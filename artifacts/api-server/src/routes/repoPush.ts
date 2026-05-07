// =============================================================
// /api/repo/* — push generated artefacts (reports, test-case
// bundles) back to a connected GitHub repository so compliance
// can re-run them in CI.
// =============================================================
import { Router, type IRouter } from "express";
import { and, desc, eq, inArray } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import {
  db,
  projectsTable,
  projectSourcesTable,
  aiReportsTable,
  testCasesTable,
  requirementsTable,
  capaActionsTable,
  complianceFrameworksTable,
} from "@workspace/db";
import { requireProjectAccessInline } from "../lib/projectAccess";
import { logActivity } from "../lib/activityLog";
import { pushFilesToRepo, slugify, type PushFile } from "../lib/github-push";

const router: IRouter = Router();

type GithubSourceConfig = { repoUrl?: string; branch?: string; token?: string };

// -------------------------------------------------------------
// Lightweight in-memory rate limiter.
// Caps each (userId, endpoint) at 10 pushes per 10-minute window
// to protect both our outbound GitHub API budget and the
// connected repo from accidental spam.
// -------------------------------------------------------------
const PUSH_LIMIT = 10;
const PUSH_WINDOW_MS = 10 * 60 * 1000;
const pushBuckets = new Map<string, number[]>();

function checkPushRateLimit(userId: string, endpoint: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const key = `${endpoint}:${userId}`;
  const now = Date.now();
  const recent = (pushBuckets.get(key) ?? []).filter((t) => now - t < PUSH_WINDOW_MS);
  if (recent.length >= PUSH_LIMIT) {
    const oldest = recent[0]!;
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((PUSH_WINDOW_MS - (now - oldest)) / 1000)) };
  }
  recent.push(now);
  pushBuckets.set(key, recent);
  return { ok: true };
}

// Hard cap on per-bundle file count. A typical project sits
// well under this; large suites should be filtered first.
const MAX_BUNDLE_CASES = 200;

async function loadGithubSource(projectId: string, sourceId: string | undefined) {
  const sources = await db
    .select()
    .from(projectSourcesTable)
    .where(and(eq(projectSourcesTable.projectId, projectId), eq(projectSourcesTable.kind, "github")))
    .orderBy(desc(projectSourcesTable.updatedAt));
  if (sources.length === 0) {
    throw new Error("This project has no connected GitHub source. Add one in the Sources tab first.");
  }
  const picked = sourceId ? sources.find((s) => s.id === sourceId) : sources[0];
  if (!picked) throw new Error("The chosen GitHub source was not found in this project.");
  const cfg = (picked.config ?? {}) as GithubSourceConfig;
  if (!cfg.repoUrl) throw new Error("The chosen GitHub source has no repoUrl configured.");
  // Token resolution: prefer the per-source token (user-supplied, scoped to
  // their account). Fall back to the platform-level GITHUB_PAT secret so
  // pushes to *public* repos owned by accounts that PAT can write to still
  // succeed without the user having to mint their own token. The push will
  // still fail at the GitHub API layer if the effective token lacks write
  // access — and we surface that error message verbatim.
  const effectiveToken = cfg.token || process.env.GITHUB_PAT || "";
  return { source: picked, cfg: { ...cfg, token: effectiveToken } };
}

