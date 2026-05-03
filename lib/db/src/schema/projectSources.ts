import { pgTable, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";

// A configured source from which project artifacts are ingested for auditing.
// kind: github | zip | folder | jira | jenkins | aws_s3 | gdrive | alm | cloud_server | url
//     | confluence | gitlab | bitbucket | slack | msteams | servicenow
// config holds connection details (tokens are NOT returned to the client after creation).
// status: idle | syncing | ready | error
export const projectSourcesTable = pgTable("project_sources", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  kind: text("kind").notNull(),
  label: text("label").notNull(),
  config: jsonb("config").$type<Record<string, unknown>>().notNull().default({}),
  status: text("status").notNull().default("idle"),
  statusMessage: text("status_message"),
  fileCount: integer("file_count").notNull().default(0),
  byteCount: integer("byte_count").notNull().default(0),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// A file/blob ingested from a source. content is stored only for small text files
// (under ~256 KB). Larger or binary files only keep metadata.
export const sourceFilesTable = pgTable("source_files", {
  id: text("id").primaryKey(),
  sourceId: text("source_id").notNull(),
  path: text("path").notNull(),
  size: integer("size").notNull().default(0),
  mime: text("mime"),
  language: text("language"),
  isBinary: text("is_binary").notNull().default("false"),
  content: text("content"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ProjectSource = typeof projectSourcesTable.$inferSelect;
export type SourceFile = typeof sourceFilesTable.$inferSelect;
