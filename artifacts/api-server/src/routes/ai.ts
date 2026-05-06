import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";

function requireString(v: unknown, name: string, opts: { min?: number; max?: number } = {}): string {
  if (typeof v !== "string") throw Object.assign(new Error(`${name} is required`), { status: 400 });
  if (opts.min !== undefined && v.length < opts.min) throw Object.assign(new Error(`${name} must be >= ${opts.min} chars`), { status: 400 });
  if (opts.max !== undefined && v.length > opts.max) throw Object.assign(new Error(`${name} must be <= ${opts.max} chars`), { status: 400 });
  return v;
}
function optionalString(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}
import { randomUUID } from "node:crypto";
import {
  db,
  projectsTable,
  requirementsTable,
  codeArtifactsTable,
  traceabilityLinksTable,
  complianceFrameworksTable,
  complianceControlsTable,
  complianceEvidenceTable,
  activityEventsTable,
  legacySystemsTable,
  aiConversationsTable,
  capaActionsTable,
  projectSourcesTable,
  sourceFilesTable,
  defectsTable,
  testCasesTable,
  aiReportsTable,
  effortEstimatesTable,
  auditRunsTable,
} from "@workspace/db";
import { inArray } from "drizzle-orm";
import { count as drizzleCount } from "drizzle-orm";
import { desc } from "drizzle-orm";
import { jsonCompletion, AIUnavailableError, AIResponseError, classifyProviderError } from "../lib/ai";
import { retrieveChunks, formatChunksAsContext } from "../lib/rag.js";
import { extractRequirementsFromDocument } from "../lib/extraction-pipeline.js";
import { analyzeCode, analyzeCodeBest, formatAnalysisForPrompt } from "../lib/code-analyzer.js";
import { rateAudit, getRatingScheme } from "../lib/framework-rating";
import { selectStandardsBlueprints, renderStandardsAddendum } from "../lib/standards-blueprints";
import { consumeCredit } from "../middlewares/creditMiddleware";
import { assertProjectAccessIfAuthed, requireProjectAccessInline } from "../lib/projectAccess";
import { loadProjectDedupIndex, findDuplicate, indexNewRow } from "../lib/requirementDedup";

const router: IRouter = Router();

function aiHandler(
  fn: (req: import("express").Request, res: import("express").Response) => Promise<void>,
) {
  return async (req: import("express").Request, res: import("express").Response) => {
    try {
      await fn(req, res);
    } catch (err: any) {
      if (err instanceof AIUnavailableError) {
        res.status(503).json({ error: err.message });
        return;
      }
      if (err instanceof AIResponseError) {
        res.status(502).json({ error: err.message });
        return;
      }
      const provider = classifyProviderError(err);
      if (provider) {
        // Log the underlying provider message once so operators can see which
        // key is depleted, but never echo it to the client.
        console.warn(`[ai] ${req.path} provider error: ${provider.message} (raw: ${err?.status ?? "?"} ${String(err?.message ?? "").slice(0, 200)})`);
        res.status(provider.status).json({ error: provider.message });
        return;
      }
      const status = typeof err?.status === "number" ? err.status : 500;
      const message = err?.message ?? "Internal error";
      if (status >= 500) {
        console.error(`[ai] ${req.path} failed:`, err);
      }
      res.status(status).json({ error: message });
    }
  };
}

async function logActivity(
  kind: string,
  message: string,
  actor: string,
  entityCode?: string,
) {
  await db.insert(activityEventsTable).values({
    id: randomUUID(),
    kind,
    message,
    actor,
    entityCode: entityCode ?? null,
  });
}

async function nextRequirementCode(projectId: string): Promise<string> {
  const [project] = await db
    .select({ slug: projectsTable.slug })
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId));
  if (!project) throw new Error("Project not found");
  const prefix = project.slug.toUpperCase().slice(0, 4);
  const existing = await db
    .select({ code: requirementsTable.code })
    .from(requirementsTable)
    .where(eq(requirementsTable.projectId, projectId));
  const max = existing.reduce((m, r) => {
    const n = Number(r.code.split("-")[1] ?? "0");
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
}

// =============================================================
// AI: Generate Requirements from a brief
// =============================================================
router.post("/ai/generate-requirements", consumeCredit(), aiHandler(async (req, res) => {
  const rawBrief = typeof req.body?.brief === "string" ? req.body.brief.trim() : "";
  const rawCode = typeof req.body?.code === "string" ? req.body.code.trim() : "";
  const rawLang = typeof req.body?.language === "string" ? req.body.language.trim().slice(0, 40) : "";
  // Allowlist: alphanumerics + a few harmless punctuation chars used in language
  // names ("c++", "c#", "f#", "objective-c"). Anything else is dropped to avoid
  // smuggling backticks / control chars into the prompt fence.
  const language = /^[a-zA-Z0-9_+.#-]{1,40}$/.test(rawLang) ? rawLang : "";
  if (!rawBrief && !rawCode) {
    res.status(400).json({ error: "Provide either 'brief' or 'code'" });
    return;
  }
  if (rawBrief && rawCode) {
    res.status(400).json({ error: "Provide 'brief' or 'code', not both" });
    return;
  }
  const mode: "brief" | "code" = rawCode ? "code" : "brief";
  const body = {
    projectId: requireString(req.body?.projectId, "projectId", { min: 1 }),
    brief: mode === "brief" ? requireString(rawBrief, "brief", { min: 20, max: 8000 }) : "",
    code: mode === "code" ? requireString(rawCode, "code", { min: 20, max: 30000 }) : "",
    language,
  };
  {
    const access = await assertProjectAccessIfAuthed(req, res, body.projectId, "developer");
    if (access === false) return;
  }
  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, body.projectId));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  // Optional list of framework IDs the user has marked as APPLICABLE STANDARDS
  // for this generation. When supplied, we narrow `frameworks` (the
  // allow-listed codes the LLM may use in linkedFrameworkCodes) to those, AND
  // we inject a deterministic standards-blueprint addendum into the prompt so
  // every generated requirement set covers the topics each standard mandates.
  const rawAppFwIds = Array.isArray(req.body?.applicableFrameworkIds)
    ? (req.body.applicableFrameworkIds as unknown[])
        .filter((x): x is string => typeof x === "string" && x.length > 0)
        .slice(0, 8)
    : [];
  const applicableFrameworkIds = Array.from(new Set(rawAppFwIds));

  const allFrameworks = await db
    .select({
      id: complianceFrameworksTable.id,
      code: complianceFrameworksTable.code,
      name: complianceFrameworksTable.name,
    })
    .from(complianceFrameworksTable);

  const frameworks = applicableFrameworkIds.length > 0
    ? allFrameworks.filter((f) => applicableFrameworkIds.includes(f.id))
    : allFrameworks;

  const standardsBlueprints = selectStandardsBlueprints(frameworks);
  const standardsAddendum = renderStandardsAddendum(standardsBlueprints, "requirements");

  const fwCodes = frameworks.map((f) => f.code).join(", ") || "(none)";
  const baseSystem = mode === "code"
    ? `You are Auditee, an enterprise requirements analyst. Reverse-engineer a well-formed set of requirements (4-12) from the supplied source code. Return strict JSON of shape:
{"requirements":[{"title":string,"description":string,"type":"BRD"|"PRD"|"FRD"|"NFR","priority":"low"|"medium"|"high"|"critical","tags":string[],"linkedFrameworkCodes":string[]}]}
Rules:
- title: <=90 chars, action-oriented, derived from observable behaviour in the code.
- description: 1-3 sentences, testable; reference the function/route/class that establishes it.
- type: BRD=business goal, PRD=product capability, FRD=functional behaviour, NFR=non-functional (performance, security, compliance, validation, error-handling).
- Cover happy paths AND validation/error-handling/security behaviours visible in the code.
- linkedFrameworkCodes must be a subset of these codes: ${fwCodes}. Only include when truly relevant.
- Output JSON only, no commentary.`
    : `You are Auditee, an enterprise requirements analyst. From a product brief, extract a small, well-formed set of requirements (3-8). Return strict JSON of shape:
{"requirements":[{"title":string,"description":string,"type":"BRD"|"PRD"|"FRD"|"NFR","priority":"low"|"medium"|"high"|"critical","tags":string[],"linkedFrameworkCodes":string[]}]}
Rules:
- title: <=90 chars, action-oriented.
- description: 1-3 sentences, testable.
- type: BRD=business goal, PRD=product capability, FRD=functional behaviour, NFR=non-functional (performance, security, compliance).
- linkedFrameworkCodes must be a subset of these codes: ${fwCodes}. Only include when truly relevant.
- Output JSON only, no commentary.`;
  // When standards are explicitly applicable, lift the upper bound on the
  // requirement count so the model can satisfy the per-standard coverage rules
  // without truncation. The cap scales with the *total number of required
  // coverage topics* across the selected blueprints — every topic must produce
  // at least one requirement (architect-review fix), so the cap must be
  // strictly greater than the topic count or the constraints are mathematically
  // unsatisfiable. We also guard against runaway prompts with a hard ceiling.
  const totalCoverageTopics = standardsBlueprints.reduce(
    (sum, b) => sum + b.requirementCoverage.length,
    0,
  );
  // Floor at the prior expanded caps (16/20) so we don't shrink the budget for
  // single-standard pickers; ceiling at 60 so prompts stay bounded.
  const expandedCountSystem = applicableFrameworkIds.length > 0
    ? (() => {
        const codeMin = Math.max(6, Math.min(60, totalCoverageTopics + 2));
        const codeMax = Math.max(20, Math.min(60, totalCoverageTopics + 8));
        const briefMin = Math.max(6, Math.min(60, totalCoverageTopics + 2));
        const briefMax = Math.max(16, Math.min(60, totalCoverageTopics + 6));
        return baseSystem
          .replace("(4-12)", `(${codeMin}-${codeMax})`)
          .replace("(3-8)", `(${briefMin}-${briefMax})`);
      })()
    : baseSystem;
  const system = `${expandedCountSystem}${standardsAddendum}`;

  // For long briefs (>4000 chars), run the multi-step extraction pipeline
  // first: classify document → extract entities → produce a dense digest.
  // The digest replaces the raw brief in the final synthesis prompt so the
  // standards-aware generation gets a focused, structured input instead of a
  // wall of text. Falls back to the raw brief on any pipeline error.
  let pipelineDigest = "";
  if (mode === "brief" && body.brief.length > 4000) {
    try {
      const fwCodeList = frameworks.map((f) => f.code);
      const ext = await extractRequirementsFromDocument(body.brief, {
        standards: fwCodeList,
        targetCount: 0,
      });
      const sec = ext.classification.sections
        .map((s, i) => `S${i + 1} ${s.title}: ${s.summary}`)
        .join("\n");
      const ent = [
        ext.entities.actors.length
          ? `Actors: ${ext.entities.actors.map((a) => `${a.name} (${a.role})`).join("; ")}`
          : "",
        ext.entities.features.length
          ? `Features: ${ext.entities.features.map((f) => f.name).join("; ")}`
          : "",
        ext.entities.constraints.length
          ? `Constraints: ${ext.entities.constraints.map((c) => `[${c.type}] ${c.statement}`).join("; ")}`
          : "",
        ext.entities.risks.length
          ? `Risks: ${ext.entities.risks.map((r) => `[${r.severity}] ${r.statement}`).join("; ")}`
          : "",
        ext.entities.dataObjects.length
          ? `Data objects: ${ext.entities.dataObjects.map((d) => d.name).join("; ")}`
          : "",
        ext.entities.externalSystems.length
          ? `External systems: ${ext.entities.externalSystems.join("; ")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");
      pipelineDigest = `Document type: ${ext.classification.documentType}\nDomain: ${ext.classification.domain}\n\nSections:\n${sec}\n\n${ent}`;
    } catch (err) {
      req.log.warn({ err }, "extraction pipeline failed; falling back to raw brief");
    }
  }

  const user = mode === "code"
    ? `Project: ${project.name}\nProject context: ${project.description ?? ""}\n\nSource code${body.language ? ` (${body.language})` : ""}:\n\`\`\`${body.language || ""}\n${body.code}\n\`\`\``
    : `Project: ${project.name}\nProject context: ${project.description ?? ""}\n\nBrief:\n${pipelineDigest || body.brief}`;

  type GenResult = {
    requirements: Array<{
      title: string;
      description: string;
      type: "BRD" | "PRD" | "FRD" | "NFR";
      priority: "low" | "medium" | "high" | "critical";
      tags?: string[];
      linkedFrameworkCodes?: string[];
    }>;
  };
  const result = await jsonCompletion<GenResult>(system, user);
  if (!Array.isArray(result.requirements) || result.requirements.length === 0) {
    res.status(422).json({ error: "Model returned no requirements" });
    return;
  }

  const codeToId = new Map(frameworks.map((f) => [f.code, f.id]));
  // Dedup: load all existing requirements once so we can skip any
  // candidate that's effectively a duplicate of one already in the project.
  const dedupIndex = await loadProjectDedupIndex(body.projectId);
  const created: Array<typeof requirementsTable.$inferSelect> = [];
  const skipped: Array<{ title: string; duplicateOfCode: string; reason: string }> = [];
  for (const r of result.requirements) {
    const dup = findDuplicate({ title: r.title, description: r.description }, dedupIndex);
    if (dup) {
      skipped.push({
        title: r.title.slice(0, 200),
        duplicateOfCode: dup.duplicateOfCode,
        reason: dup.reason,
      });
      continue;
    }
    const code = await nextRequirementCode(body.projectId);
    const linkedFrameworks = (r.linkedFrameworkCodes ?? [])
      .map((c) => codeToId.get(c))
      .filter((x): x is string => Boolean(x));
    const [row] = await db
      .insert(requirementsTable)
      .values({
        id: randomUUID(),
        projectId: body.projectId,
        code,
        title: r.title.slice(0, 200),
        description: r.description,
        type: r.type,
        status: "draft",
        priority: r.priority,
        owner: "Auditee",
        tags: r.tags ?? [],
        linkedFrameworks,
        externalSystem: "auditee_ai",
        externalId: code,
      })
      .returning();
    created.push(row);
    indexNewRow(dedupIndex, { id: row.id, code: row.code, title: row.title, description: row.description });
    await logActivity(
      "requirement",
      `${code} drafted by Auditee from ${mode}`,
      "Auditee",
      code,
    );
  }

  res.status(201).json({ created, count: created.length, skipped, skippedCount: skipped.length });
}));

// =============================================================
// AI: Fetch source code from a URL — multi-provider Git host support
//
// Used by the "Generate from code" dialog so users can paste a
// repo / folder / file link from any of the major Git hosts instead
// of pasting raw code. Runs server-side because none of the providers
// allow browser CORS for raw file content.
//
// Supported providers:
//   - GitHub          (github.com)
//   - GitLab SaaS     (gitlab.com)
//   - Bitbucket Cloud (bitbucket.org)
//   - Azure DevOps    (dev.azure.com, *.visualstudio.com)
//   - Gitea / Forgejo (any host on GITEA_HOSTS env allowlist)
//
// Each provider implements a small strategy: parse(url) → location,
// optional defaultBranch(), listTree(), and a rawUrl() builder.
//
// SSRF protection: every outbound fetch goes through
// fetchAllowlistedFollow() which manually re-validates the destination
// host on every redirect hop against a per-provider allowlist.
// =============================================================
const RAW_FETCH_MAX_BYTES = 600_000; // ~30k chars after slicing
const FETCH_TIMEOUT_MS = 15_000;

// Public-cloud hosts each provider may legitimately serve content from.
// Self-hosted GitLab / Gitea / Bitbucket DC hosts are added at runtime
// from the *_HOSTS env vars — see SELF_HOSTED_*_HOSTS below.
const GITHUB_HOSTS = new Set(["github.com", "raw.githubusercontent.com", "api.github.com"]);
const GITLAB_HOSTS = new Set(["gitlab.com"]);
const BITBUCKET_HOSTS = new Set(["bitbucket.org", "api.bitbucket.org"]);
const AZURE_HOSTS = new Set(["dev.azure.com"]);
// Self-hosted Gitea/Forgejo (and self-hosted GitLab) — operator must
// explicitly allowlist so we never fetch from arbitrary internal hosts.
function parseHostList(env: string | undefined): Set<string> {
  return new Set(
    (env ?? "")
      .split(/[\s,]+/)
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean),
  );
}
const SELF_HOSTED_GITEA_HOSTS = parseHostList(process.env.GITEA_HOSTS);
const SELF_HOSTED_GITLAB_HOSTS = parseHostList(process.env.GITLAB_HOSTS);
const SELF_HOSTED_BITBUCKET_HOSTS = parseHostList(process.env.BITBUCKET_HOSTS);
const SELF_HOSTED_AZURE_HOSTS = parseHostList(process.env.AZURE_DEVOPS_HOSTS); // legacy *.visualstudio.com etc.

// Union of every host we are willing to talk to. Used by
// fetchAllowlistedFollow() as the per-redirect-hop SSRF guard.
const ALLOWED_FETCH_HOSTS = new Set<string>([
  ...GITHUB_HOSTS,
  ...GITLAB_HOSTS,
  ...BITBUCKET_HOSTS,
  ...AZURE_HOSTS,
  ...SELF_HOSTED_GITEA_HOSTS,
  ...SELF_HOSTED_GITLAB_HOSTS,
  ...SELF_HOSTED_BITBUCKET_HOSTS,
  ...SELF_HOSTED_AZURE_HOSTS,
]);
const LANGUAGE_BY_EXT: Record<string, string> = {
  ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
  py: "python", java: "java", kt: "kotlin", go: "go", rs: "rust",
  rb: "ruby", php: "php", cs: "csharp", cpp: "cpp", cc: "cpp", c: "c",
  h: "c", hpp: "cpp", swift: "swift", scala: "scala", m: "objective-c",
  cbl: "cobol", cob: "cobol", sql: "sql", sh: "bash", yml: "yaml",
  yaml: "yaml", json: "json", html: "html", css: "css",
};

// Extensions we treat as "app related" source code when scanning a tree.
// Excludes things like .md, images, lockfiles — we only want code.
const TREE_INCLUDE_EXTS = new Set([
  "ts", "tsx", "js", "jsx", "mjs", "cjs",
  "py", "java", "kt", "go", "rs", "rb", "php",
  "cs", "cpp", "cc", "c", "h", "hpp",
  "swift", "scala", "m", "mm",
  "cbl", "cob", "sql", "sh", "bash",
  "vue", "svelte", "astro",
]);
// Path segments that should be skipped wholesale when walking a repo.
const TREE_EXCLUDE_DIRS = new Set([
  "node_modules", ".git", "dist", "build", "out", ".next", ".nuxt",
  ".turbo", ".cache", "coverage", "target", "vendor", "__pycache__",
  ".venv", "venv", ".pnpm-store", ".yarn", ".idea", ".vscode",
  "tmp", "temp", "logs",
]);
const TREE_EXCLUDE_BASENAMES = new Set([
  "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "poetry.lock",
  "Cargo.lock", "Gemfile.lock", "composer.lock",
]);
const TREE_MAX_FILES = 40;
const TREE_PER_FILE_CHAR_CAP = 6_000;
const TREE_TOTAL_CHAR_CAP = 30_000;

// Manually follow redirects so we can re-validate the host on every hop.
// This prevents an open-redirect on github.com from sending us to an
// arbitrary backend host.
async function fetchAllowlistedFollow(startUrl: string, maxHops = 5, headers: Record<string, string> = {}): Promise<Response> {
  let current = startUrl;
  for (let hop = 0; hop <= maxHops; hop++) {
    const u = new URL(current);
    if (u.protocol !== "https:") {
      throw new Error(`Refusing redirect to non-https URL`);
    }
    if (!ALLOWED_FETCH_HOSTS.has(u.hostname)) {
      throw new Error(`Refusing redirect to non-allowlisted host '${u.hostname}'`);
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    let resp: Response;
    try {
      resp = await fetch(current, { redirect: "manual", signal: ctrl.signal, headers });
    } finally {
      clearTimeout(t);
    }
    if (resp.status >= 300 && resp.status < 400) {
      const next = resp.headers.get("location");
      if (!next) throw new Error(`Redirect ${resp.status} with no Location header`);
      current = new URL(next, current).toString(); // resolve relative
      continue;
    }
    return resp;
  }
  throw new Error(`Exceeded ${maxHops} redirects`);
}

// Stream the body and abort once we exceed the byte cap, so we never
// allocate an unbounded buffer for a malicious or oversized file.
async function readBodyWithCap(resp: Response, maxBytes: number): Promise<{ buf: Uint8Array; truncated: boolean }> {
  if (!resp.body) {
    const ab = await resp.arrayBuffer();
    if (ab.byteLength > maxBytes) {
      throw new Error(`File too large (${ab.byteLength} bytes; max ${maxBytes})`);
    }
    return { buf: new Uint8Array(ab), truncated: false };
  }
  const reader = resp.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        try { await reader.cancel(); } catch { /* ignore */ }
        throw new Error(`File too large (>${maxBytes} bytes). Pick a smaller file.`);
      }
      chunks.push(value);
    }
  } finally {
    try { reader.releaseLock(); } catch { /* ignore */ }
  }
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.byteLength; }
  return { buf: out, truncated: false };
}

