import { Router, type IRouter, type Request } from "express";
import { randomUUID } from "node:crypto";
import { eq, desc, and, notInArray } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  subscriptionsTable,
  paymentsTable,
  workspacesTable,
  RAZORPAY_PLANS,
  BILLING_CADENCES,
  PLAN_PRICE_PAISE,
  PLAN_SEATS,
  type RazorpayPlanTier,
  type BillingCadence,
  type SubscriptionStatus,
} from "@workspace/db";
import {
  requireAuth,
  requireWorkspace,
  canonicalRole,
  type WorkspaceCtx,
} from "../lib/authContext";
import { permissionsFor } from "../lib/permissions";
import {
  razorpay,
  RAZORPAY_PUBLIC_KEY_ID,
  verifySubscriptionPayment,
  verifyOrderPayment,
  verifyWebhookSignature,
} from "../lib/razorpay";
import { ensureMonthlyRazorpayPlan } from "../lib/razorpayPlans";
import {
  activateWorkspacePlan,
  reapAbandonedSubscribePlaceholders,
} from "../lib/billingPlanSync";
import { msTrack } from "../lib/marketingstuffs";
import { logger } from "../lib/logger";
import { encryptField } from "../lib/fieldEncryption";

const router: IRouter = Router();

// Statuses from which a subscription may NOT be resurrected by an
// out-of-order webhook event. `cancelled`/`completed` are true terminal
// states. `halted`/`expired` are not strictly terminal in Razorpay's
// model (a halted sub can be resumed via the Razorpay dashboard if the
// user updates their card), but for OUR money-safety we treat them as
// non-resurrectable: a stale `subscription.charged`/`activated` arriving
// after `halted` from an OLD billing cycle must not re-grant paid access
// for free. If a user wants to resume after halted/expired, they should
// re-subscribe through /billing/subscribe — that creates a fresh
// subscription row whose webhook events activate cleanly.
const TERMINAL_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  "cancelled",
  "completed",
  "halted",
  "expired",
];

const SubscribeBody = z.object({
  plan: z.enum(RAZORPAY_PLANS),
  cadence: z.enum(BILLING_CADENCES),
});

