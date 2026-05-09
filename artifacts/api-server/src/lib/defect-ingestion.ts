// Defect-Management tool ingestion.
//
// Pulls defects/bugs from external defect-management systems (Jira, Azure DevOps
// Bugs, Bugzilla, MantisBT, Redmine, YouTrack, ClickUp, Linear, ServiceNow,
// HP/Micro Focus ALM Octane, GitHub Issues, GitLab Issues). Each tool has its
// own normalize function that turns the vendor-specific response into a flat
// NormalizedDefect[]. We then upsert those rows into the `defects` table tagged
// with the originating sourceId.
//
// All HTTP calls go through `safeFetch` (15 s timeout, blocks private IPs,
// blocks cloud-metadata endpoints, manual redirect handling).

import { randomUUID } from "node:crypto";
import { db, defectsTable, projectSourcesTable, activityEventsTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { safeFetch } from "./safe-fetch.js";

export type NormalizedDefect = {
  externalId: string;
  key: string;
  title: string;
  description: string;
  status: string;     // open | in_progress | resolved | closed | reopened | won't_fix | ...
  severity: "blocker" | "critical" | "major" | "minor" | "trivial";
  priority: "p0" | "p1" | "p2" | "p3" | "p4";
  component?: string;
  raisedAt?: string;
  resolvedAt?: string;
  externalUrl?: string;
};

const SEVERITIES = new Set(["blocker", "critical", "major", "minor", "trivial"]);
const PRIORITIES = new Set(["p0", "p1", "p2", "p3", "p4"]);

function normSeverity(raw: any): NormalizedDefect["severity"] {
  const u = (raw ?? "").toString().trim().toLowerCase();
  if (SEVERITIES.has(u)) return u as NormalizedDefect["severity"];
  if (/block|stopper/.test(u)) return "blocker";
  if (/crit|sev[\s_-]*1|s1/.test(u)) return "critical";
  if (/sev[\s_-]*2|s2|major|high/.test(u)) return "major";
  if (/trivi|cosmetic|sev[\s_-]*4|s4/.test(u)) return "trivial";
  if (/minor|low|sev[\s_-]*3|s3/.test(u)) return "minor";
  return "major";
}
function normPriority(raw: any): NormalizedDefect["priority"] {
  const u = (raw ?? "").toString().trim().toLowerCase();
  if (PRIORITIES.has(u)) return u as NormalizedDefect["priority"];
  if (/p0|highest|urgent|crit/.test(u)) return "p0";
  if (/p1|high|major/.test(u)) return "p1";
  if (/p3|low/.test(u)) return "p3";
  if (/p4|lowest|trivial/.test(u)) return "p4";
  return "p2";
}
function normStatus(raw: any): string {
  const u = (raw ?? "").toString().trim().toLowerCase();
  if (!u) return "open";
  if (/done|closed|fixed|resolved|complete/.test(u)) return "resolved";
  if (/progress|active|started/.test(u)) return "in_progress";
  if (/reopen/.test(u)) return "reopened";
  if (/won.?t.?fix|wontfix|invalid|reject/.test(u)) return "wontfix";
  if (/open|new|todo|to.?do|backlog/.test(u)) return "open";
  return u.slice(0, 32);
}
function trim(s: any, max: number): string {
  if (s == null) return "";
  const str = (typeof s === "string" ? s : JSON.stringify(s)).trim();
  return str.length > max ? str.slice(0, max) : str;
}
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
function safeDate(s: any): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export type DefectIngestResult = {
  count: number;
  bytes: number;
  summary: string;
};

export async function persistDefects(
  projectId: string,
  sourceId: string,
  externalSystem: string,
  defects: NormalizedDefect[],
): Promise<{ inserted: number; updated: number; bytes: number; skipped: number }> {
  let inserted = 0;
  let updated = 0;
  let bytes = 0;
  let skipped = 0;
  for (const d of defects) {
    const externalId = trim(d.externalId, 240);
    if (!externalId) { skipped++; continue; }
    const key = trim(d.key || externalId, 64);
    if (!key) { skipped++; continue; }
    bytes += (d.title?.length ?? 0) + (d.description?.length ?? 0);
    const url = safeExternalUrl(d.externalUrl);
    const existing = await db
      .select()
      .from(defectsTable)
      .where(
        and(
          eq(defectsTable.projectId, projectId),
          eq(defectsTable.sourceId, sourceId),
          eq(defectsTable.externalId, externalId),
        ),
      );
    const row = {
      projectId,
      sourceId,
      externalId,
      externalUrl: url,
      externalSystem,
      key,
      title: trim(d.title || `Defect ${key}`, 500),
      description: trim(d.description, 4000),
      status: normStatus(d.status),
      severity: d.severity,
      priority: d.priority,
      component: d.component ? trim(d.component, 120) : null,
      raisedAt: safeDate(d.raisedAt),
      resolvedAt: safeDate(d.resolvedAt),
      updatedAt: new Date(),
    };
    if (existing.length > 0) {
      await db.update(defectsTable).set(row).where(eq(defectsTable.id, existing[0].id));
      updated++;
    } else {
      await db.insert(defectsTable).values({ id: randomUUID(), ...row });
      inserted++;
    }
  }
  return { inserted, updated, bytes, skipped };
}

export async function finalizeSource(
  sourceId: string,
  status: "ready" | "error",
  count: number,
  bytes: number,
  summary: string,
): Promise<void> {
  await db
    .update(projectSourcesTable)
    .set({ status, fileCount: count, byteCount: bytes, statusMessage: summary.slice(0, 500), lastSyncAt: new Date(), updatedAt: new Date() })
    .where(eq(projectSourcesTable.id, sourceId));
}

// ─── per-tool fetchers ─────────────────────────────────────────────────────

async function fetchJiraDefects(cfg: Record<string, any>): Promise<NormalizedDefect[]> {
  const host = (cfg.host ?? "").toString().replace(/\/$/, "");
  const projectKey = (cfg.projectKey ?? "").toString().trim();
  const email = (cfg.email ?? "").toString().trim();
  const token = (cfg.token ?? "").toString().trim();
  if (!host || !projectKey) throw new Error("Jira: host and projectKey required");
  const jql = (cfg.jql && cfg.jql.toString().trim())
    || `project = ${projectKey} AND issuetype in (Bug, Defect) ORDER BY updated DESC`;
  const url = `${host}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=200&fields=summary,description,status,priority,components,created,resolutiondate`;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (email && token) headers.Authorization = `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`;
  else if (token) headers.Authorization = `Bearer ${token}`;
  const res = await safeFetch(url, { headers });
  if (!res.ok) throw new Error(`Jira returned ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json: any = await res.json();
  const issues = Array.isArray(json.issues) ? json.issues : [];
  return issues.map((it: any): NormalizedDefect => ({
    externalId: String(it.id ?? it.key ?? ""),
    key: String(it.key ?? it.id ?? ""),
    title: String(it.fields?.summary ?? ""),
    description: String(it.fields?.description?.content ? JSON.stringify(it.fields.description) : it.fields?.description ?? ""),
    status: it.fields?.status?.name ?? "open",
    severity: normSeverity(it.fields?.priority?.name),
    priority: normPriority(it.fields?.priority?.name),
    component: it.fields?.components?.[0]?.name,
    raisedAt: it.fields?.created,
    resolvedAt: it.fields?.resolutiondate,
    externalUrl: `${host}/browse/${it.key}`,
  }));
}

async function fetchAzureDevOpsDefects(cfg: Record<string, any>): Promise<NormalizedDefect[]> {
  const orgUrl = (cfg.orgUrl ?? "").toString().replace(/\/$/, "");
  const project = (cfg.project ?? "").toString().trim();
  const pat = (cfg.pat ?? "").toString().trim();
  if (!orgUrl || !project || !pat) throw new Error("Azure DevOps: orgUrl, project and pat are required");
  const wiql = (cfg.wiql && cfg.wiql.toString().trim())
    || `SELECT [System.Id] FROM workitems WHERE [System.TeamProject] = '${project}' AND [System.WorkItemType] = 'Bug'`;
  const auth = `Basic ${Buffer.from(`:${pat}`).toString("base64")}`;
  const wiqlRes = await safeFetch(`${orgUrl}/${encodeURIComponent(project)}/_apis/wit/wiql?api-version=7.0`, {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query: wiql }),
  });
  if (!wiqlRes.ok) throw new Error(`Azure DevOps WIQL returned ${wiqlRes.status}`);
  const wiqlJson: any = await wiqlRes.json();
  const ids = (wiqlJson.workItems ?? []).slice(0, 200).map((w: any) => w.id);
  if (ids.length === 0) return [];
  const wiRes = await safeFetch(
    `${orgUrl}/_apis/wit/workitems?ids=${ids.join(",")}&fields=System.Id,System.Title,System.State,Microsoft.VSTS.Common.Priority,Microsoft.VSTS.Common.Severity,System.AreaPath,System.CreatedDate,Microsoft.VSTS.Common.ResolvedDate&api-version=7.0`,
    { headers: { Authorization: auth, Accept: "application/json" } },
  );
  if (!wiRes.ok) throw new Error(`Azure DevOps work-items returned ${wiRes.status}`);
  const wiJson: any = await wiRes.json();
  return (wiJson.value ?? []).map((wi: any): NormalizedDefect => ({
    externalId: String(wi.id),
    key: `BUG-${wi.id}`,
    title: String(wi.fields?.["System.Title"] ?? ""),
    description: "",
    status: wi.fields?.["System.State"] ?? "open",
    severity: normSeverity(wi.fields?.["Microsoft.VSTS.Common.Severity"]),
    priority: normPriority(wi.fields?.["Microsoft.VSTS.Common.Priority"]),
    component: wi.fields?.["System.AreaPath"],
    raisedAt: wi.fields?.["System.CreatedDate"],
    resolvedAt: wi.fields?.["Microsoft.VSTS.Common.ResolvedDate"],
    externalUrl: `${orgUrl}/${encodeURIComponent(project)}/_workitems/edit/${wi.id}`,
  }));
}

async function fetchBugzilla(cfg: Record<string, any>): Promise<NormalizedDefect[]> {
  const host = (cfg.host ?? "").toString().replace(/\/$/, "");
  const product = (cfg.product ?? "").toString().trim();
  const apiKey = (cfg.apiKey ?? "").toString().trim();
  if (!host || !product) throw new Error("Bugzilla: host and product required");
  const qs = `product=${encodeURIComponent(product)}&limit=200${apiKey ? `&api_key=${encodeURIComponent(apiKey)}` : ""}`;
  const res = await safeFetch(`${host}/rest/bug?${qs}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Bugzilla returned ${res.status}`);
  const json: any = await res.json();
  return (json.bugs ?? []).map((b: any): NormalizedDefect => ({
    externalId: String(b.id),
    key: `BZ-${b.id}`,
    title: String(b.summary ?? ""),
    description: "",
    status: b.status,
    severity: normSeverity(b.severity),
    priority: normPriority(b.priority),
    component: b.component,
    raisedAt: b.creation_time,
    resolvedAt: b.is_open ? undefined : b.last_change_time,
    externalUrl: `${host}/show_bug.cgi?id=${b.id}`,
  }));
}

async function fetchMantis(cfg: Record<string, any>): Promise<NormalizedDefect[]> {
  const host = (cfg.host ?? "").toString().replace(/\/$/, "");
  const projectId = (cfg.projectId ?? "").toString().trim();
  const token = (cfg.token ?? "").toString().trim();
  if (!host || !projectId || !token) throw new Error("MantisBT: host, projectId and token required");
  const res = await safeFetch(`${host}/api/rest/issues?project_id=${encodeURIComponent(projectId)}&page_size=200`, {
    headers: { Authorization: token, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`MantisBT returned ${res.status}`);
  const json: any = await res.json();
  return (json.issues ?? []).map((i: any): NormalizedDefect => ({
    externalId: String(i.id),
    key: `MNT-${i.id}`,
    title: String(i.summary ?? ""),
    description: String(i.description ?? ""),
    status: i.status?.name ?? "open",
    severity: normSeverity(i.severity?.name),
    priority: normPriority(i.priority?.name),
    component: i.category?.name,
    raisedAt: i.created_at,
    resolvedAt: i.resolved_at,
    externalUrl: `${host}/view.php?id=${i.id}`,
  }));
}

async function fetchRedmine(cfg: Record<string, any>): Promise<NormalizedDefect[]> {
  const host = (cfg.host ?? "").toString().replace(/\/$/, "");
  const projectId = (cfg.projectId ?? "").toString().trim();
  const apiKey = (cfg.apiKey ?? "").toString().trim();
  if (!host || !projectId || !apiKey) throw new Error("Redmine: host, projectId and apiKey required");
  const res = await safeFetch(
    `${host}/issues.json?project_id=${encodeURIComponent(projectId)}&tracker_id=1&limit=200&status_id=*`,
    { headers: { "X-Redmine-API-Key": apiKey, Accept: "application/json" } },
  );
  if (!res.ok) throw new Error(`Redmine returned ${res.status}`);
  const json: any = await res.json();
  return (json.issues ?? []).map((i: any): NormalizedDefect => ({
    externalId: String(i.id),
    key: `REDM-${i.id}`,
    title: String(i.subject ?? ""),
    description: String(i.description ?? ""),
    status: i.status?.name ?? "open",
    severity: normSeverity(i.priority?.name),
    priority: normPriority(i.priority?.name),
    component: i.category?.name,
    raisedAt: i.created_on,
    resolvedAt: i.closed_on,
    externalUrl: `${host}/issues/${i.id}`,
  }));
}

async function fetchYouTrack(cfg: Record<string, any>): Promise<NormalizedDefect[]> {
  const host = (cfg.host ?? "").toString().replace(/\/$/, "");
  const projectKey = (cfg.projectKey ?? "").toString().trim();
  const token = (cfg.token ?? "").toString().trim();
  if (!host || !projectKey || !token) throw new Error("YouTrack: host, projectKey and token required");
  const query = encodeURIComponent(`project: ${projectKey} Type: Bug`);
  const res = await safeFetch(
    `${host}/api/issues?query=${query}&fields=id,idReadable,summary,description,created,resolved,customFields(name,value(name))&$top=200`,
    { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } },
  );
  if (!res.ok) throw new Error(`YouTrack returned ${res.status}`);
  const json: any = await res.json();
  return (json as any[]).map((i: any): NormalizedDefect => {
    const fields: Record<string, any> = {};
    for (const cf of i.customFields ?? []) fields[cf.name] = cf.value?.name ?? cf.value;
    return {
      externalId: String(i.id),
      key: String(i.idReadable ?? i.id),
      title: String(i.summary ?? ""),
      description: String(i.description ?? ""),
      status: fields["State"] ?? "open",
      severity: normSeverity(fields["Severity"] ?? fields["Priority"]),
      priority: normPriority(fields["Priority"]),
      component: fields["Subsystem"],
      raisedAt: i.created ? new Date(i.created).toISOString() : undefined,
      resolvedAt: i.resolved ? new Date(i.resolved).toISOString() : undefined,
      externalUrl: `${host}/issue/${i.idReadable ?? i.id}`,
    };
  });
}

async function fetchClickUp(cfg: Record<string, any>): Promise<NormalizedDefect[]> {
  const listId = (cfg.listId ?? "").toString().trim();
  const token = (cfg.token ?? "").toString().trim();
  if (!listId || !token) throw new Error("ClickUp: listId and token required");
  const res = await safeFetch(
    `https://api.clickup.com/api/v2/list/${encodeURIComponent(listId)}/task?include_closed=true&subtasks=false`,
    { headers: { Authorization: token, Accept: "application/json" } },
  );
  if (!res.ok) throw new Error(`ClickUp returned ${res.status}`);
  const json: any = await res.json();
  return (json.tasks ?? []).map((t: any): NormalizedDefect => ({
    externalId: String(t.id),
    key: String(t.custom_id ?? t.id),
    title: String(t.name ?? ""),
    description: String(t.description ?? ""),
    status: t.status?.status ?? "open",
    severity: normSeverity(t.priority?.priority),
    priority: normPriority(t.priority?.priority),
    component: undefined,
    raisedAt: t.date_created ? new Date(Number(t.date_created)).toISOString() : undefined,
    resolvedAt: t.date_closed ? new Date(Number(t.date_closed)).toISOString() : undefined,
    externalUrl: t.url,
  }));
}

async function fetchLinear(cfg: Record<string, any>): Promise<NormalizedDefect[]> {
  const teamKey = (cfg.teamKey ?? "").toString().trim();
  const apiKey = (cfg.apiKey ?? "").toString().trim();
  if (!apiKey) throw new Error("Linear: apiKey required");
  const filter = teamKey
    ? `{ team: { key: { eq: "${teamKey}" } }, labels: { some: { name: { containsIgnoreCase: "bug" } } } }`
    : `{ labels: { some: { name: { containsIgnoreCase: "bug" } } } }`;
  const query = `query { issues(filter: ${filter}, first: 200) { nodes { id identifier title description state { name } priority createdAt completedAt url } } }`;
  const res = await safeFetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: { Authorization: apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`Linear returned ${res.status}`);
  const json: any = await res.json();
  if (json.errors) throw new Error(`Linear: ${json.errors[0]?.message}`);
  return (json.data?.issues?.nodes ?? []).map((n: any): NormalizedDefect => ({
    externalId: String(n.id),
    key: String(n.identifier ?? n.id),
    title: String(n.title ?? ""),
    description: String(n.description ?? ""),
    status: n.state?.name ?? "open",
    severity: normSeverity(n.priority),
    priority: normPriority(n.priority),
    component: undefined,
    raisedAt: n.createdAt,
    resolvedAt: n.completedAt,
    externalUrl: n.url,
  }));
}

async function fetchServiceNow(cfg: Record<string, any>): Promise<NormalizedDefect[]> {
  const instance = (cfg.instance ?? "").toString().replace(/\/$/, "");
  const username = (cfg.username ?? "").toString().trim();
  const password = (cfg.password ?? "").toString().trim();
  const table = (cfg.table ?? "incident").toString().trim();
  if (!instance || !username || !password) throw new Error("ServiceNow: instance, username and password required");
  const auth = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
  const res = await safeFetch(
    `${instance}/api/now/table/${encodeURIComponent(table)}?sysparm_limit=200&sysparm_fields=number,short_description,description,state,severity,priority,category,opened_at,closed_at,sys_id`,
    { headers: { Authorization: auth, Accept: "application/json" } },
  );
  if (!res.ok) throw new Error(`ServiceNow returned ${res.status}`);
  const json: any = await res.json();
  return (json.result ?? []).map((r: any): NormalizedDefect => ({
    externalId: String(r.sys_id),
    key: String(r.number ?? r.sys_id),
    title: String(r.short_description ?? ""),
    description: String(r.description ?? ""),
    status: r.state ?? "open",
    severity: normSeverity(r.severity),
    priority: normPriority(r.priority),
    component: r.category,
    raisedAt: r.opened_at,
    resolvedAt: r.closed_at,
    externalUrl: `${instance}/nav_to.do?uri=${encodeURIComponent(table)}.do?sys_id=${r.sys_id}`,
  }));
}

async function fetchAlmOctane(cfg: Record<string, any>): Promise<NormalizedDefect[]> {
  const host = (cfg.host ?? "").toString().replace(/\/$/, "");
  const sharedSpaceId = (cfg.sharedSpaceId ?? "").toString().trim();
  const workspaceId = (cfg.workspaceId ?? "").toString().trim();
  const clientId = (cfg.clientId ?? "").toString().trim();
  const clientSecret = (cfg.clientSecret ?? "").toString().trim();
  if (!host || !sharedSpaceId || !workspaceId || !clientId || !clientSecret) {
    throw new Error("ALM Octane: host, sharedSpaceId, workspaceId, clientId and clientSecret required");
  }
  const auth = await safeFetch(`${host}/authentication/sign_in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
  });
  if (!auth.ok) throw new Error(`ALM Octane sign-in returned ${auth.status}`);
  const cookie = auth.headers.get("set-cookie") ?? "";
  const res = await safeFetch(
    `${host}/api/shared_spaces/${encodeURIComponent(sharedSpaceId)}/workspaces/${encodeURIComponent(workspaceId)}/defects?limit=200&fields=id,name,description,severity,phase,creation_time,closed_on`,
    { headers: { Cookie: cookie, Accept: "application/json" } },
  );
  if (!res.ok) throw new Error(`ALM Octane returned ${res.status}`);
  const json: any = await res.json();
  return (json.data ?? []).map((d: any): NormalizedDefect => ({
    externalId: String(d.id),
    key: `OCT-${d.id}`,
    title: String(d.name ?? ""),
    description: String(d.description ?? ""),
    status: d.phase?.name ?? "open",
    severity: normSeverity(d.severity?.name),
    priority: normPriority(d.severity?.name),
    component: undefined,
    raisedAt: d.creation_time,
    resolvedAt: d.closed_on,
    externalUrl: `${host}/ui/?p=${sharedSpaceId}/${workspaceId}#/defect/${d.id}`,
  }));
}

