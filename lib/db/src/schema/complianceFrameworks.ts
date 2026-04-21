import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const complianceFrameworksTable = pgTable("compliance_frameworks", {
  id: text("id").primaryKey(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull().default(""),
  status: text("status").notNull().default("passing"),
  score: integer("score").notNull().default(0),
  controlsTotal: integer("controls_total").notNull().default(0),
  lastAuditAt: timestamp("last_audit_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ComplianceFramework = typeof complianceFrameworksTable.$inferSelect;