const VerifySubscriptionBody = z.object({
  kind: z.literal("subscription"),
  razorpay_payment_id: z.string().min(1),
  razorpay_subscription_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

const VerifyOrderBody = z.object({
  kind: z.literal("order"),
  razorpay_payment_id: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

const VerifyBody = z.discriminatedUnion("kind", [
  VerifySubscriptionBody,
  VerifyOrderBody,
]);

function ownerOnly(req: Request): WorkspaceCtx | null {
  const ctx = (req as Request & { ws_ctx: WorkspaceCtx }).ws_ctx;
  if (!permissionsFor(canonicalRole(ctx.role)).canManageBilling) return null;
  return ctx;
}

/**
 * POST /api/billing/subscribe — kicks off a new payment intent.
 *
 * Monthly → creates a Razorpay Subscription (auto-renews via Razorpay).
 * Annual  → creates a one-time Razorpay Order (no auto-renew because the
 *           amount exceeds the RBI ₹15k card auto-debit cap).
 *
 * Returns whatever Checkout JS needs to open the modal on the client.
 */
router.post(
  "/billing/subscribe",
  requireAuth,
  requireWorkspace,
  async (req, res) => {
    const ctx = ownerOnly(req);
    if (!ctx) {
      res
        .status(403)
        .json({ error: "Only the workspace owner can change billing." });
      return;
    }

    const body = SubscribeBody.parse(req.body);
    const { plan, cadence } = body;
    const amountPaise = PLAN_PRICE_PAISE[plan][cadence];

    // Just-in-time clean up of abandoned placeholders (>10min old, never
    // got a Razorpay id). Without this, a user whose previous attempt
    // crashed mid-flow would be permanently locked out by the partial
    // unique index. No cron required — happens on retry.
    await reapAbandonedSubscribePlaceholders(ctx.workspace.id);

    // Race-safe duplicate-subscribe defence in two layers:
    //   (1) Application pre-check for nice UX (fast 409 with no DB write)
    //   (2) Database-level partial unique index on (workspace_id) WHERE
    //       status NOT IN terminal — the actual hard guarantee. We INSERT
    //       a placeholder row BEFORE calling Razorpay; if a concurrent
    //       request races us, the unique violation aborts before any
    //       Razorpay-side sub/order is created. No orphaned subs at
    //       Razorpay = no double-charge possible.
    const existingActive = await db
      .select({ id: subscriptionsTable.id, status: subscriptionsTable.status })
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.workspaceId, ctx.workspace.id),
          notInArray(
            subscriptionsTable.status,
            TERMINAL_SUBSCRIPTION_STATUSES,
          ),
        ),
      )
      .limit(1);
    if (existingActive[0]) {
      res.status(409).json({
        error:
          "You already have an active or pending subscription. Cancel it before starting a new one.",
        existingSubscriptionId: existingActive[0].id,
      });
      return;
    }

    const localId = randomUUID();
    try {
      await db.insert(subscriptionsTable).values({
        id: localId,
        workspaceId: ctx.workspace.id,
        plan,
        cadence,
        status: "created",
      });
    } catch (err) {
      // Postgres unique_violation = 23505. If two concurrent subscribes
      // race, the second one lands here.
      const code = (err as { code?: string }).code;
      if (code === "23505") {
        res.status(409).json({
          error:
            "Another subscription was just started for this workspace. Please refresh.",
        });
        return;
      }
      throw err;
    }

    if (cadence === "monthly") {
      try {
        const { razorpayPlanId } = await ensureMonthlyRazorpayPlan(plan);
        // total_count = 120 = 10 years; effectively indefinite until cancelled.
        const sub = await razorpay.subscriptions.create({
          plan_id: razorpayPlanId,
          total_count: 120,
          customer_notify: 1,
          notes: {
            workspace_id: ctx.workspace.id,
            plan,
            cadence,
            local_id: localId,
          },
        });

        await db
          .update(subscriptionsTable)
          .set({
            razorpaySubscriptionId: sub.id,
            razorpayPlanId,
            status: (sub.status as SubscriptionStatus) ?? "created",
            updatedAt: new Date(),
          })
          .where(eq(subscriptionsTable.id, localId));

        res.json({
          kind: "subscription",
          subscriptionId: sub.id,
          keyId: RAZORPAY_PUBLIC_KEY_ID,
          amountPaise,
          currency: "INR",
          plan,
          cadence,
        });
        return;
      } catch (err) {
        // Razorpay create failed. Mark the placeholder row terminal so
        // the partial unique index releases and the user can retry.
        await db
          .update(subscriptionsTable)
          .set({ status: "cancelled", updatedAt: new Date() })
          .where(eq(subscriptionsTable.id, localId));
        throw err;
      }
    }

    // Annual — one-time order (12-month access, no auto-renew).
    try {
      const order = await razorpay.orders.create({
        amount: amountPaise,
        currency: "INR",
        receipt: `ws_${ctx.workspace.id.slice(0, 16)}_${Date.now().toString(36)}`,
        notes: {
          workspace_id: ctx.workspace.id,
          plan,
          cadence,
          local_id: localId,
        },
      });

      await db
        .update(subscriptionsTable)
        .set({
          razorpayOrderId: order.id,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionsTable.id, localId));

      res.json({
        kind: "order",
        orderId: order.id,
        keyId: RAZORPAY_PUBLIC_KEY_ID,
        amountPaise,
        currency: "INR",
        plan,
        cadence,
      });
    } catch (err) {
      await db
        .update(subscriptionsTable)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(subscriptionsTable.id, localId));
      throw err;
    }
  },
);

/**
 * POST /api/billing/verify — called by the Checkout JS success handler.
 *
 * We verify the HMAC signature so a malicious client can't claim a payment
 * succeeded when it didn't. On success the workspace is upgraded immediately
 * (we don't wait for the webhook — but the webhook is the source of truth
 * for ongoing renewals). For monthly, status will be flipped to "active" by
 * the subscription.activated webhook a few seconds later.
 */
