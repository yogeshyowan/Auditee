import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const demoRequestsTable = pgTable("demo_requests", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  message: text("message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DemoRequest = typeof demoRequestsTable.$inferSelect;
