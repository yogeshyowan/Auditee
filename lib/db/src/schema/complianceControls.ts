import { pgTable, text, integer } from "drizzle-orm/pg-core";

export const complianceControlsTable = pgTable("compliance_controls", {
  id: text("id").primaryKey(),
  frameworkId: text("framework_id").notNull(),
  code: text("code").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  status: text("status").notNull().default("met"),
  owner: text("owner").notNull().default("Unassigned"),
  evidenceCount: integer("evidence_count").notNull().default(0),
});

export type ComplianceControl = typeof complianceControlsTable.$inferSelect;
