import { randomUUID } from "node:crypto";
import AdmZip from "adm-zip";
import { db, sourceFilesTable, projectSourcesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { safeFetch } from "./safe-fetch.js";

function sanitizePath(p: string): string | null {
  if (!p) return null;
  let s = p.replace(/\\/g, "/").replace(/^\/+/, "").replace(/^[a-zA-Z]:\//, "");
  if (s.split("/").some((seg) => seg === ".." || seg === "")) return null;
  if (s.length > 1024) return null;
  return s;
}

const MAX_TEXT_BYTES = 256 * 1024; // store content for files up to 256 KB
const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".next", ".turbo", ".cache",
  "coverage", ".venv", "venv", "__pycache__", ".pnpm-store", ".idea", ".vscode",
]);
const TEXT_EXTS = new Set([
  "ts","tsx","js","jsx","mjs","cjs","json","md","mdx","yml","yaml","toml","xml","html","htm","css","scss","sass","less",
  "py","rb","go","rs","java","kt","swift","c","cc","cpp","h","hpp","cs","php","sh","bash","ps1","sql","ini","env","cfg",
  "conf","tf","tfvars","dockerfile","makefile","gradle","groovy","scala","lua","pl","r","jl","elm","ex","exs",
]);

function langOf(p: string): string | null {
  const m = p.toLowerCase().match(/\.([^./\\]+)$/);
  if (!m) {
    const base = p.split(/[\\/]/).pop()?.toLowerCase() ?? "";
    if (base === "dockerfile") return "dockerfile";
    if (base === "makefile") return "makefile";
    return null;
  }
  return m[1];
}
function isText(p: string): boolean {
  const l = langOf(p);
  return l ? TEXT_EXTS.has(l) : false;
}
function shouldSkip(path: string): boolean {
  return path.split(/[\\/]/).some((seg) => SKIP_DIRS.has(seg));
}

export type IngestedFile = { path: string; size: number; content: Buffer | null };

