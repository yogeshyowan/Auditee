import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const LEAD_CAPTURE_SOURCES = ["signup", "login", "waitlist"] as const;
export type LeadCaptureSource = (typeof LEAD_CAPTURE_SOURCES)[number];

export const leadCapturesTable = pgTable(
  "lead_captures",
  {
    id: text("id").primaryKey(),
    clerkUserId: text("clerk_user_id"),
    name: text("name").notNull(),
    email: text("email").notNull(),
    source: text("source").$type<LeadCaptureSource>().notNull(),
    forwardedToFormAt: timestamp("forwarded_to_form_at", { withTimezone: true }),
    forwardError: text("forward_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailSourceUnique: uniqueIndex("lead_captures_email_source_unique").on(t.email, t.source),
  }),
);

export type LeadCapture = typeof leadCapturesTable.$inferSelect;
