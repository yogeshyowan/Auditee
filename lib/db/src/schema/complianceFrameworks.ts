import { pgTable, text, integer, timestamp, index } from "drizzle-orm/pg-core";

export const complianceFrameworksTable = pgTable(
  "compliance_frameworks",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    category: text("category").notNull().default(""),
    status: text("status").notNull().default("passing"),
    score: integer("score").notNull().default(0),
    controlsTotal: integer("controls_total").notNull().default(0),
    lastAuditAt: timestamp("last_audit_at", { withTimezone: true }).notNull().defaultNow(),
    // Workspace ownership: NULL = global/seeded standard (visible to everyone),
    // populated = workspace-private uploaded standard (only that workspace sees it).
    workspaceId: text("workspace_id"),
    // Provenance: "seeded" for the curated catalog; "uploaded" for AI-extracted
    // from a customer-uploaded PDF/DOCX/TXT via /api/standards/upload.
    source: text("source").notNull().default("seeded"),
    description: text("description").notNull().default(""),
    originalFilename: text("original_filename"),
    uploadedBy: text("uploaded_by"),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }),
  },
  (t) => ({
    workspaceIdx: index("compliance_frameworks_workspace_idx").on(t.workspaceId),
  }),
);

export type ComplianceFramework = typeof complianceFrameworksTable.$inferSelect;
