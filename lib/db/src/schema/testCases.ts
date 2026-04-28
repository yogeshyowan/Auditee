import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

/**
 * Test case — a single executable verification tied (optionally) to a
 * requirement. Status is the latest run outcome; lastRunAt and lastRunNote
 * are updated by POST /api/test-cases/:id/run.
 */
export const testCasesTable = pgTable("test_cases", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  requirementId: text("requirement_id"), // nullable — exploratory cases ok
  title: text("title").notNull(),
  type: text("type").notNull().default("functional"), // functional | negative | non_functional | acceptance
  steps: jsonb("steps").$type<string[]>().notNull().default([]),
  expected: text("expected").notNull().default(""),
  status: text("status").notNull().default("draft"), // draft | passing | failing | blocked
  priority: text("priority").notNull().default("medium"), // low | medium | high | critical
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  createdBy: text("created_by").notNull().default("Auditee"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  lastRunNote: text("last_run_note").notNull().default(""),
});

export type TestCase = typeof testCasesTable.$inferSelect;