export async function persistFiles(sourceId: string, files: IngestedFile[]): Promise<{ count: number; bytes: number }> {
  await db.delete(sourceFilesTable).where(eq(sourceFilesTable.sourceId, sourceId));
  let count = 0;
  let bytes = 0;
  for (const f of files) {
    const cleaned = sanitizePath(f.path);
    if (!cleaned) continue;
    f.path = cleaned;
    if (shouldSkip(f.path)) continue;
    const text = isText(f.path);
    let content: string | null = null;
    if (text && f.content && f.size <= MAX_TEXT_BYTES) {
      try {
        content = f.content.toString("utf8");
      } catch {
        content = null;
      }
    }
    await db.insert(sourceFilesTable).values({
      id: randomUUID(),
      sourceId,
      path: f.path,
      size: f.size,
      mime: text ? "text/plain" : "application/octet-stream",
      language: langOf(f.path),
      isBinary: text ? "false" : "true",
      content,
    });
    count++;
    bytes += f.size;
  }
  await db
    .update(projectSourcesTable)
    .set({
      fileCount: count,
      byteCount: bytes,
      status: "ready",
      statusMessage: `${count} files indexed`,
      lastSyncAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(projectSourcesTable.id, sourceId));
  return { count, bytes };
}

export async function ingestZipBuffer(sourceId: string, buf: Buffer): Promise<{ count: number; bytes: number }> {
  const zip = new AdmZip(buf);
  const entries = zip.getEntries();
  const files: IngestedFile[] = [];
  for (const e of entries) {
    if (e.isDirectory) continue;
    const path = e.entryName;
    if (shouldSkip(path)) continue;
    let content: Buffer | null = null;
    try {
      content = e.getData();
    } catch {
      content = null;
    }
    files.push({ path, size: e.header.size, content });
  }
  return persistFiles(sourceId, files);
}

// GitHub: list tree via API, then fetch each text file's contents.
export async function ingestGithub(
  sourceId: string,
  cfg: { repoUrl: string; branch?: string; token?: string },
): Promise<{ count: number; bytes: number }> {
  // Repo names can legitimately contain dots (e.g. "Marketingstuffs.site",
  // "my.app", "node.js"). Capture greedily up to the next slash, then strip
  // an optional ".git" suffix and any trailing path (/, /tree/main, etc).
  const m = cfg.repoUrl.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?(?:\/.*)?$/i);
  if (!m) throw new Error("Could not parse GitHub repoUrl. Expected https://github.com/owner/repo");
  const owner = m[1];
  const repo = m[2];
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "Auditee-Sources/1.0",
  };
  if (cfg.token) headers.Authorization = `Bearer ${cfg.token}`;

  let branch = cfg.branch;
  if (!branch) {
    const repoMeta = await safeFetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (!repoMeta.ok) {
      const hint = repoMeta.status === 403 ? "rate limit hit — supply a personal access token" : `HTTP ${repoMeta.status}`;
      throw new Error(`GitHub: cannot read repo (${hint}). For private repos pass a token.`);
    }
    const meta = (await repoMeta.json()) as { default_branch: string };
    branch = meta.default_branch;
  }
  const treeResp = await safeFetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    { headers },
  );
  if (!treeResp.ok) throw new Error(`GitHub: cannot list tree (HTTP ${treeResp.status})`);
  const tree = (await treeResp.json()) as { tree: Array<{ path: string; type: string; size?: number; sha: string }>; truncated?: boolean };

  const files: IngestedFile[] = [];
  const allBlobs = tree.tree.filter((t) => t.type === "blob" && !shouldSkip(t.path));
  // Cap to first 800 files to fit rate-limit + memory budgets.
  const blobs = allBlobs.slice(0, 800);
  let fetched = 0;
  let rateLimited = false;
  for (const blob of blobs) {
    let content: Buffer | null = null;
    if (isText(blob.path) && (blob.size ?? 0) <= MAX_TEXT_BYTES && blob.sha) {
      try {
        // sha-keyed blobs endpoint — same rate cost but does not need URL-encoded paths.
        const r = await safeFetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs/${blob.sha}`, { headers });
        if (r.status === 403) { rateLimited = true; break; }
        if (r.ok) {
          const j = (await r.json()) as { content?: string; encoding?: string };
          if (j.content && j.encoding === "base64") content = Buffer.from(j.content, "base64");
        }
        fetched++;
      } catch {
        content = null;
      }
    }
    files.push({ path: blob.path, size: blob.size ?? 0, content });
  }
  const result = await persistFiles(sourceId, files);
  if (rateLimited || tree.truncated || allBlobs.length > 800) {
    const notes: string[] = [];
    if (tree.truncated) notes.push("repo tree truncated by GitHub");
    if (allBlobs.length > 800) notes.push(`indexed first 800 of ${allBlobs.length} files`);
    if (rateLimited) notes.push(`rate-limited after ${fetched} content fetches — re-sync later or supply a token`);
    await db
      .update(projectSourcesTable)
      .set({ statusMessage: `${result.count} files indexed (${notes.join("; ")})` })
      .where(eq(projectSourcesTable.id, sourceId));
  }
  return result;
}

// Generic remote-system "sync": these types don't pull source code, but they connect
// and fetch a manifest of artifacts (issues, builds, objects, files) to record evidence.
export async function ingestRemoteSystem(
  sourceId: string,
  kind: string,
  cfg: Record<string, any>,
): Promise<{ count: number; bytes: number; summary: string }> {
  const files: IngestedFile[] = [];
  let summary = "";
  if (kind === "jira") {
    const host = String(cfg.host || "").replace(/\/$/, "");
    const auth = cfg.email && cfg.token ? `Basic ${Buffer.from(`${cfg.email}:${cfg.token}`).toString("base64")}` : "";
    const jql = encodeURIComponent(`project = ${cfg.projectKey} ORDER BY updated DESC`);
    const r = await safeFetch(`${host}/rest/api/3/search?jql=${jql}&maxResults=50`, {
      headers: auth ? { Authorization: auth, Accept: "application/json" } : { Accept: "application/json" },
    });
    if (!r.ok) throw new Error(`Jira: HTTP ${r.status} — check host, project key, and credentials`);
    const j = (await r.json()) as { total: number; issues: Array<{ key: string; fields: any }> };
    summary = `${j.total} issue(s) in ${cfg.projectKey}`;
    for (const issue of j.issues) {
      const text = `# ${issue.key} — ${issue.fields?.summary ?? ""}\n\nStatus: ${issue.fields?.status?.name ?? ""}\nType: ${issue.fields?.issuetype?.name ?? ""}\nPriority: ${issue.fields?.priority?.name ?? "-"}\n\n${issue.fields?.description ? JSON.stringify(issue.fields.description) : ""}`;
      files.push({ path: `jira/${issue.key}.md`, size: text.length, content: Buffer.from(text, "utf8") });
    }
  } else if (kind === "jenkins") {
    const host = String(cfg.host || "").replace(/\/$/, "");
    const auth = cfg.user && cfg.token ? `Basic ${Buffer.from(`${cfg.user}:${cfg.token}`).toString("base64")}` : "";
    const url = cfg.jobName ? `${host}/job/${encodeURIComponent(cfg.jobName)}/api/json?tree=builds[number,result,timestamp,duration,url]` : `${host}/api/json?tree=jobs[name,url,color]`;
    const r = await safeFetch(url, { headers: auth ? { Authorization: auth, Accept: "application/json" } : { Accept: "application/json" } });
    if (!r.ok) throw new Error(`Jenkins: HTTP ${r.status} — check host, job, and credentials`);
    const j = (await r.json()) as any;
    if (cfg.jobName) {
      const builds = (j.builds ?? []) as Array<{ number: number; result: string; timestamp: number; duration: number; url: string }>;
      summary = `${builds.length} build(s) for ${cfg.jobName}`;
      for (const b of builds) {
        const text = `Build #${b.number}\nResult: ${b.result}\nDuration: ${Math.round(b.duration / 1000)}s\nWhen: ${new Date(b.timestamp).toISOString()}\nURL: ${b.url}`;
        files.push({ path: `jenkins/${cfg.jobName}/build-${b.number}.txt`, size: text.length, content: Buffer.from(text, "utf8") });
      }
    } else {
      const jobs = (j.jobs ?? []) as Array<{ name: string; color: string; url: string }>;
      summary = `${jobs.length} job(s) discovered`;
      for (const job of jobs) {
        const text = `Job: ${job.name}\nStatus: ${job.color}\nURL: ${job.url}`;
        files.push({ path: `jenkins/${job.name}.txt`, size: text.length, content: Buffer.from(text, "utf8") });
      }
    }
  } else if (kind === "aws_s3") {
    // Use AWS SDK signing-free? We need to sign — keep this honest by using @aws-sdk if available; otherwise instruct.
    throw new Error("AWS S3 ingestion requires @aws-sdk/client-s3. Install it on the server, then re-sync.");
  } else if (kind === "gdrive") {
    const folderId = cfg.folderId;
    const apiKey = cfg.apiKey;
    if (!folderId || !apiKey) throw new Error("Google Drive: folderId and apiKey are required");
    const r = await safeFetch(`https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name,mimeType,size)&key=${apiKey}`);
    if (!r.ok) throw new Error(`Google Drive: HTTP ${r.status}`);
    const j = (await r.json()) as { files: Array<{ id: string; name: string; mimeType: string; size?: string }> };
    summary = `${j.files.length} file(s) in folder`;
    for (const f of j.files) {
      const text = `Drive file: ${f.name}\nID: ${f.id}\nType: ${f.mimeType}\nSize: ${f.size ?? "?"}`;
      files.push({ path: `gdrive/${f.name}.meta.txt`, size: text.length, content: Buffer.from(text, "utf8") });
    }
  } else if (kind === "alm") {
    // Treat ALM as Azure DevOps work items list.
    const host = String(cfg.host || "").replace(/\/$/, "");
    const auth = cfg.token ? `Basic ${Buffer.from(`:${cfg.token}`).toString("base64")}` : "";
    const url = `${host}/_apis/wit/wiql?api-version=7.0`;
    const body = { query: `SELECT [System.Id], [System.Title], [System.State] FROM WorkItems WHERE [System.TeamProject] = '${cfg.projectId}'` };
    const r = await safeFetch(url, { method: "POST", headers: { "Content-Type": "application/json", Authorization: auth }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`ALM: HTTP ${r.status}`);
    const j = (await r.json()) as { workItems: Array<{ id: number; url: string }> };
    summary = `${j.workItems?.length ?? 0} work item(s)`;
    for (const w of j.workItems ?? []) {
      const text = `Work item ${w.id}\nURL: ${w.url}`;
      files.push({ path: `alm/${w.id}.txt`, size: text.length, content: Buffer.from(text, "utf8") });
    }
  } else if (kind === "cloud_server" || kind === "url") {
    // Just probe reachability and capture metadata.
    const url = cfg.url || (cfg.host ? `https://${cfg.host}` : "");
    if (!url) throw new Error("Provide a url to probe");
    const r = await safeFetch(url, { method: "GET" }).catch((e) => { throw new Error(`Could not reach ${url}: ${e.message}`); });
    summary = `Reachable: HTTP ${r.status}`;
    const text = `Probed: ${url}\nStatus: ${r.status}\nServer: ${r.headers.get("server") ?? "?"}\nContent-Type: ${r.headers.get("content-type") ?? "?"}`;
    files.push({ path: `probe/${new URL(url).hostname}.txt`, size: text.length, content: Buffer.from(text, "utf8") });
  } else {
    throw new Error(`Unsupported source kind: ${kind}`);
  }
  const out = await persistFiles(sourceId, files);
  return { ...out, summary };
}
