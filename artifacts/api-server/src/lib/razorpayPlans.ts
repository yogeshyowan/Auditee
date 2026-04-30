import { randomUUID } from "node:crypto";
import { eq, and } from "drizzle-orm";
import {
  db,
  razorpayPlansTable,
  PLAN_PRICE_PAISE,
  type RazorpayPlanTier,
  type BillingCadence,
} from "@workspace/db";
import { razorpay } from "./razorpay";
import { logger } from "./logger";

const PLAN_DISPLAY: Record<RazorpayPlanTier, string> = {
  standard: "Auditee Standard",
  professional: "Auditee Professional",
};

const CADENCE_RAZORPAY_PERIOD: Record<
  BillingCadence,
  { period: "monthly" | "yearly"; interval: number }
> = {
  monthly: { period: "monthly", interval: 1 },
  // Annual is intentionally not used to create a Razorpay PLAN — annual is
  // sold as a one-time Order, not a Subscription. Including the entry for
  // type completeness; ensureRazorpayPlan() will refuse to create it.
  annual: { period: "yearly", interval: 1 },
};

/**
 * Idempotently fetch (and create-if-missing) the Razorpay Plan id for a
 * (plan, cadence) pair. Caches the id in our DB so we don't recreate plans
 * on every server boot — important on Live mode where dupes pollute the
 * dashboard and look like billing churn.
 *
 * Only `cadence: "monthly"` plans are real Razorpay Plans. Annual purchases
 * are sold as one-time Orders elsewhere and don't need a Plan object.
 */
export async function ensureMonthlyRazorpayPlan(
  plan: RazorpayPlanTier,
): Promise<{ razorpayPlanId: string; amountPaise: number }> {
  const cadence: BillingCadence = "monthly";
  const amountPaise = PLAN_PRICE_PAISE[plan][cadence];

  const existing = await db
    .select()
    .from(razorpayPlansTable)
    .where(
      and(
        eq(razorpayPlansTable.plan, plan),
        eq(razorpayPlansTable.cadence, cadence),
      ),
    )
    .limit(1);

  // Drift guard: if the cached row's amount no longer matches our source
  // of truth (PLAN_PRICE_PAISE), the cached Razorpay Plan is at the OLD
  // price. Razorpay does not support mutating a Plan's amount — we must
  // create a new Plan and bump our cache. Without this, every new
  // subscriber after a price change would be charged the old amount
  // forever.
  if (existing[0] && existing[0].amountPaise === amountPaise) {
    return {
      razorpayPlanId: existing[0].razorpayPlanId,
      amountPaise: existing[0].amountPaise,
    };
  }
  if (existing[0] && existing[0].amountPaise !== amountPaise) {
    logger.warn(
      {
        plan,
        cachedAmount: existing[0].amountPaise,
        currentAmount: amountPaise,
        oldRazorpayPlanId: existing[0].razorpayPlanId,
      },
      "Razorpay Plan amount drift detected — creating a new Plan at current price",
    );
  }

  const periodCfg = CADENCE_RAZORPAY_PERIOD[cadence];
  const created = await razorpay.plans.create({
    period: periodCfg.period,
    interval: periodCfg.interval,
    item: {
      name: `${PLAN_DISPLAY[plan]} (Monthly)`,
      amount: amountPaise,
      currency: "INR",
      description: `Monthly subscription to the ${PLAN_DISPLAY[plan]} plan.`,
    },
    notes: {
      auditee_plan: plan,
      auditee_cadence: cadence,
    },
  });

  const razorpayPlanId = created.id;

  if (existing[0]) {
    // Repoint the cache row at the new Razorpay Plan id so subsequent
    // subscribers go on the new price. Existing active subscribers stay
    // on the old plan id (Razorpay handles that — we don't re-attach).
    await db
      .update(razorpayPlansTable)
      .set({
        razorpayPlanId,
        amountPaise,
        updatedAt: new Date(),
      })
      .where(eq(razorpayPlansTable.id, existing[0].id));
  } else {
    await db.insert(razorpayPlansTable).values({
      id: randomUUID(),
      plan,
      cadence,
      razorpayPlanId,
      amountPaise,
      currency: "INR",
    });
  }

  logger.info(
    { plan, razorpayPlanId, amountPaise },
    "Created Razorpay Plan and cached id",
  );

  return { razorpayPlanId, amountPaise };
}
