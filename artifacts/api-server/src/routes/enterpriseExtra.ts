import { Router, type IRouter, type Request } from "express";
import { randomUUID } from "node:crypto";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  workspacesTable,
  workspaceMembersTable,
  uptimeSamplesTable,
  backupSnapshotsTable,
  auditLogsTable,
  type PlanTier,
} from "@workspace/db";
import {
  requireAuth,
  requireWorkspace,
  canonicalRole,
  type WorkspaceCtx,
} from "../lib/authContext";
import { planAllows, isAtLeast } from "../lib/permissions";
import { auditLog } from "../lib/auditLog";
import { ipMatchesCidr } from "../lib/ipAllowlist";

const router: IRouter = Router();

function ctxOf(req: Request): WorkspaceCtx {
  return (req as Request & { ws_ctx: WorkspaceCtx }).ws_ctx;
}

function gateAdmin(ctx: WorkspaceCtx, feature: Parameters<typeof planAllows>[1]):
  | { ok: true }
  | { ok: false; status: number; body: { error: string; requiresUpgrade?: boolean } } {
  if (!isAtLeast(canonicalRole(ctx.role), "admin")) {
    return { ok: false, status: 403, body: { error: "Admin or owner role required." } };
  }
  if (!planAllows(ctx.workspace.plan as PlanTier, feature)) {
    return { ok: false, status: 402, body: { error: "This is an Enterprise feature.", requiresUpgrade: true } };
  }
  return { ok: true };
}

// ─── IP allowlist ─────────────────────────────────────────────────────────
const CidrSchema = z
  .string()
  .trim()
  .regex(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(\/\d{1,2})?$/, "Must be IPv4 or CIDR e.g. 203.0.113.0/24");

router.get("/workspace/ip-allowlist", requireAuth, requireWorkspace, async (req, res) => {
  const ctx = ctxOf(req);
  const gate = gateAdmin(ctx, "ip_allowlist");
  if (!gate.ok) { res.status(gate.status).json(gate.body); return; }
  res.json({ allowlist: (ctx.workspace.ipAllowlist ?? []) as string[] });
});

router.post("/workspace/ip-allowlist", requireAuth, requireWorkspace, async (req, res) => {
  const ctx = ctxOf(req);
  const gate = gateAdmin(ctx, "ip_allowlist");
  if (!gate.ok) { res.status(gate.status).json(gate.body); return; }
  const body = z.object({ allowlist: z.array(CidrSchema).max(100) }).parse(req.body);

  // Self-lockout guard: if the new list is non-empty, the requester's own IP
  // must match — otherwise the very next request will be blocked. We require
  // an explicit `force=true` to override (e.g. configuring from a CI box for a
  // different prod IP range).
  if (body.allowlist.length > 0) {
    const force = (req.query.force as string) === "true";
    const remote = (req.ip ?? "").replace(/^::ffff:/, "");
    const okSelf = remote && body.allowlist.some((c) => ipMatchesCidr(remote, c));
    if (!okSelf && !force) {
      res.status(409).json({
        error: "This list would lock you out (your IP isn't in it). Add ?force=true to override.",
        remote,
      });
      return;
    }
  }

  await db
    .update(workspacesTable)
    .set({ ipAllowlist: body.allowlist })
    .where(eq(workspacesTable.id, ctx.workspace.id));
  await auditLog({
    workspaceId: ctx.workspace.id, actorUserId: ctx.userId, actorEmail: ctx.email,
    action: "ip_allowlist.changed", resourceType: "workspace", resourceId: ctx.workspace.id,
    metadata: { count: body.allowlist.length }, req,
  });
  res.json({ allowlist: body.allowlist });
});

// ─── White-label branding (admin write) ──────────────────────────────────
const BrandingBody = z.object({
  brandingProductName: z.string().trim().min(1).max(120).nullable().optional(),
  brandingPrimaryColor: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Must be a #RRGGBB hex").nullable().optional(),
  brandingLogoUrl: z.string().trim().url().max(2048).nullable().optional(),
});

router.get("/workspace/branding", requireAuth, requireWorkspace, async (req, res) => {
  const ctx = ctxOf(req);
  // Read available to any workspace member regardless of plan, so the UI can
  // render the configured brand. Edits still require Enterprise + admin.
  res.json({
    brandingProductName: ctx.workspace.brandingProductName,
    brandingPrimaryColor: ctx.workspace.brandingPrimaryColor,
    brandingLogoUrl: ctx.workspace.brandingLogoUrl,
    editable: planAllows(ctx.workspace.plan as PlanTier, "branding")
      && isAtLeast(canonicalRole(ctx.role), "admin"),
  });
});

