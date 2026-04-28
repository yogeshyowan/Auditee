import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

/**
 * Test case — a single verification tied (optionally) to a requirement, design,
 * architecture artefact, or piece of code. Status is the latest run outcome;
 * lastRunAt / lastRunNote are updated by POST /api/test-cases/:id/run or by
 * the AI execution engine at /api/ai/run-test-suite.
 *
 * The richer dimensions (level / discipline / paradigm / mode / sourceKind)
 * let teams generate exhaustive suites covering V-model + agile lifecycles
 * across procedural, BDD, OO, and functional/property-based styles.
 */
export const testCasesTable = pgTable("test_cases", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  requirementId: text("requirement_id"), // nullable — exploratory cases ok
  title: text("title").notNull(),

  // Legacy single "type" — kept for back-compat; new code uses discipline.
  type: text("type").notNull().default("functional"), // functional | negative | non_functional | acceptance

  // V-model level — where in the pyramid this case sits.
  // unit | integration | system | acceptance | operational
  level: text("level").notNull().default("system"),

  // What kind of property is being verified.
  // functional | negative | regulatory | performance | security | usability |
  // compatibility | regression | accessibility | reliability | uat
  discipline: text("discipline").notNull().default("functional"),

  // Test design paradigm.
  // procedural | bdd | oo_state | functional_property | exploratory
  paradigm: text("paradigm").notNull().default("procedural"),

  // Static (review/inspection/walkthrough) vs dynamic (executed at runtime).
  mode: text("mode").notNull().default("dynamic"), // static | dynamic

  // Where the test was derived from (which lifecycle artefact).
  // requirement | design | architecture | code | report | project | manual
  sourceKind: text("source_kind").notNull().default("requirement"),
  // Stable references the case was generated from — `[{kind, id, label}]`.
  sourceRefs: jsonb("source_refs").$type<Array<{ kind: string; id: string; label?: string }>>().notNull().default([]),

  // Test body.
  preconditions: text("preconditions").notNull().default(""),
  steps: jsonb("steps").$type<string[]>().notNull().default([]),
  expected: text("expected").notNull().default(""),
  // Optional Gherkin-style script for BDD cases (Given/When/Then).
  gherkin: text("gherkin"),

  status: text("status").notNull().default("draft"), // draft | passing | failing | blocked
  priority: text("priority").notNull().default("medium"), // low | medium | high | critical
  tags: jsonb("tags").$type<string[]>().notNull().default([]),

  createdBy: text("created_by").notNull().default("Auditee"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  lastRunNote: text("last_run_note").notNull().default(""),
  // AI-execution verdict + reasoning, populated by /api/ai/run-test-suite.
  lastRunVerdict: text("last_run_verdict"), // pass | fail | inconclusive
  lastRunReportId: text("last_run_report_id"),
});

export const TC_LEVELS = ["unit", "integration", "system", "acceptance", "operational"] as const;
export const TC_DISCIPLINES = [
  "functional",
  "negative",
  "regulatory",
  "performance",
  "security",
  "usability",
  "compatibility",
  "regression",
  "accessibility",
  "reliability",
  "uat",
] as const;
export const TC_PARADIGMS = ["procedural", "bdd", "oo_state", "functional_property", "exploratory"] as const;
export const TC_MODES = ["static", "dynamic"] as const;
export const TC_SOURCE_KINDS = ["requirement", "design", "architecture", "code", "report", "project", "manual"] as const;

export type TcLevel = (typeof TC_LEVELS)[number];
export type TcDiscipline = (typeof TC_DISCIPLINES)[number];
export type TcParadigm = (typeof TC_PARADIGMS)[number];
export type TcMode = (typeof TC_MODES)[number];
export type TcSourceKind = (typeof TC_SOURCE_KINDS)[number];

export type TestCase = typeof testCasesTable.$inferSelect;
