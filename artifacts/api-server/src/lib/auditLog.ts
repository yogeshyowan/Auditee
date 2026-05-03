import { randomUUID, createHash } from "node:crypto";
import type { Request } from "express";
import { db, auditLogsTable } from "@workspace/db";
import { logger } from "./logger";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditLogDetails {
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  metadata?: Record<string, unknown> | null;
}

/** Object-form params (used by workspace.ts / workspaceTemplate.ts) */
interface AuditLogParams extends AuditLogDetails {
  workspaceId: string;
  actorUserId: string;
  actorEmail: string | null;
  req?: Request;
}

// ─── Integrity hash ───────────────────────────────────────────────────────────

/**
 * Compute a SHA-256 tamper-detection hash over the record's canonical fields.
 * Format: SHA-256( id | workspaceId | actorUserId | action |
 *                   resourceType | resourceId | createdAt )
 *
 * This lets auditors verify that a row has not been modified after insertion
 * by recomputing the hash offline with the same input fields.
 */
function computeIntegrityHash(
  id: string,
  workspaceId: string,
  actorUserId: string,
  action: string,
  resourceType: string | null | undefined,
  resourceId: string | null | undefined,
  createdAt: Date,
): string {
  const payload = [
    id,
    workspaceId,
    actorUserId,
    action,
    resourceType ?? "",
    resourceId ?? "",
    createdAt.toISOString(),
  ].join("|");
  return createHash("sha256").update(payload).digest("hex");
}

// ─── Core insert ─────────────────────────────────────────────────────────────

async function insertAuditRow(
  id: string,
  workspaceId: string,
  actorUserId: string,
  actorEmail: string | null,
  action: string,
  resourceType: string | null | undefined,
  resourceId: string | null | undefined,
  metadata: Record<string, unknown> | null | undefined,
  req: Request | undefined,
): Promise<void> {
  try {
    const ip =
      req?.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ??
      req?.socket?.remoteAddress ??
      null;
    const userAgent = req?.headers["user-agent"] ?? null;
    const createdAt = new Date();
    const integrityHash = computeIntegrityHash(
      id, workspaceId, actorUserId, action, resourceType, resourceId, createdAt,
    );

    await db.insert(auditLogsTable).values({
      id,
      workspaceId,
      actorUserId,
      actorEmail,
      action,
      resourceType: resourceType ?? null,
      resourceId: resourceId ?? null,
      metadata: metadata ?? null,
      ip,
      userAgent: typeof userAgent === "string" ? userAgent.slice(0, 500) : null,
      integrityHash,
      createdAt,
    });
  } catch (err) {
    logger.error({ err }, "[audit_log] insert failed");
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Best-effort append-only audit row.
 *
 * Supports two call signatures:
 *
 *   // Object form (workspace.ts, workspaceTemplate.ts):
 *   await auditLog({ workspaceId, actorUserId, actorEmail, action, ... });
 *
 *   // Positional form (projects.ts):
 *   await auditLog(req, workspaceId, userId, email, { action, ... });
 *
 * Failures are swallowed so an audit-table outage cannot block user-facing mutations.
 */
export async function auditLog(
  reqOrParams: Request | AuditLogParams,
  workspaceId?: string,
  actorUserId?: string,
  actorEmail?: string | null,
  details?: AuditLogDetails,
): Promise<void> {
  const id = randomUUID();

  // Positional form: first arg is a Request object
  if (workspaceId !== undefined && actorUserId !== undefined && details !== undefined) {
    await insertAuditRow(
      id,
      workspaceId,
      actorUserId,
      actorEmail ?? null,
      details.action,
      details.resourceType,
      details.resourceId,
      details.metadata,
      reqOrParams as Request,
    );
    return;
  }

  // Object form: first arg is AuditLogParams
  const p = reqOrParams as AuditLogParams;
  await insertAuditRow(
    id,
    p.workspaceId,
    p.actorUserId,
    p.actorEmail,
    p.action,
    p.resourceType,
    p.resourceId,
    p.metadata,
    p.req,
  );
}

// ─── Security events ──────────────────────────────────────────────────────────

/**
 * Log a security-relevant event (denied access, suspicious activity, etc.)
 * to the audit trail under the special `security.*` action namespace.
 *
 * Uses a sentinel workspace ID of "SYSTEM" when no workspace is available
 * (e.g. unauthenticated probes) so the row is still queryable.
 */
export async function logSecurityEvent(
  req: Request,
  event: {
    action:
      | "security.permission_denied"
      | "security.rate_limit_exceeded"
      | "security.invalid_token"
      | "security.suspicious_input"
      | string;
    workspaceId?: string | null;
    actorUserId?: string | null;
    actorEmail?: string | null;
    resourceType?: string | null;
    resourceId?: string | null;
    metadata?: Record<string, unknown> | null;
  },
): Promise<void> {
  await insertAuditRow(
    randomUUID(),
    event.workspaceId ?? "SYSTEM",
    event.actorUserId ?? "anonymous",
    event.actorEmail ?? null,
    event.action,
    event.resourceType,
    event.resourceId,
    event.metadata,
    req,
  );
}