// Fetch+decode a single file's text via raw.githubusercontent.com.
// Returns null on any failure (used during tree walk so one bad file
// does not abort the whole scan).
async function fetchRawFileText(rawUrl: string, maxBytes: number): Promise<string | null> {
  try {
    const r = await fetchAllowlistedFollow(rawUrl);
    if (!r.ok) return null;
    const { buf } = await readBodyWithCap(r, maxBytes);
    return new TextDecoder("utf-8", { fatal: false }).decode(buf);
  } catch {
    return null;
  }
}

// Score a file path so we walk source-y directories first when budgeting.
function pathPriority(p: string): number {
  const lower = p.toLowerCase();
  if (lower.startsWith("src/") || lower.includes("/src/")) return 0;
  if (lower.startsWith("lib/") || lower.includes("/lib/")) return 1;
  if (lower.startsWith("app/") || lower.includes("/app/")) return 2;
  if (lower.startsWith("packages/") || lower.startsWith("apps/")) return 3;
  if (lower.startsWith("server/") || lower.startsWith("backend/")) return 4;
  if (lower.startsWith("client/") || lower.startsWith("frontend/")) return 4;
  if (lower.includes("/test") || lower.includes("__tests__") || lower.endsWith(".test.ts") || lower.endsWith(".spec.ts")) return 9;
  return 5;
}

// ----- Multi-provider repo location model ------------------------------
//
// All providers normalize to one of these three shapes after parsing.
// `owner` is the path-encoded owner identifier:
//   - GitHub:    "owner"
//   - GitLab:    "namespace/subgroup/..." (full path, slash-preserved)
//   - Bitbucket: "workspace"
//   - Azure:     "{org}/{project}" (the URL-encoded "_apis" base anchor)
//   - Gitea:     "owner"
// `repo` is the repo / project / Azure repository name.
type ProviderId = "github" | "gitlab" | "bitbucket" | "azure" | "gitea";

type ParsedRepoLocation =
  | { kind: "blob"; provider: ProviderId; host: string; owner: string; repo: string; ref: string; path: string }
  | { kind: "tree"; provider: ProviderId; host: string; owner: string; repo: string; ref: string | null; path: string }
  | { kind: "repo"; provider: ProviderId; host: string; owner: string; repo: string }
  | { kind: "raw"; provider: ProviderId; host: string; owner: string; repo: string; ref: string; path: string };

const PROVIDER_LABEL: Record<ProviderId, string> = {
  github: "GitHub", gitlab: "GitLab", bitbucket: "Bitbucket",
  azure: "Azure DevOps", gitea: "Gitea/Forgejo",
};

// Detect which provider a URL belongs to. Returns null if the host is
// not on any allowlist (which prevents SSRF to arbitrary internal hosts).
function detectProvider(u: URL): ProviderId | null {
  const h = u.hostname.toLowerCase();
  if (GITHUB_HOSTS.has(h)) return "github";
  if (GITLAB_HOSTS.has(h) || SELF_HOSTED_GITLAB_HOSTS.has(h)) return "gitlab";
  if (BITBUCKET_HOSTS.has(h) || SELF_HOSTED_BITBUCKET_HOSTS.has(h)) return "bitbucket";
  if (AZURE_HOSTS.has(h) || SELF_HOSTED_AZURE_HOSTS.has(h)) return "azure";
  if (SELF_HOSTED_GITEA_HOSTS.has(h)) return "gitea";
  return null;
}

// ----- Parsers (one per provider) -------------------------------------

function parseGithubUrl(u: URL): ParsedRepoLocation | null {
  const host = u.hostname;
  if (host === "raw.githubusercontent.com") {
    const segs = u.pathname.split("/").filter(Boolean);
    if (segs.length < 4) return null;
    const [owner, repo, ref, ...rest] = segs;
    return { kind: "raw", provider: "github", host, owner, repo, ref, path: rest.join("/") };
  }
  if (host !== "github.com") return null;
  const segs = u.pathname.split("/").filter(Boolean);
  if (segs.length < 2) return null;
  const [owner, repo, mode, ...rest] = segs;
  const cleanRepo = repo.replace(/\.git$/i, "");
  if (!mode) return { kind: "repo", provider: "github", host, owner, repo: cleanRepo };
  if (mode === "blob" && rest.length >= 2) {
    const refAndPath = rest.join("/");
    const slash = refAndPath.indexOf("/");
    if (slash < 0) return null;
    return { kind: "blob", provider: "github", host, owner, repo: cleanRepo, ref: refAndPath.slice(0, slash), path: refAndPath.slice(slash + 1) };
  }
  if (mode === "tree") {
    if (rest.length === 0) return { kind: "repo", provider: "github", host, owner, repo: cleanRepo };
    const refAndPath = rest.join("/");
    const slash = refAndPath.indexOf("/");
    if (slash < 0) return { kind: "tree", provider: "github", host, owner, repo: cleanRepo, ref: refAndPath, path: "" };
    return { kind: "tree", provider: "github", host, owner, repo: cleanRepo, ref: refAndPath.slice(0, slash), path: refAndPath.slice(slash + 1) };
  }
  return { kind: "repo", provider: "github", host, owner, repo: cleanRepo };
}

// GitLab URLs use "/-/" as a separator between project path and view kind.
// Supports nested groups: gitlab.com/group/sub/project/-/blob/main/foo.ts
function parseGitlabUrl(u: URL): ParsedRepoLocation | null {
  const host = u.hostname;
  const path = u.pathname.replace(/^\/+|\/+$/g, "");
  if (!path) return null;
  const dashIdx = path.indexOf("/-/");
  if (dashIdx < 0) {
    // Bare project URL: gitlab.com/group/sub/project
    const segs = path.split("/").filter(Boolean);
    if (segs.length < 2) return null;
    const repo = segs[segs.length - 1].replace(/\.git$/i, "");
    const owner = segs.slice(0, -1).join("/");
    return { kind: "repo", provider: "gitlab", host, owner, repo };
  }
  const projectPath = path.slice(0, dashIdx);
  const after = path.slice(dashIdx + 3); // skip "/-/"
  const projectSegs = projectPath.split("/").filter(Boolean);
  if (projectSegs.length < 2) return null;
  const repo = projectSegs[projectSegs.length - 1].replace(/\.git$/i, "");
  const owner = projectSegs.slice(0, -1).join("/");
  const afterSegs = after.split("/").filter(Boolean);
  const mode = afterSegs[0]; // blob | tree | raw
  const rest = afterSegs.slice(1);
  if ((mode === "blob" || mode === "raw") && rest.length >= 2) {
    const ref = rest[0];
    return { kind: mode === "raw" ? "raw" : "blob", provider: "gitlab", host, owner, repo, ref, path: rest.slice(1).join("/") };
  }
  if (mode === "tree" && rest.length >= 1) {
    return { kind: "tree", provider: "gitlab", host, owner, repo, ref: rest[0], path: rest.slice(1).join("/") };
  }
  return { kind: "repo", provider: "gitlab", host, owner, repo };
}

// Bitbucket Cloud URLs: bitbucket.org/{workspace}/{repo}[/src/{ref}/{path}]
// Single-file vs folder is ambiguous from URL alone; treat as "blob" if the
// last segment looks like a file (has a dot in basename), else "tree".
function parseBitbucketUrl(u: URL): ParsedRepoLocation | null {
  const host = u.hostname;
  const segs = u.pathname.split("/").filter(Boolean);
  if (segs.length < 2) return null;
  const [owner, repoRaw, mode, ...rest] = segs;
  const repo = repoRaw.replace(/\.git$/i, "");
  if (!mode) return { kind: "repo", provider: "bitbucket", host, owner, repo };
  if ((mode === "src" || mode === "raw") && rest.length >= 1) {
    const ref = rest[0];
    const filePath = rest.slice(1).join("/");
    if (!filePath) return { kind: "tree", provider: "bitbucket", host, owner, repo, ref, path: "" };
    const last = rest[rest.length - 1];
    const looksLikeFile = last.includes(".") && !last.endsWith("/");
    if (looksLikeFile) {
      return { kind: mode === "raw" ? "raw" : "blob", provider: "bitbucket", host, owner, repo, ref, path: filePath };
    }
    return { kind: "tree", provider: "bitbucket", host, owner, repo, ref, path: filePath };
  }
  return { kind: "repo", provider: "bitbucket", host, owner, repo };
}

// Azure DevOps URLs: dev.azure.com/{org}/{project}/_git/{repo}?path=&version=GB{branch}
// We pack {org}/{project} into `owner` so downstream API calls can rebuild it.
function parseAzureUrl(u: URL): ParsedRepoLocation | null {
  const host = u.hostname;
  const segs = u.pathname.split("/").filter(Boolean);
  const gitIdx = segs.indexOf("_git");
  if (gitIdx < 1 || gitIdx >= segs.length - 1) return null;
  const orgProj = segs.slice(0, gitIdx).join("/");
  if (orgProj.split("/").length < 2) return null;
  const repo = segs[gitIdx + 1];
  const path = u.searchParams.get("path") ?? "";
  const versionRaw = u.searchParams.get("version") ?? "";
  // version is GB{branch}, GT{tag}, or GC{commit}; we only support branches.
  const ref = versionRaw.startsWith("GB") ? versionRaw.slice(2) : (versionRaw.startsWith("GT") ? versionRaw.slice(2) : null);
  const cleanPath = path.replace(/^\/+/, "");
  if (cleanPath) {
    const last = cleanPath.split("/").pop() ?? "";
    const looksLikeFile = last.includes(".") && !cleanPath.endsWith("/");
    if (looksLikeFile && ref) return { kind: "blob", provider: "azure", host, owner: orgProj, repo, ref, path: cleanPath };
    return { kind: "tree", provider: "azure", host, owner: orgProj, repo, ref, path: cleanPath };
  }
  if (ref) return { kind: "tree", provider: "azure", host, owner: orgProj, repo, ref, path: "" };
  return { kind: "repo", provider: "azure", host, owner: orgProj, repo };
}

// Gitea/Forgejo URLs mirror GitHub but use "/src/branch/" / "/src/commit/"
// instead of "/blob/" or "/tree/". Raw is "/raw/branch/{ref}/{path}".
function parseGiteaUrl(u: URL): ParsedRepoLocation | null {
  const host = u.hostname;
  const segs = u.pathname.split("/").filter(Boolean);
  if (segs.length < 2) return null;
  const [owner, repoRaw, mode, refKind, ...rest] = segs;
  const repo = repoRaw.replace(/\.git$/i, "");
  if (!mode) return { kind: "repo", provider: "gitea", host, owner, repo };
  if ((mode === "src" || mode === "raw") && (refKind === "branch" || refKind === "commit" || refKind === "tag") && rest.length >= 1) {
    const ref = rest[0];
    const filePath = rest.slice(1).join("/");
    if (!filePath) return { kind: "tree", provider: "gitea", host, owner, repo, ref, path: "" };
    const last = rest[rest.length - 1];
    const looksLikeFile = last.includes(".") && !last.endsWith("/");
    if (looksLikeFile) return { kind: mode === "raw" ? "raw" : "blob", provider: "gitea", host, owner, repo, ref, path: filePath };
    return { kind: "tree", provider: "gitea", host, owner, repo, ref, path: filePath };
  }
  return { kind: "repo", provider: "gitea", host, owner, repo };
}

function parseRepoUrl(u: URL): ParsedRepoLocation | null {
  const p = detectProvider(u);
  if (!p) return null;
  switch (p) {
    case "github": return parseGithubUrl(u);
    case "gitlab": return parseGitlabUrl(u);
    case "bitbucket": return parseBitbucketUrl(u);
    case "azure": return parseAzureUrl(u);
    case "gitea": return parseGiteaUrl(u);
  }
}

// ----- Default branch resolvers ---------------------------------------

const FETCH_HEADERS = { "User-Agent": "Auditee" };

// Use fetchAllowlistedFollow for metadata calls too — a malicious or
// compromised repo provider could 302 us to an internal IP otherwise.
// fetchAllowlistedFollow re-validates the host on every redirect hop
// against ALLOWED_FETCH_HOSTS, which is the union of every provider's
// public + self-hosted-allowlisted hosts.
async function fetchJsonWithTimeout<T = unknown>(url: string, headers: Record<string, string> = {}): Promise<T | null> {
  try {
    const r = await fetchAllowlistedFollow(url, 5, { ...FETCH_HEADERS, ...headers });
    if (!r.ok) return null;
    return await r.json() as T;
  } catch { return null; }
}

async function getDefaultBranch(loc: { provider: ProviderId; host: string; owner: string; repo: string }): Promise<string | null> {
  const { provider, host, owner, repo } = loc;
  if (provider === "github") {
    const j = await fetchJsonWithTimeout<{ default_branch?: string }>(`https://api.github.com/repos/${owner}/${repo}`, { Accept: "application/vnd.github+json" });
    return j?.default_branch ?? null;
  }
  if (provider === "gitlab") {
    const j = await fetchJsonWithTimeout<{ default_branch?: string }>(`https://${host}/api/v4/projects/${encodeURIComponent(`${owner}/${repo}`)}`);
    return j?.default_branch ?? null;
  }
  if (provider === "bitbucket") {
    const j = await fetchJsonWithTimeout<{ mainbranch?: { name?: string } }>(`https://api.bitbucket.org/2.0/repositories/${owner}/${repo}`);
    return j?.mainbranch?.name ?? null;
  }
  if (provider === "azure") {
    // owner = "{org}/{project}"
    const j = await fetchJsonWithTimeout<{ defaultBranch?: string }>(`https://${host}/${owner}/_apis/git/repositories/${encodeURIComponent(repo)}?api-version=7.1`);
    const ref = j?.defaultBranch ?? null;
    return ref ? ref.replace(/^refs\/heads\//, "") : null;
  }
  if (provider === "gitea") {
    const j = await fetchJsonWithTimeout<{ default_branch?: string }>(`https://${host}/api/v1/repos/${owner}/${repo}`);
    return j?.default_branch ?? null;
  }
  return null;
}

// ----- Tree listers ---------------------------------------------------

async function listRepoTree(loc: { provider: ProviderId; host: string; owner: string; repo: string }, ref: string): Promise<{ files: Array<{ path: string; size: number }>; truncated: boolean } | null> {
  const { provider, host, owner, repo } = loc;
  if (provider === "github") {
    const j = await fetchJsonWithTimeout<{ tree?: Array<{ path: string; type: string; size?: number }>; truncated?: boolean }>(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`,
      { Accept: "application/vnd.github+json" },
    );
    if (!j?.tree) return null;
    return { files: j.tree.filter((e) => e.type === "blob").map((e) => ({ path: e.path, size: e.size ?? 0 })), truncated: j.truncated === true };
  }
  if (provider === "gitlab") {
    // GitLab paginates at 100 entries; pull a few pages so we can find ~40 source files.
    const all: Array<{ path: string; size: number }> = [];
    let truncated = false;
    for (let page = 1; page <= 5; page++) {
      const j = await fetchJsonWithTimeout<Array<{ path: string; type: string }>>(
        `https://${host}/api/v4/projects/${encodeURIComponent(`${owner}/${repo}`)}/repository/tree?ref=${encodeURIComponent(ref)}&recursive=true&per_page=100&page=${page}`,
      );
      if (!Array.isArray(j) || j.length === 0) break;
      for (const e of j) if (e.type === "blob") all.push({ path: e.path, size: 0 });
      if (j.length < 100) break;
      if (page === 5) truncated = true;
    }
    if (all.length === 0) return null;
    return { files: all, truncated };
  }
  if (provider === "bitbucket") {
    // Bitbucket has no recursive flag; we fetch the source tree paginated.
    const all: Array<{ path: string; size: number }> = [];
    let truncated = false;
    let next: string | null = `https://api.bitbucket.org/2.0/repositories/${owner}/${repo}/src/${encodeURIComponent(ref)}/?max_depth=10&pagelen=100`;
    let pages = 0;
    while (next && pages < 5) {
      const j: { values?: Array<{ path: string; type: string; size?: number }>; next?: string } | null = await fetchJsonWithTimeout(next);
      if (!j?.values) break;
      for (const e of j.values) if (e.type === "commit_file") all.push({ path: e.path, size: e.size ?? 0 });
      next = j.next ?? null;
      pages += 1;
      if (pages === 5 && next) truncated = true;
    }
    if (all.length === 0) return null;
    return { files: all, truncated };
  }
  if (provider === "azure") {
    const j = await fetchJsonWithTimeout<{ value?: Array<{ path: string; gitObjectType: string; size?: number }> }>(
      `https://${host}/${owner}/_apis/git/repositories/${encodeURIComponent(repo)}/items?recursionLevel=Full&versionDescriptor.version=${encodeURIComponent(ref)}&versionDescriptor.versionType=branch&api-version=7.1`,
    );
    if (!j?.value) return null;
    return {
      files: j.value
        .filter((e) => e.gitObjectType === "blob")
        .map((e) => ({ path: e.path.replace(/^\/+/, ""), size: e.size ?? 0 })),
      truncated: false,
    };
  }
  if (provider === "gitea") {
    // Gitea needs a commit SHA for git/trees; resolve branch first.
    const branchInfo = await fetchJsonWithTimeout<{ commit?: { id?: string } }>(`https://${host}/api/v1/repos/${owner}/${repo}/branches/${encodeURIComponent(ref)}`);
    const sha = branchInfo?.commit?.id;
    if (!sha) return null;
    const j = await fetchJsonWithTimeout<{ tree?: Array<{ path: string; type: string; size?: number }>; truncated?: boolean }>(
      `https://${host}/api/v1/repos/${owner}/${repo}/git/trees/${sha}?recursive=true&per_page=1000`,
    );
    if (!j?.tree) return null;
    return { files: j.tree.filter((e) => e.type === "blob").map((e) => ({ path: e.path, size: e.size ?? 0 })), truncated: j.truncated === true };
  }
  return null;
}

// ----- Raw URL builders -----------------------------------------------

function rawUrlFor(loc: { provider: ProviderId; host: string; owner: string; repo: string }, ref: string, path: string): string {
  const { provider, host, owner, repo } = loc;
  switch (provider) {
    case "github":
      return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path}`;
    case "gitlab":
      return `https://${host}/${owner}/${repo}/-/raw/${ref}/${path.split("/").map(encodeURIComponent).join("/")}`;
    case "bitbucket":
      return `https://${host === "api.bitbucket.org" ? "bitbucket.org" : host}/${owner}/${repo}/raw/${ref}/${path.split("/").map(encodeURIComponent).join("/")}`;
    case "azure":
      return `https://${host}/${owner}/_apis/git/repositories/${encodeURIComponent(repo)}/items?path=${encodeURIComponent("/" + path)}&versionDescriptor.version=${encodeURIComponent(ref)}&versionDescriptor.versionType=branch&api-version=7.1&download=true&$format=octetStream`;
    case "gitea":
      return `https://${host}/${owner}/${repo}/raw/branch/${encodeURIComponent(ref)}/${path.split("/").map(encodeURIComponent).join("/")}`;
  }
}

function shouldIncludeFile(path: string, basePath: string): boolean {
  if (basePath && !path.startsWith(basePath.endsWith("/") ? basePath : basePath + "/") && path !== basePath) {
    return false;
  }
  const segs = path.split("/");
  for (const s of segs.slice(0, -1)) {
    if (TREE_EXCLUDE_DIRS.has(s)) return false;
  }
  const base = segs[segs.length - 1];
  if (TREE_EXCLUDE_BASENAMES.has(base)) return false;
  if (base.endsWith(".min.js") || base.endsWith(".map") || base.endsWith(".d.ts")) return false;
  const ext = (base.split(".").pop() ?? "").toLowerCase();
  return TREE_INCLUDE_EXTS.has(ext);
}

