import { createHmac } from "node:crypto";
import { logger } from "./logger";

/**
 * Fire-and-forget HTTPS push of an audit-log row to a workspace's configured
 * SIEM webhook. Intended for Splunk HEC, Datadog Logs intake, Elastic ingest,
 * or any generic JSON HTTPS endpoint.
 *
 * Each request is signed with HMAC-SHA256 using the workspace's
 * `siem_webhook_secret`; receivers should verify the `X-Auditee-Signature`
 * header before trusting the payload.
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

export function signSiemPayload(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

export async function dispatchToSiem(
  url: string,
  secret: string | null,
  event: SiemEvent,
): Promise<void> {
  // Run in next tick so the audit insert can return immediately.
  setImmediate(async () => {
    try {
      const body = JSON.stringify(event);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "Auditee-SIEM/1.0",
        "X-Auditee-Event": event.action,
        "X-Auditee-Workspace": event.workspaceId,
      };
      if (secret) headers["X-Auditee-Signature"] = signSiemPayload(secret, body);

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
            { url, status: res.status, eventId: event.id },
            "[siem] webhook responded non-2xx",
          );
        }
      } finally {
        clearTimeout(timer);
      }
    } catch (err) {
      logger.warn({ err, url, eventId: event.id }, "[siem] dispatch failed");
    }
  });
}
