import { pgTable, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { workspacesTable } from "./workspaces";

/**
 * Append-only audit trail of every meaningful action in a workspace.
 *
 * Rows are written by `auditLog()` from API route handlers (member invites,
 * role changes, plan changes, SSO config, etc.). Frontend exposes these on
 * an admin-only Audit Log page (Enterprise plans only) for SOC 2 / ISO 27001
 * evidence and incident-response forensics.
 */
export const auditLogsTable = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspacesTable.id, { onDelete: "cascade" }),
    actorUserId: text("actor_user_id").notNull(),
    actorEmail: text("actor_email"),
    action: text("action").notNull(),
    resourceType: text("resource_type"),
    resourceId: text("resource_id"),
    metadata: jsonb("metadata"),
    ip: text("ip"),
    userAgent: text("user_agent"),
    /**
     * SHA-256 tamper-detection hash of the record's canonical fields.
     * Computed at insert time over: id|workspaceId|actorUserId|action|
     * resourceType|resourceId|createdAt. Allows offline integrity verification.
     */
    integrityHash: text("integrity_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byWorkspace: index("audit_logs_workspace_idx").on(t.workspaceId, t.createdAt),
  }),
);

export type AuditLog = typeof auditLogsTable.$inferSelect;