router.post("/ai/fetch-code-url", aiHandler(async (req, res) => {
  const raw = typeof req.body?.url === "string" ? req.body.url.trim() : "";
  if (!raw) {
    res.status(400).json({ error: "Provide 'url'" });
    return;
  }
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    res.status(400).json({ error: "Invalid URL" });
    return;
  }
  if (parsed.protocol !== "https:") {
    res.status(400).json({ error: "Only https URLs are supported" });
    return;
  }
  if (!ALLOWED_FETCH_HOSTS.has(parsed.hostname)) {
    res.status(400).json({ error: `Host '${parsed.hostname}' not supported. Supported: GitHub, GitLab (gitlab.com), Bitbucket Cloud (bitbucket.org), Azure DevOps (dev.azure.com), or a self-hosted Gitea/Forgejo/GitLab/Bitbucket-DC host configured by the operator (GITEA_HOSTS / GITLAB_HOSTS / BITBUCKET_HOSTS / AZURE_DEVOPS_HOSTS).` });
    return;
  }

  const loc = parseRepoUrl(parsed);
  if (!loc) {
    res.status(400).json({ error: "Could not understand that repo URL. Paste a project URL, a folder URL, or a single file URL from GitHub / GitLab / Bitbucket / Azure DevOps / Gitea." });
    return;
  }
  const providerName = PROVIDER_LABEL[loc.provider];
  const repoLabel = `${loc.owner}/${loc.repo}`;

  // ---------- Single file path ----------
  if (loc.kind === "blob" || loc.kind === "raw") {
    const { owner, repo, ref, path } = loc;
    const rawUrl = rawUrlFor(loc, ref, path);
    const label = `${repoLabel}@${ref}:${path}`;
    let response: Response;
    try {
      response = await fetchAllowlistedFollow(rawUrl);
    } catch (err) {
      res.status(502).json({ error: `Could not reach ${providerName}: ${(err as Error).message}` });
      return;
    }
    if (!response.ok) {
      res.status(response.status === 404 ? 404 : 502).json({
        error: response.status === 404
          ? `File not found on ${providerName} (private repo, wrong branch, or path mismatch). For ${providerName} private repos, connect a project source first.`
          : `${providerName} returned ${response.status}`,
      });
      return;
    }
    let bodyResult: { buf: Uint8Array; truncated: boolean };
    try {
      bodyResult = await readBodyWithCap(response, RAW_FETCH_MAX_BYTES);
    } catch (err) {
      res.status(413).json({ error: (err as Error).message });
      return;
    }
    let text: string;
    try {
      text = new TextDecoder("utf-8", { fatal: false }).decode(bodyResult.buf);
    } catch {
      res.status(415).json({ error: "File is not UTF-8 text (binary?)" });
      return;
    }
    const code = text.length > TREE_TOTAL_CHAR_CAP ? text.slice(0, TREE_TOTAL_CHAR_CAP) : text;
    const ext = (path.split(".").pop() ?? "").toLowerCase();
    const language = LANGUAGE_BY_EXT[ext] ?? "";
    res.json({ code, language, label, truncated: text.length > TREE_TOTAL_CHAR_CAP, mode: "file", filesIncluded: 1, provider: loc.provider });
    return;
  }

  // ---------- Repo or directory: walk the tree ----------
  const owner = loc.owner;
  const repo = loc.repo;
  let ref: string | null = loc.kind === "tree" ? loc.ref : null;
  const basePath = loc.kind === "tree" ? loc.path : "";
  if (!ref) {
    ref = await getDefaultBranch(loc);
    if (!ref) {
      res.status(404).json({ error: `Repository ${repoLabel} not found on ${providerName} or private. Public repos only — for private repos, connect a source on the Project Sources page.` });
      return;
    }
  }
  const tree = await listRepoTree(loc, ref);
  if (!tree) {
    res.status(404).json({ error: `Could not list ${repoLabel}@${ref} on ${providerName}. Repo may be private, the branch name might be wrong, or it doesn't exist.` });
    return;
  }
  // GitHub's git/trees endpoint truncates at ~100k entries. We can still pack
  // a useful prompt from the partial list, but we must surface this honestly.
  const treeTruncated = tree.truncated;

  const candidates = tree.files
    .filter((e) => shouldIncludeFile(e.path, basePath))
    .sort((a, b) => {
      const pa = pathPriority(a.path);
      const pb = pathPriority(b.path);
      if (pa !== pb) return pa - pb;
      return a.path.localeCompare(b.path);
    })
    .slice(0, TREE_MAX_FILES);

  if (candidates.length === 0) {
    res.status(404).json({ error: basePath
      ? `No source files found under '${basePath}' in ${repoLabel}@${ref} on ${providerName}.`
      : `No source files found in ${repoLabel}@${ref} on ${providerName}.` });
    return;
  }

  // Concurrency-limited file fetches (5 at a time).
  const results: Array<{ path: string; text: string }> = [];
  const queue = [...candidates];
  const workers: Promise<void>[] = [];
  const CONCURRENCY = 5;
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push((async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (!item) break;
        const rawUrl = rawUrlFor(loc, ref!, item.path);
        const text = await fetchRawFileText(rawUrl, RAW_FETCH_MAX_BYTES);
        if (text != null) {
          results.push({ path: item.path, text });
        }
      }
    })());
  }
  await Promise.all(workers);

  // Re-sort results to keep priority order (parallel fetches arrive out of order).
  results.sort((a, b) => {
    const pa = pathPriority(a.path);
    const pb = pathPriority(b.path);
    if (pa !== pb) return pa - pb;
    return a.path.localeCompare(b.path);
  });

  // Concatenate up to TREE_TOTAL_CHAR_CAP, with file headers and per-file caps.
  const parts: string[] = [];
  let used = 0;
  let filesIncluded = 0;
  let truncated = false;
  const langCounts = new Map<string, number>();
  for (const r of results) {
    if (used >= TREE_TOTAL_CHAR_CAP) { truncated = true; break; }
    const remaining = TREE_TOTAL_CHAR_CAP - used;
    const header = `// === ${r.path} ===\n`;
    const sliceCap = Math.min(TREE_PER_FILE_CHAR_CAP, remaining - header.length - 2);
    if (sliceCap <= 100) { truncated = true; break; }
    const body = r.text.length > sliceCap ? r.text.slice(0, sliceCap) + "\n// [truncated]\n" : r.text;
    parts.push(header + body);
    used += header.length + body.length + 2;
    filesIncluded += 1;
    const ext = (r.path.split(".").pop() ?? "").toLowerCase();
    const lang = LANGUAGE_BY_EXT[ext];
    if (lang) langCounts.set(lang, (langCounts.get(lang) ?? 0) + 1);
  }
  if (filesIncluded < results.length) truncated = true;
  if (treeTruncated) truncated = true;

  if (filesIncluded === 0) {
    res.status(502).json({
      error: results.length === 0
        ? `Found ${candidates.length} candidate file${candidates.length === 1 ? "" : "s"} in ${repoLabel}@${ref} on ${providerName}, but none could be downloaded.`
        : `Could not pack any source from ${repoLabel}@${ref} into the prompt budget.`,
    });
    return;
  }

  // Pick the most common language so the dialog auto-fills the language input.
  let language = "";
  let best = 0;
  for (const [lang, n] of langCounts) {
    if (n > best) { best = n; language = lang; }
  }

  const code = parts.join("\n\n");
  const scope = basePath ? `${basePath}` : `(repo root)`;
  const truncSuffix = truncated
    ? (treeTruncated ? " (repo too large — partial scan)" : " (truncated)")
    : "";
  const label = `${repoLabel}@${ref}:${scope} — ${filesIncluded} file${filesIncluded === 1 ? "" : "s"}${truncSuffix}`;

  res.json({
    code,
    language,
    label,
    truncated,
    mode: "tree",
    filesIncluded,
    filesAvailable: candidates.length,
    treeTruncated,
    provider: loc.provider,
  });
}));

// =============================================================
// AI: Analyze Code — match to requirements + create artifact + links
// =============================================================
router.post("/ai/analyze-code", consumeCredit(), aiHandler(async (req, res) => {
  const body = {
    projectId: requireString(req.body?.projectId, "projectId", { min: 1 }),
    filePath: requireString(req.body?.filePath, "filePath", { min: 1, max: 500 }),
    symbol: requireString(req.body?.symbol, "symbol", { min: 1, max: 200 }),
    language: requireString(req.body?.language, "language", { min: 1, max: 40 }),
    code: requireString(req.body?.code, "code", { min: 10, max: 20000 }),
  };
  {
    const access = await assertProjectAccessIfAuthed(req, res, body.projectId, "developer");
    if (access === false) return;
  }
  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, body.projectId));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const reqs = await db
    .select({
      id: requirementsTable.id,
      code: requirementsTable.code,
      title: requirementsTable.title,
      description: requirementsTable.description,
    })
    .from(requirementsTable)
    .where(eq(requirementsTable.projectId, body.projectId));

  const system = `You are Auditee's code-to-requirements analyst. Given a code snippet and a list of project requirements, identify which requirements the code implements, tests, or violates.
Return strict JSON:
{"summary":string,"matches":[{"requirementCode":string,"kind":"implements"|"tests"|"violates","confidence":number,"rationale":string}]}
Rules:
- Only emit matches with confidence >= 0.5.
- requirementCode must be one of the provided codes.
- kind 'violates' only when the code clearly conflicts with the requirement.
- summary: one sentence describing what the code does.
- Be conservative; prefer fewer high-confidence matches.`;

  const reqList = reqs
    .map((r) => `${r.code}: ${r.title} — ${r.description}`)
    .join("\n");
  const user = `Project: ${project.name}\nFile: ${body.filePath}\nSymbol: ${body.symbol}\nLanguage: ${body.language}\n\nRequirements:\n${reqList || "(none)"}\n\nCode:\n\`\`\`${body.language}\n${body.code}\n\`\`\``;

  type AnalyzeResult = {
    summary: string;
    matches: Array<{
      requirementCode: string;
      kind: "implements" | "tests" | "violates";
      confidence: number;
      rationale: string;
    }>;
  };
  const result = await jsonCompletion<AnalyzeResult>(system, user);

  // Find or create code artifact
  const existing = await db
    .select()
    .from(codeArtifactsTable)
    .where(
      and(
        eq(codeArtifactsTable.projectId, body.projectId),
        eq(codeArtifactsTable.filePath, body.filePath),
        eq(codeArtifactsTable.symbol, body.symbol),
      ),
    );
  let artifact = existing[0];
  if (!artifact) {
    const [row] = await db
      .insert(codeArtifactsTable)
      .values({
        id: randomUUID(),
        projectId: body.projectId,
        filePath: body.filePath,
        symbol: body.symbol,
        language: body.language,
        kind: "function",
        repoUrl: null,
      })
      .returning();
    artifact = row;
  }

  const codeToId = new Map(reqs.map((r) => [r.code, r.id]));
  const linksCreated: typeof traceabilityLinksTable.$inferSelect[] = [];
  for (const m of result.matches ?? []) {
    const reqId = codeToId.get(m.requirementCode);
    if (!reqId || m.confidence < 0.5) continue;
    const [existing] = await db
      .select()
      .from(traceabilityLinksTable)
      .where(
        and(
          eq(traceabilityLinksTable.requirementId, reqId),
          eq(traceabilityLinksTable.codeArtifactId, artifact.id),
          eq(traceabilityLinksTable.kind, m.kind),
        ),
      );
    if (existing) continue;
    const [link] = await db
      .insert(traceabilityLinksTable)
      .values({
        id: randomUUID(),
        requirementId: reqId,
        codeArtifactId: artifact.id,
        kind: m.kind,
      })
      .returning();
    linksCreated.push(link);
  }

  await logActivity(
    "code",
    `Auditee linked ${body.symbol} to ${linksCreated.length} requirement(s)`,
    "Auditee",
    body.symbol,
  );

  res.json({
    artifact,
    summary: result.summary,
    matches: (result.matches ?? []).map((m) => ({
      ...m,
      requirementId: codeToId.get(m.requirementCode) ?? null,
    })),
    linksCreated: linksCreated.length,
  });
}));

// =============================================================
// AI: Compliance Audit — analyze requirements vs framework controls
// =============================================================
router.post("/ai/compliance-audit", consumeCredit(), aiHandler(async (req, res) => {
  const body = {
    projectId: requireString(req.body?.projectId, "projectId", { min: 1 }),
    frameworkId: requireString(req.body?.frameworkId, "frameworkId", { min: 1 }),
    sourceIds: Array.isArray(req.body?.sourceIds) ? (req.body.sourceIds as string[]).filter(Boolean) : undefined,
  };
  {
    const access = await assertProjectAccessIfAuthed(req, res, body.projectId, "developer");
    if (access === false) return;
  }
  const [framework] = await db
    .select()
    .from(complianceFrameworksTable)
    .where(eq(complianceFrameworksTable.id, body.frameworkId));
  if (!framework) {
    res.status(404).json({ error: "Framework not found" });
    return;
  }
  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, body.projectId));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const controls = await db
    .select()
    .from(complianceControlsTable)
    .where(eq(complianceControlsTable.frameworkId, body.frameworkId));

  const reqs = await db
    .select()
    .from(requirementsTable)
    .where(eq(requirementsTable.projectId, body.projectId));

  // ───────── Load defects from connected defect-management tools ─────────
  // For most security/safety/quality controls (e.g. ISO 27001 A.5.24 incident
  // management, ISO 26262 problem resolution, FDA 11.10 audit trails) the open
  // defect log is direct evidence of how well the team responds to issues.
  // We feed a compact summary into the audit prompt so the AI weighs it.
  const allDefects = await db
    .select()
    .from(defectsTable)
    .where(eq(defectsTable.projectId, body.projectId));

  // ───────── Load project sources as evidence ─────────
  // Default: every "ready" source for the project.  If the caller passed sourceIds, scope to those.
  const sourcesForProject = await db
    .select()
    .from(projectSourcesTable)
    .where(eq(projectSourcesTable.projectId, body.projectId));
  const includedSources = (body.sourceIds && body.sourceIds.length > 0
    ? sourcesForProject.filter((s) => body.sourceIds!.includes(s.id))
    : sourcesForProject.filter((s) => s.status === "ready"));

  // Files we want to read content from (high-signal "evidence" files).
  // Listed in priority order; we cap text included per file to keep prompts small.
  const EVIDENCE_PATTERNS: RegExp[] = [
    /(^|\/)readme(\.|$)/i,
    /(^|\/)security(\.|$)/i,
    /(^|\/)license(\.|$)/i,
    /(^|\/)code_of_conduct(\.|$)/i,
    /(^|\/)contributing(\.|$)/i,
    /(^|\/)changelog(\.|$)/i,
    /(^|\/)package\.json$/i,
    /(^|\/)pyproject\.toml$/i,
    /(^|\/)requirements\.txt$/i,
    /(^|\/)dockerfile$/i,
    /(^|\/)docker-compose\.ya?ml$/i,
    /(^|\/)\.github\/workflows\/.+\.ya?ml$/i,
    /(^|\/)\.github\/.*\.ya?ml$/i,
    /(^|\/)\.gitlab-ci\.ya?ml$/i,
    /(^|\/)cloudbuild\.ya?ml$/i,
    /(^|\/)terraform\/.+\.tf$/i,
    /(^|\/)k8s\/.+\.ya?ml$/i,
    /(^|\/)kubernetes\/.+\.ya?ml$/i,
    /(^|\/)\.env\.example$/i,
    /(^|\/)Makefile$/i,
    /(^|\/)tsconfig\.json$/i,
  ];
  const MAX_FILE_BYTES = 4_000;       // ~4KB per cited file
  const MAX_TOTAL_EVIDENCE_BYTES = 60_000; // ~60KB total prompt evidence
  const MAX_PATH_LISTING = 600;       // also list paths so the AI sees scope

  type EvidenceFile = { sourceLabel: string; path: string; size: number; snippet: string };
  type SourceEvidence = {
    sourceId: string;
    sourceLabel: string;
    sourceKind: string;
    fileCount: number;
    cited: EvidenceFile[];
    listedPaths: string[];
  };
  const evidenceBySource: SourceEvidence[] = [];
  let totalEvidenceBytes = 0;

  for (const src of includedSources) {
    const allFiles = await db
      .select()
      .from(sourceFilesTable)
      .where(eq(sourceFilesTable.sourceId, src.id));
    const relevant = allFiles.filter((f) => EVIDENCE_PATTERNS.some((re) => re.test(f.path)));
    const cited: EvidenceFile[] = [];
    for (const f of relevant) {
      if (totalEvidenceBytes >= MAX_TOTAL_EVIDENCE_BYTES) break;
      if (!f.content) continue;
      const remaining = MAX_TOTAL_EVIDENCE_BYTES - totalEvidenceBytes;
      const slice = f.content.slice(0, Math.min(MAX_FILE_BYTES, remaining));
      cited.push({ sourceLabel: src.label, path: f.path, size: f.size, snippet: slice });
      totalEvidenceBytes += slice.length;
    }
    evidenceBySource.push({
      sourceId: src.id,
      sourceLabel: src.label,
      sourceKind: src.kind,
      fileCount: allFiles.length,
      cited,
      listedPaths: allFiles.slice(0, MAX_PATH_LISTING).map((f) => f.path),
    });
  }

  const evidenceBlock = evidenceBySource.length === 0
    ? "(no project sources connected — audit reasons from requirements only)"
    : evidenceBySource.map((s) => {
        const tree = s.listedPaths.length === 0 ? "(no files indexed)" : s.listedPaths.join("\n");
        const snips = s.cited.length === 0
          ? "(no high-signal files to cite)"
          : s.cited.map((f) => `--- ${f.path} (${f.size} bytes) ---\n${f.snippet}`).join("\n\n");
        return `### Source: ${s.sourceLabel} [${s.sourceKind}] — ${s.fileCount} files indexed\n\n#### File listing (truncated):\n${tree}\n\n#### Cited file contents:\n${snips}`;
      }).join("\n\n");

  // ── Defects evidence block ────────────────────────────────────────────
  // Only count defects from sources that are part of THIS audit run (sourceIds
  // gate). We summarise totals + sample the most severe open ones so the AI
  // can cite specific tickets as evidence (positive when closed-rate is high,
  // negative when criticals remain open against safety/security controls).
  const includedSourceIds = new Set(includedSources.map((s) => s.id));
  const defectsForAudit = allDefects.filter((d) => includedSourceIds.has(d.sourceId));
  const defectsBlock = ((): string => {
    if (defectsForAudit.length === 0) {
      return "(no defects imported from connected defect-management tools)";
    }
    const totals: Record<string, { open: number; resolved: number; critical: number }> = {};
    for (const d of defectsForAudit) {
      const sys = d.externalSystem || "Unknown";
      totals[sys] ??= { open: 0, resolved: 0, critical: 0 };
      if (d.status === "resolved") totals[sys]!.resolved++;
      else totals[sys]!.open++;
      if (d.severity === "critical" || d.severity === "blocker") totals[sys]!.critical++;
    }
    const sortedBySeverity = [...defectsForAudit].sort((a, b) => {
      const sev = (s: string) => ({ blocker: 0, critical: 1, major: 2, minor: 3, trivial: 4 } as any)[s] ?? 5;
      const stat = (s: string) => (s === "resolved" ? 1 : 0);
      return stat(a.status) - stat(b.status) || sev(a.severity) - sev(b.severity);
    }).slice(0, 25);
    const summary = Object.entries(totals)
      .map(([sys, t]) => `- ${sys}: ${t.open} open / ${t.resolved} resolved (${t.critical} critical)`)
      .join("\n");
    const samples = sortedBySeverity
      .map((d) => `- [${d.externalSystem}] ${d.key} [${d.status}/${d.severity}/${d.priority}] "${d.title}"${d.component ? ` (${d.component})` : ""}`)
      .join("\n");
    return `Totals by tool:\n${summary}\n\nMost severe / oldest first (sample of up to 25):\n${samples}`;
  })();

  const system = `You are Auditee's compliance auditor. For each control of the given framework, evaluate whether the project adequately covers it AND explicitly enumerate "required evidence vs found evidence vs missing evidence" so the user gets a clean conformance report.

You have FOUR inputs to reason from:
1) The project's requirements (formal documented behaviour). Many of these are imported from Requirements-Management tools (DOORS, Jama, Polarion, …) — treat the imported ones as authoritative when they cite an external system.
2) The framework's controls (what must be true).
3) Project sources — actual files ingested from GitHub / uploads / etc. These are real evidence. Cite them when they prove or disprove a control.
4) Defects imported from connected defect-management tools (Jira, Azure DevOps Bugs, Bugzilla, ServiceNow, ALM Octane, Linear, GitHub Issues, …). The defect log is direct evidence of: incident-management maturity, problem-resolution effectiveness, and unresolved risk against safety/security controls. A high count of OPEN critical defects is a meaningful gap signal — call it out specifically by ticket key when relevant.

Return strict JSON:
{
 "overallVerdict":"strong"|"adequate"|"weak"|"failing",
 "headlineFindings":string[],
 "controlAssessments":[{
   "controlCode":string,
   "verdict":"met"|"partial"|"gap",
   "coveringRequirementCodes":string[],
   "evidenceFiles":string[],
   "requiredEvidence":string[],
   "foundEvidence":string[],
   "missingEvidence":string[],
   "recommendation":string
 }]
}
Rules:
- controlCode must be one of the provided codes.
- coveringRequirementCodes is a list of project requirement codes (may be empty).
- evidenceFiles is a list of file paths (verbatim from the listings) that support your verdict (may be empty). Only cite files that genuinely support your verdict — do not invent paths.
- requiredEvidence: 2–4 short bullets (max ~80 chars each) describing the artefact types the standard expects (e.g. "Access-control policy", "Quarterly access reviews"). Speak the standard's vocabulary.
- foundEvidence: 0–4 short bullets (max ~80 chars each) describing what was actually located, each ideally referencing a requirement code or file path.
- missingEvidence: 0–4 short bullets — items in requiredEvidence that have no matching foundEvidence. Empty array if fully covered.
- verdict 'met' = clearly covered (requirements + evidence), 'partial' = some coverage with gaps, 'gap' = no meaningful coverage.
- recommendation: one concrete next step (1 sentence). If evidence is missing for a control, say which file is needed.
- headlineFindings: 2-4 short bullets summarising the audit, mentioning concrete sources where relevant.`;

  const user = `Framework: ${framework.code} — ${framework.name}\nProject: ${project.name}\n\nControls:\n${controls.map((c) => `${c.code}: ${c.title} — ${c.description}`).join("\n")}\n\nRequirements:\n${reqs.map((r) => `${r.code} [${r.type}/${r.status}]: ${r.title} — ${r.description}`).join("\n") || "(none)"}\n\nProject sources & evidence:\n${evidenceBlock}\n\nDefects from connected defect-management tools (cite these by ticket key when they prove or disprove a control):\n${defectsBlock}`;

  type AuditResult = {
    overallVerdict: "strong" | "adequate" | "weak" | "failing";
    headlineFindings: string[];
    controlAssessments: Array<{
      controlCode: string;
      verdict: "met" | "partial" | "gap";
      coveringRequirementCodes: string[];
      evidenceFiles?: string[];
      requiredEvidence?: string[];
      foundEvidence?: string[];
      missingEvidence?: string[];
      recommendation: string;
    }>;
  };
  const result = await jsonCompletion<AuditResult>(system, user, { maxTokens: 16384 });

  // Compute compliance percentage from per-control verdicts.
  // met = 1.0, partial = 0.5, gap = 0.0. Denominator is the authoritative control count
  // for the framework. Any control the model omitted is treated as a gap so met+partial+gap
  // always equals total.
  const verdictByCode = new Map<string, "met" | "partial" | "gap">();
  for (const a of result.controlAssessments ?? []) {
    if (a.verdict === "met" || a.verdict === "partial" || a.verdict === "gap") {
      verdictByCode.set(a.controlCode, a.verdict);
    }
  }
  let metCount = 0, partialCount = 0, gapCount = 0;
  for (const c of controls) {
    const v = verdictByCode.get(c.code);
    if (v === "met") metCount++;
    else if (v === "partial") partialCount++;
    else gapCount++; // includes explicit "gap" AND controls the model omitted
  }
  const denom = controls.length || 1;
  const compliancePercentage = Math.round(((metCount + partialCount * 0.5) / denom) * 100);

  // Auto-create CAPAs for newly detected gaps (skip controls that already have an audit-sourced CAPA).
  // Use a single base count + retry on collision to avoid race-condition duplicate codes when
  // multiple audits run concurrently for the same project.
  let capasCreated = 0;
  const codeToControl = new Map(controls.map((c) => [c.code, c]));
  const codePrefix = (project.slug ?? "PRJ").toUpperCase().slice(0, 4);
  const [{ value: baseCount }] = await db
    .select({ value: drizzleCount() })
    .from(capaActionsTable)
    .where(eq(capaActionsTable.projectId, project.id));
  let nextSeq = Number(baseCount) + 1;
  for (const a of result.controlAssessments ?? []) {
    if (a.verdict !== "gap" && a.verdict !== "partial") continue;
    const ctrl = codeToControl.get(a.controlCode);
    if (!ctrl) continue;
    const existingOpen = await db
      .select({ id: capaActionsTable.id })
      .from(capaActionsTable)
      .where(
        and(
          eq(capaActionsTable.projectId, project.id),
          eq(capaActionsTable.controlId, ctrl.id),
          eq(capaActionsTable.source, "ai_audit"),
        ),
      );
    if (existingOpen.length > 0) continue;
    let inserted = false;
    let attempts = 0;
    while (!inserted && attempts < 25) {
      const capaCode = `CAPA-${codePrefix}-${String(nextSeq).padStart(4, "0")}`;
      // Skip if this code already exists in DB (concurrent run won the race).
      const existingCode = await db
        .select({ id: capaActionsTable.id })
        .from(capaActionsTable)
        .where(eq(capaActionsTable.code, capaCode));
      if (existingCode.length > 0) {
        nextSeq++;
        attempts++;
        continue;
      }
      try {
        await db.insert(capaActionsTable).values({
          id: randomUUID(),
          code: capaCode,
          projectId: project.id,
          frameworkId: framework.id,
          controlId: ctrl.id,
          controlCode: ctrl.code,
          title: `[${framework.code} ${ctrl.code}] ${a.verdict === "gap" ? "Gap" : "Partial"}: ${ctrl.title}`.slice(0, 240),
          description: a.recommendation,
          severity: a.verdict === "gap" ? "high" : "medium",
          status: "open",
          owner: ctrl.owner ?? "Unassigned",
          source: "ai_audit",
          tags: [framework.code, ctrl.code],
        });
        inserted = true;
        nextSeq++;
        capasCreated++;
      } catch (e: any) {
        // unique violation on `code` — bump the sequence and retry.
        if (e?.code === "23505") {
          nextSeq++;
          attempts++;
          continue;
        }
        throw e;
      }
    }
  }

  const totalCitedFiles = evidenceBySource.reduce((n, s) => n + s.cited.length, 0);
  const totalIndexedFiles = evidenceBySource.reduce((n, s) => n + s.fileCount, 0);

  // ---- Pack C — auto-mark "met" controls as AI-asserted + log evidence ----
  // For every control the model judged "met" we:
  //   1. flip the control row to status="met", assertion="ai_asserted" (only if it
  //      isn't already verified — never downgrade a human verdict).
  //   2. insert a complianceEvidenceTable row capturing each cited evidence file
  //      so the locker has a full audit trail.
  let controlsAutoMarked = 0;
  let evidenceAutoCreated = 0;
  for (const a of result.controlAssessments ?? []) {
    if (a.verdict !== "met") continue;
    const ctrl = codeToControl.get(a.controlCode);
    if (!ctrl) continue;
    if (ctrl.assertion !== "verified") {
      await db
        .update(complianceControlsTable)
        .set({ status: "met", assertion: "ai_asserted" })
        .where(eq(complianceControlsTable.id, ctrl.id));
      controlsAutoMarked++;
    }
    const cited = Array.isArray(a.evidenceFiles) ? a.evidenceFiles.slice(0, 12) : [];
    if (cited.length === 0) {
      // Even with no file evidence, log the AI assertion itself so the
      // locker shows *something* the user can verify or reject.
      await db.insert(complianceEvidenceTable).values({
        id: randomUUID(),
        projectId: project.id,
        controlId: ctrl.id,
        frameworkId: framework.id,
        kind: "note",
        refLabel: `AI audit: ${a.recommendation.slice(0, 200)}`,
        source: "ai",
        status: "ai_asserted",
      });
      evidenceAutoCreated++;
    } else {
      for (const path of cited) {
        await db.insert(complianceEvidenceTable).values({
          id: randomUUID(),
          projectId: project.id,
          controlId: ctrl.id,
          frameworkId: framework.id,
          kind: "file",
          refLabel: String(path).slice(0, 400),
          source: "ai",
          status: "ai_asserted",
        });
        evidenceAutoCreated++;
      }
    }
  }

  // Standard-native rating overlay. Each framework (ASPICE, NIST CSF,
  // ISO 27001, IEC 61508, …) has its own audit vocabulary. We deterministically
  // derive the standard-native rating from the universal verdicts +
  // compliance % so the report speaks the auditor's language without asking
  // the LLM for it (which would be non-reproducible).
  const allVerdictsForRating: Array<{ controlCode: string; verdict: "met" | "partial" | "gap" }> = controls.map((c) => ({
    controlCode: c.code,
    verdict: verdictByCode.get(c.code) ?? "gap",
  }));
  const nativeRating = rateAudit(framework.code, compliancePercentage, allVerdictsForRating);

  await logActivity(
    "compliance",
    `Auditee ran ${framework.code} audit on ${project.name}: ${result.overallVerdict} · ${nativeRating.schemeName}: ${nativeRating.overall.value}${capasCreated ? ` · ${capasCreated} CAPA(s) opened` : ""}${includedSources.length ? ` · ${includedSources.length} source(s), ${totalCitedFiles} file(s) cited` : ""}`,
    "Auditee",
    framework.code,
  );

  const responsePayload = {
    framework: { id: framework.id, code: framework.code, name: framework.name },
    project: { id: project.id, name: project.name },
    capasCreated,
    compliancePercentage,
    controlSummary: { total: denom, met: metCount, partial: partialCount, gap: gapCount },
    sourcesUsed: evidenceBySource.map((s) => ({
      sourceId: s.sourceId,
      sourceLabel: s.sourceLabel,
      sourceKind: s.sourceKind,
      fileCount: s.fileCount,
      citedCount: s.cited.length,
      citedPaths: s.cited.map((f) => f.path),
    })),
    evidenceTotals: { sources: includedSources.length, indexedFiles: totalIndexedFiles, citedFiles: totalCitedFiles },
    // Spread the LLM result FIRST, then assign deterministic nativeRating
    // afterwards so the model can never overwrite the standard-native rating.
    ...result,
    nativeRating,
  };

  // Persist so the dialog can re-open without re-spending a credit.
  // We persist one row per (sourceId, framework) combination — the latest is
  // returned on next dialog open. Failures are logged but never block the
  // client response.
  try {
    const persistSourceId = includedSources[0]?.id ?? null;
    const persistSourceLabel = includedSources[0]?.label ?? null;
    await db.insert(auditRunsTable).values({
      id: randomUUID(),
      projectId: project.id,
      sourceId: persistSourceId,
      kind: "compliance",
      frameworkId: framework.id,
      frameworkCode: framework.code,
      sourceLabel: persistSourceLabel,
      result: responsePayload as unknown as Record<string, unknown>,
    });
  } catch (err) {
    req.log?.warn?.({ err }, "Failed to persist compliance audit run");
  }

  res.json(responsePayload);
}));