router.post(
  "/billing/verify",
  requireAuth,
  requireWorkspace,
  async (req, res) => {
    const ctx = ownerOnly(req);
    if (!ctx) {
      res
        .status(403)
        .json({ error: "Only the workspace owner can change billing." });
      return;
    }
    const body = VerifyBody.parse(req.body);

    if (body.kind === "subscription") {
      if (
        !verifySubscriptionPayment({
          razorpay_payment_id: body.razorpay_payment_id,
          razorpay_subscription_id: body.razorpay_subscription_id,
          razorpay_signature: body.razorpay_signature,
        })
      ) {
        res.status(400).json({ error: "Invalid payment signature." });
        return;
      }
      const sub = await db
        .select()
        .from(subscriptionsTable)
        .where(
          eq(
            subscriptionsTable.razorpaySubscriptionId,
            body.razorpay_subscription_id,
          ),
        )
        .limit(1);
      if (!sub[0] || sub[0].workspaceId !== ctx.workspace.id) {
        res.status(404).json({ error: "Subscription not found." });
        return;
      }

      // Idempotent: if the webhook already activated this subscription,
      // /verify is a no-op success. Don't re-mutate state. Don't re-apply
      // the plan (the workspace is already on it).
      if (sub[0].status === "active") {
        res.json({ ok: true, plan: sub[0].plan, cadence: sub[0].cadence });
        return;
      }

      // Positive allowlist for activatable statuses. Anything else
      // (cancelled, completed, halted, expired, paused) is non-activatable
      // — the original signed `/verify` payload remains valid forever, so
      // a replay must NOT be able to re-grant paid access for a
      // subscription that's no longer in a payable state. Activated rows
      // were handled by the early-return above.
      const ACTIVATABLE: SubscriptionStatus[] = [
        "created",
        "authenticated",
        "pending",
      ];
      if (!ACTIVATABLE.includes(sub[0].status as SubscriptionStatus)) {
        res
          .status(409)
          .json({ error: "Subscription is no longer in an activatable state." });
        return;
      }

      // Wrap status flip + workspace activation in one DB transaction
      // so a mid-flow failure rolls back BOTH writes. Without this, a
      // crash between the two would leave sub.status='active' but the
      // workspace still on free, and the next /verify would early-return
      // because sub is already active — silently denying access to a
      // paid customer.
      await db.transaction(async (tx) => {
        await tx
          .update(subscriptionsTable)
          .set({ status: "active", updatedAt: new Date() })
          .where(eq(subscriptionsTable.id, sub[0].id));
        const ok = await activateWorkspacePlan({
          exec: tx,
          workspaceId: ctx.workspace.id,
          subscriptionId: sub[0].id,
          newPlan: sub[0].plan,
          planExpiresAt: null,
        });
        if (!ok) {
          // Should be impossible: subscribe enforces no duplicate
          // non-terminal subs, so workspace should be on free or
          // already entitled by this sub. Throw to roll back the
          // status flip and let the user retry — better than silent
          // money loss.
          throw new Error(
            "activation CAS lost in /verify — workspace state inconsistent",
          );
        }
      });

      res.json({ ok: true, plan: sub[0].plan, cadence: sub[0].cadence });
      return;
    }

    // body.kind === "order" (annual one-time)
    if (
      !verifyOrderPayment({
        razorpay_order_id: body.razorpay_order_id,
        razorpay_payment_id: body.razorpay_payment_id,
        razorpay_signature: body.razorpay_signature,
      })
    ) {
      res.status(400).json({ error: "Invalid payment signature." });
      return;
    }
    const sub = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.razorpayOrderId, body.razorpay_order_id))
      .limit(1);
    if (!sub[0] || sub[0].workspaceId !== ctx.workspace.id) {
      res.status(404).json({ error: "Order not found." });
      return;
    }

    // Replay protection: a captured verify payload for an annual order is
    // valid forever (the signature is over fixed strings). Without this
    // check, the same signed payload could be POSTed every 11 months to
    // perpetually extend periodEnd by another year — free annuals. Once
    // active, /verify is idempotent and never extends the period. The
    // webhook is the only thing that can grant a new annual period, and
    // it's gated behind a real `payment.captured` from Razorpay.
    if (sub[0].status === "active") {
      res.json({ ok: true, plan: sub[0].plan, cadence: sub[0].cadence });
      return;
    }
    // Positive allowlist for annual order activation. Annual orders only
    // exist in `created` (waiting for payment) or `active` (paid) state in
    // our flow; anything else (cancelled, completed, halted, expired)
    // means the entitlement is gone and a replay must not resurrect it.
    if (sub[0].status !== "created") {
      res
        .status(409)
        .json({ error: "This order is no longer in an activatable state." });
      return;
    }

    const periodEnd = new Date();
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);

    // Atomic: status flip + workspace activation in one transaction.
    // Without this, a mid-flow crash would leave sub.status='active' but
    // workspace still free; on retry the early-return-on-active check
    // would silently deny access to a paid annual customer.
    await db.transaction(async (tx) => {
      await tx
        .update(subscriptionsTable)
        .set({
          status: "active",
          currentPeriodEnd: periodEnd,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionsTable.id, sub[0].id));
      const ok = await activateWorkspacePlan({
        exec: tx,
        workspaceId: ctx.workspace.id,
        subscriptionId: sub[0].id,
        newPlan: sub[0].plan,
        planExpiresAt: periodEnd,
      });
      if (!ok) {
        throw new Error(
          "annual activation CAS lost in /verify — workspace state inconsistent",
        );
      }
    });

    res.json({ ok: true, plan: sub[0].plan, cadence: sub[0].cadence });
  },
);

