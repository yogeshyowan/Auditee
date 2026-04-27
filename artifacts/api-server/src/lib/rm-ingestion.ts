// Requirements-Management tool ingestion.
//
// Pulls requirements from external RM systems (DOORS Next, Jama, Polarion,
// codeBeamer, Helix RM, Visure, Azure DevOps Boards, Jira) and from generic
// ReqIF/CSV exports. Each tool has its own normalize function that turns the
// vendor-specific response into a flat NormalizedReq[]. We then upsert those
// rows into the `requirements` table tagged with the originating sourceId.
//
// All HTTP calls go through `safeFetch` (15 s timeout, blocks private IPs,
// blocks cloud-metadata endpoints, manual redirect handling).

import { randomUUID } from "node:crypto";
import { db, requirementsTable, sourceFilesTable, projectSourcesTable, activityEventsTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { safeFetch } from "./safe-fetch.js";

export type NormalizedReq = {
  externalId: string;          // tool's own ID for the requirement
  code: string;                // short display code (often == externalId)
  title: string;
  description: string;
  type: "BRD" | "PRD" | "FRD" | "NFR";
  status: string;
  priority: "low" | "medium" | "high" | "critical";
  externalUrl?: string;
};

const REQ_TYPES = new Set(["BRD", "PRD", "FRD", "NFR"]);
const PRIORITIES = new Set(["low", "medium", "high", "critical"]);

function normalizeType(raw: string | undefined | null): NormalizedReq["type"] {
  const u = (raw ?? "").toString().trim().toUpperCase();
  if (REQ_TYPES.has(u)) return u as NormalizedReq["type"];
  if (/BUSINESS|STAKEHOLDER/i.test(u)) return "BRD";
  if (/USER|FEATURE|EPIC|STORY|PRODUCT/i.test(u)) return "PRD";
  if (/NON.?FUNCTIONAL|PERF|SECURITY|RELIAB|USABIL/i.test(u)) return "NFR";
  return "FRD";
}
function normalizePriority(raw: string | undefined | null): NormalizedReq["priority"] {
  const u = (raw ?? "").toString().trim().toLowerCase();
  if (PRIORITIES.has(u)) return u as NormalizedReq["priority"];
  if (/p0|crit|block/.test(u)) return "critical";
  if (/p1|high|major/.test(u)) return "high";
  if (/p3|low|minor|trivial/.test(u)) return "low";
  return "medium";
}
function trim(s: any, max: number): string {
  if (s == null) return "";
  // Whitespace-trim first, then length-cap. This means a value like "  "
  // or " \t\n " collapses to "" and is treated as missing — important for
  // externalId, which is the dedupe key for re-syncs.
  const str = (typeof s === "string" ? s : JSON.stringify(s)).trim();
  return str.length > max ? str.slice(0, max) : str;
}

export type RmIngestResult = {
  count: number;
  bytes: number;
  summary: string;
};

/**
 * Persist a list of normalized requirements into the requirements table,
 * tagged with the source they came from. Uses code+sourceId as the dedupe key
 * so that re-syncing updates existing rows in place rather than duplicating.
 */
// Defence-in-depth: only persist http(s) external URLs. RM systems should
// never produce anything else, but we don't want a malicious payload to slip
// a `javascript:` URL through to the badge link on the Requirements page.
function safeExternalUrl(u: string | undefined | null): string | null {
  if (!u) return null;
  try {
    const p = new URL(u);
    if (p.protocol === "http:" || p.protocol === "https:") return p.toString();
    return null;
  } catch {
    return null;
  }
}

async function persistRequirements(
  projectId: string,
  sourceId: string,
  externalSystem: string,
  reqs: NormalizedReq[],
): Promise<{ inserted: number; updated: number; bytes: number; skipped: number }> {
  let inserted = 0;
  let updated = 0;
  let bytes = 0;
  let skipped = 0;
  for (const r of reqs) {
    // externalId is the dedupe key for re-syncs — without it we'd risk
    // collapsing multiple distinct items onto the same row, so we skip them.
    const externalId = trim(r.externalId, 240);
    if (!externalId) { skipped++; continue; }
    const code = trim(r.code || externalId, 64);
    if (!code) { skipped++; continue; }
    bytes += (r.title?.length ?? 0) + (r.description?.length ?? 0);
    const url = safeExternalUrl(r.externalUrl);
    const existing = await db
      .select({ id: requirementsTable.id })
      .from(requirementsTable)
      .where(and(eq(requirementsTable.projectId, projectId), eq(requirementsTable.sourceId, sourceId), eq(requirementsTable.externalId, externalId)))
      .limit(1);
    if (existing.length > 0) {
      await db
        .update(requirementsTable)
        .set({
          code,
          title: trim(r.title, 240) || code,
          description: trim(r.description, 4000),
          type: r.type,
          status: trim(r.status, 32) || "draft",
          priority: r.priority,
          externalUrl: url,
          externalSystem,
          updatedAt: new Date(),
        })
        .where(eq(requirementsTable.id, existing[0]!.id));
      updated++;
    } else {
      await db.insert(requirementsTable).values({
        id: randomUUID(),
        projectId,
        code,
        title: trim(r.title, 240) || code,
        description: trim(r.description, 4000),
        type: r.type,
        status: trim(r.status, 32) || "draft",
        priority: r.priority,
        owner: "Imported",
        tags: [externalSystem.toLowerCase()],
        linkedFrameworks: [],
        sourceId,
        externalId,
        externalUrl: url,
        externalSystem,
      });
      inserted++;
    }
  }
  return { inserted, updated, bytes, skipped };
}

// Save a small "manifest" of the imported requirements as a single text file
// under the source so the existing source_files / file viewer keeps working.
async function persistManifest(sourceId: string, system: string, reqs: NormalizedReq[]): Promise<number> {
  await db.delete(sourceFilesTable).where(eq(sourceFilesTable.sourceId, sourceId));
  const lines = reqs.map((r) => `${r.externalId}\t${r.type}\t${r.priority}\t${r.status}\t${r.title.replace(/\s+/g, " ")}`);
  const body = `# ${system} import manifest — ${reqs.length} requirements\n# Format: externalId<TAB>type<TAB>priority<TAB>status<TAB>title\n\n${lines.join("\n")}\n`;
  await db.insert(sourceFilesTable).values({
    id: randomUUID(),
    sourceId,
    path: `${system.toLowerCase().replace(/\s+/g, "-")}/manifest.txt`,
    size: body.length,
    mime: "text/plain",
    language: "txt",
    isBinary: "false",
    content: body,
  });
  return body.length;
}

async function finalizeSource(
  sourceId: string,
  status: "ready" | "error",
  count: number,
  bytes: number,
  message: string,
): Promise<void> {
  await db
    .update(projectSourcesTable)
    .set({
      status,
      statusMessage: message.slice(0, 500),
      fileCount: count,
      byteCount: bytes,
      lastSyncAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(projectSourcesTable.id, sourceId));
}

// ─── per-tool fetchers ─────────────────────────────────────────────────────

async function fetchJama(cfg: any): Promise<NormalizedReq[]> {
  const host = String(cfg.host || "").replace(/\/$/, "");
  const projectId = cfg.projectId;
  const token = cfg.token;
  if (!host || !projectId || !token) throw new Error("Jama: host, projectId and token are required");
  const headers: Record<string, string> = { Accept: "application/json", Authorization: `Bearer ${token}` };
  // Items endpoint with project filter — pull first 200 items.
  const r = await safeFetch(`${host}/rest/v1/items?project=${encodeURIComponent(projectId)}&maxResults=200`, { headers });
  if (!r.ok) throw new Error(`Jama: HTTP ${r.status} — verify host, project ID and access token`);
  const j: any = await r.json();
  const items: any[] = j.data ?? [];
  return items.map((it) => ({
    externalId: String(it.id ?? it.documentKey ?? ""),
    code: String(it.documentKey ?? it.id ?? ""),
    title: it.fields?.name ?? it.fields?.summary ?? "(untitled)",
    description: it.fields?.description ?? "",
    type: normalizeType(it.itemType?.display ?? it.itemType),
    status: it.fields?.status ?? "imported",
    priority: normalizePriority(it.fields?.priority),
    externalUrl: `${host}/perspective.req#/items/${it.id}?projectId=${projectId}`,
  }));
}

async function fetchPolarion(cfg: any): Promise<NormalizedReq[]> {
  const host = String(cfg.host || "").replace(/\/$/, "");
  const projectId = cfg.projectId;
  const token = cfg.token;
  if (!host || !projectId || !token) throw new Error("Polarion: host, projectId and token are required");
  const headers = { Accept: "application/json", Authorization: `Bearer ${token}` };
  const r = await safeFetch(
    `${host}/polarion/rest/v1/projects/${encodeURIComponent(projectId)}/workitems?fields[workitems]=id,title,description,status,type,priority&page[size]=200`,
    { headers },
  );
  if (!r.ok) throw new Error(`Polarion: HTTP ${r.status} — verify host, project ID and bearer token`);
  const j: any = await r.json();
  const items: any[] = j.data ?? [];
  return items.map((it) => {
    const a = it.attributes ?? {};
    return {
      externalId: String(it.id ?? a.id ?? ""),
      code: String(it.id ?? a.id ?? ""),
      title: a.title ?? "(untitled)",
      description: typeof a.description === "object" ? a.description?.value ?? "" : a.description ?? "",
      type: normalizeType(a.type),
      status: a.status ?? "imported",
      priority: normalizePriority(a.priority),
      externalUrl: `${host}/polarion/#/project/${projectId}/workitem?id=${it.id}`,
    };
  });
}

async function fetchCodebeamer(cfg: any): Promise<NormalizedReq[]> {
  const host = String(cfg.host || "").replace(/\/$/, "");
  const trackerId = cfg.trackerId;
  const user = cfg.user;
  const token = cfg.token;
  if (!host || !trackerId || !token) throw new Error("codeBeamer: host, trackerId and token (or password) are required");
  const auth = user ? `Basic ${Buffer.from(`${user}:${token}`).toString("base64")}` : `Bearer ${token}`;
  const r = await safeFetch(`${host}/api/v3/trackers/${encodeURIComponent(trackerId)}/items?pageSize=200`, {
    headers: { Accept: "application/json", Authorization: auth },
  });
  if (!r.ok) throw new Error(`codeBeamer: HTTP ${r.status} — verify host, tracker ID and credentials`);
  const j: any = await r.json();
  const items: any[] = j.itemRefs ?? j.items ?? [];
  return items.map((it) => ({
    externalId: String(it.id ?? ""),
    code: String(it.id ?? ""),
    title: it.name ?? it.title ?? "(untitled)",
    description: it.description ?? "",
    type: normalizeType(it.typeName ?? it.type?.name),
    status: it.statusName ?? it.status?.name ?? "imported",
    priority: normalizePriority(it.priorityName ?? it.priority?.name),
    externalUrl: `${host}/cb/issue/${it.id}`,
  }));
}

async function fetchDoorsNext(cfg: any): Promise<NormalizedReq[]> {
  // IBM DOORS Next exposes OSLC. We use a simple "GET requirements collection"
  // call. Real OSLC discovery (rootservices → catalog → service provider) is
  // multi-step; we use the project-services shortcut documented for DNG 7.x.
  const host = String(cfg.host || "").replace(/\/$/, "");
  const projectArea = cfg.projectArea;
  const token = cfg.token;
  if (!host || !projectArea || !token) throw new Error("DOORS Next: host, projectArea and bearer token are required");
  const headers = {
    Accept: "application/json",
    "OSLC-Core-Version": "2.0",
    Authorization: `Bearer ${token}`,
  };
  const r = await safeFetch(
    `${host}/rm/views?oslc.pageSize=200&projectURL=${encodeURIComponent(projectArea)}`,
    { headers },
  );
  if (!r.ok) throw new Error(`DOORS Next: HTTP ${r.status} — verify host, project area and bearer token`);
  const j: any = await r.json();
  const items: any[] = j["oslc:results"] ?? j.results ?? [];
  return items.map((it) => ({
    externalId: String(it["dcterms:identifier"] ?? it.id ?? ""),
    code: String(it["dcterms:identifier"] ?? it.id ?? ""),
    title: it["dcterms:title"] ?? it.title ?? "(untitled)",
    description: it["dcterms:description"] ?? "",
    type: normalizeType(it["rdf:type"] ?? it.type),
    status: it["oslc_rm:status"] ?? "imported",
    priority: normalizePriority(it["oslc_rm:priority"]),
    externalUrl: it["rdf:about"] ?? `${host}/rm/web#action=com.ibm.rdm.web.pages.showArtifactPage&artifactURI=${encodeURIComponent(String(it.id))}`,
  }));
}

async function fetchHelixRm(cfg: any): Promise<NormalizedReq[]> {
  const host = String(cfg.host || "").replace(/\/$/, "");
  const projectId = cfg.projectId;
  const user = cfg.user;
  const token = cfg.token;
  if (!host || !projectId || !token) throw new Error("Helix RM: host, projectId and token (or password) are required");
  const auth = user ? `Basic ${Buffer.from(`${user}:${token}`).toString("base64")}` : `Bearer ${token}`;
  const r = await safeFetch(`${host}/helix-alm/api/v0/${encodeURIComponent(projectId)}/requirements?max=200`, {
    headers: { Accept: "application/json", Authorization: auth },
  });
  if (!r.ok) throw new Error(`Helix RM: HTTP ${r.status} — verify host, project ID and credentials`);
  const j: any = await r.json();
  const items: any[] = j.requirements ?? j.items ?? [];
  return items.map((it) => ({
    externalId: String(it.id ?? it.requirementId ?? ""),
    code: String(it.tag ?? it.id ?? ""),
    title: it.summary ?? it.title ?? "(untitled)",
    description: it.description ?? "",
    type: normalizeType(it.type ?? it.requirementType),
    status: it.status ?? "imported",
    priority: normalizePriority(it.priority),
    externalUrl: `${host}/web/${projectId}/requirements/${it.id}`,
  }));
}

async function fetchVisure(cfg: any): Promise<NormalizedReq[]> {
  const host = String(cfg.host || "").replace(/\/$/, "");
  const projectKey = cfg.projectKey;
  const token = cfg.token;
  if (!host || !projectKey || !token) throw new Error("Visure: host, projectKey and token are required");
  const r = await safeFetch(`${host}/api/v1/projects/${encodeURIComponent(projectKey)}/items?max=200`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`Visure: HTTP ${r.status} — verify host, project key and access token`);
  const j: any = await r.json();
  const items: any[] = j.items ?? j.data ?? [];
  return items.map((it) => ({
    externalId: String(it.id ?? ""),
    code: String(it.code ?? it.id ?? ""),
    title: it.name ?? it.title ?? "(untitled)",
    description: it.description ?? "",
    type: normalizeType(it.type),
    status: it.status ?? "imported",
    priority: normalizePriority(it.priority),
    externalUrl: `${host}/projects/${projectKey}/items/${it.id}`,
  }));
}

async function fetchAzureDevOps(cfg: any): Promise<NormalizedReq[]> {
  const orgUrl = String(cfg.orgUrl || cfg.host || "").replace(/\/$/, "");
  const project = cfg.projectId || cfg.project;
  const pat = cfg.token;
  if (!orgUrl || !project || !pat) throw new Error("Azure DevOps: orgUrl, project and PAT are required");
  const auth = `Basic ${Buffer.from(`:${pat}`).toString("base64")}`;
  const wiql = cfg.wiql ||
    `SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State], [Microsoft.VSTS.Common.Priority], [System.Description] FROM WorkItems WHERE [System.TeamProject] = '${project}' AND [System.WorkItemType] IN ('User Story','Feature','Requirement','Epic') ORDER BY [System.Id]`;
  const r1 = await safeFetch(`${orgUrl}/${encodeURIComponent(project)}/_apis/wit/wiql?api-version=7.0`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: auth },
    body: JSON.stringify({ query: wiql }),
  });
  if (!r1.ok) throw new Error(`Azure DevOps: WIQL HTTP ${r1.status} — verify org, project and PAT`);
  const wit: any = await r1.json();
  const ids: number[] = (wit.workItems ?? []).slice(0, 200).map((w: any) => w.id);
  if (ids.length === 0) return [];
  // Batched fetch.
  const r2 = await safeFetch(`${orgUrl}/_apis/wit/workitemsbatch?api-version=7.0`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: auth },
    body: JSON.stringify({ ids, fields: ["System.Id", "System.Title", "System.WorkItemType", "System.State", "Microsoft.VSTS.Common.Priority", "System.Description"] }),
  });
  if (!r2.ok) throw new Error(`Azure DevOps: batch fetch HTTP ${r2.status}`);
  const jb: any = await r2.json();
  const items: any[] = jb.value ?? [];
  return items.map((it) => {
    const f = it.fields ?? {};
    return {
      externalId: String(it.id),
      code: `WI-${it.id}`,
      title: f["System.Title"] ?? "(untitled)",
      description: f["System.Description"] ?? "",
      type: normalizeType(f["System.WorkItemType"]),
      status: f["System.State"] ?? "imported",
      priority: normalizePriority(String(f["Microsoft.VSTS.Common.Priority"] ?? "")),
      externalUrl: `${orgUrl}/${encodeURIComponent(project)}/_workitems/edit/${it.id}`,
    };
  });
}

