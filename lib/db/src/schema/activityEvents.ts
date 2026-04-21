import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const activityEventsTable = pgTable("activity_events", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(),
  message: text("message").notNull(),
  actor: text("actor").notNull(),
  entityCode: text("entity_code"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ActivityEvent = typeof activityEventsTable.$inferSelect;
