import { Router, type IRouter, type Request } from "express";
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  workspacesTable,
  workspaceMembersTable,
  auditLogsTable,
  PLAN_TIERS,
  PLAN_SEATS,
  PLAN_CREDITS,
  WORKSPACE_ROLES,
  type PlanTier,
} from "@workspace/db";
import { permissionsFor, planAllows, isAtLeast } from "../lib/permissions";
import { auditLog } from "../lib/auditLog";
import {
  requireAuth,
  requireWorkspace,
  canonicalRole,
  type WorkspaceCtx,
} from "../lib/authContext";

const router: IRouter = Router();

router.get("/workspace/me", requireAuth, requireWorkspace, async (req, res) => {
  const ctx = (req as Request & { ws_ctx: WorkspaceCtx }).ws_ctx;
  const members = await db
    .select()
    .from(workspaceMembersTable)
    .where(eq(workspaceMembersTable.workspaceId, ctx.workspace.id));

  const planTier = ctx.workspace.plan as PlanTier;
  const creditsLimit = PLAN_CREDITS[planTier] ?? PLAN_CREDITS.free;
  const role = canonicalRole(ctx.role);
  res.json({
    workspace: ctx.workspace,
    role,
    permissions: permissionsFor(role),
    seatsUsed: members.length,
    seatLimit: ctx.workspace.seatLimit,
    creditsUsed: ctx.workspace.creditsUsed,
    creditsLimit,
    members: members.map((m) => ({ ...m, role: canonicalRole(m.role) })),
    plans: PLAN_TIERS.map((tier) => ({
      tier,
      seatLimit: PLAN_SEATS[tier],
      creditsLimit: PLAN_CREDITS[tier],
    })),
    enterpriseFeatures: {
      auditLog: planAllows(planTier, "audit_log"),
      sso: planAllows(planTier, "sso"),
      saml: planAllows(planTier, "saml"),
      scim: planAllows(planTier, "scim"),
      siem: planAllows(planTier, "siem"),
      byo_llm: planAllows(planTier, "byo_llm"),
      mfa_policy: planAllows(planTier, "mfa_policy"),
      data_residency: planAllows(planTier, "data_residency"),
      cmk: planAllows(planTier, "cmk"),
    },
  });
});

const InviteBody = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(WORKSPACE_ROLES).optional(),
});

router.post("/workspace/members", requireAuth, requireWorkspace, async (req, res) => {
  const ctx = (req as Request & { ws_ctx: WorkspaceCtx }).ws_ctx;
  if (!permissionsFor(canonicalRole(ctx.role)).canManageMembers) {
    res.status(403).json({ error: "You don't have permission to invite members." });
    return;
  }
  const body = InviteBody.parse(req.body);
  const inviteRole: WorkspaceRole = body.role ?? "editor";
  // Only owners may grant owner/admin via invite.
  if ((inviteRole === "owner" || inviteRole === "admin") && canonicalRole(ctx.role) !== "owner") {
    res.status(403).json({ error: "Only the owner can invite admins or transfer ownership." });
    return;
  }
  if (inviteRole === "owner") {
    res.status(400).json({ error: "Cannot invite a second owner. Use ownership transfer instead." });
    return;
  }

  const result = await db.transaction(async (tx) => {
    const [locked] = await tx
      .select()
      .from(workspacesTable)
      .where(eq(workspacesTable.id, ctx.workspace.id))
      .for("update");
    if (!locked) return { ok: false as const, code: 404, msg: "Workspace no longer exists." };

    const seatRows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(workspaceMembersTable)
      .where(eq(workspaceMembersTable.workspaceId, ctx.workspace.id));
    const seatsUsed = Number(seatRows[0]?.count ?? 0);
    if (seatsUsed >= locked.seatLimit) {
      return {
        ok: false as const,
        code: 403,
        msg: `Seat limit reached (${locked.seatLimit}). Upgrade your plan to add more members.`,
      };
    }

    const dupe = await tx
      .select()
      .from(workspaceMembersTable)
      .where(and(eq(workspaceMembersTable.workspaceId, ctx.workspace.id), eq(workspaceMembersTable.email, body.email)))
      .limit(1);
    if (dupe.length > 0) {
      return { ok: false as const, code: 409, msg: "That email is already a member of this workspace." };
    }

    const placeholderUserId = `pending:${body.email}`;
    try {
      const [member] = await tx
        .insert(workspaceMembersTable)
        .values({
          id: randomUUID(),
          workspaceId: ctx.workspace.id,
          userId: placeholderUserId,
          email: body.email,
          role: inviteRole,
          invitedBy: ctx.userId,
        })
        .returning();
      return { ok: true as const, member };
    } catch (err) {
      if ((err as { code?: string }).code === "23505") {
        return { ok: false as const, code: 409, msg: "That email is already a member of this workspace." };
      }
      throw err;
    }
  });

  if (!result.ok) {
    res.status(result.code).json({ error: result.msg });
    return;
  }
  await auditLog({
    workspaceId: ctx.workspace.id,
    actorUserId: ctx.userId,
    actorEmail: ctx.email,
    action: "member.invited",
    resourceType: "member",
    resourceId: result.member.id,
    metadata: { email: body.email, role: inviteRole },
    req,
  });
  res.status(201).json(result.member);
});