// -------------------------------------------------------------
// GET /api/repo/push-targets?projectId=
// Returns the GitHub source(s) attached to the project so the
// UI can show a target picker (and warn when no token).
// -------------------------------------------------------------
router.get("/repo/push-targets", async (req, res) => {
  const projectId = String(req.query.projectId ?? "");
  if (!projectId) {
    res.status(400).json({ error: "projectId required" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, projectId, "viewer");
  if (!access) return;

  const sources = await db
    .select()
    .from(projectSourcesTable)
    .where(and(eq(projectSourcesTable.projectId, projectId), eq(projectSourcesTable.kind, "github")))
    .orderBy(desc(projectSourcesTable.updatedAt));

  res.json({
    sources: sources.map((s) => {
      const cfg = (s.config ?? {}) as GithubSourceConfig;
      return {
        id: s.id,
        label: s.label,
        repoUrl: cfg.repoUrl ?? null,
        branch: cfg.branch ?? null,
        hasToken: Boolean(cfg.token) || Boolean(process.env.GITHUB_PAT),
        status: s.status,
      };
    }),
  });
});

// -------------------------------------------------------------
// POST /api/repo/push-report
// Body: { projectId, reportId, sourceId?, branch?, subdir?, commitMessage? }
// Pushes the report rendered as Markdown into
// `<subdir or "auditee/reports">/<kind>/<slug>.md`
// -------------------------------------------------------------
router.post("/repo/push-report", async (req, res) => {
  try {
    const projectId = String(req.body?.projectId ?? "");
    const reportId = String(req.body?.reportId ?? "");
    if (!projectId || !reportId) {
      res.status(400).json({ error: "projectId and reportId required" });
      return;
    }
    const access = await requireProjectAccessInline(req, res, projectId, "developer");
    if (!access) return;

    const userId = getAuth(req).userId ?? "anon";
    const rl = checkPushRateLimit(userId, "push-report");
    if (!rl.ok) {
      res.setHeader("Retry-After", String(rl.retryAfterSec));
      res.status(429).json({ error: `Too many pushes. Try again in ${rl.retryAfterSec}s.` });
      return;
    }

    const [report] = await db
      .select()
      .from(aiReportsTable)
      .where(and(eq(aiReportsTable.id, reportId), eq(aiReportsTable.projectId, projectId)));
    if (!report) {
      res.status(404).json({ error: "Report not found" });
      return;
    }

    const { source, cfg } = await loadGithubSource(projectId, req.body?.sourceId);
    const branch = (req.body?.branch as string | undefined) ?? cfg.branch;
    const subdir = sanitiseSubdir(req.body?.subdir, "auditee/reports");
    const md = renderReportMarkdown(report);
    const path = `${subdir}/${slugify(report.kind)}/${report.id.slice(0, 8)}-${slugify(report.title)}.md`;
    const commitMessage =
      (req.body?.commitMessage as string | undefined)?.trim() ||
      `chore(auditee): add ${report.kind} report — ${report.title.slice(0, 60)}`;

    const result = await pushFilesToRepo({
      repoUrl: cfg.repoUrl!,
      branch,
      token: cfg.token!,
      files: [{ path, content: md }],
      commitMessage,
      authorName: "Auditee Bot",
      authorEmail: "auditee-bot@users.noreply.github.com",
    });

    await logActivity(
      "report",
      `Pushed report "${report.title.slice(0, 60)}" to ${source.label} (${result.commitSha.slice(0, 7)})`,
      "User",
    );

    res.json({ ...result, path });
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

// -------------------------------------------------------------
// POST /api/repo/push-test-bundle
// Body: { projectId, sourceId?, branch?, subdir?, commitMessage?, reportId? }
// Pushes the entire test-case bundle (per-case Markdown, JSON,
// optional execution report) under `<subdir or "auditee">/`
// in a single atomic commit.
// -------------------------------------------------------------
router.post("/repo/push-test-bundle", async (req, res) => {
  try {
    const projectId = String(req.body?.projectId ?? "");
    if (!projectId) {
      res.status(400).json({ error: "projectId required" });
      return;
    }
    const access = await requireProjectAccessInline(req, res, projectId, "developer");
    if (!access) return;

    const userId = getAuth(req).userId ?? "anon";
    const rl = checkPushRateLimit(userId, "push-test-bundle");
    if (!rl.ok) {
      res.setHeader("Retry-After", String(rl.retryAfterSec));
      res.status(429).json({ error: `Too many pushes. Try again in ${rl.retryAfterSec}s.` });
      return;
    }

    const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const { source, cfg } = await loadGithubSource(projectId, req.body?.sourceId);
    const branch = (req.body?.branch as string | undefined) ?? cfg.branch;
    const subdir = sanitiseSubdir(req.body?.subdir, "auditee");

    // Build the same artefacts as the ZIP export, but in-memory as PushFile[].
    const cases = await db
      .select()
      .from(testCasesTable)
      .where(eq(testCasesTable.projectId, projectId))
      .orderBy(desc(testCasesTable.updatedAt));
    if (cases.length === 0) {
      res.status(400).json({ error: "No test cases to push." });
      return;
    }
    if (cases.length > MAX_BUNDLE_CASES) {
      res.status(413).json({
        error: `This project has ${cases.length} test cases — pushing more than ${MAX_BUNDLE_CASES} in one commit is disabled to keep the request bounded. Filter or split the suite, then push again.`,
      });
      return;
    }

    const reqs = await db
      .select({ id: requirementsTable.id, code: requirementsTable.code })
      .from(requirementsTable)
      .where(eq(requirementsTable.projectId, projectId));
    const reqByid = new Map(reqs.map((r) => [r.id, r] as const));

    const explicitReportId = typeof req.body?.reportId === "string" ? req.body.reportId : null;
    let report: typeof aiReportsTable.$inferSelect | null = null;
    if (explicitReportId) {
      const [r] = await db
        .select()
        .from(aiReportsTable)
        .where(and(eq(aiReportsTable.id, explicitReportId), eq(aiReportsTable.projectId, projectId)));
      report = r ?? null;
    } else {
      const [r] = await db
        .select()
        .from(aiReportsTable)
        .where(and(eq(aiReportsTable.projectId, projectId), eq(aiReportsTable.kind, "test_execution_report")))
        .orderBy(desc(aiReportsTable.createdAt))
        .limit(1);
      report = r ?? null;
    }

    const files: PushFile[] = [];
    for (const c of cases) {
      const reqLabel = c.requirementId ? reqByid.get(c.requirementId)?.code ?? null : null;
      const safeTitle = slugify(c.title);
      files.push({
        path: `${subdir}/test-cases/${slugify(c.level)}/${c.id.slice(0, 8)}-${safeTitle}.md`,
        content: renderTestCaseMarkdown(c, reqLabel),
      });
    }
    files.push({
      path: `${subdir}/test-cases.json`,
      content: JSON.stringify(
        {
          project: { id: project.id, name: project.name },
          generatedAt: new Date().toISOString(),
          testCases: cases.map((c) => ({
            id: c.id,
            title: c.title,
            level: c.level,
            discipline: c.discipline,
            paradigm: c.paradigm,
            mode: c.mode,
            sourceKind: c.sourceKind,
            requirementCode: c.requirementId ? reqByid.get(c.requirementId)?.code ?? null : null,
            priority: c.priority,
            preconditions: c.preconditions,
            steps: c.steps,
            expected: c.expected,
            gherkin: c.gherkin,
            status: c.status,
            lastRunVerdict: c.lastRunVerdict,
            lastRunNote: c.lastRunNote,
            lastRunAt: c.lastRunAt,
          })),
        },
        null,
        2,
      ),
    });
    if (report) {
      files.push({ path: `${subdir}/REPORT.md`, content: renderReportMarkdown(report) });
    }
    files.push({
      path: `${subdir}/README.md`,
      content: renderBundleReadme(project.name, cases.length, subdir),
    });

    const commitMessage =
      (req.body?.commitMessage as string | undefined)?.trim() ||
      `chore(auditee): sync ${cases.length} test cases${report ? " + execution report" : ""}`;

    const result = await pushFilesToRepo({
      repoUrl: cfg.repoUrl!,
      branch,
      token: cfg.token!,
      files,
      commitMessage,
      authorName: "Auditee Bot",
      authorEmail: "auditee-bot@users.noreply.github.com",
    });

    await logActivity(
      "test_case",
      `Pushed test bundle (${cases.length} cases) to ${source.label} (${result.commitSha.slice(0, 7)})`,
      "User",
    );

    res.json(result);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

// -------------------------------------------------------------
// POST /api/repo/push-capa
// Body: {
//   projectId: string,
//   capaActionIds?: string[],   // optional: push only these CAPAs
//   includeStatuses?: string[], // default ["open","in_progress","blocked"]
//   sourceId?: string,          // optional GitHub source picker
//   branch?: string,
//   subdir?: string,            // default "auditee/capa"
//   commitMessage?: string,
// }
// Pushes the chosen CAPA actions back to the connected GitHub
// repo as one Markdown file per action under
// `<subdir>/<code>.md`, in a single atomic commit. Lets the
// engineering team track corrective actions in version control
// (or wire them into PR templates) instead of having them live
// only inside Auditee.
// -------------------------------------------------------------
const MAX_CAPA_PUSH = 200;

router.post("/repo/push-capa", async (req, res) => {
  try {
    const projectId = String(req.body?.projectId ?? "");
    if (!projectId) {
      res.status(400).json({ error: "projectId required" });
      return;
    }
    const access = await requireProjectAccessInline(req, res, projectId, "developer");
    if (!access) return;

    const userId = getAuth(req).userId ?? "anon";
    const rl = checkPushRateLimit(userId, "push-capa");
    if (!rl.ok) {
      res.setHeader("Retry-After", String(rl.retryAfterSec));
      res.status(429).json({ error: `Too many pushes. Try again in ${rl.retryAfterSec}s.` });
      return;
    }

    const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    // Resolve CAPA selection: explicit ids → those (validated against project),
    // otherwise all CAPAs in the requested status set (default = still-actionable
    // ones). Done/cancelled are excluded by default so the repo doesn't drift
    // full of resolved noise on every push.
    const explicitIds: string[] = Array.isArray(req.body?.capaActionIds)
      ? req.body.capaActionIds.filter((s: unknown): s is string => typeof s === "string" && s.length > 0)
      : [];
    const allowedStatuses = new Set(["open", "in_progress", "blocked", "done", "cancelled"]);
    const requestedStatuses: string[] = Array.isArray(req.body?.includeStatuses)
      ? req.body.includeStatuses.filter((s: unknown): s is string => typeof s === "string" && allowedStatuses.has(s))
      : ["open", "in_progress", "blocked"];

    let capas: Array<typeof capaActionsTable.$inferSelect>;
    if (explicitIds.length > 0) {
      capas = await db
        .select()
        .from(capaActionsTable)
        .where(and(eq(capaActionsTable.projectId, projectId), inArray(capaActionsTable.id, explicitIds)));
    } else {
      capas = await db
        .select()
        .from(capaActionsTable)
        .where(and(eq(capaActionsTable.projectId, projectId), inArray(capaActionsTable.status, requestedStatuses)))
        .orderBy(desc(capaActionsTable.updatedAt));
    }

    if (capas.length === 0) {
      res.status(400).json({ error: "No matching CAPA actions to push." });
      return;
    }
    if (capas.length > MAX_CAPA_PUSH) {
      res.status(413).json({
        error: `Selected ${capas.length} CAPA actions — pushing more than ${MAX_CAPA_PUSH} in one commit is disabled. Filter the selection (e.g. by status) and push again.`,
      });
      return;
    }

    // Resolve framework labels in one round-trip so each CAPA file can show
    // its parent framework (no n+1).
    const fwIds = Array.from(new Set(capas.map((c) => c.frameworkId).filter((v): v is string => !!v)));
    const fwRows =
      fwIds.length > 0
        ? await db
            .select({ id: complianceFrameworksTable.id, code: complianceFrameworksTable.code, name: complianceFrameworksTable.name })
            .from(complianceFrameworksTable)
            .where(inArray(complianceFrameworksTable.id, fwIds))
        : [];
    const fwById = new Map(fwRows.map((f) => [f.id, f] as const));

    const { source, cfg } = await loadGithubSource(projectId, req.body?.sourceId);
    const branch = (req.body?.branch as string | undefined) ?? cfg.branch;
    const subdir = sanitiseSubdir(req.body?.subdir, "auditee/capa");

    // Build files. The filename embeds the first 8 hex of the CAPA UUID so two
    // CAPAs whose code+title slug collide (e.g. duplicates created by mistake,
    // or unicode-only differences flattened by slugify) cannot overwrite each
    // other in the pushed tree. We still defensively detect collisions and
    // fail closed before issuing any GitHub write — better a 409 than a silent
    // overwrite that drops corrective-action evidence.
    const fileEntries: Array<{ capaId: string; path: string; content: string }> = capas.map((c) => {
      const fw = c.frameworkId ? fwById.get(c.frameworkId) ?? null : null;
      const safeCode = slugify(c.code);
      const safeTitle = slugify(c.title);
      const idPrefix = c.id.replace(/-/g, "").slice(0, 8);
      return {
        capaId: c.id,
        path: `${subdir}/${safeCode}-${idPrefix}-${safeTitle}.md`,
        content: renderCapaMarkdown(c, fw, project.name),
      };
    });
    const seen = new Map<string, string>(); // path → first capaId
    const collisions: Array<{ path: string; ids: string[] }> = [];
    for (const f of fileEntries) {
      const existing = seen.get(f.path);
      if (existing) {
        const found = collisions.find((c) => c.path === f.path);
        if (found) found.ids.push(f.capaId);
        else collisions.push({ path: f.path, ids: [existing, f.capaId] });
      } else {
        seen.set(f.path, f.capaId);
      }
    }
    if (collisions.length > 0) {
      res.status(409).json({
        error: "Refusing to push: two or more CAPA actions resolve to the same file path. Rename their codes/titles in Auditee, or push a smaller subset.",
        collisions,
      });
      return;
    }
    const files: PushFile[] = fileEntries.map(({ path, content }) => ({ path, content }));
    files.push({
      path: `${subdir}/INDEX.md`,
      content: renderCapaIndex(project.name, capas, fwById, subdir),
    });

    const commitMessage =
      (req.body?.commitMessage as string | undefined)?.trim() ||
      `chore(auditee): sync ${capas.length} CAPA action(s)`;

    const result = await pushFilesToRepo({
      repoUrl: cfg.repoUrl!,
      branch,
      token: cfg.token!,
      files,
      commitMessage,
      authorName: "Auditee Bot",
      authorEmail: "auditee-bot@users.noreply.github.com",
    });

    await logActivity(
      "capa",
      `Pushed ${capas.length} CAPA action(s) to ${source.label} (${result.commitSha.slice(0, 7)})`,
      "User",
    );

    res.json({ ...result, count: capas.length, subdir });
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

// -------------------------------------------------------------
// Helpers — kept here (vs. shared util) so this file is the
// single audit-trail surface for repo-push behaviour.
// -------------------------------------------------------------
function sanitiseSubdir(raw: unknown, fallback: string): string {
  if (typeof raw !== "string") return fallback;
  const trimmed = raw.trim().replace(/^\/+|\/+$/g, "");
  if (!trimmed) return fallback;
  if (trimmed.includes("..") || trimmed.startsWith("/") || /[^a-z0-9_\-./]/i.test(trimmed)) {
    return fallback;
  }
  return trimmed;
}

function renderReportMarkdown(report: typeof aiReportsTable.$inferSelect): string {
  const content = (report.content ?? {}) as {
    title?: string;
    subtitle?: string;
    executiveSummary?: string;
    sections?: Array<{ heading: string; body: string; citations?: string[] }>;
    evidence?: Array<{ id: string; label: string; source: string }>;
  };
  const lines: string[] = [];
  lines.push(`# ${content.title ?? report.title}`);
  if (content.subtitle) lines.push(`\n_${content.subtitle}_\n`);
  lines.push("");
  lines.push(`> **Kind:** \`${report.kind}\` · **Tone:** \`${report.tone}\` · **Generated:** ${new Date(report.createdAt).toISOString()}`);
  lines.push("");
  if (content.executiveSummary) {
    lines.push("## Executive summary");
    lines.push("");
    lines.push(content.executiveSummary);
    lines.push("");
  }
  for (const s of content.sections ?? []) {
    lines.push(`## ${s.heading}`);
    lines.push("");
    lines.push(s.body);
    if (s.citations && s.citations.length > 0) {
      lines.push("");
      lines.push(`_Evidence: ${s.citations.map((c) => `\`${c}\``).join(", ")}_`);
    }
    lines.push("");
  }
  if (content.evidence && content.evidence.length > 0) {
    lines.push("## Evidence index");
    lines.push("");
    for (const e of content.evidence.slice(0, 200)) {
      lines.push(`- \`${e.id}\` — ${e.label} _(${e.source})_`);
    }
    lines.push("");
  }
  lines.push("");
  lines.push("---");
  lines.push("_Generated by Auditee. Re-import into Auditee or feed into your compliance pipeline._");
  return lines.join("\n");
}

function renderTestCaseMarkdown(
  c: typeof testCasesTable.$inferSelect,
  reqLabel: string | null,
): string {
  const lines: string[] = [];
  lines.push(`# ${c.title}`);
  lines.push("");
  lines.push(`> **Level:** \`${c.level}\` · **Discipline:** \`${c.discipline}\` · **Paradigm:** \`${c.paradigm}\` · **Mode:** \`${c.mode}\` · **Priority:** \`${c.priority}\``);
  lines.push(`> **Source:** \`${c.sourceKind}\`${reqLabel ? ` · **Requirement:** \`${reqLabel}\`` : ""}`);
  lines.push("");
  if (c.preconditions) {
    lines.push("## Preconditions");
    lines.push(c.preconditions);
    lines.push("");
  }
  if (c.gherkin && c.paradigm === "bdd") {
    lines.push("## Gherkin");
    lines.push("```gherkin");
    lines.push(c.gherkin);
    lines.push("```");
    lines.push("");
  }
  if (c.steps.length > 0) {
    lines.push("## Steps");
    c.steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
    lines.push("");
  }
  if (c.expected) {
    lines.push("## Expected result");
    lines.push(c.expected);
    lines.push("");
  }
  if (c.lastRunVerdict || c.lastRunNote) {
    lines.push("## Last AI run");
    if (c.lastRunVerdict) lines.push(`- **Verdict:** \`${c.lastRunVerdict}\``);
    if (c.lastRunAt) lines.push(`- **At:** ${new Date(c.lastRunAt).toISOString()}`);
    if (c.lastRunNote) lines.push(`- **Notes:** ${c.lastRunNote}`);
    lines.push("");
  }
  return lines.join("\n");
}

function renderCapaMarkdown(
  c: typeof capaActionsTable.$inferSelect,
  fw: { code: string; name: string } | null,
  projectName: string,
): string {
  const lines: string[] = [];
  lines.push(`# ${c.code} — ${c.title}`);
  lines.push("");
  lines.push(`> **Project:** ${projectName}`);
  lines.push(
    `> **Severity:** \`${c.severity}\` · **Status:** \`${c.status}\` · **Owner:** ${c.owner} · **Source:** \`${c.source}\``,
  );
  if (fw || c.controlCode) {
    const fwLabel = fw ? `${fw.code} — ${fw.name}` : "—";
    const ctrl = c.controlCode ?? "—";
    lines.push(`> **Framework:** ${fwLabel} · **Control:** \`${ctrl}\``);
  }
  if (c.dueAt) lines.push(`> **Due:** ${new Date(c.dueAt).toISOString().slice(0, 10)}`);
  if (c.closedAt) lines.push(`> **Closed:** ${new Date(c.closedAt).toISOString().slice(0, 10)}`);
  if (c.tags.length > 0) lines.push(`> **Tags:** ${c.tags.map((t) => `\`${t}\``).join(", ")}`);
  lines.push("");
  if (c.description.trim().length > 0) {
    lines.push("## Description");
    lines.push("");
    lines.push(c.description);
    lines.push("");
  }
  lines.push("## Audit metadata");
  lines.push("");
  lines.push(`- **Auditee ID:** \`${c.id}\``);
  lines.push(`- **Created:** ${new Date(c.createdAt).toISOString()}`);
  lines.push(`- **Last updated:** ${new Date(c.updatedAt).toISOString()}`);
  lines.push(`- **Evidence count:** ${c.evidenceCount}`);
  lines.push("");
  lines.push("---");
  lines.push("_Synced from Auditee. Update status in Auditee — the next push will overwrite this file._");
  return lines.join("\n");
}

function renderCapaIndex(
  projectName: string,
  capas: Array<typeof capaActionsTable.$inferSelect>,
  fwById: Map<string, { code: string; name: string }>,
  subdir: string,
): string {
  const lines: string[] = [];
  lines.push(`# Auditee — CAPA Actions`);
  lines.push("");
  lines.push(`**Project:** ${projectName}`);
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push(`**Total actions:** ${capas.length}`);
  lines.push("");
  lines.push("| Code | Severity | Status | Owner | Framework | Control | Title |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- |");
  for (const c of capas) {
    const fw = c.frameworkId ? fwById.get(c.frameworkId)?.code ?? "—" : "—";
    const ctrl = c.controlCode ?? "—";
    const fname = `${slugify(c.code)}-${slugify(c.title)}.md`;
    const safeTitle = c.title.replace(/\|/g, "\\|");
    lines.push(`| [${c.code}](./${fname}) | ${c.severity} | ${c.status} | ${c.owner} | ${fw} | ${ctrl} | ${safeTitle} |`);
  }
  lines.push("");
  lines.push("---");
  lines.push(`_All files live under \`${subdir}/\`. Auditee will overwrite this folder on the next push._`);
  return lines.join("\n");
}

function renderBundleReadme(projectName: string, count: number, subdir: string): string {
  return `# Auditee — Test Bundle

**Project:** ${projectName}
**Generated:** ${new Date().toISOString()}
**Total cases:** ${count}

This folder was pushed by Auditee to keep your compliance evidence in version control.

## Layout

\`\`\`
${subdir}/
├── REPORT.md            # latest AI test-execution report (if available)
├── test-cases.json      # machine-readable copy of every case
└── test-cases/
    ├── unit/
    ├── integration/
    ├── system/
    ├── acceptance/
    └── operational/
\`\`\`

## Re-running

- Edit cases in your repo or in Auditee — both are safe.
- POST \`/api/ai/run-test-suite\` (with this project's id) to refresh verdicts after fixes.
- Auditee will overwrite this folder on the next push, so keep extra notes outside \`${subdir}/\`.
`;
}

export default router;
