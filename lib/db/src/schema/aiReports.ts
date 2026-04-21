import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export type ReportSection = {
  id: string;
  heading: string;
  body: string;
  citations?: string[];
};

export type ReportContent = {
  title: string;
  subtitle?: string;
  executiveSummary: string;
  sections: ReportSection[];
  evidence: Array<{ id: string; label: string; source: string }>;
};

export const aiReportsTable = pgTable("ai_reports", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  frameworkId: text("framework_id"),
  kind: text("kind").notNull(), // compliance_audit | requirements_summary | traceability | exec_brief
  tone: text("tone").notNull().default("executive"), // executive | technical | regulator
  title: text("title").notNull(),
  status: text("status").notNull().default("draft"), // draft | finalised
  content: jsonb("content").$type<ReportContent>().notNull(),
  history: jsonb("history").$type<Array<{ at: string; instruction: string }>>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AiReport = typeof aiReportsTable.$inferSelect;