router.delete("/workspace/members/:id", requireAuth, requireWorkspace, async (req, res) => {
  const ctx = (req as Request & { ws_ctx: WorkspaceCtx }).ws_ctx;
  if (!permissionsFor(canonicalRole(ctx.role)).canManageMembers) {
    res.status(403).json({ error: "You don't have permission to remove members." });
    return;
  }

  const memberId = String(req.params.id);
  const [target] = await db
    .select()
    .from(workspaceMembersTable)
    .where(and(eq(workspaceMembersTable.id, memberId), eq(workspaceMembersTable.workspaceId, ctx.workspace.id)))
    .limit(1);
  if (!target) {
    res.status(404).json({ error: "Member not found." });
    return;
  }
  if (target.role === "owner") {
    res.status(400).json({ error: "Cannot remove the workspace owner." });
    return;
  }
  // Admins can't remove other admins; only owner can.
  if (target.role === "admin" && canonicalRole(ctx.role) !== "owner") {
    res.status(403).json({ error: "Only the owner can remove an admin." });
    return;
  }
  await db.delete(workspaceMembersTable).where(eq(workspaceMembersTable.id, target.id));
  await auditLog({
    workspaceId: ctx.workspace.id,
    actorUserId: ctx.userId,
    actorEmail: ctx.email,
    action: "member.removed",
    resourceType: "member",
    resourceId: target.id,
    metadata: { email: target.email, role: target.role },
    req,
  });
  res.status(204).send();
});

const RoleBody = z.object({ role: z.enum(WORKSPACE_ROLES) });

router.patch("/workspace/members/:id", requireAuth, requireWorkspace, async (req, res) => {
  const ctx = (req as Request & { ws_ctx: WorkspaceCtx }).ws_ctx;
  if (!permissionsFor(canonicalRole(ctx.role)).canChangeRoles) {
    res.status(403).json({ error: "You don't have permission to change roles." });
    return;
  }
  const body = RoleBody.parse(req.body);
  const memberId = String(req.params.id);

  // Only owner can grant owner/admin (promotion check on the new role).
  if ((body.role === "owner" || body.role === "admin") && canonicalRole(ctx.role) !== "owner") {
    res.status(403).json({ error: "Only the owner can grant admin or ownership." });
    return;
  }

  const result = await db.transaction(async (tx) => {
    // Lock the workspace row first to serialize all role-change /
    // demotion attempts against this workspace's owner-count invariant.
    const [locked] = await tx
      .select()
      .from(workspacesTable)
      .where(eq(workspacesTable.id, ctx.workspace.id))
      .for("update");
    if (!locked) return { ok: false as const, code: 404, msg: "Workspace no longer exists." };

    const [target] = await tx
      .select()
      .from(workspaceMembersTable)
      .where(and(eq(workspaceMembersTable.id, memberId), eq(workspaceMembersTable.workspaceId, ctx.workspace.id)))
      .for("update")
      .limit(1);
    if (!target) return { ok: false as const, code: 404, msg: "Member not found." };

    // Privileged-target protection: only an owner may modify the role of an
    // existing owner OR admin. An admin can only manage editor/viewer rows.
    const targetCurrent = canonicalRole(target.role);
    if ((targetCurrent === "owner" || targetCurrent === "admin") && canonicalRole(ctx.role) !== "owner") {
      return {
        ok: false as const,
        code: 403,
        msg: "Only the owner can change the role of another admin or owner.",
      };
    }

    // Demoting an owner — only allowed if at least one other owner remains
    // after this update. Workspace + target rows are now FOR UPDATE locked,
    // so concurrent demotions serialize through this check.
    if (targetCurrent === "owner" && body.role !== "owner") {
      const ownerCountRow = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(workspaceMembersTable)
        .where(and(eq(workspaceMembersTable.workspaceId, ctx.workspace.id), eq(workspaceMembersTable.role, "owner")));
      const ownerCount = Number(ownerCountRow[0]?.count ?? 0);
      if (ownerCount <= 1) {
        return { ok: false as const, code: 400, msg: "Cannot demote the last owner. Promote another member first." };
      }
    }

    const [updated] = await tx
      .update(workspaceMembersTable)
      .set({ role: body.role })
      .where(eq(workspaceMembersTable.id, target.id))
      .returning();
    return { ok: true as const, member: updated, prevRole: target.role };
  });

  if (!result.ok) {
    res.status(result.code).json({ error: result.msg });
    return;
  }
  await auditLog({
    workspaceId: ctx.workspace.id,
    actorUserId: ctx.userId,
    actorEmail: ctx.email,
    action: "member.role_changed",
    resourceType: "member",
    resourceId: result.member.id,
    metadata: { from: result.prevRole, to: body.role, email: result.member.email },
    req,
  });
  res.json(result.member);
});

