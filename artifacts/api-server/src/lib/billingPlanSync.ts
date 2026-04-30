/**
 * Single source of truth for "this workspace just changed plan tier".
 *
 * Updating workspaces.plan alone is NOT enough — seatLimit is enforced
 * server-side from the persisted column and must move in lock-step. SSO
 * fields must also be cleared on downgrade off Enterprise. Keeping this
 * logic in one place means /billing/verify, the Razorpay webhook, and
 * the lazy annual-expiry path can never drift.
 *
 * `currentSubscriptionId` is the workspace's current entitling subscription
 * row. The webhook uses it to decide whether an incoming downgrade event is
 * for the active subscription (honour) or a stale one (ignore).
 */

import { and, eq, isNull, lt, or, sql } from "drizzle-orm";
import {
  db,
  workspacesTable,
  subscriptionsTable,
  PLAN_SEATS,
  type PlanTier,
} from "@workspace/db";

export interface ApplyPlanArgs {
  workspaceId: string;
  newPlan: PlanTier;
  /** When set (annual one-time orders), workspace lapses back to free at this time. */
  planExpiresAt?: Date | null;
  /** Optional override for activation timestamp. Defaults to now. */
  activatedAt?: Date | null;
  /** The subscription row that is now the workspace's source of paid
   *  entitlement. Required when upgrading from free. When downgrading to
   *  free, omit (or pass null) — this column will be cleared. */
  currentSubscriptionId?: string | null;
}

export async function applyWorkspacePlan({
  workspaceId,
  newPlan,
  planExpiresAt,
  activatedAt,
  currentSubscriptionId,
}: ApplyPlanArgs): Promise<void> {
  const ssoFields =
    newPlan === "enterprise"
      ? {}
      : { ssoEnabled: false, ssoDomain: null as string | null };
  // When downgrading to free, always clear the entitling subscription
  // pointer. When upgrading, use the explicit value if given; otherwise
  // leave the existing pointer alone (e.g. webhook-driven plan refresh
  // for the same subscription).
  const subscriptionPointer =
    newPlan === "free"
      ? { currentSubscriptionId: null as string | null }
      : currentSubscriptionId !== undefined
        ? { currentSubscriptionId }
        : {};
  await db
    .update(workspacesTable)
    .set({
      plan: newPlan,
      seatLimit: PLAN_SEATS[newPlan],
      planActivatedAt:
        activatedAt === undefined
          ? new Date()
          : activatedAt,
      planExpiresAt: planExpiresAt ?? null,
      ...subscriptionPointer,
      ...ssoFields,
    })
    .where(eq(workspacesTable.id, workspaceId));
}

/**
 * Lazy annual-plan expiry. Called on every workspace context load so we don't
 * need a cron. If the workspace is paid AND has a `planExpiresAt` in the past,
 * silently downgrades to free. Returns the (possibly-mutated) workspace row.
 */
export async function expirePastDueAnnualPlan<
  W extends {
    id: string;
    plan: string;
    planExpiresAt: Date | null;
    seatLimit: number;
    currentSubscriptionId?: string | null;
  },
>(workspace: W): Promise<W> {
  if (
    workspace.plan === "free" ||
    !workspace.planExpiresAt ||
    workspace.planExpiresAt.getTime() > Date.now()
  ) {
    return workspace;
  }
  // Atomically: mark the entitling annual subscription row as `expired`
  // (so the partial unique index releases and the user can renew) AND
  // downgrade the workspace to free. If we only downgraded the workspace,
  // the subscription row would stay `active` (non-terminal) and the
  // partial unique index `subscriptions_workspace_active_uniq` would
  // permanently block /billing/subscribe — locking out the customer
  // from renewing.
  await db.transaction(async (tx) => {
    if (workspace.currentSubscriptionId) {
      await tx
        .update(subscriptionsTable)
        .set({ status: "expired", updatedAt: new Date() })
        .where(eq(subscriptionsTable.id, workspace.currentSubscriptionId));
    }
    await tx
      .update(workspacesTable)
      .set({
        plan: "free",
        seatLimit: PLAN_SEATS.free,
        planActivatedAt: null,
        planExpiresAt: null,
        currentSubscriptionId: null,
        ssoEnabled: false,
        ssoDomain: null,
      })
      .where(eq(workspacesTable.id, workspace.id));
  });
  return {
    ...workspace,
    plan: "free",
    seatLimit: PLAN_SEATS.free,
    planExpiresAt: null,
  };
}