async function fetchGithubIssues(cfg: Record<string, any>): Promise<NormalizedDefect[]> {
  const owner = (cfg.owner ?? "").toString().trim();
  const repo = (cfg.repo ?? "").toString().trim();
  const token = (cfg.token ?? "").toString().trim();
  const labels = (cfg.labels ?? "bug").toString().trim();
  if (!owner || !repo) throw new Error("GitHub: owner and repo required");
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await safeFetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?state=all&labels=${encodeURIComponent(labels)}&per_page=100`,
    { headers },
  );
  if (!res.ok) throw new Error(`GitHub returned ${res.status}`);
  const json: any = await res.json();
  // /issues also includes PRs — filter them out.
  return (json as any[]).filter((i) => !i.pull_request).map((i: any): NormalizedDefect => ({
    externalId: String(i.id),
    key: `#${i.number}`,
    title: String(i.title ?? ""),
    description: String(i.body ?? ""),
    status: i.state ?? "open",
    severity: normSeverity((i.labels ?? []).map((l: any) => l.name).find((n: string) => /sev|severity|critical|major|minor|trivial/i.test(n))),
    priority: normPriority((i.labels ?? []).map((l: any) => l.name).find((n: string) => /^p[0-4]$|priority/i.test(n))),
    component: (i.labels ?? []).map((l: any) => l.name).find((n: string) => /component|area/i.test(n)),
    raisedAt: i.created_at,
    resolvedAt: i.closed_at,
    externalUrl: i.html_url,
  }));
}