// Direct plan mutation is restricted to "free" only. Paid tiers must go
// through /billing/subscribe → Razorpay → /billing/verify (or the webhook).
// Without this restriction, any owner could POST {"plan":"enterprise"} and
// grant themselves paid access for free — historically this endpoint
// existed before Razorpay was wired up. Kept around so users can
// self-downgrade to free without reaching out to Razorpay support.
const PlanBody = z.object({ plan: z.literal("free") });

router.post("/workspace/plan", requireAuth, requireWorkspace, async (req, res) => {
  const ctx = (req as Request & { ws_ctx: WorkspaceCtx }).ws_ctx;
  if (!permissionsFor(canonicalRole(ctx.role)).canManageBilling) {
    res.status(403).json({ error: "Only the workspace owner can change the plan." });
    return;
  }
  const body = PlanBody.parse(req.body);
  const newPlan: PlanTier = body.plan;
  const newSeatLimit = PLAN_SEATS[newPlan];

  const result = await db.transaction(async (tx) => {
    const [locked] = await tx
      .select()
      .from(workspacesTable)
      .where(eq(workspacesTable.id, ctx.workspace.id))
      .for("update");
    if (!locked) return { ok: false as const, code: 404, msg: "Workspace no longer exists." };

    const seatRows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(workspaceMembersTable)
      .where(eq(workspaceMembersTable.workspaceId, ctx.workspace.id));
    const seatsUsed = Number(seatRows[0]?.count ?? 0);
    if (seatsUsed > newSeatLimit) {
      return {
        ok: false as const,
        code: 409,
        msg: `You currently have ${seatsUsed} members but the ${newPlan} plan only allows ${newSeatLimit}. Remove members before downgrading.`,
      };
    }
    // Self-downgrade to free clears all paid-tier state: SSO, the
    // entitling subscription pointer, and the planExpiresAt watchdog.
    const [updated] = await tx
      .update(workspacesTable)
      .set({
        plan: newPlan,
        seatLimit: newSeatLimit,
        planActivatedAt: null,
        planExpiresAt: null,
        currentSubscriptionId: null,
        ssoEnabled: false,
        ssoDomain: null,
      })
      .where(eq(workspacesTable.id, ctx.workspace.id))
      .returning();
    return { ok: true as const, workspace: updated, prevPlan: locked.plan };
  });

  if (!result.ok) {
    res.status(result.code).json({ error: result.msg });
    return;
  }
  await auditLog({
    workspaceId: ctx.workspace.id,
    actorUserId: ctx.userId,
    actorEmail: ctx.email,
    action: "plan.changed",
    resourceType: "workspace",
    resourceId: ctx.workspace.id,
    metadata: { from: result.prevPlan, to: newPlan },
    req,
  });
  res.json(result.workspace);
});

const SsoBody = z.object({
  ssoEnabled: z.boolean(),
  ssoDomain: z
    .string()
    .trim()
    .toLowerCase()
    .max(255)
    .regex(/^([a-z0-9-]+\.)+[a-z]{2,}$/i, "Invalid email domain (e.g. acme.com)")
    .optional()
    .nullable(),
});

