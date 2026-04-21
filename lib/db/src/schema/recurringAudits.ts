import { pgTable, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

// Recurring compliance audit schedule. The scheduler tick (in api-server) iterates
// active rows where nextRunAt <= now() and triggers an AI compliance audit, then
// computes the next nextRunAt based on cadence.
export const recurringAuditsTable = pgTable("recurring_audits", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  frameworkId: text("framework_id").notNull(),
  cadence: text("cadence").notNull().default("weekly"), // daily | weekly | monthly | quarterly
  hourUtc: integer("hour_utc").notNull().default(13),
  notifyTo: text("notify_to").notNull().default(""), // comma-separated handles/emails
  active: boolean("active").notNull().default(true),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  lastRunStatus: text("last_run_status"),
  nextRunAt: timestamp("next_run_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type RecurringAudit = typeof recurringAuditsTable.$inferSelect;
