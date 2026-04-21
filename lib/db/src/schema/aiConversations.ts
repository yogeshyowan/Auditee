import { pgTable, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";

export const aiConversationsTable = pgTable(
  "ai_conversations",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id"),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    confidence: text("confidence"),
    citations: jsonb("citations").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    createdAtIdx: index("ai_conversations_created_at_idx").on(t.createdAt),
    projectIdIdx: index("ai_conversations_project_id_idx").on(t.projectId),
  }),
);

export type AiConversation = typeof aiConversationsTable.$inferSelect;