/**
 * POST /api/billing/cancel — cancel the active monthly subscription at the
 * end of the current billing period. Annuals can't be cancelled (they're
 * one-time orders that simply expire after 12 months).
 */
router.post(
  "/billing/cancel",
  requireAuth,
  requireWorkspace,
  async (req, res) => {
    const ctx = ownerOnly(req);
    if (!ctx) {
      res
        .status(403)
        .json({ error: "Only the workspace owner can change billing." });
      return;
    }
    // Cancel the workspace's CURRENT entitling subscription, not "the
    // newest row" — those can diverge if there were prior cancelled
    // subscriptions or a duplicate-subscribe attempt slipped through.
    // currentSubscriptionId is the pointer the rest of the system
    // already trusts as the source of paid access.
    if (!ctx.workspace.currentSubscriptionId) {
      res.status(404).json({ error: "No active subscription to cancel." });
      return;
    }
    const active = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.id, ctx.workspace.currentSubscriptionId))
      .limit(1);
    const row = active[0];
    if (
      !row ||
      row.workspaceId !== ctx.workspace.id ||
      row.cadence !== "monthly" ||
      !row.razorpaySubscriptionId ||
      TERMINAL_SUBSCRIPTION_STATUSES.includes(row.status as SubscriptionStatus)
    ) {
      res.status(404).json({
        error:
          "No cancellable monthly subscription. Annual plans expire automatically.",
      });
      return;
    }
    // cancel_at_cycle_end=1 → keeps user on the plan until the period they
    // already paid for ends, then stops billing.
    await razorpay.subscriptions.cancel(row.razorpaySubscriptionId, true);
    await db
      .update(subscriptionsTable)
      .set({ cancelAtPeriodEnd: true, updatedAt: new Date() })
      .where(eq(subscriptionsTable.id, row.id));
    res.json({ ok: true, cancelAtPeriodEnd: true });
  },
);

/**
 * GET /api/billing/me — current subscription state for the workspace UI.
 */
router.get("/billing/me", requireAuth, requireWorkspace, async (req, res) => {
  const ctx = (req as Request & { ws_ctx: WorkspaceCtx }).ws_ctx;
  const rows = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.workspaceId, ctx.workspace.id))
    .orderBy(desc(subscriptionsTable.createdAt))
    .limit(1);
  const sub = rows[0] ?? null;
  res.json({
    workspaceId: ctx.workspace.id,
    plan: ctx.workspace.plan,
    planActivatedAt: ctx.workspace.planActivatedAt,
    planExpiresAt: ctx.workspace.planExpiresAt,
    subscription: sub
      ? {
          id: sub.id,
          plan: sub.plan,
          cadence: sub.cadence,
          status: sub.status,
          currentPeriodEnd: sub.currentPeriodEnd,
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
          razorpaySubscriptionId: sub.razorpaySubscriptionId,
          razorpayOrderId: sub.razorpayOrderId,
        }
      : null,
  });
});

/**
 * POST /api/billing/webhook — Razorpay → us. Source of truth for ongoing
 * subscription state changes. Verifies the HMAC signature against the raw
 * request bytes (express.json's `verify` hook stashes them on req.rawBody).
 *
 * Always responds 200 once the signature passes — Razorpay retries on
 * non-2xx, which would create duplicate processing during transient errors.
 */
