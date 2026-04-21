import { pgTable, text } from "drizzle-orm/pg-core";

export const codeArtifactsTable = pgTable("code_artifacts", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  filePath: text("file_path").notNull(),
  language: text("language").notNull(),
  symbol: text("symbol").notNull(),
  kind: text("kind").notNull(), // function | class | module | service
  repoUrl: text("repo_url"),
});

export type CodeArtifact = typeof codeArtifactsTable.$inferSelect;