async function fetchJiraAsRequirements(cfg: any): Promise<NormalizedReq[]> {
  const host = String(cfg.host || "").replace(/\/$/, "");
  const projectKey = cfg.projectKey;
  const email = cfg.email;
  const token = cfg.token;
  if (!host || !projectKey || !token) throw new Error("Jira: host, projectKey and token are required");
  const auth = email ? `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}` : `Bearer ${token}`;
  const jql = encodeURIComponent(`project = ${projectKey} AND issuetype in (Story, "User Story", Requirement, Epic, Feature) ORDER BY updated DESC`);
  const r = await safeFetch(`${host}/rest/api/3/search?jql=${jql}&maxResults=200`, {
    headers: { Accept: "application/json", Authorization: auth },
  });
  if (!r.ok) throw new Error(`Jira: HTTP ${r.status} — check host, project key and credentials`);
  const j: any = await r.json();
  const items: any[] = j.issues ?? [];
  return items.map((it) => ({
    externalId: String(it.id ?? it.key),
    code: String(it.key),
    title: it.fields?.summary ?? "(untitled)",
    description: typeof it.fields?.description === "object" ? JSON.stringify(it.fields.description) : it.fields?.description ?? "",
    type: normalizeType(it.fields?.issuetype?.name),
    status: it.fields?.status?.name ?? "imported",
    priority: normalizePriority(it.fields?.priority?.name),
    externalUrl: `${host}/browse/${it.key}`,
  }));
}