router.post("/billing/webhook", async (req, res) => {
  const signature = req.header("x-razorpay-signature");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawBody = (req as any).rawBody as Buffer | undefined;

  if (!signature || !rawBody) {
    res.status(400).json({ error: "Missing signature or raw body." });
    return;
  }

  if (!verifyWebhookSignature(rawBody, signature)) {
    req.log.warn("Razorpay webhook signature verification failed");
    res.status(400).json({ error: "Invalid signature." });
    return;
  }

  // Body is already JSON-parsed by express.json earlier in the middleware
  // chain; we only used rawBody for HMAC. Safe to reuse req.body.
  const event = req.body as {
    event: string;
    payload: Record<string, { entity: Record<string, unknown> }>;
  };

  try {
    await handleRazorpayEvent(event, req.log);
  } catch (err) {
    // Return 5xx so Razorpay retries this delivery. Without retries, a
    // transient DB blip during processing would silently drop a paid
    // user's activation OR a cancellation — both lose money. The payment
    // ledger is idempotent (unique razorpayPaymentId), so retrying is
    // safe even if the failure happened mid-handler.
    req.log.error(
      { err: err instanceof Error ? err.message : String(err), event: event.event },
      "razorpay webhook handler threw — returning 500 so Razorpay retries",
    );
    res.status(500).json({ error: "Webhook processing failed." });
    return;
  }

  res.json({ ok: true });
});

interface RazorpayPaymentEntity {
  id: string;
  order_id?: string;
  invoice_id?: string;
  amount: number;
  currency: string;
  status: string;
  method?: string;
  email?: string;
  contact?: string;
  notes?: Record<string, string>;
}

interface RazorpaySubscriptionEntity {
  id: string;
  status: string;
  current_end?: number; // unix seconds
  notes?: Record<string, string>;
}

interface RazorpayOrderEntity {
  id: string;
  amount: number;
  currency: string;
  status: string;
  notes?: Record<string, string>;
}

