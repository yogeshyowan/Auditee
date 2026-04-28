import { randomUUID } from "node:crypto";
import type { Request } from "express";
import { db, auditLogsTable } from "@workspace/db";

interface AuditLogParams {
  workspaceId: string;
  actorUserId: string;
  actorEmail: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  metadata?: Record<string, unknown> | null;
  req?: Request;
}

/**
 * Best-effort append-only audit row.
 *
 * Failures are swallowed (logged to stderr) so an audit-table outage cannot
 * break user-facing mutations. Per SOC 2 evidence requirements, callers
 * should still treat this as the authoritative record of admin actions.
 */
export async function auditLog(params: AuditLogParams): Promise<void> {
  try {
    const ip =
      params.req?.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ??
      params.req?.socket.remoteAddress ??
      null;
    const userAgent = params.req?.headers["user-agent"] ?? null;
    await db.insert(auditLogsTable).values({
      id: randomUUID(),
      workspaceId: params.workspaceId,
      actorUserId: params.actorUserId,
      actorEmail: params.actorEmail,
      action: params.action,
      resourceType: params.resourceType ?? null,
      resourceId: params.resourceId ?? null,
      metadata: params.metadata ?? null,
      ip,
      userAgent: typeof userAgent === "string" ? userAgent.slice(0, 500) : null,
    });
  } catch (err) {
    // Never let audit-trail failure block the action. Surface to logs.
    // eslint-disable-next-line no-console
    console.error("[audit_log] insert failed", err);
  }
}