/**
 * Sweep abandoned `/billing/subscribe` placeholder rows so they don't
 * permanently block a workspace from retrying via the partial unique
 * index. A placeholder is identified as: status='created' AND no
 * razorpay_subscription_id AND no razorpay_order_id (we insert this row
 * BEFORE calling Razorpay; if the user closes the tab or Razorpay create
 * fails after the placeholder INSERT but before the cancellation update
 * commits, the row leaks).
 *
 * Called at the top of /billing/subscribe so abandoned placeholders are
 * cleared just-in-time when the user retries — no cron required.
 *
 * TTL is 10 minutes: long enough to comfortably outlast the slowest
 * Razorpay create call, short enough that a user retrying a few minutes
 * later isn't blocked.
 */
export async function reapAbandonedSubscribePlaceholders(
  workspaceId: string,
): Promise<void> {
  const cutoff = new Date(Date.now() - 10 * 60 * 1000);
  await db
    .update(subscriptionsTable)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(
      and(
        eq(subscriptionsTable.workspaceId, workspaceId),
        eq(subscriptionsTable.status, "created"),
        isNull(subscriptionsTable.razorpaySubscriptionId),
        isNull(subscriptionsTable.razorpayOrderId),
        lt(subscriptionsTable.createdAt, cutoff),
      ),
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DbExecutor = typeof db | any;

export interface ActivatePlanArgs {
  workspaceId: string;
  /** The subscription row that is being activated. Must already have its
   *  status persisted as "active" in the same caller-visible transaction
   *  before invoking this function. */
  subscriptionId: string;
  newPlan: PlanTier;
  /** When set (annual one-time orders), workspace lapses back to free at this time. */
  planExpiresAt?: Date | null;
  /** REQUIRED when called from inside a transaction so the EXISTS check
   *  can see the same transaction's uncommitted `subscription.status=active`
   *  write. If you call this with the global `db` while a transaction in
   *  another connection holds the row, EXISTS will read the pre-commit
   *  value and the CAS will silently lose, denying access to a paying
   *  customer. There is no safe non-tx use of this function on the
   *  activation path — always pass the tx. */
  exec: DbExecutor;
}

/**
 * Atomic CAS activation of a workspace's paid entitlement.
 *
 * This is the ONLY safe path for activate/charge/order.paid events. It
 * defends against three LIVE-money hazards in a single SQL statement:
 *
 *   1. Stale-activation clobber. If an old `subscription.charged` for
 *      sub_A arrives after the workspace has already moved to a newer
 *      sub_B, we must not overwrite sub_B's pointer. Defence: WHERE
 *      requires `plan = 'free' OR current_subscription_id = subscriptionId`.
 *      A workspace already entitled by a different subscription is left
 *      alone. (Combined with the "no concurrent non-terminal subs"
 *      guard in /billing/subscribe, this means activations are correct.)
 *
 *   2. Resurrection race. If between writing `subscription.status='active'`
 *      and writing the workspace plan, a concurrent `cancelled` event
 *      flipped the sub to terminal and downgraded the workspace, our
 *      stale activation must NOT re-grant paid access. Defence: an
 *      EXISTS subquery requires `subscriptions.status = 'active'` at
 *      the moment of the workspace UPDATE. If the cancellation
 *      committed in between, the EXISTS fails and the UPDATE no-ops.
 *
 *   3. Annual atomicity. Callers MUST wrap the subscription status
 *      update + this activation call in a single DB transaction so a
 *      mid-flow crash rolls back BOTH writes — never leaving a "sub is
 *      active but workspace is free" state that retries would skip.
 *
 * Returns true if the workspace was actually activated; false if the
 * CAS lost (workspace already moved on, or sub no longer active).
 */
export async function activateWorkspacePlan({
  workspaceId,
  subscriptionId,
  newPlan,
  planExpiresAt,
  exec,
}: ActivatePlanArgs): Promise<boolean> {
  if (newPlan === "free") {
    throw new Error("activateWorkspacePlan must not be used to downgrade.");
  }
  const ssoFields =
    newPlan === "enterprise"
      ? {}
      : { ssoEnabled: false, ssoDomain: null as string | null };
  const updated = await exec
    .update(workspacesTable)
    .set({
      plan: newPlan,
      seatLimit: PLAN_SEATS[newPlan],
      planActivatedAt: new Date(),
      planExpiresAt: planExpiresAt ?? null,
      currentSubscriptionId: subscriptionId,
      ...ssoFields,
    })
    .where(
      and(
        eq(workspacesTable.id, workspaceId),
        or(
          eq(workspacesTable.plan, "free"),
          eq(workspacesTable.currentSubscriptionId, subscriptionId),
        ),
        sql`EXISTS (SELECT 1 FROM ${subscriptionsTable} WHERE ${subscriptionsTable.id} = ${subscriptionId} AND ${subscriptionsTable.status} = 'active')`,
      ),
    )
    .returning({ id: workspacesTable.id });
  return updated.length > 0;
}
