import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { getAuth, clerkClient } from "@clerk/express";
import { z } from "zod";
import {
  db,
  workspacesTable,
  workspaceMembersTable,
  PLAN_TIERS,
  PLAN_SEATS,
  PLAN_CREDITS,
  type PlanTier,
} from "@workspace/db";

const router: IRouter = Router();

interface AuthCtx {
  userId: string;
  email: string | null;
}

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  let email: string | null = null;
  try {
    const user = await clerkClient.users.getUser(userId);
    email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null;
  } catch {
    email = null;
  }
  (req as Request & { auth_ctx?: AuthCtx }).auth_ctx = { userId, email };
  next();
}

/**
 * Reconcile any pending email-based invites: if a previously-invited member
 * row was created with a `pending:<email>` placeholder userId, swap it in for
 * this user's real Clerk userId so they automatically join their inviter's
 * workspace on first sign-in.
 */
async function reconcilePendingInvites(userId: string, email: string | null) {
  if (!email) return;
  const pendingId = `pending:${email}`;
  await db
    .update(workspaceMembersTable)
    .set({ userId })
    .where(eq(workspaceMembersTable.userId, pendingId));
}

/**
 * Idempotently fetch (or create) the workspace this user owns. Safe under
 * concurrent calls because of the unique index on workspaces.owner_user_id +
 * workspace_members (workspace_id, user_id) — losers of the race fall back to
 * a re-select.
 */
async function getOrCreateWorkspace(userId: string, email: string | null) {
  await reconcilePendingInvites(userId, email);

  const lookup = async () => {
    const rows = await db
      .select({
        workspace: workspacesTable,
        role: workspaceMembersTable.role,
      })
      .from(workspaceMembersTable)
      .innerJoin(workspacesTable, eq(workspaceMembersTable.workspaceId, workspacesTable.id))
      .where(eq(workspaceMembersTable.userId, userId))
      .limit(1);
    return rows[0] ?? null;
  };

  const existing = await lookup();
  if (existing) return { workspace: existing.workspace, role: existing.role };

  const workspaceId = randomUUID();
  const insertedWorkspaces = await db
    .insert(workspacesTable)
    .values({
      id: workspaceId,
      name: email ? `${email.split("@")[0]}'s workspace` : "My workspace",
      plan: "free",
      seatLimit: PLAN_SEATS.free,
      ownerUserId: userId,
    })
    .onConflictDoNothing({ target: workspacesTable.ownerUserId })
    .returning();

  if (insertedWorkspaces.length === 0) {
    // Lost the race — another concurrent call already created our workspace.
    const after = await lookup();
    if (after) return { workspace: after.workspace, role: after.role };
    throw new Error("workspace_bootstrap_inconsistent_state");
  }

  const workspace = insertedWorkspaces[0];
  await db
    .insert(workspaceMembersTable)
    .values({
      id: randomUUID(),
      workspaceId,
      userId,
      email,
      role: "owner",
      invitedBy: userId,
    })
    .onConflictDoNothing({
      target: [workspaceMembersTable.workspaceId, workspaceMembersTable.userId],
    });

  return { workspace, role: "owner" as const };
}

router.get("/workspace/me", requireAuth, async (req, res) => {
  const ctx = (req as Request & { auth_ctx: AuthCtx }).auth_ctx;
  const { workspace, role } = await getOrCreateWorkspace(ctx.userId, ctx.email);

  const members = await db
    .select()
    .from(workspaceMembersTable)
    .where(eq(workspaceMembersTable.workspaceId, workspace.id));

  const planTier = workspace.plan as keyof typeof PLAN_CREDITS;
  const creditsLimit = PLAN_CREDITS[planTier] ?? PLAN_CREDITS.free;
  res.json({
    workspace,
    role,
    seatsUsed: members.length,
    seatLimit: workspace.seatLimit,
    creditsUsed: workspace.creditsUsed,
    creditsLimit,
    members,
    plans: PLAN_TIERS.map((tier) => ({
      tier,
      seatLimit: PLAN_SEATS[tier],
      creditsLimit: PLAN_CREDITS[tier],
    })),
  });
});

const InviteBody = z.object({
  email: z.string().trim().toLowerCase().email(),
});