async function fetchGitlabIssues(cfg: Record<string, any>): Promise<NormalizedDefect[]> {
  const host = (cfg.host ?? "https://gitlab.com").toString().replace(/\/$/, "");
  const projectId = (cfg.projectId ?? "").toString().trim();
  const token = (cfg.token ?? "").toString().trim();
  const labels = (cfg.labels ?? "bug").toString().trim();
  if (!projectId) throw new Error("GitLab: projectId required");
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers["PRIVATE-TOKEN"] = token;
  const res = await safeFetch(
    `${host}/api/v4/projects/${encodeURIComponent(projectId)}/issues?labels=${encodeURIComponent(labels)}&per_page=100&scope=all`,
    { headers },
  );
  if (!res.ok) throw new Error(`GitLab returned ${res.status}`);
  const json: any = await res.json();
  return (json as any[]).map((i: any): NormalizedDefect => ({
    externalId: String(i.id),
    key: `#${i.iid}`,
    title: String(i.title ?? ""),
    description: String(i.description ?? ""),
    status: i.state ?? "open",
    severity: normSeverity((i.labels ?? []).find((n: string) => /sev|severity|critical|major|minor|trivial/i.test(n))),
    priority: normPriority((i.labels ?? []).find((n: string) => /^p[0-4]$|priority/i.test(n))),
    component: undefined,
    raisedAt: i.created_at,
    resolvedAt: i.closed_at,
    externalUrl: i.web_url,
  }));
}