// ─── ReqIF parsing ─────────────────────────────────────────────────────────

/**
 * Very small subset ReqIF parser. ReqIF (OMG) is XML; the requirement records
 * live in <SPEC-OBJECT> elements with <ATTRIBUTE-VALUE-XHTML> / <ATTRIBUTE-VALUE-STRING>
 * children whose THE-VALUE / THE-VALUE/<xhtml:div> holds the text. We also peek
 * at SPEC-OBJECT-TYPE for the type label.
 *
 * This is a best-effort implementation: it extracts all <SPEC-OBJECT> blocks
 * and pulls a Title / Description from any string/xhtml attribute whose
 * referenced DEFINITION mentions "title", "name", "description" or "text".
 */
export function parseReqIF(xml: string): NormalizedReq[] {
  const out: NormalizedReq[] = [];
  // Build a lookup of attribute-definition IDs → human name.
  const defNameById = new Map<string, string>();
  const defRegex = /<ATTRIBUTE-DEFINITION-(?:STRING|XHTML)\b[^>]*\bIDENTIFIER="([^"]+)"[^>]*\bLONG-NAME="([^"]+)"/gi;
  let dm: RegExpExecArray | null;
  while ((dm = defRegex.exec(xml)) !== null) defNameById.set(dm[1]!, dm[2]!.toLowerCase());

  const objRegex = /<SPEC-OBJECT\b([^>]*)>([\s\S]*?)<\/SPEC-OBJECT>/gi;
  let m: RegExpExecArray | null;
  while ((m = objRegex.exec(xml)) !== null) {
    const head = m[1] ?? "";
    const body = m[2] ?? "";
    const idMatch = head.match(/\bIDENTIFIER="([^"]+)"/);
    const externalId = idMatch ? idMatch[1]! : `req-${out.length + 1}`;
    let title = "";
    let description = "";

    // Pull each attribute-value with its definition reference + value.
    const avRegex = /<ATTRIBUTE-VALUE-(STRING|XHTML)\b([^>]*)>([\s\S]*?)<\/ATTRIBUTE-VALUE-\1>/gi;
    let am: RegExpExecArray | null;
    while ((am = avRegex.exec(body)) !== null) {
      const kind = am[1]!;
      const attrHead = am[2] ?? "";
      const attrBody = am[3] ?? "";
      const refMatch = attrBody.match(/<DEFINITION>\s*<ATTRIBUTE-DEFINITION-(?:STRING|XHTML)-REF>([^<]+)<\/ATTRIBUTE-DEFINITION-(?:STRING|XHTML)-REF>\s*<\/DEFINITION>/i);
      const defId = refMatch ? refMatch[1]! : "";
      const defName = defNameById.get(defId) ?? "";
      let value = "";
      if (kind === "STRING") {
        const vMatch = attrHead.match(/\bTHE-VALUE="([^"]*)"/);
        value = vMatch ? vMatch[1]!.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"') : "";
      } else {
        const vMatch = attrBody.match(/<THE-VALUE>([\s\S]*?)<\/THE-VALUE>/i);
        const inner = vMatch ? vMatch[1]! : "";
        value = inner.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      }
      if (!value) continue;
      if (!title && /(title|name|heading|object[\s_-]?heading)/i.test(defName)) title = value.slice(0, 240);
      else if (!description && /(text|description|object[\s_-]?text|requirement[\s_-]?text)/i.test(defName)) description = value.slice(0, 4000);
    }
    if (!title) title = description ? description.slice(0, 80) + (description.length > 80 ? "…" : "") : externalId;
    out.push({
      externalId,
      code: externalId,
      title,
      description,
      type: "FRD",
      status: "imported",
      priority: "medium",
    });
  }
  return out;
}

