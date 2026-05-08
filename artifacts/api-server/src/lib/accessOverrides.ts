/**
 * Operator allowlist — emails listed here bypass billing and plan gating.
 * They are treated as full-access enterprise admins on whatever workspace
 * they happen to be a member of, regardless of the row stored in the DB.
 *
 * Used for founders / internal staff / demo accounts. Default includes the
 * project owner. Extend at deploy time via the `UNLIMITED_CREDIT_EMAILS`
 * env var (comma- or whitespace-separated).
 *
 * The override does TWO things:
 *   1. AI credit middleware treats them as unlimited (see creditMiddleware.ts).
 *   2. requireWorkspace / optionalWorkspace forces their effective workspace
 *      to plan='enterprise' with seatLimit=PLAN_SEATS.enterprise and their
 *      role to 'owner', so every plan gate (planAllows) and role gate
 *      (isAtLeast) returns true.
 *
 * IMPORTANT: this only changes the in-memory request context — the DB row
 * is never mutated, so removing an email from the allowlist instantly
 * reverts that account to its real plan/role on the next request.
 */
import { PLAN_SEATS, type Workspace } from "@workspace/db";

const DEFAULT_UNLIMITED_EMAILS = ["yogesh.yowan@gmail.com"];

const UNLIMITED_EMAILS = new Set(
  [
    ...DEFAULT_UNLIMITED_EMAILS,
    ...(process.env.UNLIMITED_CREDIT_EMAILS ?? "")
      .split(/[\s,]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  ].map((e) => e.toLowerCase()),
);

export function isUnlimitedEmail(email: string | null | undefined): boolean {
  return !!email && UNLIMITED_EMAILS.has(email.toLowerCase());
}

/**
 * Returns a workspace + role pair with full enterprise/admin access if the
 * given email is in the operator allowlist. Otherwise returns the inputs
 * unchanged. Pure function — never touches the database.
 */
export function applyAccessOverrides<T extends Workspace>(
  workspace: T,
  role: string,
  email: string | null | undefined,
): { workspace: T; role: string } {
  if (!isUnlimitedEmail(email)) return { workspace, role };
  const overridden: T = {
    ...workspace,
    plan: "enterprise",
    seatLimit: PLAN_SEATS.enterprise,
    // Clear any past-due expiry so expirePastDueAnnualPlan can't downgrade
    // us on subsequent requests.
    planExpiresAt: null,
  };
  return { workspace: overridden, role: "owner" };
}