router.post("/workspace/members", requireAuth, async (req, res) => {
  const ctx = (req as Request & { auth_ctx: AuthCtx }).auth_ctx;
  const body = InviteBody.parse(req.body);
  const { workspace, role } = await getOrCreateWorkspace(ctx.userId, ctx.email);
  if (role !== "owner") {
    res.status(403).json({ error: "Only the workspace owner can invite members." });
    return;
  }

  const result = await db.transaction(async (tx) => {
    // Lock the workspace row so concurrent invites + plan changes serialize
    // against this membership-cap check.
    const [locked] = await tx
      .select()
      .from(workspacesTable)
      .where(eq(workspacesTable.id, workspace.id))
      .for("update");
    if (!locked) {
      return { ok: false as const, code: 404, msg: "Workspace no longer exists." };
    }

    const seatRows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(workspaceMembersTable)
      .where(eq(workspaceMembersTable.workspaceId, workspace.id));
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
      .where(and(eq(workspaceMembersTable.workspaceId, workspace.id), eq(workspaceMembersTable.email, body.email)))
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
          workspaceId: workspace.id,
          userId: placeholderUserId,
          email: body.email,
          role: "member",
          invitedBy: ctx.userId,
        })
        .returning();
      return { ok: true as const, member };
    } catch (err) {
      // Unique-constraint violation from a concurrent identical invite.
      const code = (err as { code?: string }).code;
      if (code === "23505") {
        return { ok: false as const, code: 409, msg: "That email is already a member of this workspace." };
      }
      throw err;
    }
  });

  if (!result.ok) {
    res.status(result.code).json({ error: result.msg });
    return;
  }
  res.status(201).json(result.member);
});

router.delete("/workspace/members/:id", requireAuth, async (req, res) => {
  const ctx = (req as Request & { auth_ctx: AuthCtx }).auth_ctx;
  const { workspace, role } = await getOrCreateWorkspace(ctx.userId, ctx.email);
  if (role !== "owner") {
    res.status(403).json({ error: "Only the workspace owner can remove members." });
    return;
  }

  const memberId = String(req.params.id);
  const [target] = await db
    .select()
    .from(workspaceMembersTable)
    .where(and(eq(workspaceMembersTable.id, memberId), eq(workspaceMembersTable.workspaceId, workspace.id)))
    .limit(1);
  if (!target) {
    res.status(404).json({ error: "Member not found." });
    return;
  }
  if (target.role === "owner") {
    res.status(400).json({ error: "Cannot remove the workspace owner." });
    return;
  }
  await db.delete(workspaceMembersTable).where(eq(workspaceMembersTable.id, target.id));
  res.status(204).send();
});

const PlanBody = z.object({
  plan: z.enum(PLAN_TIERS),
});

router.post("/workspace/plan", requireAuth, async (req, res) => {
  const ctx = (req as Request & { auth_ctx: AuthCtx }).auth_ctx;
  const body = PlanBody.parse(req.body);
  const { workspace, role } = await getOrCreateWorkspace(ctx.userId, ctx.email);
  if (role !== "owner") {
    res.status(403).json({ error: "Only the workspace owner can change the plan." });
    return;
  }

  const newPlan: PlanTier = body.plan;
  const newSeatLimit = PLAN_SEATS[newPlan];

  const result = await db.transaction(async (tx) => {
    // Lock workspace row to serialize against concurrent invite flows.
    const [locked] = await tx
      .select()
      .from(workspacesTable)
      .where(eq(workspacesTable.id, workspace.id))
      .for("update");
    if (!locked) {
      return { ok: false as const, code: 404, msg: "Workspace no longer exists." };
    }
    const seatRows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(workspaceMembersTable)
      .where(eq(workspaceMembersTable.workspaceId, workspace.id));
    const seatsUsed = Number(seatRows[0]?.count ?? 0);
    if (seatsUsed > newSeatLimit) {
      return {
        ok: false as const,
        code: 409,
        msg: `You currently have ${seatsUsed} members but the ${newPlan} plan only allows ${newSeatLimit}. Remove members before downgrading.`,
      };
    }
    const [updated] = await tx
      .update(workspacesTable)
      .set({
        plan: newPlan,
        seatLimit: newSeatLimit,
        planActivatedAt: new Date(),
      })
      .where(eq(workspacesTable.id, workspace.id))
      .returning();
    return { ok: true as const, workspace: updated };
  });

  if (!result.ok) {
    res.status(result.code).json({ error: result.msg });
    return;
  }
  res.json(result.workspace);
});

export default router;
