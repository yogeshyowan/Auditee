import { pgTable, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";

export const capaActionsTable = pgTable("capa_actions", {
  id: text("id").primaryKey(),
  code: text("code").notNull(),
  projectId: text("project_id").notNull(),
  frameworkId: text("framework_id"),
  controlId: text("control_id"),
  controlCode: text("control_code"),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  severity: text("severity").notNull().default("medium"), // low | medium | high | critical
  status: text("status").notNull().default("open"), // open | in_progress | blocked | done | cancelled
  owner: text("owner").notNull().default("Unassigned"),
  source: text("source").notNull().default("manual"), // manual | ai_audit | inspection
  evidenceCount: integer("evidence_count").notNull().default(0),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  dueAt: timestamp("due_at", { withTimezone: true }),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CapaAction = typeof capaActionsTable.$inferSelect;
