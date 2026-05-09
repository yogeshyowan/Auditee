import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getAuth, clerkClient } from "@clerk/express";
import { expirePastDueAnnualPlan } from "./billingPlanSync";
import { applyAccessOverrides } from "./accessOverrides";
import {
  db,
  workspacesTable,
  workspaceMembersTable,
  PLAN_SEATS,
  WORKSPACE_ROLES,
  type WorkspaceRole,
  type Workspace,
} from "@workspace/db";

export interface AuthCtx {
  userId: string;
  email: string | null;
}

export interface WorkspaceCtx extends AuthCtx {
  workspace: Workspace;
  role: string;
}

export type AuthedRequest = Request & { auth_ctx?: AuthCtx; ws_ctx?: WorkspaceCtx };

/**
 * Normalize legacy "member" role rows to "editor" semantics so the new RBAC
 * matrix evaluates correctly without a destructive data migration.
 */
export function canonicalRole(role: string | null | undefined): WorkspaceRole {
  if (role === "member") return "editor";
  if (role && (WORKSPACE_ROLES as readonly string[]).includes(role)) return role as WorkspaceRole;
  return "viewer";
}

async function reconcilePendingInvites(userId: string, email: string | null) {
  if (!email) return;
  const pendingId = `pending:${email.toLowerCase()}`;
  await db
    .update(workspaceMembersTable)
    .set({ userId })
    .where(eq(workspaceMembersTable.userId, pendingId));
  // Reconcile pending project-level invites too — `project_members` rows
  // are created with userId=`pending:<email>` until the invitee signs in.
  // Imported lazily to avoid a circular dependency at module load.
  try {
    const { projectMembersTable } = await import("@workspace/db");
    await db
      .update(projectMembersTable)
      .set({ userId })
      .where(eq(projectMembersTable.userId, pendingId));
  } catch {
    /* projectMembersTable not exported yet during early bootstraps — skip */
  }
}

export async function getOrCreateWorkspace(userId: string, email: string | null) {
  await reconcilePendingInvites(userId, email);

  const lookup = async () => {
    const rows = await db
      .select({ workspace: workspacesTable, role: workspaceMembersTable.role })
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

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
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
  (req as AuthedRequest).auth_ctx = { userId, email };
  next();
}

export async function requireWorkspace(req: Request, res: Response, next: NextFunction) {
  const ctx = (req as AuthedRequest).auth_ctx!;
  const { workspace, role } = await getOrCreateWorkspace(ctx.userId, ctx.email);
  // Lazy annual-plan expiry. Razorpay annual purchases are one-time orders
  // (RBI ₹15k auto-debit cap workaround), so we have no recurring webhook to
  // trigger downgrade — instead we expire the plan on the next workspace
  // load after planExpiresAt has passed.
  const liveWorkspace = await expirePastDueAnnualPlan(workspace);
  // Operator override: allowlisted founder/test emails are forced to plan
  // 'enterprise' + role 'owner' in-memory only (no DB write). See
  // ./accessOverrides.ts.
  const { workspace: effectiveWorkspace, role: effectiveRole } =
    applyAccessOverrides(liveWorkspace, role, ctx.email);
  (req as AuthedRequest).ws_ctx = { ...ctx, workspace: effectiveWorkspace, role: effectiveRole };
  // Enterprise IP allowlist enforcement. Empty list = disabled. The check is
  // intentionally placed AFTER workspace resolution so it can read per-tenant
  // policy, and BEFORE any business handler runs.
  const allow = ((effectiveWorkspace as { ipAllowlist?: string[] }).ipAllowlist ?? []) as string[];
  if (allow.length > 0) {
    const remote = (req.ip ?? "").replace(/^::ffff:/, "");
    const { ipMatchesAnyCidr } = await import("./ipAllowlist");
    if (!remote || !ipMatchesAnyCidr(remote, allow)) {
      // Allow IP-allowlist management itself, so admins can never lock
      // themselves out permanently from any IP.
      // Exact-path match (not endsWith) to prevent suffix-based bypass like
      // /api/anything?/workspace/ip-allowlist or weird path-traversal attempts.
      // Operator-allowlisted emails (isUnlimitedEmail) are also exempt — they
      // are the founder/test accounts and must never be locked out.
      const p = req.path;
      const isAllowlistRoute = p === "/workspace/ip-allowlist" || p === "/api/workspace/ip-allowlist";
      const { isUnlimitedEmail } = await import("./accessOverrides");
      if (!isAllowlistRoute && !isUnlimitedEmail(ctx.email)) {
        res.status(403).json({ error: "Source IP is not allowed for this workspace.", remote });
        return;
      }
    }
  }
  next();
}

/**
 * Resolves auth + workspace if a Clerk session is present, but does not 401
 * for anonymous traffic. Used by routes that have a legitimate anonymous
 * fallback (AI trial credits) but still want workspace scoping when signed in.
 */
export async function optionalWorkspace(req: Request, _res: Response, next: NextFunction) {
  const { userId } = getAuth(req);
  if (!userId) return next();
  let email: string | null = null;
  try {
    const user = await clerkClient.users.getUser(userId);
    email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null;
  } catch {
    email = null;
  }
  const { workspace, role } = await getOrCreateWorkspace(userId, email);
  const { workspace: effectiveWorkspace, role: effectiveRole } =
    applyAccessOverrides(workspace, role, email);
  (req as AuthedRequest).auth_ctx = { userId, email };
  (req as AuthedRequest).ws_ctx = { ...{ userId, email }, workspace: effectiveWorkspace, role: effectiveRole };
  next();
}
