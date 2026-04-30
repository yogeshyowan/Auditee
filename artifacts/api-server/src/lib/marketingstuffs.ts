import { logger } from "./logger";

const MS_API = "https://marketingstuffs.site/__api/email/trigger";

export interface MsTriggerPayload {
  /** Must match the trigger_event name configured in the marketingstuffs.site
   *  automation. Examples: "lead_captured", "payment_completed", "custom". */
  event: string;
  email?: string;
  name?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Fires a custom marketingstuffs.site automation trigger from the server.
 * Best-effort: failures are logged at warn level but never thrown so they
 * cannot break the request the caller is in the middle of handling.
 *
 * Call this from any backend code path that should kick off an email
 * automation (e.g. payment captured, lead captured, account upgraded). To
 * avoid blocking the response, prefer `void msTrack({...})` rather than
 * `await msTrack(...)`.
 */
export async function msTrack(payload: MsTriggerPayload): Promise<void> {
  try {
    const res = await fetch(MS_API, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      logger.warn(
        { status: res.status, event: payload.event },
        "marketingstuffs trigger returned non-success status",
      );
    }
  } catch (err) {
    logger.warn(
      {
        err: err instanceof Error ? err.message : String(err),
        event: payload.event,
      },
      "marketingstuffs trigger threw",
    );
  }
}