// ─── public dispatcher ─────────────────────────────────────────────────────

const SYSTEM_LABEL: Record<string, string> = {
  doors: "IBM DOORS",
  doors_next: "DOORS Next",
  jama: "Jama Connect",
  polarion: "Polarion ALM",
  codebeamer: "codeBeamer",
  helix_rm: "Helix RM",
  visure: "Visure",
  azure_devops: "Azure DevOps Boards",
  jira_reqs: "Jira",
  reqif: "ReqIF import",
};

export const RM_KINDS = Object.keys(SYSTEM_LABEL) as Array<keyof typeof SYSTEM_LABEL>;
export function isRmKind(k: string): boolean {
  return RM_KINDS.includes(k as any);
}
export function rmSystemLabel(k: string): string {
  return SYSTEM_LABEL[k] ?? k;
}

/**
 * Run a sync against an RM source. The source row must already exist.
 * Returns { count, bytes, summary } so the existing sources route can persist
 * the same shape it does for code-source ingestion.
 *
 * For REST-based tools we hit the API. For ReqIF, the caller should use the
 * dedicated upload-reqif route which calls `ingestReqifBuffer` directly with
 * the file bytes.
 */
export async function ingestRequirementsTool(
  sourceId: string,
  projectId: string,
  kind: string,
  config: Record<string, any>,
): Promise<RmIngestResult> {
  const system = rmSystemLabel(kind);
  let reqs: NormalizedReq[];
  try {
    if (kind === "jama") reqs = await fetchJama(config);
    else if (kind === "polarion") reqs = await fetchPolarion(config);
    else if (kind === "codebeamer") reqs = await fetchCodebeamer(config);
    else if (kind === "doors_next") reqs = await fetchDoorsNext(config);
    else if (kind === "helix_rm") reqs = await fetchHelixRm(config);
    else if (kind === "visure") reqs = await fetchVisure(config);
    else if (kind === "azure_devops") reqs = await fetchAzureDevOps(config);
    else if (kind === "jira_reqs") reqs = await fetchJiraAsRequirements(config);
    else if (kind === "doors") {
      throw new Error(
        "IBM DOORS Classic has no public REST API. Export your module as ReqIF or CSV from DOORS, then upload it via the ReqIF connector.",
      );
    } else if (kind === "reqif") {
      throw new Error("Upload a .reqif/.reqifz file via /api/sources/upload-reqif rather than calling sync");
    } else {
      throw new Error(`Unknown RM kind: ${kind}`);
    }
  } catch (err: any) {
    await finalizeSource(sourceId, "error", 0, 0, err.message ?? "Sync failed");
    throw err;
  }
  const persisted = await persistRequirements(projectId, sourceId, system, reqs);
  const bytes = await persistManifest(sourceId, system, reqs);
  const summary = `${persisted.inserted} new + ${persisted.updated} updated requirements from ${system}`;
  await finalizeSource(sourceId, "ready", reqs.length, bytes, summary);
  await db.insert(activityEventsTable).values({
    id: randomUUID(),
    kind: "requirement",
    message: `Imported ${reqs.length} requirement(s) from ${system}`,
    actor: "avery.kim",
    entityCode: sourceId,
  });
  return { count: reqs.length, bytes, summary };
}