router.post("/workspace/branding", requireAuth, requireWorkspace, async (req, res) => {
  const ctx = ctxOf(req);
  const gate = gateAdmin(ctx, "branding");
  if (!gate.ok) { res.status(gate.status).json(gate.body); return; }
  const body = BrandingBody.parse(req.body);
  await db
    .update(workspacesTable)
    .set({
      brandingProductName: body.brandingProductName ?? null,
      brandingPrimaryColor: body.brandingPrimaryColor ?? null,
      brandingLogoUrl: body.brandingLogoUrl ?? null,
    })
    .where(eq(workspacesTable.id, ctx.workspace.id));
  await auditLog({
    workspaceId: ctx.workspace.id, actorUserId: ctx.userId, actorEmail: ctx.email,
    action: "branding.changed", resourceType: "workspace", resourceId: ctx.workspace.id,
    metadata: body, req,
  });
  res.json({ ok: true });
});

// ─── SLA / uptime dashboard ──────────────────────────────────────────────
router.get("/workspace/uptime", requireAuth, requireWorkspace, async (req, res) => {
  const ctx = ctxOf(req);
  const gate = gateAdmin(ctx, "sla_dashboard");
  if (!gate.ok) { res.status(gate.status).json(gate.body); return; }
  const windowDays = Math.min(Math.max(Number(req.query.days ?? 30) || 30, 1), 90);
  const since = new Date(Date.now() - windowDays * 24 * 3600 * 1000);
  const [{ total, healthy }] = await db
    .select({
      total: sql<number>`count(*)::int`,
      healthy: sql<number>`count(*) filter (where ${uptimeSamplesTable.healthy})::int`,
    })
    .from(uptimeSamplesTable)
    .where(gte(uptimeSamplesTable.sampledAt, since));
  const uptimePct = total > 0 ? (healthy / total) * 100 : null;
  const recent = await db
    .select()
    .from(uptimeSamplesTable)
    .where(gte(uptimeSamplesTable.sampledAt, since))
    .orderBy(desc(uptimeSamplesTable.sampledAt))
    .limit(50);
  await auditLog({
    workspaceId: ctx.workspace.id, actorUserId: ctx.userId, actorEmail: ctx.email,
    action: "sla.viewed", resourceType: "workspace", resourceId: ctx.workspace.id,
    metadata: { windowDays }, req,
  });
  res.json({
    windowDays,
    samples: total,
    healthy,
    uptimePct,
    slaTarget: 99.9,
    recent: recent.map((r) => ({
      sampledAt: r.sampledAt, healthy: r.healthy, durationMs: r.durationMs, note: r.note,
    })),
  });
});

// ─── Backups / disaster-recovery ─────────────────────────────────────────
router.get("/workspace/backups", requireAuth, requireWorkspace, async (req, res) => {
  const ctx = ctxOf(req);
  const gate = gateAdmin(ctx, "backups");
  if (!gate.ok) { res.status(gate.status).json(gate.body); return; }
  const rows = await db
    .select()
    .from(backupSnapshotsTable)
    .where(eq(backupSnapshotsTable.workspaceId, ctx.workspace.id))
    .orderBy(desc(backupSnapshotsTable.createdAt))
    .limit(100);
  await auditLog({
    workspaceId: ctx.workspace.id, actorUserId: ctx.userId, actorEmail: ctx.email,
    action: "backups.viewed", resourceType: "workspace", resourceId: ctx.workspace.id,
    metadata: { count: rows.length }, req,
  });
  res.json({
    rpoHours: 24,
    rtoHours: 4,
    snapshots: rows,
  });
});

router.post("/workspace/backups/trigger", requireAuth, requireWorkspace, async (req, res) => {
  const ctx = ctxOf(req);
  const gate = gateAdmin(ctx, "backups");
  if (!gate.ok) { res.status(gate.status).json(gate.body); return; }
  // We record the snapshot intent here. The actual pg_dump runs via an
  // out-of-band ops job; this row is the customer-visible audit trail.
  const id = randomUUID();
  await db.insert(backupSnapshotsTable).values({
    id,
    workspaceId: ctx.workspace.id,
    kind: "manual",
    note: `Triggered by ${ctx.email ?? ctx.userId}`,
    location: `s3://auditee-backups/${ctx.workspace.id}/${id}.sql.gz`,
  });
  await auditLog({
    workspaceId: ctx.workspace.id, actorUserId: ctx.userId, actorEmail: ctx.email,
    action: "backup.triggered", resourceType: "backup_snapshot", resourceId: id, req,
  });
  res.status(201).json({ id });
});