// ─── public dispatcher ─────────────────────────────────────────────────────

const SYSTEM_LABEL: Record<string, string> = {
  jira_defects: "Jira (Bugs)",
  ado_defects: "Azure DevOps (Bugs)",
  bugzilla: "Bugzilla",
  mantis: "MantisBT",
  redmine: "Redmine",
  youtrack: "YouTrack",
  clickup: "ClickUp",
  linear: "Linear",
  servicenow: "ServiceNow",
  alm_octane: "ALM Octane",
  github_issues: "GitHub Issues",
  gitlab_issues: "GitLab Issues",
};

export const DEFECT_KINDS = Object.keys(SYSTEM_LABEL) as Array<keyof typeof SYSTEM_LABEL>;
export function isDefectKind(k: string): boolean {
  return DEFECT_KINDS.includes(k as any);
}
export function defectSystemLabel(k: string): string {
  return SYSTEM_LABEL[k] ?? k;
}

export async function ingestDefectsTool(
  sourceId: string,
  projectId: string,
  kind: string,
  config: Record<string, any>,
): Promise<DefectIngestResult> {
  const system = defectSystemLabel(kind);
  let defects: NormalizedDefect[];
  try {
    if (kind === "jira_defects") defects = await fetchJiraDefects(config);
    else if (kind === "ado_defects") defects = await fetchAzureDevOpsDefects(config);
    else if (kind === "bugzilla") defects = await fetchBugzilla(config);
    else if (kind === "mantis") defects = await fetchMantis(config);
    else if (kind === "redmine") defects = await fetchRedmine(config);
    else if (kind === "youtrack") defects = await fetchYouTrack(config);
    else if (kind === "clickup") defects = await fetchClickUp(config);
    else if (kind === "linear") defects = await fetchLinear(config);
    else if (kind === "servicenow") defects = await fetchServiceNow(config);
    else if (kind === "alm_octane") defects = await fetchAlmOctane(config);
    else if (kind === "github_issues") defects = await fetchGithubIssues(config);
    else if (kind === "gitlab_issues") defects = await fetchGitlabIssues(config);
    else throw new Error(`Unknown defect kind: ${kind}`);
  } catch (err: any) {
    await finalizeSource(sourceId, "error", 0, 0, err.message ?? "Sync failed");
    throw err;
  }
  const persisted = await persistDefects(projectId, sourceId, system, defects);
  const summary = `${persisted.inserted} new + ${persisted.updated} updated defect(s) from ${system}`;
  await finalizeSource(sourceId, "ready", defects.length, persisted.bytes, summary);
  await db.insert(activityEventsTable).values({
    id: randomUUID(),
    kind: "defect",
    message: `Imported ${defects.length} defect(s) from ${system}`,
    actor: "avery.kim",
    entityCode: sourceId,
  });
  return { count: defects.length, bytes: persisted.bytes, summary };
}
