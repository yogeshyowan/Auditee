import { pgTable, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";

export const auditRunsTable = pgTable(
  "audit_runs",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull(),
    sourceId: text("source_id"),
    kind: text("kind").notNull().$type<"compliance" | "traceability">(),
    frameworkId: text("framework_id"),
    frameworkCode: text("framework_code"),
    sourceLabel: text("source_label"),
    result: jsonb("result").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byProjectKind: index("audit_runs_project_kind_idx").on(t.projectId, t.kind),
    bySourceKind: index("audit_runs_source_kind_idx").on(t.sourceId, t.kind),
  }),
);

export type AuditRun = typeof auditRunsTable.$inferSelect;