async function handleRazorpayEvent(
  event: { event: string; payload: Record<string, { entity: Record<string, unknown> }> },
  log: { info: (o: object, m?: string) => void; warn: (o: object, m?: string) => void },
): Promise<void> {
  const payload = event.payload;

  // Persist any payment we see so we have a ledger. Idempotent via
  // razorpay_payment_id unique index — duplicate webhook deliveries no-op.
  if (payload.payment) {
    const p = payload.payment.entity as unknown as RazorpayPaymentEntity;
    const subEntity = payload.subscription?.entity as
      | unknown as RazorpaySubscriptionEntity
      | undefined;
    const subId = subEntity?.id;
    const workspaceId =
      p.notes?.["workspace_id"] ??
      subEntity?.notes?.["workspace_id"] ??
      null;

    // We use ON CONFLICT DO NOTHING + .returning() so we can tell whether
    // this delivery is brand new or a Razorpay retry. Only fire downstream
    // side effects (marketingstuffs, plan activation) on the first sighting
    // — duplicate deliveries become true no-ops.
    const inserted = await db
      .insert(paymentsTable)
      .values({
        id: randomUUID(),
        workspaceId,
        razorpayPaymentId: p.id,
        razorpayOrderId: p.order_id ?? null,
        razorpaySubscriptionId: subId ?? null,
        amountPaise: p.amount,
        currency: p.currency,
        status: p.status,
        method: p.method ?? null,
        email: encryptField(p.email ?? null),
        contact: encryptField(p.contact ?? null),
        capturedAt: p.status === "captured" ? new Date() : null,
        rawEvent: event,
      })
      .onConflictDoNothing({ target: paymentsTable.razorpayPaymentId })
      .returning({ id: paymentsTable.id });

    const isNewPayment = inserted.length > 0;

    if (isNewPayment && p.status === "captured") {
      void msTrack({
        event: "payment_completed",
        email: p.email,
        metadata: {
          amount: p.amount / 100,
          currency: p.currency,
          order_id: p.order_id,
          payment_id: p.id,
          subscription_id: subId,
          workspace_id: workspaceId,
        },
      });
    }
  }

  // Webhook events from Razorpay can arrive out of order, especially
  // after retries. We protect against two stale-event hazards:
  //   (a) "Resurrection" — an old `activated`/`charged` arriving after a
  //       newer `cancelled`/`completed`. Defence: refuse to write a
  //       non-terminal status onto a row that's already terminal.
  //   (b) "Stale downgrade" — an old `cancelled`/`halted` arriving after
  //       the workspace has already moved to a different (newer) paid
  //       subscription/order. Defence: only downgrade the workspace if
  //       its `currentSubscriptionId` still points at this subscription
  //       row. Otherwise, update the subscription row's own status but
  //       leave workspace.plan alone.
  switch (event.event) {
    case "subscription.activated":
    case "subscription.charged": {
      // Source of truth for monthly activation. /billing/verify is a fast
      // path for the happy case where the user keeps the tab open, but if
      // they close it after Checkout success we'd otherwise leave them on
      // free even though they paid. The webhook makes sure paid = paid.
      //
      // Wrapped in a transaction with activateWorkspacePlan's atomic CAS
      // so a stale `charged` for an old subscription cannot clobber a
      // workspace that has already moved to a different paid sub, and
      // a concurrent cancellation cannot be resurrected by an in-flight
      // activation race (CAS requires sub.status='active' at the moment
      // of the workspace UPDATE).
      const s = payload.subscription.entity as unknown as RazorpaySubscriptionEntity;
      await db.transaction(async (tx) => {
        const applied = await applySubscriptionStatusTx(tx, s, "active");
        if (!applied) {
          log.info(
            { subscriptionId: s.id, event: event.event },
            "ignoring stale activate/charge for terminal subscription",
          );
          return;
        }
        const sub = await loadSubscriptionByRazorpayIdTx(tx, s.id);
        if (!sub) return;
        const ok = await activateWorkspacePlan({
          exec: tx,
          workspaceId: sub.workspaceId,
          subscriptionId: sub.id,
          newPlan: sub.plan,
          planExpiresAt: null,
        });
        if (!ok) {
          log.info(
            {
              subscriptionId: s.id,
              workspaceId: sub.workspaceId,
              event: event.event,
            },
            "activation CAS lost — workspace already entitled by a different subscription, leaving alone",
          );
        }
      });
      break;
    }
    case "subscription.pending": {
      const s = payload.subscription.entity as unknown as RazorpaySubscriptionEntity;
      await applySubscriptionStatus(s, "pending");
      break;
    }
    case "subscription.halted": {
      // Razorpay retried payment until the bank gave up. Workspace is no
      // longer paying — drop them back to free immediately. We can't keep
      // serving paid features for free.
      const s = payload.subscription.entity as unknown as RazorpaySubscriptionEntity;
      await applySubscriptionStatus(s, "halted");
      await downgradeIfCurrent(s.id);
      break;
    }
    case "subscription.paused": {
      // User-initiated pause from Razorpay-hosted page. Status only, no
      // downgrade — they should still keep access until the next charge
      // would have happened.
      const s = payload.subscription.entity as unknown as RazorpaySubscriptionEntity;
      await applySubscriptionStatus(s, "paused");
      break;
    }
    case "subscription.cancelled":
    case "subscription.completed": {
      // Both events mark end-of-life for the subscription. Downgrade to
      // free regardless of which one Razorpay sends — for cancel-at-cycle-end
      // and for natural-expiry of total_count, the actual access end is
      // when this fires.
      const s = payload.subscription.entity as unknown as RazorpaySubscriptionEntity;
      await applySubscriptionStatus(
        s,
        event.event === "subscription.completed" ? "completed" : "cancelled",
      );
      await downgradeIfCurrent(s.id);
      break;
    }
    case "order.paid": {
      // Annual one-time purchases. The verify endpoint already upgraded the
      // workspace; this is a belt-and-braces in case the user closes the
      // tab before /verify runs.
      //
      // Wrapped in a transaction so subscription status flip + workspace
      // activation succeed or fail together — never half-applied. The CAS
      // EXISTS check inside activateWorkspacePlan prevents resurrection
      // races (stale order.paid arriving after a concurrent downgrade).
      const o = payload.order.entity as unknown as RazorpayOrderEntity;
      await db.transaction(async (tx) => {
        const found = await tx
          .select()
          .from(subscriptionsTable)
          .where(eq(subscriptionsTable.razorpayOrderId, o.id))
          .limit(1);
        const row = found[0];
        if (!row) return;
        if (row.status === "active") return; // idempotent no-op
        if (
          TERMINAL_SUBSCRIPTION_STATUSES.includes(
            row.status as SubscriptionStatus,
          )
        ) {
          log.info(
            { orderId: o.id, status: row.status },
            "ignoring stale order.paid for terminal subscription row",
          );
          return;
        }
        const periodEnd = new Date();
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        await tx
          .update(subscriptionsTable)
          .set({
            status: "active",
            currentPeriodEnd: periodEnd,
            updatedAt: new Date(),
          })
          .where(eq(subscriptionsTable.id, row.id));
        const ok = await activateWorkspacePlan({
          exec: tx,
          workspaceId: row.workspaceId,
          subscriptionId: row.id,
          newPlan: row.plan,
          planExpiresAt: periodEnd,
        });
        if (!ok) {
          log.info(
            { orderId: o.id, workspaceId: row.workspaceId },
            "annual activation CAS lost — workspace already entitled by a different subscription, leaving alone",
          );
        }
      });
      break;
    }
    default:
      // Unhandled event — log so we can decide later if we care.
      log.info({ event: event.event }, "razorpay webhook: unhandled event type");
  }
}

