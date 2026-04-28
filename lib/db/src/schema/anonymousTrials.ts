import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

/**
 * Server-side counter for anonymous (signed-out) free-trial usage.
 *
 * Each browser is issued a `trial_id` via an HttpOnly signed cookie on its
 * first request to a credit-gated endpoint. We then atomically increment
 * `credits_used` server-side under the global cap (`ANON_CREDIT_LIMIT`),
 * making the cap impossible to bypass by header/localStorage forgery.
 */
export const anonymousTrialsTable = pgTable("anonymous_trials", {
  id: text("id").primaryKey(),
  creditsUsed: integer("credits_used").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
