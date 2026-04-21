import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const commentsTable = pgTable("comments", {
  id: text("id").primaryKey(),
  entityType: text("entity_type").notNull(), // requirement | capa | report | audit
  entityId: text("entity_id").notNull(),
  projectId: text("project_id"),
  author: text("author").notNull(),
  body: text("body").notNull(),
  mentions: jsonb("mentions").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Comment = typeof commentsTable.$inferSelect;
