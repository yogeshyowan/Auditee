// Defect-file ingestion.
//
// Parses defect-export files (CSV / Excel / PDF / JSON) produced by the user's
// defect-management tool of record (Jira, Azure DevOps, Bugzilla, MantisBT,
// Redmine, YouTrack, ClickUp, Linear, ServiceNow, GitHub/GitLab issues, ALM
// Octane, etc.) — i.e. the "Export to CSV" / "Export to Excel" / printed-PDF
// flows — without needing live API credentials.
//
// The router calls `ingestDefectsFileBuffer(...)` which:
//   1. Sniffs the file type from extension/mime.
//   2. Parses rows or text out of the buffer.
//   3. Maps each row to a NormalizedDefect using header heuristics that cover
//      every major tool's default export schema.
//   4. Reuses `persistDefects()` and `finalizeSource()` from defect-ingestion.ts
//      so file-uploaded defects show up in the same `defects` table and the
//      same Defects dashboard as live-synced ones.

import Papa from "papaparse";
import * as XLSX from "xlsx";
// @ts-ignore - pdf-parse has CJS-only exports
import pdfParse from "pdf-parse";

import {
  type NormalizedDefect,
  type DefectIngestResult,
  persistDefects,
  finalizeSource,
} from "./defect-ingestion.js";

// ---------------------------------------------------------------------------
// Header heuristics — match many vendor-specific column names to one canonical
// field. Lowercased & whitespace-collapsed before lookup.
// ---------------------------------------------------------------------------
type Field =
  | "externalId"
  | "key"
  | "title"
  | "description"
  | "status"
  | "severity"
  | "priority"
  | "component"
  | "raisedAt"
  | "resolvedAt"
  | "externalUrl";