router.post("/workspace/sso", requireAuth, requireWorkspace, async (req, res) => {
  const ctx = (req as Request & { ws_ctx: WorkspaceCtx }).ws_ctx;
  if (!permissionsFor(canonicalRole(ctx.role)).canManageSso) {
    res.status(403).json({ error: "Only the workspace owner can configure SSO." });
    return;
  }
  if (!planAllows(ctx.workspace.plan as PlanTier, "sso")) {
    res.status(402).json({
      error: "SSO is an Enterprise feature. Upgrade your plan to configure SAML.",
      requiresUpgrade: true,
      plan: ctx.workspace.plan,
    });
    return;
  }
  const body = SsoBody.parse(req.body);
  const [updated] = await db
    .update(workspacesTable)
    .set({ ssoEnabled: body.ssoEnabled, ssoDomain: body.ssoDomain ?? null })
    .where(eq(workspacesTable.id, ctx.workspace.id))
    .returning();
  await auditLog({
    workspaceId: ctx.workspace.id,
    actorUserId: ctx.userId,
    actorEmail: ctx.email,
    action: "sso.configured",
    resourceType: "workspace",
    resourceId: ctx.workspace.id,
    metadata: { ssoEnabled: body.ssoEnabled, ssoDomain: body.ssoDomain },
    req,
  });
  res.json(updated);
});

/**
 * SOC 2 / ISO 27001 evidence export.
 * GET /api/workspace/audit-logs/export?format=json|csv&from=ISO8601&to=ISO8601
 *
 * Returns the audit log as an attachment. Same auth gating as the viewer
 * (admin+, Enterprise plan). Optional date-range filter.
 */
router.get("/workspace/audit-logs/export", requireAuth, requireWorkspace, async (req, res) => {
  const ctx = (req as Request & { ws_ctx: WorkspaceCtx }).ws_ctx;
  if (!isAtLeast(canonicalRole(ctx.role), "admin")) {
    res.status(403).json({ error: "Admin or owner role required to export audit logs." });
    return;
  }
  if (!planAllows(ctx.workspace.plan as PlanTier, "audit_log")) {
    res.status(402).json({
      error: "Audit log export is an Enterprise feature.",
      requiresUpgrade: true,
    });
    return;
  }

  const format = req.query.format === "csv" ? "csv" : "json";
  const fromDate = req.query.from ? new Date(String(req.query.from)) : null;
  const toDate = req.query.to ? new Date(String(req.query.to)) : null;

  const conds = [eq(auditLogsTable.workspaceId, ctx.workspace.id)];
  if (fromDate && !isNaN(fromDate.getTime())) conds.push(gte(auditLogsTable.createdAt, fromDate));
  if (toDate && !isNaN(toDate.getTime())) conds.push(lte(auditLogsTable.createdAt, toDate));

  const rows = await db
    .select()
    .from(auditLogsTable)
    .where(and(...conds))
    .orderBy(asc(auditLogsTable.createdAt));

  const dateTag = new Date().toISOString().slice(0, 10);
  if (format === "csv") {
    const CSV_COLS = ["id","workspaceId","actorUserId","actorEmail","action","resourceType","resourceId","ip","userAgent","integrityHash","createdAt"] as const;
    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const lines = [
      CSV_COLS.join(","),
      ...rows.map((r) => CSV_COLS.map((c) => escape((r as Record<string, unknown>)[c])).join(",")),
    ];
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="audit-log-${dateTag}.csv"`);
    res.send(lines.join("\n"));
  } else {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="audit-log-${dateTag}.json"`);
    res.json({ exportedAt: new Date().toISOString(), workspace: ctx.workspace.id, rows });
  }
});

router.get("/workspace/audit-logs", requireAuth, requireWorkspace, async (req, res) => {
  const ctx = (req as Request & { ws_ctx: WorkspaceCtx }).ws_ctx;
  if (!isAtLeast(canonicalRole(ctx.role), "admin")) {
    res.status(403).json({ error: "Admin or owner role required to view audit logs." });
    return;
  }
  if (!planAllows(ctx.workspace.plan as PlanTier, "audit_log")) {
    res.status(402).json({
      error: "Audit logs are an Enterprise feature. Upgrade to view your team's activity history.",
      requiresUpgrade: true,
      plan: ctx.workspace.plan,
    });
    return;
  }
  const limit = Math.min(Number(req.query.limit ?? 200), 500);
  const rows = await db
    .select()
    .from(auditLogsTable)
    .where(eq(auditLogsTable.workspaceId, ctx.workspace.id))
    .orderBy(desc(auditLogsTable.createdAt))
    .limit(limit);
  res.json({ logs: rows, count: rows.length });
});

export default router;
