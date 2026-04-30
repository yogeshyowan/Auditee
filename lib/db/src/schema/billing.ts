import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  timestamp,
  uniqueIndex,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";

/** Razorpay-side billing cadence. Monthly = subscription with auto-renew.
 *  Annual = one-time order (RBI auto-debit cap on cards is ₹15k/txn so
 *  ₹19,990+ annuals can't auto-renew on cards without e-NACH). */
export const BILLING_CADENCES = ["monthly", "annual"] as const;
export type BillingCadence = (typeof BILLING_CADENCES)[number];

/** Plans we sell through Razorpay. Free is intentionally absent (no payment).
 *  Enterprise is sold via contact-sales, not through Razorpay. */
export const RAZORPAY_PLANS = ["standard", "professional"] as const;
export type RazorpayPlanTier = (typeof RAZORPAY_PLANS)[number];

/** Razorpay subscription lifecycle. Mirrors the values Razorpay's webhook
 *  events assert. We persist these verbatim. */
export const SUBSCRIPTION_STATUSES = [
  "created",
  "authenticated",
  "active",
  "pending",
  "halted",
  "cancelled",
  "completed",
  "expired",
  "paused",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

/** Pricing source-of-truth (paise = INR × 100). Razorpay APIs always work
 *  in paise. Keep this in sync with the marketing pricing page. */
export const PLAN_PRICE_PAISE: Record<
  RazorpayPlanTier,
  Record<BillingCadence, number>
> = {
  standard: { monthly: 199900, annual: 1999000 },
  professional: { monthly: 799900, annual: 7999000 },
};

/** Cache of Razorpay Plan objects so we don't recreate them on every boot.
 *  Razorpay Plans are reusable across customers and free to create, but
 *  duplicates pollute the dashboard so we look up by (plan, cadence) first. */
export const razorpayPlansTable = pgTable(
  "razorpay_plans",
  {
    id: text("id").primaryKey(),
    plan: text("plan").$type<RazorpayPlanTier>().notNull(),
    cadence: text("cadence").$type<BillingCadence>().notNull(),
    razorpayPlanId: text("razorpay_plan_id").notNull(),
    amountPaise: integer("amount_paise").notNull(),
    currency: text("currency").notNull().default("INR"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniqPlanCadence: uniqueIndex("razorpay_plans_plan_cadence_uniq").on(
      t.plan,
      t.cadence,
    ),
  }),
);

/** A subscription represents a workspace's recurring billing relationship.
 *  Annual purchases create a row with cadence='annual' but no Razorpay
 *  subscription id (one-time orders don't have one) — `razorpayOrderId`
 *  is set instead and `currentPeriodEnd` records the 12-month expiry. */
export const subscriptionsTable = pgTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    plan: text("plan").$type<RazorpayPlanTier>().notNull(),
    cadence: text("cadence").$type<BillingCadence>().notNull(),
    /** Razorpay subscription id (sub_*). Null for annual one-time orders. */
    razorpaySubscriptionId: text("razorpay_subscription_id"),
    /** Razorpay order id (order_*). Set for annual one-time purchases. */
    razorpayOrderId: text("razorpay_order_id"),
    razorpayPlanId: text("razorpay_plan_id"),
    status: text("status").$type<SubscriptionStatus>().notNull(),
    /** When the current paid period ends. For annual = createdAt + 12 months.
     *  For monthly = the next renewal date Razorpay reports. */
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniqRzpSub: uniqueIndex("subscriptions_razorpay_sub_id_uniq").on(
      t.razorpaySubscriptionId,
    ),
    uniqRzpOrder: uniqueIndex("subscriptions_razorpay_order_id_uniq").on(
      t.razorpayOrderId,
    ),
    /**
     * Hard guarantee that a workspace has AT MOST one non-terminal
     * subscription/order at any time. Without this, two concurrent
     * /billing/subscribe requests can both pass the application-level
     * SELECT pre-check and both succeed, double-charging the customer.
     * This partial unique index is enforced by Postgres so the second
     * insert fails with a unique violation and the caller can roll back
     * the Razorpay-side sub/order it just created.
     *
     * Terminal statuses (cancelled/completed/halted/expired) are
     * excluded so historical rows from past subscriptions don't block
     * new ones.
     */
    uniqWsActive: uniqueIndex("subscriptions_workspace_active_uniq")
      .on(t.workspaceId)
      .where(
        sql`status NOT IN ('cancelled','completed','halted','expired')`,
      ),
  }),
);

/** One row per Razorpay payment event we receive (webhook or verify). Used
 *  for ledger / reconciliation and to dedupe duplicate webhook deliveries. */
export const paymentsTable = pgTable(
  "payments",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id"),
    razorpayPaymentId: text("razorpay_payment_id").notNull(),
    razorpayOrderId: text("razorpay_order_id"),
    razorpaySubscriptionId: text("razorpay_subscription_id"),
    amountPaise: integer("amount_paise").notNull(),
    currency: text("currency").notNull().default("INR"),
    /** Razorpay payment status: created, authorized, captured, refunded, failed. */
    status: text("status").notNull(),
    method: text("method"),
    email: text("email"),
    contact: text("contact"),
    capturedAt: timestamp("captured_at", { withTimezone: true }),
    rawEvent: jsonb("raw_event"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniqRzpPayment: uniqueIndex("payments_razorpay_payment_id_uniq").on(
      t.razorpayPaymentId,
    ),
  }),
);

export type RazorpayPlanRow = typeof razorpayPlansTable.$inferSelect;
export type Subscription = typeof subscriptionsTable.$inferSelect;
export type Payment = typeof paymentsTable.$inferSelect;
