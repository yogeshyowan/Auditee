import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

// Lightweight in-app notification stream. The `channel` column is informational —
// "in_app" is always written; "email" / "sms" are added by the delivery adapter
// when the matching transport is configured.
export const notificationsTable = pgTable("notifications", {
  id: text("id").primaryKey(),
  recipient: text("recipient").notNull(), // user handle / email
  kind: text("kind").notNull(), // workflow_blocked | workflow_completed | capa_created | audit_completed | mention
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  link: text("link"),
  channels: jsonb("channels").$type<string[]>().notNull().default(["in_app"]),
  data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Notification = typeof notificationsTable.$inferSelect;
