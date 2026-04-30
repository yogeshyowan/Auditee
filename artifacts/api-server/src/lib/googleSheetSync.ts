import { ReplitConnectors } from "@replit/connectors-sdk";
import { GoogleAuth } from "google-auth-library";
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
const SHEET_HEADER_RANGE = "Sheet1!A1:E1";
const SHEETS_BASE = "https://sheets.googleapis.com";

let connectors: ReplitConnectors | null = null;
function getConnectors(): ReplitConnectors {
  if (!connectors) connectors = new ReplitConnectors();
  return connectors;
}

let serviceAccountAuth: GoogleAuth | null = null;
function getServiceAccountAuth(): GoogleAuth | null {
  const raw = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  if (serviceAccountAuth) return serviceAccountAuth;
  try {
    const credentials = JSON.parse(raw) as Record<string, unknown>;
    serviceAccountAuth = new GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    return serviceAccountAuth;
  } catch (err) {
    logger.error(
      { err: err instanceof Error ? err.message : String(err) },
      "GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON could not be parsed as JSON",
    );
    return null;
  }
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

/**
 * Routes a Sheets API call through whichever auth source is configured.
 * Prefers a service-account JSON (portable across hosts, e.g. Hetzner) and
 * falls back to the Replit `google-sheet` OAuth connector (only available
 * when running inside a Replit container).
 */
async function sheetsFetch(
  pathAndQuery: string,
  init: RequestInit = {},
): Promise<Response> {
  const sa = getServiceAccountAuth();
  if (sa) {
    const client = await sa.getClient();
    const { token } = await client.getAccessToken();
    if (!token) throw new Error("service_account_token_unavailable");
    return fetch(`${SHEETS_BASE}${pathAndQuery}`, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        authorization: `Bearer ${token}`,
      },
    });
  }
  return getConnectors().proxy("google-sheet", pathAndQuery, init);
}

async function ensureHeaderRow(spreadsheetId: string): Promise<void> {
  if (headerEnsured) return;
  if (headerEnsurePromise) return headerEnsurePromise;

  headerEnsurePromise = (async () => {
    try {
      const getRes = await sheetsFetch(
        `/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(SHEET_HEADER_RANGE)}`,
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
      const writeRes = await sheetsFetch(
        `/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(SHEET_HEADER_RANGE)}?valueInputOption=RAW`,
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
 * GOOGLE_SHEET_ID. Auth source is auto-selected:
 *   1. GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON (preferred, host-agnostic)
 *   2. Replit `google-sheet` OAuth integration (Replit only)
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

    const path = `/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(SHEET_RANGE)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    const res = await sheetsFetch(path, {
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
