import { logger } from "./logger";

export interface GoogleSheetPayload {
  name: string;
  email: string;
  id: string;
  source: string;
  capturedAt: string;
}

export interface GoogleSheetSyncResult {
  attempted: boolean;
  ok: boolean;
  status?: number;
  error?: string;
}

/**
 * Pushes a captured lead to a Google Sheet via a bound Google Apps Script
 * web-app deployment. Activates only when GOOGLE_SHEET_WEBHOOK_URL is set;
 * otherwise returns { attempted: false } so the caller can persist the row
 * locally and forward later when the webhook is wired up.
 *
 * Setup (one-time, no Cloud project required):
 *   1. Open the target Google Sheet.
 *   2. Extensions > Apps Script. Replace Code.gs with:
 *        const TOKEN = "<paste a long random string here, optional>";
 *        function doPost(e) {
 *          const body = JSON.parse(e.postData.contents);
 *          if (TOKEN && body.token !== TOKEN) {
 *            return ContentService.createTextOutput("forbidden")
 *              .setMimeType(ContentService.MimeType.TEXT);
 *          }
 *          const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
 *          sheet.appendRow([
 *            body.capturedAt, body.source, body.name, body.email, body.id,
 *          ]);
 *          return ContentService.createTextOutput("ok");
 *        }
 *   3. Deploy > New deployment > type "Web app".
 *      Execute as: Me. Who has access: Anyone (or "Anyone with the link").
 *   4. Copy the resulting /exec URL into env var GOOGLE_SHEET_WEBHOOK_URL.
 *      If you used a TOKEN, also set GOOGLE_SHEET_WEBHOOK_TOKEN to the same
 *      value so the server includes it on every request.
 */
export async function postToGoogleSheet(
  payload: GoogleSheetPayload,
): Promise<GoogleSheetSyncResult> {
  const url = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!url) return { attempted: false, ok: false };

  const token = process.env.GOOGLE_SHEET_WEBHOOK_TOKEN ?? "";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, token }),
      redirect: "follow",
    });
    const ok = res.status >= 200 && res.status < 400;
    if (!ok) {
      logger.warn(
        { status: res.status, statusText: res.statusText },
        "Google Sheet webhook returned non-success status",
      );
    }
    return { attempted: true, ok, status: res.status };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    logger.error({ err: error }, "Google Sheet webhook threw");
    return { attempted: true, ok: false, error };
  }
}
