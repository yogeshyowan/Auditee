import { eq, isNull } from "drizzle-orm";
import { db, leadCapturesTable } from "@workspace/db";
import { postToGoogleSheet } from "./googleSheetSync";
import { logger } from "./logger";

/**
 * Replays every lead_captures row that was never successfully forwarded into
 * the connected Google Sheet. Safe to run on every server start: rows with a
 * non-null forwardedToFormAt are skipped, so re-runs are no-ops once caught
 * up. If GOOGLE_SHEET_ID isn't configured the function exits immediately.
 */
export async function backfillUnforwardedLeads(): Promise<{
  attempted: number;
  forwarded: number;
  failed: number;
}> {
  if (!process.env.GOOGLE_SHEET_ID?.trim()) {
    return { attempted: 0, forwarded: 0, failed: 0 };
  }

  const pending = await db
    .select()
    .from(leadCapturesTable)
    .where(isNull(leadCapturesTable.forwardedToFormAt));

  if (pending.length === 0) return { attempted: 0, forwarded: 0, failed: 0 };

  logger.info({ count: pending.length }, "Back-filling unforwarded leads to Google Sheet");

  let forwarded = 0;
  let failed = 0;
  for (const row of pending) {
    const result = await postToGoogleSheet({
      name: row.name,
      email: row.email,
      id: row.clerkUserId,
      source: row.source,
      capturedAt: row.createdAt.toISOString(),
    });
    if (!result.attempted) break;
    if (result.ok) {
      await db
        .update(leadCapturesTable)
        .set({ forwardedToFormAt: new Date(), forwardError: null })
        .where(eq(leadCapturesTable.id, row.id));
      forwarded += 1;
    } else {
      await db
        .update(leadCapturesTable)
        .set({ forwardError: result.error ?? `status_${result.status ?? "unknown"}` })
        .where(eq(leadCapturesTable.id, row.id));
      failed += 1;
    }
  }

  logger.info({ attempted: pending.length, forwarded, failed }, "Lead back-fill complete");
  return { attempted: pending.length, forwarded, failed };
}
