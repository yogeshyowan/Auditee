import { pgTable, text, integer } from "drizzle-orm/pg-core";

export const pdlcStagesTable = pgTable("pdlc_stages", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  stage: text("stage").notNull(),
  title: text("title").notNull(),
  completion: integer("completion").notNull().default(0),
  blockers: integer("blockers").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type PdlcStage = typeof pdlcStagesTable.$inferSelect;