/**
 * Ingest a ReqIF (or .reqifz which is a ZIP containing a .reqif) buffer.
 * If the buffer starts with PK we assume it's a zip and extract the first .reqif inside.
 */
export async function ingestReqifBuffer(
  sourceId: string,
  projectId: string,
  buf: Buffer,
): Promise<RmIngestResult> {
  let xml: string;
  try {
    if (buf.length >= 2 && buf[0] === 0x50 && buf[1] === 0x4b) {
      // .reqifz is a ZIP — find the first .reqif entry inside.
      const AdmZip = (await import("adm-zip")).default;
      const zip = new AdmZip(buf);
      const entry = zip.getEntries().find((e) => e.entryName.toLowerCase().endsWith(".reqif"));
      if (!entry) throw new Error("ReqIF archive contained no .reqif file");
      xml = entry.getData().toString("utf8");
    } else {
      xml = buf.toString("utf8");
    }
  } catch (err: any) {
    await finalizeSource(sourceId, "error", 0, 0, `Could not read ReqIF: ${err.message}`);
    throw new Error(`Could not read ReqIF: ${err.message}`);
  }
  let reqs: NormalizedReq[];
  try {
    reqs = parseReqIF(xml);
  } catch (err: any) {
    await finalizeSource(sourceId, "error", 0, 0, `Could not parse ReqIF: ${err.message}`);
    throw new Error(`Could not parse ReqIF: ${err.message}`);
  }
  if (reqs.length === 0) {
    await finalizeSource(sourceId, "error", 0, 0, "ReqIF parsed successfully but no SPEC-OBJECT elements were found");
    throw new Error("ReqIF parsed successfully but no SPEC-OBJECT elements were found");
  }
  const system = "ReqIF import";
  const persisted = await persistRequirements(projectId, sourceId, system, reqs);
  const bytes = await persistManifest(sourceId, system, reqs);
  const summary = `${persisted.inserted} new + ${persisted.updated} updated requirements from ${system}`;
  await finalizeSource(sourceId, "ready", reqs.length, bytes, summary);
  await db.insert(activityEventsTable).values({
    id: randomUUID(),
    kind: "requirement",
    message: `Imported ${reqs.length} requirement(s) from ReqIF`,
    actor: "avery.kim",
    entityCode: sourceId,
  });
  return { count: reqs.length, bytes, summary };
}