async function loadSubscriptionByRazorpayId(razorpaySubscriptionId: string) {
  const rows = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.razorpaySubscriptionId, razorpaySubscriptionId))
    .limit(1);
  return rows[0] ?? null;
}


/**
 * Apply a Razorpay-reported status update to our subscription row, but
 * never resurrect a terminal subscription. Returns true if the update
 * was applied, false if it was rejected as a stale resurrection event.
 *
 * The terminal-state guard is enforced in SQL via a conditional WHERE so
 * concurrent webhook deliveries (e.g. a stale `charged` arriving while a
 * `cancelled` is being processed) cannot race past the check.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbOrTx = typeof db | any;

async function applySubscriptionStatusTx(
  exec: DbOrTx,
  s: RazorpaySubscriptionEntity,
  status: SubscriptionStatus,
): Promise<boolean> {
  const periodEnd = s.current_end ? new Date(s.current_end * 1000) : undefined;
  const whereClause = TERMINAL_SUBSCRIPTION_STATUSES.includes(status)
    ? eq(subscriptionsTable.razorpaySubscriptionId, s.id)
    : and(
        eq(subscriptionsTable.razorpaySubscriptionId, s.id),
        notInArray(subscriptionsTable.status, TERMINAL_SUBSCRIPTION_STATUSES),
      );
  const updated = await exec
    .update(subscriptionsTable)
    .set({
      status,
      ...(periodEnd ? { currentPeriodEnd: periodEnd } : {}),
      updatedAt: new Date(),
    })
    .where(whereClause)
    .returning({ id: subscriptionsTable.id });
  return updated.length > 0;
}

async function applySubscriptionStatus(
  s: RazorpaySubscriptionEntity,
  status: SubscriptionStatus,
): Promise<boolean> {
  return applySubscriptionStatusTx(db, s, status);
}

async function loadSubscriptionByRazorpayIdTx(
  exec: DbOrTx,
  razorpaySubscriptionId: string,
) {
  const rows = await exec
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.razorpaySubscriptionId, razorpaySubscriptionId))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Downgrade the subscription's workspace to free, but ONLY if this
 * subscription is still the workspace's current entitling subscription.
 * Protects against an old `cancelled`/`halted` event arriving after the
 * workspace has moved to a newer paid subscription/order.
 *
 * The "is current?" check is performed in the same SQL UPDATE that
 * downgrades — a CAS-style `WHERE id=? AND current_subscription_id=?` —
 * so a concurrent activation cannot squeeze a new pointer in between
 * read and write and have it clobbered.
 */
async function downgradeIfCurrent(
  razorpaySubscriptionId: string,
): Promise<void> {
  const sub = await loadSubscriptionByRazorpayId(razorpaySubscriptionId);
  if (!sub) return;
  const updated = await db
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
    .where(
      and(
        eq(workspacesTable.id, sub.workspaceId),
        eq(workspacesTable.currentSubscriptionId, sub.id),
      ),
    )
    .returning({ id: workspacesTable.id });
  if (updated.length === 0) {
    // Either the workspace has moved on (newer subscription pointer) or
    // it was already on free. Nothing to do.
    return;
  }
}

export default router;