// ─── GDPR DSAR / right-to-erasure ────────────────────────────────────────
router.post("/workspace/dsar", requireAuth, requireWorkspace, async (req, res) => {
  const ctx = ctxOf(req);
  const gate = gateAdmin(ctx, "dsar");
  if (!gate.ok) { res.status(gate.status).json(gate.body); return; }
  const body = z.object({ subjectEmail: z.string().trim().email() }).parse(req.body);
  // Look up matching member rows (the per-workspace footprint of this subject).
  const members = await db
    .select()
    .from(workspaceMembersTable)
    .where(and(
      eq(workspaceMembersTable.workspaceId, ctx.workspace.id),
      eq(workspaceMembersTable.email, body.subjectEmail.toLowerCase()),
    ));
  // Record the export request as a backup_snapshots row (kind=dsar_export)
  // so the audit trail shows when each subject's data was packaged.
  const id = randomUUID();
  await db.insert(backupSnapshotsTable).values({
    id,
    workspaceId: ctx.workspace.id,
    kind: "dsar_export",
    note: `DSAR for ${body.subjectEmail}`,
    location: `s3://auditee-dsar/${ctx.workspace.id}/${id}.json`,
  });
  await auditLog({
    workspaceId: ctx.workspace.id, actorUserId: ctx.userId, actorEmail: ctx.email,
    action: "gdpr.dsar_requested", resourceType: "subject", resourceId: body.subjectEmail,
    metadata: { matchedMembers: members.length }, req,
  });
  res.json({
    requestId: id,
    subjectEmail: body.subjectEmail,
    matchedMembers: members.length,
    export: {
      members: members.map((m) => ({
        id: m.id, email: m.email, role: m.role, addedAt: m.addedAt,
      })),
    },
  });
});

router.post("/workspace/dsar/erasure", requireAuth, requireWorkspace, async (req, res) => {
  const ctx = ctxOf(req);
  const gate = gateAdmin(ctx, "dsar");
  if (!gate.ok) { res.status(gate.status).json(gate.body); return; }
  const body = z.object({
    subjectEmail: z.string().trim().email(),
    confirm: z.literal(true),
  }).parse(req.body);

  // Block erasure of the workspace owner — would orphan the workspace.
  const owner = ctx.workspace.ownerUserId;
  const targets = await db
    .select()
    .from(workspaceMembersTable)
    .where(and(
      eq(workspaceMembersTable.workspaceId, ctx.workspace.id),
      eq(workspaceMembersTable.email, body.subjectEmail.toLowerCase()),
    ));
  const erasable = targets.filter((m) => m.userId !== owner);
  for (const t of erasable) {
    await db.delete(workspaceMembersTable).where(eq(workspaceMembersTable.id, t.id));
  }
  // GDPR Article 17: scrub the subject's PII from append-only audit logs as
  // well. We retain the row IDs/timestamps (required for SOC2/27001 audit
  // integrity) but null out the email so the subject is no longer identifiable.
  const scrubbed = await db
    .update(auditLogsTable)
    .set({ actorEmail: null })
    .where(and(
      eq(auditLogsTable.workspaceId, ctx.workspace.id),
      eq(auditLogsTable.actorEmail, body.subjectEmail.toLowerCase()),
    ))
    .returning({ id: auditLogsTable.id });
  await auditLog({
    workspaceId: ctx.workspace.id, actorUserId: ctx.userId, actorEmail: ctx.email,
    action: "gdpr.erasure_executed", resourceType: "subject", resourceId: body.subjectEmail,
    metadata: {
      erased: erasable.length,
      blockedOwner: targets.length - erasable.length,
      auditLogsScrubbed: scrubbed.length,
    }, req,
  });
  res.json({
    subjectEmail: body.subjectEmail,
    erased: erasable.length,
    blockedOwner: targets.length - erasable.length,
    auditLogsScrubbed: scrubbed.length,
  });
});

export default router;