const HEADER_MAP: Record<Field, RegExp[]> = {
  externalId: [
    /^(issue[\s_-]*key|key|id|#|bug[\s_-]*id|defect[\s_-]*id|work[\s_-]*item[\s_-]*id|number|story[\s_-]*id|ticket[\s_-]*id|incident[\s_-]*id|item[\s_-]*id|issue[\s_-]*id|case[\s_-]*number)$/,
  ],
  key: [/^(key|name|short[\s_-]*name|short[\s_-]*key|reference)$/],
  title: [
    /^(summary|title|subject|short[\s_-]*desc(ription)?|name|headline|issue[\s_-]*title|defect[\s_-]*title)$/,
  ],
  description: [
    /^(description|details|long[\s_-]*desc(ription)?|notes|comments|body|repro[\s_-]*steps|steps[\s_-]*to[\s_-]*reproduce)$/,
  ],
  status: [/^(status|state|workflow[\s_-]*state|bug[\s_-]*status|resolution)$/],
  severity: [/^(severity|sev|bug[\s_-]*severity|impact)$/],
  priority: [/^(priority|prio|bug[\s_-]*priority|urgency)$/],
  component: [
    /^(component|component[\s\/_-]*s|product|module|category|area|application|sub[\s_-]*system|labels?|tags?)$/,
  ],
  raisedAt: [
    /^(created|created[\s_-]*at|created[\s_-]*on|opened|opened[\s_-]*at|reported[\s_-]*at|reported[\s_-]*on|date[\s_-]*opened|raised[\s_-]*on|date)$/,
  ],
  resolvedAt: [
    /^(resolved|resolved[\s_-]*at|resolved[\s_-]*on|closed|closed[\s_-]*at|closed[\s_-]*on|date[\s_-]*closed|fixed[\s_-]*at)$/,
  ],
  externalUrl: [/^(url|link|ticket[\s_-]*url|issue[\s_-]*url|web[\s_-]*url)$/],
};

function normHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildHeaderIndex(headers: string[]): Partial<Record<Field, number>> {
  const idx: Partial<Record<Field, number>> = {};
  headers.forEach((h, i) => {
    const norm = normHeader(h);
    for (const f of Object.keys(HEADER_MAP) as Field[]) {
      if (idx[f] !== undefined) continue;
      if (HEADER_MAP[f].some((re) => re.test(norm))) {
        idx[f] = i;
      }
    }
  });
  return idx;
}

function rowToDefect(
  row: any[],
  idx: Partial<Record<Field, number>>,
  fallbackIdSeed: string,
  rowNum: number,
): NormalizedDefect | null {
  const get = (f: Field): string => {
    const i = idx[f];
    if (i === undefined) return "";
    const v = row[i];
    return v == null ? "" : String(v).trim();
  };
  const externalId =
    get("externalId") ||
    get("key") ||
    `${fallbackIdSeed}-${String(rowNum).padStart(6, "0")}`;
  const title = get("title") || `Imported defect ${externalId}`;
  // Skip totally-empty rows (no id heuristic AND no title that wasn't synthesized).
  if (!get("externalId") && !get("key") && !get("title")) return null;
  return {
    externalId,
    key: get("key") || externalId,
    title,
    description: get("description"),
    status: get("status") || "open",
    severity: "major" as const, // placeholder — persistDefects re-normalises via the .severity field on input, so we pass the raw and let it map.  See below: we override.
    priority: "p2" as const,
    component: get("component") || undefined,
    raisedAt: get("raisedAt") || undefined,
    resolvedAt: get("resolvedAt") || undefined,
    externalUrl: get("externalUrl") || undefined,
    // Smuggle the raw severity/priority strings through the typed shape
    // so persistDefects' normaliser can map them. We re-assign below.
  } as NormalizedDefect & { _rawSeverity?: string; _rawPriority?: string };
}

// persistDefects expects already-normalised severity/priority enum values.
// To re-use its normalisers without a second pass, we pre-normalise here.
function normSeverityLike(raw: string): NormalizedDefect["severity"] {
  const u = raw.trim().toLowerCase();
  if (["blocker", "critical", "major", "minor", "trivial"].includes(u))
    return u as NormalizedDefect["severity"];
  if (/block|stopper/.test(u)) return "blocker";
  if (/crit|sev[\s_-]*1|s1/.test(u)) return "critical";
  if (/sev[\s_-]*2|s2|major|high/.test(u)) return "major";
  if (/trivi|cosmetic|sev[\s_-]*4|s4/.test(u)) return "trivial";
  if (/minor|low|sev[\s_-]*3|s3/.test(u)) return "minor";
  return "major";
}
function normPriorityLike(raw: string): NormalizedDefect["priority"] {
  const u = raw.trim().toLowerCase();
  if (["p0", "p1", "p2", "p3", "p4"].includes(u))
    return u as NormalizedDefect["priority"];
  if (/p0|highest|urgent|crit/.test(u)) return "p0";
  if (/p1|high|major/.test(u)) return "p1";
  if (/p3|low/.test(u)) return "p3";
  if (/p4|lowest|trivial/.test(u)) return "p4";
  return "p2";
}

function mapRows(
  headers: string[],
  rows: any[][],
  fallbackIdSeed: string,
): NormalizedDefect[] {
  const idx = buildHeaderIndex(headers);
  const out: NormalizedDefect[] = [];
  rows.forEach((row, i) => {
    const d = rowToDefect(row, idx, fallbackIdSeed, i + 1);
    if (!d) return;
    const sevCol = idx.severity !== undefined ? String(row[idx.severity] ?? "") : "";
    const priCol = idx.priority !== undefined ? String(row[idx.priority] ?? "") : "";
    d.severity = normSeverityLike(sevCol);
    d.priority = normPriorityLike(priCol);
    out.push(d);
  });
  return out;
}

// ---------------------------------------------------------------------------
// Per-format parsers
// ---------------------------------------------------------------------------
function parseCSV(buffer: Buffer): { headers: string[]; rows: any[][] } {
  const text = buffer.toString("utf8").replace(/^\uFEFF/, ""); // strip BOM
  const result = Papa.parse<string[]>(text, {
    header: false,
    skipEmptyLines: "greedy",
    dynamicTyping: false,
  });
  const all = (result.data as string[][]).filter((r) => Array.isArray(r) && r.length > 0);
  if (all.length === 0) return { headers: [], rows: [] };
  return { headers: all[0]!.map((h) => String(h ?? "")), rows: all.slice(1) };
}

function parseXLSX(buffer: Buffer): { headers: string[]; rows: any[][] } {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = wb.SheetNames[0];
  if (!firstSheetName) return { headers: [], rows: [] };
  const ws = wb.Sheets[firstSheetName]!;
  const aoa = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: "", raw: false });
  if (aoa.length === 0) return { headers: [], rows: [] };
  return { headers: (aoa[0] as any[]).map((h) => String(h ?? "")), rows: aoa.slice(1) as any[][] };
}

async function parsePDF(buffer: Buffer): Promise<{ headers: string[]; rows: any[][] }> {
  const out = await pdfParse(buffer);
  const text: string = out.text ?? "";
  // Best-effort: many tools' PDF "issue list" exports are pseudo-tabular.
  // Strategy: split into non-empty lines; treat the first line that looks like
  // a header (contains "id"/"key"/"summary"/"status") as the header row, split
  // on 2+ whitespace, and split subsequent lines the same way.
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const headerIdx = lines.findIndex((l) =>
    /\b(id|key|summary|title|subject|status|severity|priority)\b/i.test(l),
  );
  if (headerIdx === -1) {
    // No detectable header — emit one defect per line as a fallback so nothing
    // is silently dropped; user still gets to see what was extracted.
    return {
      headers: ["ID", "Title"],
      rows: lines.map((l, i) => [`PDF-${String(i + 1).padStart(6, "0")}`, l.slice(0, 500)]),
    };
  }
  const splitter = /\s{2,}|\t+/;
  const headers = lines[headerIdx]!.split(splitter).filter(Boolean);
  const rows = lines
    .slice(headerIdx + 1)
    .map((l) => l.split(splitter))
    .filter((cells) => cells.length >= Math.max(2, Math.floor(headers.length / 2)));
  return { headers, rows };
}

