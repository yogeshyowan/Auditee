import { pgTable, text, timestamp, integer, doublePrecision, jsonb } from "drizzle-orm/pg-core";

export type EffortEstimateRow = {
  requirementCode: string;
  hours: number;
  complexity: "trivial" | "small" | "medium" | "large" | "epic";
  rationale: string;
  risks?: string[];
};

export const effortEstimatesTable = pgTable("effort_estimates", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  requirementCount: integer("requirement_count").notNull(),
  totalHours: doublePrecision("total_hours").notNull(),
  weeksAtOneFte: doublePrecision("weeks_at_one_fte").notNull(),
  complexityBreakdown: jsonb("complexity_breakdown").$type<Record<string, number>>().notNull().default({}),
  estimates: jsonb("estimates").$type<EffortEstimateRow[]>().notNull().default([]),
  assumptions: jsonb("assumptions").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type EffortEstimate = typeof effortEstimatesTable.$inferSelect;
