import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const requirementsTable = pgTable("requirements", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  code: text("code").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  type: text("type").notNull(), // BRD | PRD | FRD | NFR
  status: text("status").notNull().default("draft"),
  priority: text("priority").notNull().default("medium"),
  owner: text("owner").notNull().default("Unassigned"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  linkedFrameworks: jsonb("linked_frameworks").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Requirement = typeof requirementsTable.$inferSelect;