function parseJSON(buffer: Buffer): NormalizedDefect[] {
  const txt = buffer.toString("utf8");
  let data: any;
  try {
    data = JSON.parse(txt);
  } catch {
    throw new Error("Invalid JSON file");
  }
  // Accept either { issues: [...] } / { defects: [...] } / { items: [...] } / [...]
  const arr: any[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.issues)
    ? data.issues
    : Array.isArray(data?.defects)
    ? data.defects
    : Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.results)
    ? data.results
    : Array.isArray(data?.workItems)
    ? data.workItems
    : [];
  if (arr.length === 0) {
    throw new Error("JSON did not contain a defects/issues/items array");
  }
  return arr.map((it: any, i: number) => {
    const fields = it.fields ?? it; // Jira/ADO nest inside `fields`
    const externalId = String(
      it.key ?? it.id ?? fields.id ?? fields.key ?? it.number ?? `JSON-${i + 1}`,
    );
    return {
      externalId,
      key: String(it.key ?? externalId),
      title: String(
        fields.summary ?? fields.title ?? fields.short_desc ?? it.title ?? `Defect ${externalId}`,
      ),
      description: String(fields.description ?? it.description ?? ""),
      status: String(
        fields.status?.name ?? fields.state ?? it.status ?? it.state ?? "open",
      ),
      severity: normSeverityLike(
        String(fields.severity?.name ?? fields.severity ?? it.severity ?? ""),
      ),
      priority: normPriorityLike(
        String(fields.priority?.name ?? fields.priority ?? it.priority ?? ""),
      ),
      component: fields.component ?? it.component ?? undefined,
      raisedAt:
        fields.created ?? fields.createdAt ?? it.created ?? it.createdAt ?? undefined,
      resolvedAt:
        fields.resolved ?? fields.resolvedAt ?? it.resolved ?? it.resolvedAt ?? undefined,
      externalUrl: it.url ?? it.html_url ?? it.web_url ?? undefined,
    } as NormalizedDefect;
  });
}

// ---------------------------------------------------------------------------
// Public entry — used by POST /sources/upload-defects-file
// ---------------------------------------------------------------------------
export type DefectFileFormat = "csv" | "xlsx" | "xls" | "pdf" | "json" | "tsv";

export function detectDefectFileFormat(
  originalName: string,
  mime: string | undefined,
): DefectFileFormat {
  const ext = (originalName.split(".").pop() || "").toLowerCase();
  if (ext === "csv") return "csv";
  if (ext === "tsv") return "tsv";
  if (ext === "xlsx") return "xlsx";
  if (ext === "xls") return "xls";
  if (ext === "pdf") return "pdf";
  if (ext === "json") return "json";
  if (mime?.includes("csv")) return "csv";
  if (mime?.includes("tab-separated")) return "tsv";
  if (mime?.includes("spreadsheet") || mime?.includes("excel")) return "xlsx";
  if (mime?.includes("pdf")) return "pdf";
  if (mime?.includes("json")) return "json";
  throw new Error(
    `Unsupported file type "${ext || mime || "unknown"}". Use CSV, TSV, XLSX, XLS, PDF, or JSON.`,
  );
}

export async function ingestDefectsFileBuffer(
  sourceId: string,
  projectId: string,
  buffer: Buffer,
  originalName: string,
  mime: string | undefined,
  externalSystemLabel: string = "Uploaded file",
): Promise<DefectIngestResult> {
  let defects: NormalizedDefect[];
  try {
    const fmt = detectDefectFileFormat(originalName, mime);
    const seed = (originalName.replace(/\.[a-z0-9]+$/i, "") || "FILE")
      .replace(/[^A-Za-z0-9]+/g, "_")
      .slice(0, 24)
      .toUpperCase() || "FILE";
    if (fmt === "csv" || fmt === "tsv") {
      const parsed = parseCSV(buffer);
      defects = mapRows(parsed.headers, parsed.rows, seed);
    } else if (fmt === "xlsx" || fmt === "xls") {
      const parsed = parseXLSX(buffer);
      defects = mapRows(parsed.headers, parsed.rows, seed);
    } else if (fmt === "pdf") {
      const parsed = await parsePDF(buffer);
      defects = mapRows(parsed.headers, parsed.rows, seed);
    } else if (fmt === "json") {
      defects = parseJSON(buffer);
    } else {
      throw new Error(`Unsupported format: ${fmt}`);
    }
    if (defects.length === 0) {
      throw new Error(
        "No defects could be extracted. Make sure the file has a header row with at least an ID/Key and a Title/Summary column.",
      );
    }
  } catch (err: any) {
    await finalizeSource(sourceId, "error", 0, 0, err.message ?? "Could not parse file");
    throw err;
  }
  const persisted = await persistDefects(projectId, sourceId, externalSystemLabel, defects);
  const summary = `${persisted.inserted} new + ${persisted.updated} updated defect(s) from uploaded file`;
  await finalizeSource(sourceId, "ready", defects.length, persisted.bytes, summary);
  return { count: defects.length, bytes: persisted.bytes, summary };
}
