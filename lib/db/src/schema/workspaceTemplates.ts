import { pgTable, text, timestamp, integer, customType, uniqueIndex } from "drizzle-orm/pg-core";
import { workspacesTable } from "./workspaces";

const bytea = customType<{ data: Buffer; default: false }>({
  dataType() {
    return "bytea";
  },
});

/**
 * Per-workspace company letterhead template (.docx).
 *
 * One row per workspace. The template is a Word document with placeholders:
 *   {title}, {subtitle}, {date}, {tone}, {generated_by}, {executive_summary},
 *   and a sections loop {#sections}{heading}{body}{/sections}.
 *
 * When present, every report DOCX export is rendered through this template
 * so the resulting file inherits the company header, footer, logo, fonts and
 * page styles defined in the user-uploaded letterhead.
 */
export const workspaceTemplatesTable = pgTable(
  "workspace_templates",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspacesTable.id, { onDelete: "cascade" }),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    fileBytes: bytea("file_bytes").notNull(),
    fileSize: integer("file_size").notNull(),
    uploadedBy: text("uploaded_by").notNull(),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqWorkspace: uniqueIndex("workspace_templates_workspace_uniq").on(t.workspaceId),
  }),
);

export type WorkspaceTemplate = typeof workspaceTemplatesTable.$inferSelect;
