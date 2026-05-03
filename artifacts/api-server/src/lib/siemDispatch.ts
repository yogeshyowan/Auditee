import { createHmac } from "node:crypto";
import { logger } from "./logger";

/**
 * Fire-and-forget HTTPS push of an audit-log row to a workspace's configured
 * SIEM webhook. Supports four payload shapes via `format`:
 *   - "generic"    — Auditee's native JSON (default, backward compatible)
 *   - "splunk_hec" — Splunk HTTP Event Collector envelope
 *   - "datadog"    — Datadog Logs intake (ddsource/ddtags/service/host)
 *   - "elastic"    — Elastic Common Schema (ECS) flat fields
 *
 * Each request is signed with HMAC-SHA256 using the workspace's
 * `siem_webhook_secret`; receivers should verify the `X-Auditee-Signature`
 * header before trusting the payload. (Splunk HEC also accepts the secret as a
 * `Splunk <token>` Authorization header — we send both so customers can use
 * whichever their HEC instance is configured for.)
 *
 * Failures are swallowed so a downstream SIEM outage cannot block the
 * customer's user-facing mutation. Errors are logged for ops to follow up.
 */
export interface SiemEvent {
  id: string;
  workspaceId: string;
  actorUserId: string;
  actorEmail: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  integrityHash: string;
  createdAt: string; // ISO 8601
}

export type SiemFormat = "generic" | "splunk_hec" | "datadog" | "elastic";

export function signSiemPayload(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

function formatPayload(event: SiemEvent, format: SiemFormat): string {
  switch (format) {
    case "splunk_hec":
      // Splunk HEC envelope. `event` is the user payload; `time` is epoch
      // seconds. `sourcetype` lets Splunk apply field extractions.
      return JSON.stringify({
        time: Math.floor(new Date(event.createdAt).getTime() / 1000),
        host: "auditee",
        source: "auditee:audit-log",
        sourcetype: "auditee:audit:v1",
        event,
      });
    case "datadog":
      // Datadog Logs intake — flat object with reserved attributes.
      return JSON.stringify({
        ddsource: "auditee",
        ddtags: `workspace:${event.workspaceId},action:${event.action}`,
        service: "auditee-audit-log",
        hostname: "auditee",
        timestamp: event.createdAt,
        message: `[${event.action}] by ${event.actorEmail ?? event.actorUserId}`,
        ...event,
      });
    case "elastic":
      // Elastic Common Schema (ECS) — map our fields onto ECS namespaces.
      return JSON.stringify({
        "@timestamp": event.createdAt,
        "event.kind": "event",
        "event.category": ["iam", "configuration"],
        "event.action": event.action,
        "event.id": event.id,
        "event.dataset": "auditee.audit",
        "user.id": event.actorUserId,
        "user.email": event.actorEmail,
        "client.ip": event.ip,
        "user_agent.original": event.userAgent,
        "organization.id": event.workspaceId,
        "labels.resource_type": event.resourceType,
        "labels.resource_id": event.resourceId,
        "labels.integrity_hash": event.integrityHash,
        auditee: { metadata: event.metadata },
      });
    case "generic":
    default:
      return JSON.stringify(event);
  }
}

export async function dispatchToSiem(
  url: string,
  secret: string | null,
  event: SiemEvent,
  format: SiemFormat = "generic",
): Promise<void> {
  // Run in next tick so the audit insert can return immediately.
  setImmediate(async () => {
    try {
      const body = formatPayload(event, format);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "Auditee-SIEM/1.0",
        "X-Auditee-Event": event.action,
        "X-Auditee-Workspace": event.workspaceId,
        "X-Auditee-Format": format,
      };
      if (secret) headers["X-Auditee-Signature"] = signSiemPayload(secret, body);
      // Splunk HEC also accepts the secret as a bearer token. Sending both
      // costs nothing and lets the same secret work in either direction.
      if (format === "splunk_hec" && secret) headers["Authorization"] = `Splunk ${secret}`;

      // Don't trust customer-supplied URLs blindly. Reject non-https in prod.
      if (!url.startsWith("https://") && process.env.NODE_ENV === "production") {
        logger.warn({ url }, "[siem] refusing non-https endpoint in production");
        return;
      }

      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), 5000);
      try {
        // Route through safeFetch so admins can't aim the SIEM webhook at internal/cloud
        // metadata endpoints (SSRF). safeFetch resolves DNS first and refuses private/loopback IPs.
        const { safeFetch } = await import("./safe-fetch.js");
        const res = await safeFetch(url, { method: "POST", headers, body, signal: ac.signal });
        if (!res.ok) {
          logger.warn(
            { url, status: res.status, eventId: event.id, format },
            "[siem] webhook responded non-2xx",
          );
        }
      } finally {
        clearTimeout(timer);
      }
    } catch (err) {
      logger.warn({ err, url, eventId: event.id, format }, "[siem] dispatch failed");
    }
  });
}