// =============================================================
// AI: Traceability / Completeness audit
// For each requirement, evaluates coverage across:
//   design  →  code  →  tests  →  test reports
// using existing traceability_links + uploaded source files.
// =============================================================
router.post("/ai/traceability-audit", consumeCredit(), aiHandler(async (req, res) => {
  const projectId = requireString(req.body?.projectId, "projectId", { min: 1 });
  {
    const access = await assertProjectAccessIfAuthed(req, res, projectId, "developer");
    if (access === false) return;
  }
  const requestedSourceIds: string[] = Array.isArray(req.body?.sourceIds)
    ? req.body.sourceIds.filter((x: unknown) => typeof x === "string" && x.length > 0)
    : [];

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const reqs = await db
    .select()
    .from(requirementsTable)
    .where(eq(requirementsTable.projectId, projectId));
  if (reqs.length === 0) {
    res.status(400).json({ error: "Project has no requirements to audit. Add requirements first." });
    return;
  }

  // Existing traceability links → code artifacts (the "manual" trace).
  const reqIds = reqs.map((r) => r.id);
  const links = reqIds.length
    ? await db.select().from(traceabilityLinksTable).where(inArray(traceabilityLinksTable.requirementId, reqIds))
    : [];
  const artifactIds = Array.from(new Set(links.map((l) => l.codeArtifactId)));
  const artifacts = artifactIds.length
    ? await db.select().from(codeArtifactsTable).where(inArray(codeArtifactsTable.id, artifactIds))
    : [];
  const artifactById = new Map(artifacts.map((a) => [a.id, a]));
  const linksByReq = new Map<string, Array<{ kind: string; path: string }>>();
  for (const l of links) {
    const a = artifactById.get(l.codeArtifactId);
    if (!a) continue;
    const arr = linksByReq.get(l.requirementId) ?? [];
    arr.push({ kind: l.kind, path: a.filePath ?? a.symbol ?? a.id });
    linksByReq.set(l.requirementId, arr);
  }

  // Source files — give the AI the full path listing per source so it can match.
  const sourcesAll = await db
    .select()
    .from(projectSourcesTable)
    .where(eq(projectSourcesTable.projectId, projectId));
  const includedSources = (
    requestedSourceIds.length
      ? sourcesAll.filter((s) => requestedSourceIds.includes(s.id))
      : sourcesAll.filter((s) => s.status === "ready")
  );

  const MAX_PATHS_PER_SOURCE = 800;
  type SrcSummary = { id: string; label: string; kind: string; fileCount: number; paths: string[] };
  const sourceSummaries: SrcSummary[] = [];
  for (const s of includedSources) {
    const files = await db
      .select({ path: sourceFilesTable.path })
      .from(sourceFilesTable)
      .where(eq(sourceFilesTable.sourceId, s.id));
    sourceSummaries.push({
      id: s.id,
      label: s.label,
      kind: s.kind,
      fileCount: files.length,
      paths: files.slice(0, MAX_PATHS_PER_SOURCE).map((f) => f.path),
    });
  }

  // Heuristic pre-classification of paths into the FIVE lifecycle stages
  // (architecture / design / implementation / testing / deployment). The AI
  // uses these as hints but can override.
  const isArchitecture = (p: string) =>
    /(^|\/)(architecture|arch|adr|c4)\//i.test(p) ||
    /(ARCHITECTURE|ADR-[0-9]{2,}|C4)\.(md|adoc|rst|txt)$/i.test(p);
  const isDesign = (p: string) =>
    /(^|\/)(design|hld|lld|specs?|rfcs?)\//i.test(p) ||
    /(DESIGN|HLD|LLD|SPEC|RFC)\.(md|adoc|rst|txt)$/i.test(p) ||
    (/\.(md|mdx|adoc|rst)$/i.test(p) && /(^|\/)(docs?)\//i.test(p));
  const isTest = (p: string) =>
    /(\.|_|\/)(test|spec)s?(\.|\/)/i.test(p) ||
    /(^|\/)(tests?|__tests__|cypress|e2e|playwright|vitest|jest)\//i.test(p) ||
    /\.(test|spec)\.[jt]sx?$/i.test(p);
  const isDeployment = (p: string) =>
    /(^|\/)(Dockerfile($|\.)|docker-compose|k8s\/|kubernetes\/|helm\/|terraform\/|infra\/|deploy\/|deployment\/|\.github\/workflows\/|\.gitlab-ci\.yml$|Jenkinsfile($|\.)|cloudformation\/|pulumi\/)/i.test(p);
  const isImplementation = (p: string) =>
    /\.(ts|tsx|js|jsx|py|go|rs|java|kt|cs|cpp|c|h|hpp|rb|php|swift|m|mm|sql)$/i.test(p) &&
    !isTest(p);

  type StageBucket = {
    architecture: string[];
    design: string[];
    implementation: string[];
    testing: string[];
    deployment: string[];
  };
  const buckets: Record<string, StageBucket> = {};
  for (const s of sourceSummaries) {
    buckets[s.id] = { architecture: [], design: [], implementation: [], testing: [], deployment: [] };
    for (const p of s.paths) {
      // Order matters — deployment > testing > architecture > design > implementation.
      if (isDeployment(p)) buckets[s.id].deployment.push(p);
      else if (isTest(p)) buckets[s.id].testing.push(p);
      else if (isArchitecture(p)) buckets[s.id].architecture.push(p);
      else if (isDesign(p)) buckets[s.id].design.push(p);
      else if (isImplementation(p)) buckets[s.id].implementation.push(p);
    }
  }

  const sourceBlock = sourceSummaries.length === 0
    ? "(no project sources connected — completeness will rely on declared traceability links only)"
    : sourceSummaries.map((s) => {
        const b = buckets[s.id]!;
        const fmt = (label: string, arr: string[]) =>
          `${label} (${arr.length}):\n${arr.slice(0, 60).map((p) => `  - ${p}`).join("\n") || "  (none detected)"}`;
        return `### Source: ${s.label} [${s.kind}] — ${s.fileCount} files\n${fmt("Architecture (ADRs, C4, arch/)", b.architecture)}\n${fmt("Design (HLD/LLD/specs/RFCs)", b.design)}\n${fmt("Implementation (source code)", b.implementation)}\n${fmt("Testing (unit/integration/e2e)", b.testing)}\n${fmt("Deployment (CI, infra, runbooks)", b.deployment)}`;
      }).join("\n\n");

  const reqBlock = reqs.map((r) => {
    const ls = linksByReq.get(r.id) ?? [];
    return `${r.code} [${r.type}/${r.status}] ${r.title}\n  description: ${(r.description ?? "").slice(0, 280)}\n  declared links: ${ls.length === 0 ? "(none)" : ls.map((l) => `${l.kind}→${l.path}`).join(", ")}`;
  }).join("\n");

  const system = `You are Auditee's end-to-end lifecycle traceability & completeness auditor. For every requirement, decide whether it is covered at FIVE stages of the software development lifecycle:
  1) Architecture — is there an architecture description, ADR, C4 diagram or architectural rationale anchoring this requirement? (ISO/IEC/IEEE 42010 framing.)
  2) Design — is there an HLD / LLD / functional spec / RFC describing HOW this will be built? (IEEE 1016 framing.)
  3) Implementation — does the source code that delivers this requirement exist?
  4) Testing — are there unit / integration / e2e test cases for this requirement?
  5) Deployment — is there CI/CD, infra-as-code (Dockerfile, k8s, terraform), release runbook or deployment doc that ships this?

Use BOTH the declared traceability links AND the source file listings to decide. Match by requirement code (e.g. HEL-0001) appearing in path/filename, by feature keyword, or by obvious domain mapping. Be conservative — if you cannot cite any artefact, mark "missing".

Return strict JSON:
{
 "overallVerdict":"strong"|"adequate"|"weak"|"failing",
 "headlineFindings": string[],
 "requirementCoverage":[{
   "requirementCode": string,
   "architecture":   {"status":"covered"|"partial"|"missing", "artifacts": string[], "note": string},
   "design":         {"status":"covered"|"partial"|"missing", "artifacts": string[], "note": string},
   "implementation": {"status":"covered"|"partial"|"missing", "artifacts": string[], "note": string},
   "testing":        {"status":"covered"|"partial"|"missing", "artifacts": string[], "note": string},
   "deployment":     {"status":"covered"|"partial"|"missing", "artifacts": string[], "note": string},
   "recommendation": string
 }]
}
Rules:
- Return EXACTLY ONE entry per provided requirement code, no duplicates, no extras. The list must contain every code in the "Requirements" block, even if all five stages are missing.
- requirementCode must be one of the provided codes (verbatim).
- artifacts: file paths verbatim from the listings or declared links. Do not invent paths. May be empty.
- note: ONE short sentence explaining what was (or wasn't) found.
- recommendation: ONE concrete next action for this requirement (e.g. "Add e2e test in tests/auth.e2e.ts covering MFA flow", "Author an ADR for the chosen MFA mechanism").
- headlineFindings: 2–4 short bullets about systemic lifecycle gaps (e.g. "14 of 18 requirements have no architecture artefact", "Deployment story is undocumented across the board").`;

  const user = `Project: ${project.name}\n\nRequirements (${reqs.length}):\n${reqBlock}\n\nProject sources:\n${sourceBlock}`;

  type CoverageStage = { status: "covered" | "partial" | "missing"; artifacts: string[]; note: string };
  type ReqCoverage = {
    requirementCode: string;
    architecture: CoverageStage;
    design: CoverageStage;
    implementation: CoverageStage;
    testing: CoverageStage;
    deployment: CoverageStage;
    recommendation: string;
  };
  type TraceResult = {
    overallVerdict: "strong" | "adequate" | "weak" | "failing";
    headlineFindings: string[];
    requirementCoverage: ReqCoverage[];
  };
  const result = await jsonCompletion<TraceResult>(system, user, { maxTokens: 16384 });

  // Reconcile model output against authoritative requirement set.
  // Any requirement code the model omitted (or returned with invalid shape) is treated as
  // fully missing across all 5 stages, so completeness can never be inflated by omissions.
  const MISSING_STAGE: { status: "missing"; artifacts: string[]; note: string } = {
    status: "missing",
    artifacts: [],
    note: "Model returned no coverage entry for this requirement.",
  };
  function normalizeStage(s: any): CoverageStage {
    const status =
      s?.status === "covered" || s?.status === "partial" || s?.status === "missing"
        ? s.status
        : "missing";
    const artifacts = Array.isArray(s?.artifacts) ? s.artifacts.filter((x: any) => typeof x === "string") : [];
    const note = typeof s?.note === "string" ? s.note : "";
    return { status, artifacts, note };
  }
  const modelByCode = new Map<string, ReqCoverage>();
  for (const r of result.requirementCoverage ?? []) {
    if (r && typeof r.requirementCode === "string" && !modelByCode.has(r.requirementCode)) {
      modelByCode.set(r.requirementCode, r);
    }
  }
  const STAGE_KEYS = ["architecture", "design", "implementation", "testing", "deployment"] as const;
  type StageKey = (typeof STAGE_KEYS)[number];
  // Back-compat: older payloads from the model might still emit "code"/"tests"/
  // "reports" keys. Map them onto the new stage names so a stale prompt cache
  // doesn't degrade scores to zero. "reports" rolls up into "testing" because
  // it's evidence that tests have actually been run.
  function pickStage(m: any, key: StageKey): CoverageStage {
    if (!m) return { ...MISSING_STAGE };
    const direct = m[key];
    if (direct) return normalizeStage(direct);
    if (key === "implementation" && m.code) return normalizeStage(m.code);
    if (key === "testing" && (m.tests || m.reports)) return normalizeStage(m.tests ?? m.reports);
    return { ...MISSING_STAGE };
  }
  const reconciled = reqs.map((req) => {
    const m = modelByCode.get(req.code);
    return {
      requirementCode: req.code,
      architecture: pickStage(m, "architecture"),
      design: pickStage(m, "design"),
      implementation: pickStage(m, "implementation"),
      testing: pickStage(m, "testing"),
      deployment: pickStage(m, "deployment"),
      recommendation:
        m && typeof m.recommendation === "string" && m.recommendation.trim()
          ? m.recommendation
          : "Establish architecture, design, implementation, testing, and deployment artefacts for this requirement.",
    };
  });

  // Compute completeness % — average of 5 stage scores across ALL project requirements
  // (not just those returned by the model). covered=1, partial=0.5, missing=0
  function scoreStage(s: { status: string }): number {
    if (s.status === "covered") return 1;
    if (s.status === "partial") return 0.5;
    return 0;
  }
  let totalScore = 0;
  const stageTotals: Record<StageKey, number> = {
    architecture: 0,
    design: 0,
    implementation: 0,
    testing: 0,
    deployment: 0,
  };
  for (const r of reconciled) {
    const a = scoreStage(r.architecture);
    const d = scoreStage(r.design);
    const i = scoreStage(r.implementation);
    const t = scoreStage(r.testing);
    const dep = scoreStage(r.deployment);
    totalScore += (a + d + i + t + dep) / 5;
    stageTotals.architecture += a;
    stageTotals.design += d;
    stageTotals.implementation += i;
    stageTotals.testing += t;
    stageTotals.deployment += dep;
  }
  const totalReqs = reconciled.length;
  const completenessPercentage = totalReqs > 0 ? Math.round((totalScore / totalReqs) * 100) : 0;
  const stagePercentages: Record<StageKey, number> = {
    architecture: totalReqs ? Math.round((stageTotals.architecture / totalReqs) * 100) : 0,
    design: totalReqs ? Math.round((stageTotals.design / totalReqs) * 100) : 0,
    implementation: totalReqs ? Math.round((stageTotals.implementation / totalReqs) * 100) : 0,
    testing: totalReqs ? Math.round((stageTotals.testing / totalReqs) * 100) : 0,
    deployment: totalReqs ? Math.round((stageTotals.deployment / totalReqs) * 100) : 0,
  };

  await logActivity(
    "compliance",
    `Auditee ran lifecycle traceability audit on ${project.name}: ${result.overallVerdict} (${completenessPercentage}%)`,
    "Auditee",
    project.slug ?? project.id,
  );

  const tracePayload = {
    project: { id: project.id, name: project.name },
    overallVerdict: result.overallVerdict,
    headlineFindings: result.headlineFindings ?? [],
    requirementCoverage: reconciled,
    completenessPercentage,
    stagePercentages,
    requirementsAudited: totalReqs,
    sourcesUsed: sourceSummaries.map((s) => ({
      sourceId: s.id,
      sourceLabel: s.label,
      sourceKind: s.kind,
      fileCount: s.fileCount,
      architectureCount: buckets[s.id]?.architecture.length ?? 0,
      designCount: buckets[s.id]?.design.length ?? 0,
      implementationCount: buckets[s.id]?.implementation.length ?? 0,
      testingCount: buckets[s.id]?.testing.length ?? 0,
      deploymentCount: buckets[s.id]?.deployment.length ?? 0,
    })),
  };

  try {
    const persistSourceId = includedSources[0]?.id ?? null;
    const persistSourceLabel = includedSources[0]?.label ?? null;
    await db.insert(auditRunsTable).values({
      id: randomUUID(),
      projectId: project.id,
      sourceId: persistSourceId,
      kind: "traceability",
      sourceLabel: persistSourceLabel,
      result: tracePayload as unknown as Record<string, unknown>,
    });
  } catch (err) {
    req.log?.warn?.({ err }, "Failed to persist traceability audit run");
  }

  res.json(tracePayload);
}));

// =============================================================
// GET latest audit run (compliance or traceability) for a source
// so the dialog can re-open without re-running the LLM.
// =============================================================
router.get("/ai/audit-runs/latest", aiHandler(async (req, res) => {
  const sourceId = requireString(req.query?.sourceId, "sourceId", { min: 1 });
  const kindRaw = requireString(req.query?.kind, "kind", { min: 1 });
  if (kindRaw !== "compliance" && kindRaw !== "traceability") {
    res.status(400).json({ error: "kind must be 'compliance' or 'traceability'" });
    return;
  }
  const kind = kindRaw as "compliance" | "traceability";
  const frameworkId = typeof req.query?.frameworkId === "string" && req.query.frameworkId.length > 0
    ? (req.query.frameworkId as string)
    : null;

  const conditions = [
    eq(auditRunsTable.sourceId, sourceId),
    eq(auditRunsTable.kind, kind),
  ];
  if (kind === "compliance" && frameworkId) {
    conditions.push(eq(auditRunsTable.frameworkId, frameworkId));
  }
  const [latest] = await db
    .select()
    .from(auditRunsTable)
    .where(and(...conditions))
    .orderBy(desc(auditRunsTable.createdAt))
    .limit(1);

  if (!latest) {
    res.status(404).json({ error: "No prior audit" });
    return;
  }

  // Project-level access check using the persisted projectId.
  {
    const access = await assertProjectAccessIfAuthed(req, res, latest.projectId, "viewer");
    if (access === false) return;
  }

  res.json({
    id: latest.id,
    kind: latest.kind,
    frameworkId: latest.frameworkId,
    frameworkCode: latest.frameworkCode,
    runAt: latest.createdAt.toISOString(),
    result: latest.result,
  });
}));

// =============================================================
// GET aggregated traceability completeness summary for a project.
// Pivots the latest traceability audit_run per source into a
// requirement × stage matrix, taking the BEST status per cell across
// all sources (covered > partial > missing). Read-only, no AI credit.
// =============================================================
router.get("/ai/audit-runs/traceability-summary", aiHandler(async (req, res) => {
  const projectId = requireString(req.query?.projectId, "projectId", { min: 1 });
  {
    // Content read of project-scoped audit data — must require an
    // authenticated, project-member caller (not the AI anonymous-trial path).
    // Project roles are manager > developer > reviewer > auditor; "auditor"
    // is the read-only floor (there is no "viewer" role).
    const access = await requireProjectAccessInline(req, res, projectId, "auditor");
    if (access === false) return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const allReqs = await db
    .select({
      id: requirementsTable.id,
      code: requirementsTable.code,
      title: requirementsTable.title,
      type: requirementsTable.type,
      status: requirementsTable.status,
      priority: requirementsTable.priority,
    })
    .from(requirementsTable)
    .where(eq(requirementsTable.projectId, projectId));

  const allRuns = await db
    .select()
    .from(auditRunsTable)
    .where(and(eq(auditRunsTable.projectId, projectId), eq(auditRunsTable.kind, "traceability")))
    .orderBy(desc(auditRunsTable.createdAt));

  // Latest run per source — first occurrence wins because we ordered DESC.
  type RunRow = typeof auditRunsTable.$inferSelect;
  const latestBySource = new Map<string, RunRow>();
  for (const r of allRuns) {
    const key = r.sourceId ?? "__no_source__";
    if (!latestBySource.has(key)) latestBySource.set(key, r);
  }
  const runs = Array.from(latestBySource.values());

  type StageKey = "architecture" | "design" | "implementation" | "testing" | "deployment";
  const STAGE_KEYS: StageKey[] = ["architecture", "design", "implementation", "testing", "deployment"];
  type CellStatus = "covered" | "partial" | "missing" | "unaudited";
  const RANK: Record<CellStatus, number> = { covered: 3, partial: 2, missing: 1, unaudited: 0 };

  type SourceCellEvidence = {
    sourceId: string;
    sourceLabel: string;
    status: "covered" | "partial" | "missing";
    artifacts: string[];
    note: string;
  };
  type RequirementRow = {
    requirementId: string;
    requirementCode: string;
    requirementTitle: string;
    type: string;
    status: string;
    priority: string;
    stages: Record<StageKey, { best: CellStatus; perSource: SourceCellEvidence[] }>;
    recommendations: Array<{ sourceLabel: string; text: string }>;
    auditedBySources: number;
  };

  // Track unique source IDs per requirement (keyed by requirement ID, not
  // code, because legacy bulk-import races could create multiple
  // requirements that share the same code — we still want the matrix to
  // show every requirement row independently).
  const auditingSourcesByReq = new Map<string, Set<string>>();
  // Rows are keyed by requirement ID (always unique). A separate
  // codeToReqIds index lets us broadcast a coverage entry to every
  // requirement that shares the same code, so duplicate-code projects
  // still render every requirement instead of collapsing to one row.
  const rows: Map<string, RequirementRow> = new Map();
  const codeToReqIds: Map<string, string[]> = new Map();
  for (const r of allReqs) {
    rows.set(r.id, {
      requirementId: r.id,
      requirementCode: r.code,
      requirementTitle: r.title,
      type: r.type,
      status: r.status,
      priority: r.priority,
      stages: {
        architecture: { best: "unaudited", perSource: [] },
        design: { best: "unaudited", perSource: [] },
        implementation: { best: "unaudited", perSource: [] },
        testing: { best: "unaudited", perSource: [] },
        deployment: { best: "unaudited", perSource: [] },
      },
      recommendations: [],
      auditedBySources: 0,
    });
    const existing = codeToReqIds.get(r.code);
    if (existing) existing.push(r.id);
    else codeToReqIds.set(r.code, [r.id]);
  }

  // Sources block (latest-per-source metadata)
  const sourcesUsed = runs.map((r) => ({
    sourceId: r.sourceId,
    sourceLabel: r.sourceLabel ?? "(unknown source)",
    runAt: r.createdAt.toISOString(),
    overallVerdict:
      (r.result as any)?.overallVerdict ?? null,
    completenessPercentage:
      typeof (r.result as any)?.completenessPercentage === "number"
        ? (r.result as any).completenessPercentage
        : null,
  }));

  for (const run of runs) {
    const payload = run.result as any;
    const sourceLabel = run.sourceLabel ?? "(unknown source)";
    const sourceId = run.sourceId ?? "__no_source__";
    const coverage: any[] = Array.isArray(payload?.requirementCoverage) ? payload.requirementCoverage : [];
    for (const rc of coverage) {
      const code = typeof rc?.requirementCode === "string" ? rc.requirementCode : null;
      if (!code) continue;
      const reqIds = codeToReqIds.get(code);
      if (!reqIds || reqIds.length === 0) continue; // requirement was deleted after the audit
      // Pre-compute the per-stage values once per coverage entry, then fan
      // out to every requirement sharing this code (handles legacy
      // duplicate-code projects without inflating credit cost).
      const stageVals = STAGE_KEYS.map((stage) => {
        const stageVal = rc?.[stage];
        const status: "covered" | "partial" | "missing" =
          stageVal?.status === "covered" || stageVal?.status === "partial" || stageVal?.status === "missing"
            ? stageVal.status
            : "missing";
        const artifacts = Array.isArray(stageVal?.artifacts)
          ? stageVal.artifacts.filter((x: any) => typeof x === "string")
          : [];
        const note = typeof stageVal?.note === "string" ? stageVal.note : "";
        return { stage, status, artifacts, note };
      });
      const recommendation =
        typeof rc?.recommendation === "string" && rc.recommendation.trim() ? rc.recommendation : null;
      for (const reqId of reqIds) {
        const row = rows.get(reqId);
        if (!row) continue;
        let srcSet = auditingSourcesByReq.get(reqId);
        if (!srcSet) {
          srcSet = new Set<string>();
          auditingSourcesByReq.set(reqId, srcSet);
        }
        srcSet.add(sourceId);
        for (const sv of stageVals) {
          row.stages[sv.stage].perSource.push({
            sourceId,
            sourceLabel,
            status: sv.status,
            artifacts: sv.artifacts,
            note: sv.note,
          });
          if (RANK[sv.status] > RANK[row.stages[sv.stage].best]) {
            row.stages[sv.stage].best = sv.status;
          }
        }
        if (recommendation) {
          row.recommendations.push({ sourceLabel, text: recommendation });
        }
      }
    }
  }

  // Compute KPIs based on the BEST cell per requirement-stage across sources.
  function score(s: CellStatus): number {
    if (s === "covered") return 1;
    if (s === "partial") return 0.5;
    return 0; // missing or unaudited
  }
  const stageTotals: Record<StageKey, { score: number; missing: number; partial: number; covered: number; unaudited: number }> = {
    architecture: { score: 0, missing: 0, partial: 0, covered: 0, unaudited: 0 },
    design: { score: 0, missing: 0, partial: 0, covered: 0, unaudited: 0 },
    implementation: { score: 0, missing: 0, partial: 0, covered: 0, unaudited: 0 },
    testing: { score: 0, missing: 0, partial: 0, covered: 0, unaudited: 0 },
    deployment: { score: 0, missing: 0, partial: 0, covered: 0, unaudited: 0 },
  };
  let perReqScoreSum = 0;
  let requirementsWithGaps = 0;
  let requirementsFullyCovered = 0;
  const requirementRows = Array.from(rows.values());
  // Backfill the deduplicated audited-source count.
  for (const row of requirementRows) {
    row.auditedBySources = auditingSourcesByReq.get(row.requirementId)?.size ?? 0;
  }
  for (const row of requirementRows) {
    let rowScore = 0;
    let hasGap = false;
    let allCovered = true;
    for (const stage of STAGE_KEYS) {
      const best = row.stages[stage].best;
      stageTotals[stage][best as keyof typeof stageTotals[StageKey]]++;
      stageTotals[stage].score += score(best);
      rowScore += score(best);
      if (best !== "covered") allCovered = false;
      if (best === "missing" || best === "unaudited") hasGap = true;
    }
    perReqScoreSum += rowScore / STAGE_KEYS.length;
    if (hasGap) requirementsWithGaps++;
    if (allCovered) requirementsFullyCovered++;
  }
  const totalReqs = requirementRows.length;
  const completenessPercentage = totalReqs > 0 ? Math.round((perReqScoreSum / totalReqs) * 100) : 0;
  const stagePercentages: Record<StageKey, number> = {
    architecture: totalReqs ? Math.round((stageTotals.architecture.score / totalReqs) * 100) : 0,
    design: totalReqs ? Math.round((stageTotals.design.score / totalReqs) * 100) : 0,
    implementation: totalReqs ? Math.round((stageTotals.implementation.score / totalReqs) * 100) : 0,
    testing: totalReqs ? Math.round((stageTotals.testing.score / totalReqs) * 100) : 0,
    deployment: totalReqs ? Math.round((stageTotals.deployment.score / totalReqs) * 100) : 0,
  };

  // Sort requirements: gaps first, then partials, then fully covered. Within
  // each bucket, by code ASC for stable display.
  function bucket(row: RequirementRow): number {
    let hasMissing = false;
    let hasPartialOrUnaudited = false;
    let allCovered = true;
    for (const s of STAGE_KEYS) {
      const b = row.stages[s].best;
      if (b !== "covered") allCovered = false;
      if (b === "missing") hasMissing = true;
      if (b === "partial" || b === "unaudited") hasPartialOrUnaudited = true;
    }
    if (allCovered) return 2;
    if (hasMissing) return 0;
    if (hasPartialOrUnaudited) return 1;
    return 1;
  }
  requirementRows.sort((a, b) => {
    const d = bucket(a) - bucket(b);
    if (d !== 0) return d;
    return a.requirementCode.localeCompare(b.requirementCode);
  });

  // Identify the weakest stage for the headline.
  let weakestStage: StageKey | null = null;
  for (const s of STAGE_KEYS) {
    if (weakestStage === null || stagePercentages[s] < stagePercentages[weakestStage]) {
      weakestStage = s;
    }
  }

  res.json({
    project: { id: project.id, name: project.name, slug: project.slug ?? null },
    completenessPercentage,
    stagePercentages,
    stageBreakdown: stageTotals,
    weakestStage,
    requirementsTotal: totalReqs,
    requirementsAudited: requirementRows.filter((r) => r.auditedBySources > 0).length,
    requirementsWithGaps,
    requirementsFullyCovered,
    sourcesUsed,
    requirements: requirementRows,
    hasAnyRun: runs.length > 0,
  });
}));

// =============================================================
// AI: Legacy Code Extractor — pull implicit requirements
// =============================================================
router.post("/ai/legacy-extract", consumeCredit(), aiHandler(async (req, res) => {
  const body = {
    legacySystemId: requireString(req.body?.legacySystemId, "legacySystemId", { min: 1 }),
    code: requireString(req.body?.code, "code", { min: 20, max: 40000 }),
    projectId: optionalString(req.body?.projectId),
  };
  if (body.projectId) {
    const access = await assertProjectAccessIfAuthed(req, res, body.projectId, "developer");
    if (access === false) return;
  }
  const [system] = await db
    .select()
    .from(legacySystemsTable)
    .where(eq(legacySystemsTable.id, body.legacySystemId));
  if (!system) {
    res.status(404).json({ error: "Legacy system not found" });
    return;
  }

  // Static analysis pre-processor — extract structural skeleton (functions,
  // classes, paragraphs, call graph, imports, complexity hints, candidate
  // business rules) before sending anything to the LLM. Lets the model focus
  // on the structured summary + selected high-complexity excerpts instead of
  // re-deriving program structure from raw text on every call.
  // analyzeCodeBest tries tree-sitter AST first (Java/C/C++/C#/Python/JS/TS/
  // Go/Rust/Ruby/PHP/Kotlin/Scala/Swift/Solidity/Lua and 20+ more) and falls
  // back to the regex analyzer for mainframe languages (COBOL/JCL/RPG/ABAP/
  // PL-I/Fortran) where column-rigid syntax makes regex the standard tool.
  const analysis = await analyzeCodeBest(body.code, system.language);
  const analysisBlock = formatAnalysisForPrompt(analysis);

  const sysPrompt = `You are Auditee's legacy modernization analyst. You are given (1) a deterministic static-analysis summary of the legacy code and (2) the raw source. Use the static analysis as ground truth for structure and call-graph; use the raw code for behaviour. Extract the implicit business and functional requirements the code encodes, and surface hidden risks (compliance gaps, brittle patterns, hard-coded rules).
Return strict JSON:
{"summary":string,"requirements":[{"title":string,"description":string,"type":"BRD"|"PRD"|"FRD"|"NFR","priority":"low"|"medium"|"high"|"critical","tags":string[]}],"risks":[{"severity":"low"|"medium"|"high","title":string,"detail":string}],"modernizationNotes":string}
Rules:
- 3-8 requirements, each grounded in a specific symbol, paragraph, call edge, or business-rule line from the static analysis.
- 1-5 risks, each clearly tied to something in the code or static analysis.
- Cite the relevant symbol/line in the requirement.description when possible (e.g. "L142 PERFORM CALC-INTEREST").
- Output JSON only.`;

  const userPrompt = `Legacy system: ${system.name} (${system.language})\nDescription: ${system.description ?? ""}\n\n${analysisBlock}\n\n## Raw source\n\`\`\`${system.language.toLowerCase()}\n${body.code}\n\`\`\``;

  type LegacyResult = {
    summary: string;
    requirements: Array<{
      title: string;
      description: string;
      type: "BRD" | "PRD" | "FRD" | "NFR";
      priority: "low" | "medium" | "high" | "critical";
      tags?: string[];
    }>;
    risks: Array<{ severity: "low" | "medium" | "high"; title: string; detail: string }>;
    modernizationNotes: string;
  };
  const result = await jsonCompletion<LegacyResult>(sysPrompt, userPrompt);

  // Optionally persist requirements to a real project
  let createdRequirements: Array<typeof requirementsTable.$inferSelect> = [];
  let skippedDuplicates: Array<{ title: string; duplicateOfCode: string; reason: string }> = [];
  if (body.projectId) {
    const [project] = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, body.projectId));
    if (project) {
      const dedupIndex = await loadProjectDedupIndex(body.projectId);
      for (const r of result.requirements) {
        const dup = findDuplicate({ title: r.title, description: r.description }, dedupIndex);
        if (dup) {
          skippedDuplicates.push({
            title: r.title.slice(0, 200),
            duplicateOfCode: dup.duplicateOfCode,
            reason: dup.reason,
          });
          continue;
        }
        const code = await nextRequirementCode(body.projectId);
        const [row] = await db
          .insert(requirementsTable)
          .values({
            id: randomUUID(),
            projectId: body.projectId,
            code,
            title: r.title.slice(0, 200),
            description: r.description,
            type: r.type,
            status: "draft",
            priority: r.priority,
            owner: "Auditee (legacy)",
            tags: [...(r.tags ?? []), "legacy", system.name],
            linkedFrameworks: [],
          })
          .returning();
        createdRequirements.push(row);
        indexNewRow(dedupIndex, { id: row.id, code: row.code, title: row.title, description: row.description });
      }
    }
  }

  // Update legacy system metadata
  await db
    .update(legacySystemsTable)
    .set({
      requirementsExtracted: system.requirementsExtracted + result.requirements.length,
      modernizationStatus:
        system.modernizationStatus === "assessment" ? "scoping" : system.modernizationStatus,
    })
    .where(eq(legacySystemsTable.id, system.id));

  await logActivity(
    "code",
    `Auditee extracted ${result.requirements.length} requirements from ${system.name}`,
    "Auditee",
    system.name,
  );

  res.json({
    legacySystemId: system.id,
    ...result,
    createdRequirementCount: createdRequirements.length,
  });
}));

