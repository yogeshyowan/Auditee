import { ReplitConnectors } from "@replit/connectors-sdk";
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

const HEADER_ROW = ["capturedAt", "source", "name", "email", "clerkUserId"];
const SHEET_RANGE = "Sheet1!A:E";

let connectors: ReplitConnectors | null = null;
function getConnectors(): ReplitConnectors {
  if (!connectors) connectors = new ReplitConnectors();
  return connectors;
}

let headerEnsured = false;
let headerEnsurePromise: Promise<void> | null = null;

function getSpreadsheetId(): string | null {
  return process.env.GOOGLE_SHEET_ID?.trim() || null;
}

async function readResponseSnippet(res: Response): Promise<string> {
  try {
    const text = await res.text();
    return text.slice(0, 300);
  } catch {
    return "";
  }
}

async function ensureHeaderRow(spreadsheetId: string): Promise<void> {
  if (headerEnsured) return;
  if (headerEnsurePromise) return headerEnsurePromise;

  headerEnsurePromise = (async () => {
    try {
      const c = getConnectors();
      const getRes = await c.proxy(
        "google-sheet",
        `/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent("Sheet1!A1:E1")}`,
        { method: "GET" },
      );
      if (!getRes.ok) {
        const snippet = await readResponseSnippet(getRes);
        logger.warn(
          { status: getRes.status, snippet },
          "Google Sheet header probe failed",
        );
        return;
      }
      const data = (await getRes.json()) as { values?: string[][] };
      const firstCell = data.values?.[0]?.[0];
      if (firstCell === HEADER_ROW[0]) {
        headerEnsured = true;
        return;
      }
      const writeRes = await c.proxy(
        "google-sheet",
        `/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent("Sheet1!A1:E1")}?valueInputOption=RAW`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ values: [HEADER_ROW] }),
        },
      );
      if (writeRes.ok) {
        headerEnsured = true;
      } else {
        const snippet = await readResponseSnippet(writeRes);
        logger.warn(
          { status: writeRes.status, snippet },
          "Google Sheet header write failed",
        );
      }
    } catch (err) {
      logger.warn(
        { err: err instanceof Error ? err.message : String(err) },
        "Google Sheet header ensure threw",
      );
    } finally {
      headerEnsurePromise = null;
    }
  })();

  return headerEnsurePromise;
}

/**
 * Appends a captured lead as a new row in the Google Sheet identified by
 * GOOGLE_SHEET_ID, using the connected Replit "google-sheet" integration
 * (OAuth, no Apps Script or service account required).
 *
 * Returns { attempted: false } when GOOGLE_SHEET_ID is not configured so the
 * caller can persist the row locally and forward later.
 */
export async function postToGoogleSheet(
  payload: GoogleSheetPayload,
): Promise<GoogleSheetSyncResult> {
  const spreadsheetId = getSpreadsheetId();
  if (!spreadsheetId) return { attempted: false, ok: false };

  try {
    await ensureHeaderRow(spreadsheetId);

    const c = getConnectors();
    const path = `/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(SHEET_RANGE)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    const res = await c.proxy("google-sheet", path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        values: [
          [
            payload.capturedAt,
            payload.source,
            payload.name,
            payload.email,
            payload.id,
          ],
        ],
      }),
    });

    if (!res.ok) {
      const snippet = await readResponseSnippet(res);
      logger.warn(
        { status: res.status, snippet },
        "Google Sheet append returned non-success status",
      );
      return {
        attempted: true,
        ok: false,
        status: res.status,
        error: snippet || `status_${res.status}`,
      };
    }
    return { attempted: true, ok: true, status: res.status };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    logger.error({ err: error }, "Google Sheet append threw");
    return { attempted: true, ok: false, error };
  }
}