// =============================================================
// AI: Ask Auditee — natural language Q&A across project data
// =============================================================
router.post("/ai/ask", consumeCredit(), aiHandler(async (req, res) => {
  const body = {
    question: requireString(req.body?.question, "question", { min: 3, max: 2000 }),
    projectId: optionalString(req.body?.projectId),
  };
  if (body.projectId) {
    // Reading the project Q&A requires real access (auditor+). Anonymous
    // callers cannot pass a projectId — they are restricted to the
    // unscoped catalog-only fallback below.
    const access = await requireProjectAccessInline(req, res, body.projectId, "auditor");
    if (access === false) return;
  }

  // For project-scoped questions, only feed the model data from that
  // project. For unscoped (anon trial / catalog) questions, do not leak
  // requirement rows — only return public catalog metadata (frameworks,
  // controls, legacy systems summaries).
  const projects = body.projectId
    ? await db.select().from(projectsTable).where(eq(projectsTable.id, body.projectId))
    : [];
  const requirements = body.projectId
    ? await db
        .select()
        .from(requirementsTable)
        .where(eq(requirementsTable.projectId, body.projectId))
    : [];
  const frameworks = await db.select().from(complianceFrameworksTable);
  const controls = await db.select().from(complianceControlsTable);
  const legacy = await db.select().from(legacySystemsTable);

  const context = {
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      owner: p.owner,
      complianceScore: p.complianceScore,
      description: p.description,
    })),
    requirements: requirements.map((r) => ({
      code: r.code,
      title: r.title,
      type: r.type,
      status: r.status,
      priority: r.priority,
      owner: r.owner,
    })),
    frameworks: frameworks.map((f) => ({
      code: f.code,
      name: f.name,
      status: f.status,
      score: f.score,
      controlsTotal: f.controlsTotal,
    })),
    controls: controls.map((c) => ({
      code: c.code,
      title: c.title,
      status: c.status,
      owner: c.owner,
    })),
    legacySystems: legacy.map((l) => ({
      name: l.name,
      language: l.language,
      riskScore: l.riskScore,
      modernizationStatus: l.modernizationStatus,
      requirementsExtracted: l.requirementsExtracted,
    })),
  };

  // RAG: pull the top-K most semantically relevant document chunks for the
  // question from the project's source corpus (pgvector cosine similarity).
  // Falls back to empty string if RAG is unavailable or the project has no
  // indexed chunks yet — the structured context above is still passed.
  let ragBlock = "";
  if (body.projectId) {
    try {
      const chunks = await retrieveChunks(body.projectId, body.question, 8);
      ragBlock = formatChunksAsContext(chunks, 10000);
    } catch {
      ragBlock = "";
    }
  }

  const sysPrompt = `You are Auditee, an AI-native PDLC platform assistant. Answer questions using ONLY the structured project context AND the retrieved source excerpts provided. Cite specific requirement codes (e.g., HEL-0001), framework codes, system names, or source paths when relevant.
Return strict JSON:
{"answer":string,"citations":string[],"confidence":"low"|"medium"|"high"}
- answer: clear, concise (<=200 words), markdown allowed.
- citations: identifiers you referenced (codes/names/source paths).
- If neither context nor source excerpts contain enough information, say so honestly with confidence "low".`;

  const userPrompt = [
    `Question: ${body.question}`,
    ``,
    `Structured context:`,
    JSON.stringify(context).slice(0, 16000),
    ragBlock ? `\nRetrieved source excerpts (top-K by semantic relevance):\n${ragBlock}` : "",
  ].join("\n");

  type AskResult = { answer: string; citations: string[]; confidence: "low" | "medium" | "high" };
  const result = await jsonCompletion<AskResult>(sysPrompt, userPrompt);

  const [saved] = await db
    .insert(aiConversationsTable)
    .values({
      id: randomUUID(),
      projectId: body.projectId ?? null,
      question: body.question,
      answer: result.answer ?? "",
      confidence: result.confidence ?? "medium",
      citations: Array.isArray(result.citations) ? result.citations : [],
    })
    .returning();

  res.json({ ...result, id: saved.id, createdAt: saved.createdAt });
}));

router.get("/ai/ask/history", aiHandler(async (req, res) => {
  const projectId = optionalString(req.query.projectId);
  if (!projectId) {
    res.status(400).json({ error: "projectId is required" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, projectId, "auditor");
  if (access === false) return;
  const limitRaw = Number(req.query.limit ?? 50);
  const limit = Math.max(1, Math.min(200, Number.isFinite(limitRaw) ? limitRaw : 50));
  const rows = await db
    .select()
    .from(aiConversationsTable)
    .where(eq(aiConversationsTable.projectId, projectId))
    .orderBy(desc(aiConversationsTable.createdAt))
    .limit(limit);
  res.json({ conversations: rows });
}));

router.delete("/ai/ask/history/:id", aiHandler(async (req, res) => {
  const id = requireString(req.params.id, "id", { min: 1 });
  const [target] = await db
    .select({ projectId: aiConversationsTable.projectId })
    .from(aiConversationsTable)
    .where(eq(aiConversationsTable.id, id))
    .limit(1);
  if (!target) {
    res.json({ ok: true });
    return;
  }
  if (target.projectId) {
    // Authors of a Q&A live inside a project — only project members
    // (developer+) can prune that history.
    const access = await requireProjectAccessInline(req, res, target.projectId, "developer");
    if (access === false) return;
  } else {
    // Legacy unscoped conversations cannot be deleted via this endpoint.
    res.status(403).json({ error: "Conversation is not project-scoped and cannot be deleted via this endpoint" });
    return;
  }
  await db.delete(aiConversationsTable).where(eq(aiConversationsTable.id, id));
  res.json({ ok: true });
}));

// =============================================================
// AI: Gap Analysis (Missing Requirements Analysis)
// Analyses an entire project's requirements set against industry
// best practices, security, and the chosen compliance framework
// (if any) and returns a structured set of findings:
//   - missing requirements (categorised)
//   - duplicates between existing requirements
//   - conflicts (requirements that contradict each other)
//   - improvement recommendations
// =============================================================
router.post("/ai/gap-analysis", consumeCredit(), aiHandler(async (req, res) => {
  const projectId = requireString(req.body?.projectId, "projectId", { min: 1 });
  const frameworkId = optionalString(req.body?.frameworkId);

  // Gap analysis reads every requirement in the project — guard with
  // strict auditor+ access so anon/cross-workspace callers can't enumerate.
  {
    const access = await requireProjectAccessInline(req, res, projectId, "auditor");
    if (access === false) return;
  }

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const reqs = await db
    .select({
      code: requirementsTable.code,
      title: requirementsTable.title,
      description: requirementsTable.description,
      type: requirementsTable.type,
      priority: requirementsTable.priority,
    })
    .from(requirementsTable)
    .where(eq(requirementsTable.projectId, projectId));

  if (reqs.length === 0) {
    res.status(422).json({ error: "Project has no requirements yet — generate or import requirements first." });
    return;
  }

  let frameworkContext = "";
  let frameworkLabel = "general industry best practices";
  if (frameworkId) {
    const [fw] = await db
      .select()
      .from(complianceFrameworksTable)
      .where(eq(complianceFrameworksTable.id, frameworkId));
    if (fw) {
      const controls = await db
        .select({
          code: complianceControlsTable.code,
          title: complianceControlsTable.title,
          description: complianceControlsTable.description,
        })
        .from(complianceControlsTable)
        .where(eq(complianceControlsTable.frameworkId, frameworkId));
      frameworkLabel = `${fw.code} — ${fw.name}`;
      const controlList = controls
        .slice(0, 60)
        .map((c) => `- ${c.code}: ${c.title}`)
        .join("\n");
      frameworkContext = `\n\nThe project must satisfy this compliance framework:\n${frameworkLabel}\nKey controls:\n${controlList || "(no controls registered)"}`;
    }
  }

  const reqList = reqs
    .map((r) => `- ${r.code} [${r.type}/${r.priority}] ${r.title}${r.description ? ` — ${r.description.slice(0, 220)}` : ""}`)
    .join("\n");

  const system = `You are Auditee, a senior enterprise requirements analyst with 20+ years of domain expertise across regulated industries (healthcare, finance, life sciences, manufacturing).

Your job is to perform a rigorous Missing Requirements Analysis on the project's existing requirements set. You must identify:
  1. Critical requirements that are MISSING (especially security, error-handling, accessibility, regulatory, observability, data-retention, edge-cases).
  2. DUPLICATES — requirements that overlap so much they should be merged.
  3. CONFLICTS — requirements that contradict each other or are mutually exclusive.
  4. RECOMMENDATIONS — meaningful improvements to existing requirements.

Return STRICT JSON of shape:
{
  "summary": string,
  "missing": [{"category": "security"|"compliance"|"accessibility"|"performance"|"error_handling"|"observability"|"data"|"ux"|"other", "title": string, "description": string, "rationale": string, "severity": "low"|"medium"|"high"|"critical", "suggestedType": "BRD"|"PRD"|"FRD"|"NFR", "suggestedPriority": "low"|"medium"|"high"|"critical"}],
  "duplicates": [{"requirementCodes": string[], "rationale": string}],
  "conflicts": [{"requirementCodes": string[], "rationale": string, "severity": "low"|"medium"|"high"|"critical"}],
  "recommendations": [{"requirementCode": string, "issue": string, "improvement": string}]
}

Rules:
- Be specific and actionable. Vague findings are worthless.
- requirementCodes in duplicates/conflicts/recommendations MUST reference codes from the supplied list.
- Aim for 4-12 missing items, but only include ones that are genuinely material to a production-quality system.
- summary is 1-2 sentences capturing the overall posture.
- Output JSON only, no commentary.`;

  const user = `Project: ${project.name}
Project context: ${project.description ?? "(none)"}
Reference standard: ${frameworkLabel}${frameworkContext}

Existing requirements (${reqs.length}):
${reqList}`;

  type GapResult = {
    summary: string;
    missing: Array<{
      category: string;
      title: string;
      description: string;
      rationale: string;
      severity: "low" | "medium" | "high" | "critical";
      suggestedType: "BRD" | "PRD" | "FRD" | "NFR";
      suggestedPriority: "low" | "medium" | "high" | "critical";
    }>;
    duplicates: Array<{ requirementCodes: string[]; rationale: string }>;
    conflicts: Array<{ requirementCodes: string[]; rationale: string; severity: string }>;
    recommendations: Array<{ requirementCode: string; issue: string; improvement: string }>;
  };

  const result = await jsonCompletion<GapResult>(system, user);

  await logActivity(
    "gap_analysis",
    `Gap analysis run on ${project.name} (${reqs.length} reqs, framework: ${frameworkLabel}) — ${result.missing?.length ?? 0} missing, ${result.duplicates?.length ?? 0} dupes, ${result.conflicts?.length ?? 0} conflicts`,
    "Auditee",
  );

  res.json({
    project: { id: project.id, name: project.name },
    framework: frameworkId ? frameworkLabel : null,
    requirementCount: reqs.length,
    summary: result.summary || "",
    missing: Array.isArray(result.missing) ? result.missing : [],
    duplicates: Array.isArray(result.duplicates) ? result.duplicates : [],
    conflicts: Array.isArray(result.conflicts) ? result.conflicts : [],
    recommendations: Array.isArray(result.recommendations) ? result.recommendations : [],
    runAt: new Date().toISOString(),
  });
}));

// =============================================================
// AI: Promote a gap-analysis "missing" finding into a real
// requirement. Accepts a single finding payload (the same shape
// the gap-analysis endpoint emits) and inserts it.
// =============================================================
router.post("/ai/gap-analysis/promote", aiHandler(async (req, res) => {
  const projectId = requireString(req.body?.projectId, "projectId", { min: 1 });
  {
    const access = await requireProjectAccessInline(req, res, projectId, "developer");
    if (access === false) return;
  }
  const title = requireString(req.body?.title, "title", { min: 4, max: 200 });
  const description = requireString(req.body?.description, "description", { min: 4, max: 4000 });
  const type = requireString(req.body?.type, "type", { min: 1 });
  const priority = requireString(req.body?.priority, "priority", { min: 1 });
  const category = optionalString(req.body?.category);

  if (!["BRD", "PRD", "FRD", "NFR"].includes(type)) {
    res.status(400).json({ error: "type must be BRD|PRD|FRD|NFR" });
    return;
  }
  if (!["low", "medium", "high", "critical"].includes(priority)) {
    res.status(400).json({ error: "priority must be low|medium|high|critical" });
    return;
  }

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  // Dedup: if this gap finding is effectively a paraphrase of an existing
  // requirement in the project, return that row instead of inserting a
  // duplicate. The downstream auto-close-compliance code below still runs
  // against the existing requirement, so the control still gets evidence
  // attached — we just stop multiplying near-identical requirement rows.
  const dedupIndex = await loadProjectDedupIndex(projectId);
  const dup = findDuplicate({ title, description }, dedupIndex);
  let row: typeof requirementsTable.$inferSelect;
  let alreadyExisted = false;
  if (dup) {
    const [existing] = await db
      .select()
      .from(requirementsTable)
      .where(eq(requirementsTable.id, dup.duplicateOfId));
    row = existing!;
    alreadyExisted = true;
  } else {
    const code = await nextRequirementCode(projectId);
    // Allowlist category — only the categories the gap-analysis prompt is permitted
    // to emit can become a tag, so we never accept arbitrary user-controlled strings
    // into the tags column.
    const ALLOWED_GAP_CATEGORIES = new Set([
      "security",
      "compliance",
      "accessibility",
      "performance",
      "error_handling",
      "observability",
      "data",
      "ux",
      "other",
    ]);
    const tags = ["gap-analysis"];
    if (category && ALLOWED_GAP_CATEGORIES.has(category)) tags.push(category);

    const [inserted] = await db
      .insert(requirementsTable)
      .values({
        id: randomUUID(),
        projectId,
        code,
        title,
        description,
        type: type as "BRD" | "PRD" | "FRD" | "NFR",
        status: "draft",
        priority: priority as "low" | "medium" | "high" | "critical",
        owner: "Auditee",
        tags,
        linkedFrameworks: [],
        externalSystem: "auditee_ai",
        externalId: code,
      })
      .returning();
    row = inserted!;
  }
  const code = row.code;

  await logActivity(
    "requirement",
    `${code} drafted by Auditee from gap analysis (${category ?? "general"})`,
    "Auditee",
    code,
  );

  // ---- Pack C — auto-close compliance ----
  // Optional: caller can supply controlId(s) and frameworkId so the new
  // requirement immediately becomes evidence for the control(s) that the
  // gap analysis determined it satisfies. We mark the control "Met
  // (AI-asserted)" pending human verify.
  const rawControlIds = Array.isArray(req.body?.controlIds)
    ? (req.body.controlIds as unknown[]).filter((x): x is string => typeof x === "string" && x.length > 0)
    : typeof req.body?.controlId === "string" && req.body.controlId.length > 0
      ? [req.body.controlId as string]
      : [];
  const linkedControlIds: string[] = [];
  if (rawControlIds.length > 0) {
    const ctrls = await db
      .select()
      .from(complianceControlsTable)
      .where(inArray(complianceControlsTable.id, rawControlIds.slice(0, 12)));
    for (const ctrl of ctrls) {
      await db.insert(complianceEvidenceTable).values({
        id: randomUUID(),
        projectId,
        controlId: ctrl.id,
        frameworkId: ctrl.frameworkId,
        kind: "requirement",
        refId: row.id,
        refLabel: `${code} — ${title.slice(0, 200)}`,
        source: "ai",
        status: "ai_asserted",
      });
      // Only auto-promote control to "met (ai_asserted)" when it isn't
      // already verified — never downgrade a human verdict.
      if (ctrl.assertion !== "verified") {
        await db
          .update(complianceControlsTable)
          .set({ status: "met", assertion: "ai_asserted" })
          .where(eq(complianceControlsTable.id, ctrl.id));
      }
      linkedControlIds.push(ctrl.id);
    }
    if (linkedControlIds.length > 0) {
      await logActivity(
        "compliance",
        `${code} auto-asserted as evidence for ${linkedControlIds.length} control(s) — pending verification`,
        "Auditee",
        code,
      );
    }
  }

  res.status(alreadyExisted ? 200 : 201).json({
    created: row,
    linkedControlIds,
    alreadyExisted,
    duplicateOfCode: alreadyExisted ? row.code : undefined,
  });
}));

// =============================================================
// AI: Generate Test Cases (legacy single-requirement) — kept for
// back-compat; thin wrapper that calls into the richer
// generate-test-suite engine with sensible defaults.
// =============================================================
router.post("/ai/generate-test-cases", consumeCredit(), aiHandler(async (req, res) => {
  const requirementId = requireString(req.body?.requirementId, "requirementId", { min: 1 });
  const [req_] = await db
    .select()
    .from(requirementsTable)
    .where(eq(requirementsTable.id, requirementId));
  if (!req_) {
    res.status(404).json({ error: "Requirement not found" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, req_.projectId, "developer");
  if (access === false) return;

  const inserted = await generateSuiteImpl({
    projectId: req_.projectId,
    sourceKind: "requirement",
    sourceIds: [req_.id],
    levels: ["unit", "system", "acceptance"],
    disciplines: ["functional", "negative", "uat"],
    paradigms: ["procedural"],
    includeStatic: false,
    includeDynamic: true,
    targetCount: 8,
  });

  res.status(201).json({ created: inserted, count: inserted.length });
}));

// =============================================================
// AI: Generate Test Suite — comprehensive, multi-source,
// multi-level, multi-discipline, multi-paradigm test generation.
//
// body: {
//   projectId: string,
//   sourceKind: "requirement"|"design"|"architecture"|"code"|"report"|"project",
//   sourceIds?: string[],          // ids of requirements / report rows
//   sourceFileIds?: string[],      // for "code" / "design" / "architecture"
//   levels: ("unit"|"integration"|"system"|"acceptance"|"operational")[],
//   disciplines: (string)[],       // see TC_DISCIPLINES
//   paradigms: (string)[],         // procedural | bdd | oo_state | functional_property | exploratory
//   includeStatic?: boolean,       // also generate inspection/review checklist items
//   includeDynamic?: boolean,
//   targetCount?: number,          // 4..40 — soft cap
// }
// =============================================================
router.post("/ai/generate-test-suite", consumeCredit(), aiHandler(async (req, res) => {
  const projectId = requireString(req.body?.projectId, "projectId", { min: 1 });
  const access = await requireProjectAccessInline(req, res, projectId, "developer");
  if (access === false) return;

  const sourceKind = String(req.body?.sourceKind ?? "requirement");
  if (!["requirement", "design", "architecture", "code", "report", "project"].includes(sourceKind)) {
    res.status(400).json({ error: "Invalid sourceKind" });
    return;
  }
  const sourceIds = Array.isArray(req.body?.sourceIds)
    ? req.body.sourceIds.filter((s: unknown): s is string => typeof s === "string").slice(0, 30)
    : [];
  const sourceFileIds = Array.isArray(req.body?.sourceFileIds)
    ? req.body.sourceFileIds.filter((s: unknown): s is string => typeof s === "string").slice(0, 30)
    : [];

  const levels = sanitizeStringArray(req.body?.levels, ["unit", "integration", "system", "acceptance", "operational"], ["system"]);
  const disciplines = sanitizeStringArray(
    req.body?.disciplines,
    ["functional", "negative", "regulatory", "performance", "security", "usability", "compatibility", "regression", "accessibility", "reliability", "uat"],
    ["functional"],
  );
  const paradigms = sanitizeStringArray(
    req.body?.paradigms,
    ["procedural", "bdd", "oo_state", "functional_property", "exploratory"],
    ["procedural"],
  );
  const includeStatic = req.body?.includeStatic !== false ? true : false; // default true
  const includeDynamic = req.body?.includeDynamic !== false ? true : false;
  if (!includeStatic && !includeDynamic) {
    res.status(400).json({
      error: "At least one of includeStatic or includeDynamic must be true.",
    });
    return;
  }
  const targetCount = Math.max(4, Math.min(40, Number(req.body?.targetCount) || 12));

  const inserted = await generateSuiteImpl({
    projectId,
    sourceKind,
    sourceIds,
    sourceFileIds,
    levels,
    disciplines,
    paradigms,
    includeStatic,
    includeDynamic,
    targetCount,
  });

  res.status(201).json({ created: inserted, count: inserted.length });
}));

function sanitizeStringArray(input: unknown, allowed: string[], fallback: string[]): string[] {
  if (!Array.isArray(input)) return fallback;
  const allow = new Set(allowed);
  const out = input.filter((v): v is string => typeof v === "string" && allow.has(v));
  return out.length > 0 ? Array.from(new Set(out)) : fallback;
}

async function generateSuiteImpl(opts: {
  projectId: string;
  sourceKind: string;
  sourceIds?: string[];
  sourceFileIds?: string[];
  levels: string[];
  disciplines: string[];
  paradigms: string[];
  includeStatic: boolean;
  includeDynamic: boolean;
  targetCount: number;
}): Promise<Array<typeof testCasesTable.$inferSelect>> {
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, opts.projectId));
  if (!project) throw new Error("Project not found");

  // Build context from chosen source(s).
  const ctxBlocks: string[] = [];
  const sourceRefs: Array<{ kind: string; id: string; label?: string }> = [];

  if (opts.sourceKind === "requirement" || opts.sourceKind === "project") {
    const reqRows = opts.sourceIds && opts.sourceIds.length > 0
      ? await db.select().from(requirementsTable).where(
          and(eq(requirementsTable.projectId, opts.projectId), inArray(requirementsTable.id, opts.sourceIds)),
        )
      : opts.sourceKind === "project"
        ? await db.select().from(requirementsTable).where(eq(requirementsTable.projectId, opts.projectId)).limit(40)
        : [];
    for (const r of reqRows) {
      ctxBlocks.push(
        `[REQUIREMENT ${r.code}] type=${r.type} priority=${r.priority}\nTitle: ${r.title}\n${(r.description ?? "").slice(0, 800)}`,
      );
      sourceRefs.push({ kind: "requirement", id: r.id, label: r.code });
    }
  }

  if (opts.sourceKind === "report" && opts.sourceIds && opts.sourceIds.length > 0) {
    const reports = await db
      .select()
      .from(aiReportsTable)
      .where(inArray(aiReportsTable.id, opts.sourceIds));
    for (const rpt of reports) {
      if (rpt.projectId !== opts.projectId) continue;
      const sectionText = (rpt.content?.sections ?? [])
        .map((s) => `## ${s.heading}\n${(s.body ?? "").slice(0, 1200)}`)
        .join("\n\n");
      ctxBlocks.push(
        `[${rpt.kind.toUpperCase()} ${rpt.title}]\nExec summary: ${(rpt.content?.executiveSummary ?? "").slice(0, 600)}\n${sectionText.slice(0, 4000)}`,
      );
      sourceRefs.push({ kind: "report", id: rpt.id, label: rpt.title.slice(0, 60) });
    }
  }

  if (opts.sourceKind === "design" || opts.sourceKind === "architecture") {
    // Pull recent reports of matching kind as the "documents" context.
    const targetKinds =
      opts.sourceKind === "design"
        ? ["hld", "lld", "design_spec", "feature_spec", "ux_spec"]
        : ["architecture_doc", "hld", "deployment_doc"];
    const docs = await db
      .select()
      .from(aiReportsTable)
      .where(and(eq(aiReportsTable.projectId, opts.projectId), inArray(aiReportsTable.kind, targetKinds)))
      .orderBy(desc(aiReportsTable.updatedAt))
      .limit(5);
    for (const rpt of docs) {
      const sectionText = (rpt.content?.sections ?? [])
        .map((s) => `## ${s.heading}\n${(s.body ?? "").slice(0, 1000)}`)
        .join("\n\n");
      ctxBlocks.push(`[${rpt.kind.toUpperCase()} ${rpt.title}]\n${sectionText.slice(0, 3500)}`);
      sourceRefs.push({ kind: opts.sourceKind, id: rpt.id, label: rpt.title.slice(0, 60) });
    }
  }

  if (opts.sourceKind === "code" || opts.sourceKind === "project") {
    // Sample text source files (small, code-like). For code-only mode use
    // the explicitly chosen sourceFileIds first — but ALWAYS scope to this
    // project so a developer cannot reference file ids from another project.
    let files: Array<typeof sourceFilesTable.$inferSelect> = [];
    const projectSources = await db
      .select({ id: projectSourcesTable.id })
      .from(projectSourcesTable)
      .where(eq(projectSourcesTable.projectId, opts.projectId));
    const sids = projectSources.map((s) => s.id);

    if (opts.sourceFileIds && opts.sourceFileIds.length > 0 && sids.length > 0) {
      files = await db
        .select()
        .from(sourceFilesTable)
        .where(
          and(
            inArray(sourceFilesTable.id, opts.sourceFileIds),
            inArray(sourceFilesTable.sourceId, sids), // <-- project scoping (IDOR fix)
          ),
        )
        .limit(20);
    } else if ((opts.sourceKind === "code" || opts.sourceKind === "project") && sids.length > 0) {
      files = await db
        .select()
        .from(sourceFilesTable)
        .where(and(inArray(sourceFilesTable.sourceId, sids), eq(sourceFilesTable.isBinary, "false")))
        .limit(15);
    }
    for (const f of files) {
      const ext = f.path.split(".").pop()?.toLowerCase() ?? "";
      const isCode = ["ts", "tsx", "js", "jsx", "py", "java", "go", "rs", "c", "cpp", "h", "rb", "cs", "kt", "swift"].includes(ext);
      if (!isCode && opts.sourceKind === "code") continue;
      const snippet = (f.content ?? "").slice(0, 1500);
      if (!snippet.trim()) continue;
      ctxBlocks.push(`[CODE ${f.path}] (${f.language ?? ext})\n${snippet}`);
      sourceRefs.push({ kind: "code", id: f.id, label: f.path });
    }
  }

  if (ctxBlocks.length === 0) {
    throw new Error(
      `No source material found for ${opts.sourceKind}. Make sure your project has the relevant artefacts ingested.`,
    );
  }

  const sysPrompt = `You are Auditee's Senior QA architect, fluent in IEEE 829, ISO/IEC/IEEE 29119, ISTQB v4 syllabus, and BDD/OO/functional test design.

Generate a comprehensive test suite spanning the requested LEVELS, DISCIPLINES, and PARADIGMS for the supplied project material.

Return STRICT JSON of shape:
{
  "testCases": [{
    "title": string,
    "level": "unit"|"integration"|"system"|"acceptance"|"operational",
    "discipline": "functional"|"negative"|"regulatory"|"performance"|"security"|"usability"|"compatibility"|"regression"|"accessibility"|"reliability"|"uat",
    "paradigm": "procedural"|"bdd"|"oo_state"|"functional_property"|"exploratory",
    "mode": "static"|"dynamic",
    "priority": "low"|"medium"|"high"|"critical",
    "preconditions": string,
    "steps": string[],
    "expected": string,
    "gherkin": string,                 // OPTIONAL — only for paradigm=bdd, must be a Given/When/Then block
    "sourceRefLabel": string,          // OPTIONAL — short label of which source it tests (e.g. "REQ-007" or "src/auth.ts")
    "tags": string[]                   // OPTIONAL — short kebab-case tags
  }]
}

Hard rules:
- Cover EVERY requested level/discipline/paradigm at least once where the source material allows; bias quantity toward the requested target count (~${opts.targetCount}).
- Static cases (when requested) are review/inspection/walkthrough checklists targeting documents; dynamic cases describe runtime verification.
- BDD paradigm cases MUST include a "gherkin" block with ≥3 Given/When/Then lines.
- OO state cases MUST include explicit state transitions in steps (e.g. "From state=IDLE → trigger LOGIN → expect state=AUTHENTICATED").
- Functional/property cases MUST describe an invariant + an oracle ("for any input X, property P must hold; oracle: …").
- Performance/security/regulatory cases MUST cite the standard or threshold (e.g. "p95 latency < 250ms", "OWASP A01", "GDPR Art.17").
- title ≤140 chars, action-first.
- steps: 2-8 imperative steps, each ≤220 chars. preconditions ≤300 chars. expected ≤400 chars.
- Output JSON only, no commentary.`;

  const userPrompt = `Project: ${project.name}

Requested LEVELS: ${opts.levels.join(", ")}
Requested DISCIPLINES: ${opts.disciplines.join(", ")}
Requested PARADIGMS: ${opts.paradigms.join(", ")}
Include STATIC: ${opts.includeStatic ? "yes" : "no"}
Include DYNAMIC: ${opts.includeDynamic ? "yes" : "no"}
Target count: ${opts.targetCount}
Source kind: ${opts.sourceKind}

=== SOURCE MATERIAL ===
${ctxBlocks.join("\n\n---\n\n").slice(0, 18000)}`;

  type GenResult = {
    testCases?: Array<{
      title: string;
      level?: string;
      discipline?: string;
      paradigm?: string;
      mode?: string;
      priority?: string;
      preconditions?: string;
      steps?: string[];
      expected?: string;
      gherkin?: string;
      sourceRefLabel?: string;
      tags?: string[];
    }>;
  };
  const result = await jsonCompletion<GenResult>(sysPrompt, userPrompt, { maxTokens: 8000 });
  const cases = Array.isArray(result.testCases) ? result.testCases.slice(0, opts.targetCount + 6) : [];

  const VALID_LEVELS = new Set(["unit", "integration", "system", "acceptance", "operational"]);
  const VALID_DISC = new Set(["functional", "negative", "regulatory", "performance", "security", "usability", "compatibility", "regression", "accessibility", "reliability", "uat"]);
  const VALID_PARA = new Set(["procedural", "bdd", "oo_state", "functional_property", "exploratory"]);
  const VALID_MODE = new Set(["static", "dynamic"]);
  const VALID_PRIORITY = new Set(["low", "medium", "high", "critical"]);

  const reqIdsByCode = new Map<string, string>();
  if (sourceRefs.some((r) => r.kind === "requirement")) {
    for (const r of sourceRefs.filter((s) => s.kind === "requirement")) {
      if (r.label) reqIdsByCode.set(r.label, r.id);
    }
  }

  // Build the request-allow-lists so we can enforce that the AI did not
  // produce levels/disciplines/paradigms/modes outside what was requested.
  const allowedLevels = new Set(opts.levels);
  const allowedDisciplines = new Set(opts.disciplines);
  const allowedParadigms = new Set(opts.paradigms);
  const allowedModes = new Set<string>([
    ...(opts.includeStatic ? ["static"] : []),
    ...(opts.includeDynamic ? ["dynamic"] : []),
  ]);

  const inserted: Array<typeof testCasesTable.$inferSelect> = [];
  const skipped: { reason: string; title: string }[] = [];
  for (const tc of cases) {
    if (typeof tc?.title !== "string" || tc.title.trim().length < 3) continue;

    // Snap the AI's value to a requested one when it strayed outside the
    // user's selection — keeps the suite within the requested envelope.
    let level = VALID_LEVELS.has(tc.level ?? "") ? (tc.level as string) : "system";
    if (!allowedLevels.has(level)) level = opts.levels[0]!;
    let discipline = VALID_DISC.has(tc.discipline ?? "") ? (tc.discipline as string) : "functional";
    if (!allowedDisciplines.has(discipline)) discipline = opts.disciplines[0]!;
    let paradigm = VALID_PARA.has(tc.paradigm ?? "") ? (tc.paradigm as string) : "procedural";
    if (!allowedParadigms.has(paradigm)) paradigm = opts.paradigms[0]!;
    let mode = VALID_MODE.has(tc.mode ?? "") ? (tc.mode as string) : "dynamic";
    if (!allowedModes.has(mode)) {
      // If the AI produced a mode the caller didn't ask for, skip the case
      // rather than silently flipping it (mode materially changes meaning).
      skipped.push({ reason: `mode=${mode} not requested`, title: tc.title });
      continue;
    }
    const priority = VALID_PRIORITY.has(tc.priority ?? "") ? (tc.priority as string) : "medium";

    // Map legacy "type" for back-compat consumers.
    const legacyType =
      discipline === "negative" ? "negative"
      : discipline === "uat" || discipline === "usability" ? "acceptance"
      : ["performance", "security", "reliability", "compatibility", "accessibility", "regulatory"].includes(discipline) ? "non_functional"
      : "functional";

    // Resolve specific requirement link if the AI labelled it with a known code.
    let linkedReqId: string | null = null;
    if (tc.sourceRefLabel && reqIdsByCode.has(tc.sourceRefLabel)) {
      linkedReqId = reqIdsByCode.get(tc.sourceRefLabel) ?? null;
    } else if (opts.sourceKind === "requirement" && opts.sourceIds && opts.sourceIds.length === 1) {
      linkedReqId = opts.sourceIds[0]!;
    }

    const refsForRow: Array<{ kind: string; id: string; label?: string }> = linkedReqId
      ? [{ kind: "requirement", id: linkedReqId, label: tc.sourceRefLabel }]
      : sourceRefs.slice(0, 5);

    const row = await db
      .insert(testCasesTable)
      .values({
        id: randomUUID(),
        projectId: opts.projectId,
        requirementId: linkedReqId,
        title: String(tc.title).slice(0, 240),
        type: legacyType,
        level,
        discipline,
        paradigm,
        mode,
        sourceKind: opts.sourceKind,
        sourceRefs: refsForRow,
        priority,
        preconditions: typeof tc.preconditions === "string" ? tc.preconditions.slice(0, 800) : "",
        steps: Array.isArray(tc.steps)
          ? tc.steps.filter((s): s is string => typeof s === "string").map((s) => s.slice(0, 600)).slice(0, 12)
          : [],
        expected: typeof tc.expected === "string" ? tc.expected.slice(0, 2000) : "",
        gherkin: typeof tc.gherkin === "string" && tc.gherkin.trim().length > 0 ? tc.gherkin.slice(0, 2000) : null,
        status: "draft",
        tags: Array.from(new Set([
          "ai-generated",
          ...(Array.isArray(tc.tags) ? tc.tags.filter((t): t is string => typeof t === "string").slice(0, 5) : []),
        ])),
        createdBy: "Auditee",
      })
      .returning();
    inserted.push(row[0]);
  }

  // Coverage check: did we produce at least one case for every requested
  // level / discipline / paradigm? Surface the gaps in the activity log so
  // admins can decide whether to re-run; we deliberately do NOT throw — a
  // partial suite is still useful.
  const seenLevels = new Set(inserted.map((r) => r.level));
  const seenDisciplines = new Set(inserted.map((r) => r.discipline));
  const seenParadigms = new Set(inserted.map((r) => r.paradigm));
  const missingLevels = opts.levels.filter((l) => !seenLevels.has(l));
  const missingDisciplines = opts.disciplines.filter((d) => !seenDisciplines.has(d));
  const missingParadigms = opts.paradigms.filter((p) => !seenParadigms.has(p));
  const gapNote = [
    missingLevels.length ? `missing levels: ${missingLevels.join(",")}` : "",
    missingDisciplines.length ? `missing disciplines: ${missingDisciplines.join(",")}` : "",
    missingParadigms.length ? `missing paradigms: ${missingParadigms.join(",")}` : "",
    skipped.length ? `skipped ${skipped.length} (mode mismatch)` : "",
  ].filter(Boolean).join("; ");

  await logActivity(
    "test_case",
    `Generated ${inserted.length} test case(s) (${opts.sourceKind}, ${opts.levels.join("/")}, ${opts.paradigms.join("/")})${gapNote ? ` — ${gapNote}` : ""}`,
    "Auditee",
  );

  return inserted;
}

// =============================================================
// AI: Run Test Suite — for a chosen set of test-case ids the AI
// reviews each case against the project's source material and
// produces a per-case verdict + reasoning. Persists an
// ai_reports row of kind="test_execution_report" and updates each
// test case's lastRunVerdict / status / lastRunNote.
//
// body: { projectId: string, testCaseIds?: string[] }
//   if testCaseIds omitted → runs the most recently updated 40
//   cases for the project.
//
// Status mapping policy:
//   pass         → status="passing"
//   fail         → status="failing"
//   inconclusive → status preserved (don't downgrade decisive prior
//                  results); only set to "blocked" if previously "draft".
// =============================================================
router.post("/ai/run-test-suite", consumeCredit(), aiHandler(async (req, res) => {
  const projectId = requireString(req.body?.projectId, "projectId", { min: 1 });
  const access = await requireProjectAccessInline(req, res, projectId, "developer");
  if (access === false) return;

  const ids: string[] | undefined = Array.isArray(req.body?.testCaseIds)
    ? req.body.testCaseIds.filter((s: unknown): s is string => typeof s === "string").slice(0, 60)
    : undefined;

  const cases = ids && ids.length > 0
    ? await db.select().from(testCasesTable).where(
        and(eq(testCasesTable.projectId, projectId), inArray(testCasesTable.id, ids)),
      )
    : await db.select().from(testCasesTable).where(eq(testCasesTable.projectId, projectId)).limit(40);

  if (cases.length === 0) {
    res.status(400).json({ error: "No test cases to run" });
    return;
  }

  // Pull a small repo context for the executor.
  const projectSources = await db
    .select({ id: projectSourcesTable.id })
    .from(projectSourcesTable)
    .where(eq(projectSourcesTable.projectId, projectId));
  const sids = projectSources.map((s) => s.id);
  let codeFiles: Array<{ path: string; content: string | null }> = [];
  if (sids.length > 0) {
    codeFiles = (await db
      .select({ path: sourceFilesTable.path, content: sourceFilesTable.content })
      .from(sourceFilesTable)
      .where(and(inArray(sourceFilesTable.sourceId, sids), eq(sourceFilesTable.isBinary, "false")))
      .limit(40)
    ).map((f) => ({ path: f.path, content: f.content }));
  }

  const repoSummary = codeFiles.length === 0
    ? "(no ingested source files)"
    : codeFiles
        .map((f) => `### ${f.path}\n${(f.content ?? "").slice(0, 800)}`)
        .join("\n\n")
        .slice(0, 14000);

  const sysPrompt = `You are Auditee's AI test executor.

For EACH supplied test case, decide a verdict by reviewing the project's source material:
- "pass"   — the artefact (code/design/req) clearly satisfies the test case's expected outcome
- "fail"   — there is concrete evidence the artefact violates the expectation
- "inconclusive" — insufficient evidence in the supplied material

You must also produce:
- "evidence": short citation (file path, requirement code, or report section) supporting the verdict
- "reasoning": 1-3 sentence justification

Return STRICT JSON of shape:
{"results":[{"id":string,"verdict":"pass"|"fail"|"inconclusive","evidence":string,"reasoning":string}]}

Be conservative — prefer "inconclusive" over guessing. Output JSON only.`;

  const caseList = cases
    .map((c, i) =>
      `[${i + 1}] id=${c.id}\nTitle: ${c.title}\nLevel/Discipline/Paradigm: ${c.level}/${c.discipline}/${c.paradigm}\nPreconditions: ${c.preconditions || "(none)"}\nSteps:\n${c.steps.map((s, n) => `  ${n + 1}. ${s}`).join("\n") || "  (none)"}\nExpected: ${c.expected}`,
    )
    .join("\n\n");

  const userPrompt = `=== PROJECT SOURCE MATERIAL (truncated) ===
${repoSummary}

=== TEST CASES TO RUN (${cases.length}) ===
${caseList.slice(0, 24000)}`;

  type ExecResult = {
    results?: Array<{ id: string; verdict: string; evidence?: string; reasoning?: string }>;
  };
  const result = await jsonCompletion<ExecResult>(sysPrompt, userPrompt, { maxTokens: 8000 });

  const byId = new Map((result.results ?? []).map((r) => [r.id, r] as const));
  const VALID_VERDICTS = new Set(["pass", "fail", "inconclusive"]);

  // Build the AI report.
  const counts = { pass: 0, fail: 0, inconclusive: 0 };
  const detailLines: string[] = [];
  const reportId = randomUUID();
  const now = new Date();

  for (const c of cases) {
    const r = byId.get(c.id);
    const verdict = r && VALID_VERDICTS.has(r.verdict) ? r.verdict : "inconclusive";
    counts[verdict as "pass" | "fail" | "inconclusive"]++;

    const note = (r?.reasoning ?? "").slice(0, 600);
    const ev = (r?.evidence ?? "").slice(0, 240);
    // Status mapping: pass/fail are decisive; "inconclusive" should NOT
    // downgrade a previously-decisive outcome (passing/failing) — only flip
    // a draft to "blocked" so reviewers see it needs more evidence.
    const newStatus =
      verdict === "pass" ? "passing"
      : verdict === "fail" ? "failing"
      : c.status === "draft" ? "blocked"
      : c.status; // preserve prior decisive status

    await db
      .update(testCasesTable)
      .set({
        status: newStatus,
        lastRunAt: now,
        lastRunVerdict: verdict,
        lastRunNote: note ? `${note}${ev ? ` [evidence: ${ev}]` : ""}` : ev || "",
        lastRunReportId: reportId,
        updatedAt: now,
      })
      .where(eq(testCasesTable.id, c.id));

    detailLines.push(
      `**[${verdict.toUpperCase()}] ${c.title}**  \nLevel/Discipline: ${c.level}/${c.discipline}  \nEvidence: ${ev || "—"}  \nReasoning: ${note || "—"}`,
    );
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  const projectName = project?.name ?? "Project";
  const totalRun = cases.length;
  const passRate = totalRun > 0 ? Math.round((counts.pass / totalRun) * 100) : 0;

  await db.insert(aiReportsTable).values({
    id: reportId,
    projectId,
    kind: "test_execution_report",
    tone: "technical",
    title: `AI Test Execution — ${projectName} (${now.toISOString().slice(0, 10)})`,
    status: "draft",
    content: {
      title: `AI Test Execution — ${projectName}`,
      subtitle: `${totalRun} cases · ${counts.pass} passed · ${counts.fail} failed · ${counts.inconclusive} inconclusive`,
      executiveSummary: `Executed ${totalRun} AI-asserted test cases against the project's ingested artefacts. Pass rate: ${passRate}%. ${counts.fail > 0 ? `${counts.fail} failing case(s) require remediation.` : ""} ${counts.inconclusive > 0 ? `${counts.inconclusive} case(s) need additional source material to verify.` : ""}`.trim(),
      sections: [
        {
          id: "summary",
          heading: "Run summary",
          body: `- Total cases run: **${totalRun}**\n- Passed: **${counts.pass}**\n- Failed: **${counts.fail}**\n- Inconclusive: **${counts.inconclusive}**\n- Pass rate: **${passRate}%**\n- Run at: ${now.toISOString()}\n- Source artefacts scanned: ${codeFiles.length} file(s)`,
        },
        {
          id: "details",
          heading: "Per-case verdicts",
          body: detailLines.join("\n\n"),
        },
      ],
      evidence: cases.slice(0, 10).map((c, i) => ({
        id: `tc-${i + 1}`,
        label: c.title.slice(0, 80),
        source: `Test case ${c.id} (${c.level}/${c.discipline}/${c.paradigm})`,
      })),
    },
  });

  await logActivity(
    "test_case",
    `AI ran ${totalRun} test case(s): ${counts.pass} pass / ${counts.fail} fail / ${counts.inconclusive} inconclusive`,
    "Auditee",
  );

  res.status(201).json({
    reportId,
    counts,
    totalRun,
    passRate,
  });
}));

// =============================================================
// AI: Smart Interview — given a brief, generate 5-7 tailored
// follow-up questions that, when answered, will produce a far
// more complete requirements set than the brief alone. The
// frontend then concatenates the brief + Q&A and re-uses the
// existing /ai/generate-requirements endpoint to extract the
// final requirements list.
// =============================================================
router.post("/ai/interview/questions", consumeCredit(), aiHandler(async (req, res) => {
  const projectId = requireString(req.body?.projectId, "projectId", { min: 1 });
  {
    const access = await assertProjectAccessIfAuthed(req, res, projectId, "developer");
    if (access === false) return;
  }
  const brief = requireString(req.body?.brief, "brief", { min: 20, max: 4000 });
  // Optional list of compliance framework IDs the user marked applicable.
  // We use them to (a) load the matching frameworks for prompt context and
  // (b) tailor the generated interview questions toward each standard's
  // required coverage areas — fulfilling the helper text shown in the UI.
  const rawAppFwIds = Array.isArray(req.body?.applicableFrameworkIds)
    ? (req.body.applicableFrameworkIds as unknown[])
        .filter((x): x is string => typeof x === "string" && x.length > 0)
    : [];
  const applicableFrameworkIds = Array.from(new Set(rawAppFwIds)).slice(0, 8);

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  // Load the selected frameworks (if any) and derive the standards addendum
  // describing the required interview-coverage topics.
  let interviewFrameworks: typeof complianceFrameworksTable.$inferSelect[] = [];
  if (applicableFrameworkIds.length > 0) {
    interviewFrameworks = await db
      .select()
      .from(complianceFrameworksTable)
      .where(inArray(complianceFrameworksTable.id, applicableFrameworkIds));
  }
  const interviewBlueprints = selectStandardsBlueprints(interviewFrameworks);
  const interviewAddendum = renderStandardsAddendum(interviewBlueprints, "requirements");

  const baseQuestionCount = applicableFrameworkIds.length > 0 ? "7-10" : "5-7";

  const system = `You are Auditee, a senior business analyst conducting a structured discovery interview to extract complete requirements from a stakeholder.

Given a project brief, generate ${baseQuestionCount} sharply targeted follow-up questions. The answers, taken together, should be enough to draft a complete BRD/PRD-quality requirements set${applicableFrameworkIds.length > 0 ? " that satisfies every selected standard's coverage requirements" : ""}.

Return STRICT JSON of shape:
{"questions":[{"id":string,"category":"users"|"functional"|"data"|"integration"|"non_functional"|"compliance"|"constraints"|"success","prompt":string,"hint":string}]}

Rules:
- id: a short kebab-case identifier ("primary-users", "auth-method", etc.).
- category: one of the listed values; cover at least 4 different categories across the question set.
- prompt: a single direct question (<=200 chars). Plain English. No multi-part compound questions.
- hint: a one-sentence example or clarification (<=160 chars) showing what a good answer looks like.
- Order: start with users/scope, then functional, then non-functional/compliance, then constraints/success criteria.
- Output JSON only, no commentary.${interviewAddendum}`;

  const fwLine = interviewFrameworks.length > 0
    ? `\n\nApplicable standards (the answers MUST give us enough to satisfy each one): ${interviewFrameworks.map((f) => `${f.code} — ${f.name}`).join("; ")}`
    : "";
  const user = `Project: ${project.name}
Project context: ${project.description ?? "(none)"}

Brief:
${brief}${fwLine}`;

  type InterviewResult = {
    questions: Array<{
      id: string;
      category: string;
      prompt: string;
      hint: string;
    }>;
  };

  const ALLOWED_INTERVIEW_CATEGORIES = new Set([
    "users",
    "functional",
    "data",
    "integration",
    "non_functional",
    "compliance",
    "constraints",
    "success",
  ]);

  const raw = await jsonCompletion<InterviewResult>(system, user);
  if (!Array.isArray(raw.questions) || raw.questions.length === 0) {
    res.status(422).json({ error: "Model returned no questions" });
    return;
  }

  // Normalise + validate every question. Drop malformed ones, dedup ids, and
  // cap counts/lengths so the UI can never be fed garbage from the LLM.
  const seenIds = new Set<string>();
  const questions = raw.questions
    .filter((q): q is { id: string; category: string; prompt: string; hint: string } =>
      !!q
      && typeof q.id === "string"
      && typeof q.prompt === "string"
      && q.prompt.trim().length > 0
    )
    .map((q, idx) => {
      let id = q.id.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
      if (!id || seenIds.has(id)) id = `q-${idx + 1}`;
      seenIds.add(id);
      const category = ALLOWED_INTERVIEW_CATEGORIES.has(q.category) ? q.category : "functional";
      return {
        id,
        category,
        prompt: q.prompt.trim().slice(0, 240),
        hint: typeof q.hint === "string" ? q.hint.trim().slice(0, 200) : "",
      };
    })
    .slice(0, 10);

  if (questions.length === 0) {
    res.status(422).json({ error: "Model returned no usable questions" });
    return;
  }

  await logActivity(
    "smart_interview",
    `Smart interview started on ${project.name} (${questions.length} questions)`,
    "Auditee",
  );

  res.json({
    project: { id: project.id, name: project.name },
    brief,
    questions,
  });
}));

// =============================================================
// AI: Smart Interview → Extract requirements (eltegra-style)
//
// Replaces the old "concat brief + Q&A → reuse /ai/generate-requirements"
// path. The old approach lost per-question category metadata, capped output
// at 3-8 requirements regardless of how many questions were answered, and
// could silently return 0 because a 7900-char prose dump tripped duplicate
// detection or model truncation.
//
// New flow (mirrors per-question, category-driven extraction):
//   1. Accept the STRUCTURED Q&A — per-question category preserved.
//   2. Map category → requirement type deterministically:
//        users / success                          → BRD
//        functional                               → FRD
//        data / integration                       → PRD
//        non_functional / compliance / constraints → NFR
//   3. Send a structured JSON Q&A list to the model (not prose dump),
//      asking for 1-3 requirements per answered question, each with a
//      `sourceQuestionId` for provenance.
//   4. Tag each created requirement with `interview:<questionId>` and the
//      category so they remain traceable in the UI.
//   5. Deterministic fallback: if the model returns 0 (rare), synthesise
//      one templated requirement per answered question so the user never
//      gets a dead-end "0 requirements" toast after answering 10 questions.
// =============================================================
router.post("/ai/interview/extract", consumeCredit(), aiHandler(async (req, res) => {
  const projectId = requireString(req.body?.projectId, "projectId", { min: 1 });
  {
    const access = await assertProjectAccessIfAuthed(req, res, projectId, "developer");
    if (access === false) return;
  }

  const brief = typeof req.body?.brief === "string"
    ? req.body.brief.trim().slice(0, 4000)
    : "";

  const rawQA = Array.isArray(req.body?.qa) ? req.body.qa : null;
  if (!rawQA || rawQA.length === 0) {
    res.status(400).json({ error: "qa[] is required" });
    return;
  }

  const ALLOWED_CATEGORIES = new Set([
    "users", "functional", "data", "integration",
    "non_functional", "compliance", "constraints", "success",
  ]);
  const CATEGORY_TO_TYPE: Record<string, "BRD" | "PRD" | "FRD" | "NFR"> = {
    users: "BRD",
    success: "BRD",
    functional: "FRD",
    data: "PRD",
    integration: "PRD",
    non_functional: "NFR",
    compliance: "NFR",
    constraints: "NFR",
  };

  type QA = { id: string; category: string; prompt: string; answer: string };
  const qa: QA[] = (rawQA as unknown[])
    .map((row): QA | null => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const id = typeof r.id === "string" ? r.id.trim().slice(0, 80) : "";
      const prompt = typeof r.prompt === "string" ? r.prompt.trim().slice(0, 400) : "";
      const answer = typeof r.answer === "string" ? r.answer.trim().slice(0, 2000) : "";
      const rawCat = typeof r.category === "string" ? r.category : "functional";
      const category = ALLOWED_CATEGORIES.has(rawCat) ? rawCat : "functional";
      if (!id || !prompt || !answer) return null;
      return { id, category, prompt, answer };
    })
    .filter((x): x is QA => x !== null)
    .slice(0, 20);

  if (qa.length === 0) {
    res.status(400).json({ error: "No answered questions provided" });
    return;
  }

  const rawAppFwIds = Array.isArray(req.body?.applicableFrameworkIds)
    ? (req.body.applicableFrameworkIds as unknown[])
        .filter((x): x is string => typeof x === "string" && x.length > 0)
        .slice(0, 8)
    : [];
  const applicableFrameworkIds = Array.from(new Set(rawAppFwIds));

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const allFrameworks = await db
    .select({
      id: complianceFrameworksTable.id,
      code: complianceFrameworksTable.code,
      name: complianceFrameworksTable.name,
    })
    .from(complianceFrameworksTable);
  const frameworks = applicableFrameworkIds.length > 0
    ? allFrameworks.filter((f) => applicableFrameworkIds.includes(f.id))
    : allFrameworks;
  const fwCodes = frameworks.map((f) => f.code).join(", ") || "(none)";
  const codeToId = new Map(frameworks.map((f) => [f.code, f.id]));

  const standardsBlueprints = selectStandardsBlueprints(
    applicableFrameworkIds.length > 0 ? frameworks : [],
  );
  const standardsAddendum = renderStandardsAddendum(standardsBlueprints, "requirements");

  const minOut = qa.length;
  const maxOut = Math.min(60, qa.length * 3);

  const system = `You are Auditee, an enterprise requirements analyst. You are given the answers to a structured discovery interview. Convert each answered question into 1-3 atomic, testable requirements.

Return STRICT JSON of shape:
{"requirements":[{"sourceQuestionId":string,"title":string,"description":string,"type":"BRD"|"PRD"|"FRD"|"NFR","priority":"low"|"medium"|"high"|"critical","tags":string[],"linkedFrameworkCodes":string[]}]}

Rules:
- Total requirements: ${minOut}-${maxOut}. EVERY answered question must produce at least one requirement (use sourceQuestionId to point back).
- title: <=90 chars, action-oriented ("System shall …" style), derived from the answer.
- description: 1-3 sentences, testable, referencing the specific answer content.
- type follows the question category: users/success → BRD; functional → FRD; data/integration → PRD; non_functional/compliance/constraints → NFR. Use the suggested type unless the answer clearly demands another.
- priority: infer from the answer (must/critical/required → high or critical; should → medium; could/may → low).
- tags: include short topic keywords AND a tag of the form "interview:<sourceQuestionId>".
- linkedFrameworkCodes must be a subset of: ${fwCodes}. Only include codes whose clauses the requirement actually addresses.
- Output JSON only, no commentary.${standardsAddendum}`;

  const qaJson = JSON.stringify(
    qa.map((q) => ({
      id: q.id,
      category: q.category,
      suggestedType: CATEGORY_TO_TYPE[q.category],
      question: q.prompt,
      answer: q.answer,
    })),
    null,
    2,
  );

  const user = `Project: ${project.name}
Project context: ${project.description ?? "(none)"}

${brief ? `Original brief:\n${brief}\n\n` : ""}Discovery interview answers (JSON):
${qaJson}`;

  type GenResult = {
    requirements: Array<{
      sourceQuestionId?: string;
      title: string;
      description: string;
      type: "BRD" | "PRD" | "FRD" | "NFR";
      priority: "low" | "medium" | "high" | "critical";
      tags?: string[];
      linkedFrameworkCodes?: string[];
    }>;
  };

  let candidates: GenResult["requirements"] = [];
  try {
    const result = await jsonCompletion<GenResult>(system, user);
    if (Array.isArray(result.requirements)) candidates = result.requirements;
  } catch (err) {
    req.log.warn({ err }, "interview extract: model call failed, using deterministic fallback");
  }

  if (candidates.length === 0) {
    req.log.warn("interview extract: empty model output, falling back to per-question templates");
    candidates = qa.map((q) => ({
      sourceQuestionId: q.id,
      title: q.prompt.replace(/\?$/, "").slice(0, 80),
      description: q.answer.slice(0, 600),
      type: CATEGORY_TO_TYPE[q.category],
      priority: "medium" as const,
      tags: [q.category, `interview:${q.id}`],
      linkedFrameworkCodes: [],
    }));
  }

  const dedupIndex = await loadProjectDedupIndex(projectId);
  const created: Array<typeof requirementsTable.$inferSelect> = [];
  const skipped: Array<{ title: string; duplicateOfCode: string; reason: string }> = [];

  for (const r of candidates) {
    if (!r || typeof r.title !== "string" || typeof r.description !== "string") continue;
    const dup = findDuplicate({ title: r.title, description: r.description }, dedupIndex);
    if (dup) {
      skipped.push({
        title: r.title.slice(0, 200),
        duplicateOfCode: dup.duplicateOfCode,
        reason: dup.reason,
      });
      continue;
    }
    const code = await nextRequirementCode(projectId);
    const sourceQ = qa.find((q) => q.id === r.sourceQuestionId);
    const tags = Array.isArray(r.tags) ? r.tags.filter((t) => typeof t === "string").slice(0, 8) : [];
    if (sourceQ && !tags.some((t) => t.startsWith("interview:"))) {
      tags.push(`interview:${sourceQ.id}`);
    }
    const linkedFrameworks = (r.linkedFrameworkCodes ?? [])
      .map((c) => codeToId.get(c))
      .filter((x): x is string => Boolean(x));
    const [row] = await db
      .insert(requirementsTable)
      .values({
        id: randomUUID(),
        projectId,
        code,
        title: r.title.slice(0, 200),
        description: r.description.slice(0, 4000),
        type: r.type,
        status: "draft",
        priority: r.priority,
        owner: "Auditee",
        tags,
        linkedFrameworks,
        externalSystem: "auditee_smart_interview",
        externalId: code,
      })
      .returning();
    created.push(row);
    indexNewRow(dedupIndex, { id: row.id, code: row.code, title: row.title, description: row.description });
    await logActivity(
      "requirement",
      `${code} drafted by Smart Interview from ${sourceQ ? `Q "${sourceQ.prompt.slice(0, 60)}"` : "interview"}`,
      "Auditee",
      code,
    );
  }

  if (created.length === 0 && skipped.length > 0) {
    res.status(409).json({
      error: "Every extracted requirement matched one already in this project — nothing new to add.",
      skipped,
      skippedCount: skipped.length,
    });
    return;
  }

  res.status(201).json({
    created,
    count: created.length,
    skipped,
    skippedCount: skipped.length,
    questionsAnswered: qa.length,
  });
}));

// =============================================================
// AI: Effort Estimation
// Estimates implementation effort (in man-hours) for every
// requirement in a project. Returns per-requirement estimates
// plus a project total and complexity breakdown.
// =============================================================
router.post("/ai/estimate-effort", consumeCredit(), aiHandler(async (req, res) => {
  const projectId = requireString(req.body?.projectId, "projectId", { min: 1 });
  {
    const access = await assertProjectAccessIfAuthed(req, res, projectId, "developer");
    if (access === false) return;
  }

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const reqs = await db
    .select({
      code: requirementsTable.code,
      title: requirementsTable.title,
      description: requirementsTable.description,
      type: requirementsTable.type,
      priority: requirementsTable.priority,
    })
    .from(requirementsTable)
    .where(eq(requirementsTable.projectId, projectId));

  if (reqs.length === 0) {
    res.status(422).json({ error: "Project has no requirements yet." });
    return;
  }

  const reqList = reqs
    .map((r) => `- ${r.code} [${r.type}/${r.priority}] ${r.title}${r.description ? ` — ${r.description.slice(0, 220)}` : ""}`)
    .join("\n");

  const system = `You are Auditee, a senior delivery engineer with 20+ years estimating enterprise software work.

For each requirement provided, estimate implementation effort in man-hours assuming a staff-level full-stack engineer. Include:
  - design + implementation + tests + code review + documentation
  - all reasonable risk buffer for the requirement's complexity

Return STRICT JSON of shape:
{
  "estimates": [{"requirementCode": string, "hours": number, "complexity": "trivial"|"small"|"medium"|"large"|"epic", "rationale": string, "risks": string[]}],
  "totals": {"hours": number, "weeksAtOneFte": number, "complexityBreakdown": {"trivial": number, "small": number, "medium": number, "large": number, "epic": number}},
  "assumptions": string[]
}

Rules:
- requirementCode MUST match a code from the input list. Cover EVERY requirement.
- hours: number (1-400 per requirement). Be realistic, not optimistic.
- weeksAtOneFte = round(totalHours / 40, 1).
- assumptions: 2-5 bullet points explaining the basis.
- Output JSON only, no commentary.`;

  const user = `Project: ${project.name}
Project context: ${project.description ?? "(none)"}

Requirements (${reqs.length}):
${reqList}`;

  type EffortResult = {
    estimates: Array<{
      requirementCode: string;
      hours: number;
      complexity: "trivial" | "small" | "medium" | "large" | "epic";
      rationale: string;
      risks?: string[];
    }>;
    totals: {
      hours: number;
      weeksAtOneFte: number;
      complexityBreakdown: Record<string, number>;
    };
    assumptions: string[];
  };

  const result = await jsonCompletion<EffortResult>(system, user);

  const estimates = Array.isArray(result.estimates) ? result.estimates : [];
  const totals = result.totals ?? { hours: 0, weeksAtOneFte: 0, complexityBreakdown: {} };
  const assumptions = Array.isArray(result.assumptions) ? result.assumptions : [];

  // Persist so the user can re-open without re-running the LLM, and we
  // keep history of every estimation pass.
  const id = randomUUID();
  const [persisted] = await db
    .insert(effortEstimatesTable)
    .values({
      id,
      projectId,
      requirementCount: reqs.length,
      totalHours: Number(totals.hours ?? 0),
      weeksAtOneFte: Number(totals.weeksAtOneFte ?? 0),
      complexityBreakdown: totals.complexityBreakdown ?? {},
      estimates,
      assumptions,
    })
    .returning();

  await logActivity(
    "effort_estimate",
    `Effort estimate run on ${project.name} (${reqs.length} reqs) — ${result.totals?.hours ?? 0} hours total`,
    "Auditee",
  );

  res.json({
    id: persisted?.id ?? id,
    project: { id: project.id, name: project.name },
    requirementCount: reqs.length,
    estimates,
    totals,
    assumptions,
    runAt: (persisted?.createdAt ?? new Date()).toISOString(),
  });
}));

// =============================================================
// GET latest effort estimate for a project (so the sheet can re-open
// the previous run without re-spending a credit on the LLM).
// =============================================================
router.get("/ai/estimate-effort/latest", aiHandler(async (req, res) => {
  const projectId = requireString(req.query?.projectId, "projectId", { min: 1 });
  {
    const access = await assertProjectAccessIfAuthed(req, res, projectId, "viewer");
    if (access === false) return;
  }

  const [project] = await db
    .select({ id: projectsTable.id, name: projectsTable.name })
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const [latest] = await db
    .select()
    .from(effortEstimatesTable)
    .where(eq(effortEstimatesTable.projectId, projectId))
    .orderBy(desc(effortEstimatesTable.createdAt))
    .limit(1);

  if (!latest) {
    res.status(404).json({ error: "No estimate yet" });
    return;
  }

  res.json({
    id: latest.id,
    project,
    requirementCount: latest.requirementCount,
    estimates: latest.estimates,
    totals: {
      hours: latest.totalHours,
      weeksAtOneFte: latest.weeksAtOneFte,
      complexityBreakdown: latest.complexityBreakdown,
    },
    assumptions: latest.assumptions,
    runAt: latest.createdAt.toISOString(),
  });
}));

export default router;
