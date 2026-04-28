import { Router, type IRouter } from "express";
import { and, desc, eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import AdmZip from "adm-zip";
import {
  db,
  testCasesTable,
  requirementsTable,
  projectsTable,
  aiReportsTable,
} from "@workspace/db";
import { requireProjectAccessInline } from "../lib/projectAccess";
import { logActivity } from "../lib/activityLog";

const router: IRouter = Router();

const VALID_TYPES = new Set(["functional", "negative", "non_functional", "acceptance"]);
const VALID_STATUS = new Set(["draft", "passing", "failing", "blocked"]);
const VALID_PRIORITY = new Set(["low", "medium", "high", "critical"]);
const VALID_LEVELS = new Set(["unit", "integration", "system", "acceptance", "operational"]);
const VALID_DISCIPLINES = new Set(["functional", "negative", "regulatory", "performance", "security", "usability", "compatibility", "regression", "accessibility", "reliability", "uat"]);
const VALID_PARADIGMS = new Set(["procedural", "bdd", "oo_state", "functional_property", "exploratory"]);
const VALID_MODES = new Set(["static", "dynamic"]);

function clampString(s: unknown, max: number, fallback = ""): string {
  if (typeof s !== "string") return fallback;
  return s.slice(0, max);
}

// =============================================================
// GET /api/test-cases?projectId=&requirementId=
// =============================================================
router.get("/test-cases", async (req, res) => {
  const projectId = String(req.query.projectId ?? "");
  if (!projectId) {
    res.status(400).json({ error: "projectId required" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, projectId, "viewer");
  if (!access) return;
  const requirementId = typeof req.query.requirementId === "string" ? req.query.requirementId : null;
  const rows = await db
    .select()
    .from(testCasesTable)
    .where(
      requirementId
        ? and(eq(testCasesTable.projectId, projectId), eq(testCasesTable.requirementId, requirementId))
        : eq(testCasesTable.projectId, projectId),
    )
    .orderBy(desc(testCasesTable.updatedAt));
  res.json({ testCases: rows });
});

// =============================================================
// POST /api/test-cases
// =============================================================
router.post("/test-cases", async (req, res) => {
  const projectId = String(req.body?.projectId ?? "");
  if (!projectId) {
    res.status(400).json({ error: "projectId required" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, projectId, "developer");
  if (access === false) return;
  const title = clampString(req.body?.title, 240).trim();
  if (title.length < 3) {
    res.status(400).json({ error: "title must be 3-240 chars" });
    return;
  }
  const type = VALID_TYPES.has(req.body?.type) ? req.body.type : "functional";
  const status = VALID_STATUS.has(req.body?.status) ? req.body.status : "draft";
  const priority = VALID_PRIORITY.has(req.body?.priority) ? req.body.priority : "medium";
  const steps = Array.isArray(req.body?.steps)
    ? (req.body.steps as unknown[])
        .filter((s): s is string => typeof s === "string")
        .map((s) => s.slice(0, 600))
        .slice(0, 50)
    : [];
  const expected = clampString(req.body?.expected, 2000);
  const requirementId = typeof req.body?.requirementId === "string" ? req.body.requirementId : null;
  const tags = Array.isArray(req.body?.tags)
    ? (req.body.tags as unknown[]).filter((s): s is string => typeof s === "string").slice(0, 16)
    : [];

  const [row] = await db
    .insert(testCasesTable)
    .values({
      id: randomUUID(),
      projectId,
      requirementId,
      title,
      type,
      status,
      priority,
      steps,
      expected,
      tags,
      createdBy: "User",
    })
    .returning();
  res.status(201).json({ testCase: row });
});

// =============================================================
// PATCH /api/test-cases/:id
// =============================================================
router.patch("/test-cases/:id", async (req, res) => {
  const id = String(req.params.id ?? "");
  const [existing] = await db.select().from(testCasesTable).where(eq(testCasesTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Test case not found" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, existing.projectId, "developer");
  if (access === false) return;

  const patch: Partial<typeof testCasesTable.$inferInsert> = { updatedAt: new Date() };
  if (typeof req.body?.title === "string") patch.title = clampString(req.body.title, 240);
  if (typeof req.body?.type === "string" && VALID_TYPES.has(req.body.type)) patch.type = req.body.type;
  if (typeof req.body?.status === "string" && VALID_STATUS.has(req.body.status)) patch.status = req.body.status;
  if (typeof req.body?.priority === "string" && VALID_PRIORITY.has(req.body.priority)) patch.priority = req.body.priority;
  if (Array.isArray(req.body?.steps)) {
    patch.steps = (req.body.steps as unknown[])
      .filter((s): s is string => typeof s === "string")
      .map((s) => s.slice(0, 600))
      .slice(0, 50);
  }
  if (typeof req.body?.expected === "string") patch.expected = clampString(req.body.expected, 2000);
  if (Array.isArray(req.body?.tags)) {
    patch.tags = (req.body.tags as unknown[]).filter((s): s is string => typeof s === "string").slice(0, 16);
  }

  const [row] = await db.update(testCasesTable).set(patch).where(eq(testCasesTable.id, id)).returning();
  res.json({ testCase: row });
});

// =============================================================
// DELETE /api/test-cases/:id
// =============================================================
router.delete("/test-cases/:id", async (req, res) => {
  const id = String(req.params.id ?? "");
  const [existing] = await db.select().from(testCasesTable).where(eq(testCasesTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Test case not found" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, existing.projectId, "developer");
  if (access === false) return;
  await db.delete(testCasesTable).where(eq(testCasesTable.id, id));
  res.status(204).send();
});

// =============================================================
// POST /api/test-cases/:id/run  body: { status, note? }
// =============================================================
router.post("/test-cases/:id/run", async (req, res) => {
  const id = String(req.params.id ?? "");
  const [existing] = await db.select().from(testCasesTable).where(eq(testCasesTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Test case not found" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, existing.projectId, "developer");
  if (access === false) return;
  const status = String(req.body?.status ?? "");
  if (!VALID_STATUS.has(status) || status === "draft") {
    res.status(400).json({ error: "status must be passing|failing|blocked" });
    return;
  }
  const note = clampString(req.body?.note, 1000);
  const [row] = await db
    .update(testCasesTable)
    .set({ status, lastRunAt: new Date(), lastRunNote: note, updatedAt: new Date() })
    .where(eq(testCasesTable.id, id))
    .returning();
  await logActivity("test_case", `${row.title.slice(0, 80)} → ${status}`, "User");
  res.json({ testCase: row });
});

// =============================================================
// POST /api/test-cases/bulk-by-requirement
// Convenience for the per-requirement table view.
// =============================================================
router.post("/test-cases/bulk-by-requirement", async (req, res) => {
  const requirementIds = Array.isArray(req.body?.requirementIds)
    ? (req.body.requirementIds as unknown[]).filter((s): s is string => typeof s === "string").slice(0, 200)
    : [];
  const projectId = String(req.body?.projectId ?? "");
  if (!projectId || requirementIds.length === 0) {
    res.json({ counts: {} });
    return;
  }
  const access = await requireProjectAccessInline(req, res, projectId, "viewer");
  if (!access) return;
  const rows = await db
    .select({ requirementId: testCasesTable.requirementId, status: testCasesTable.status })
    .from(testCasesTable)
    .where(
      and(
        eq(testCasesTable.projectId, projectId),
        inArray(testCasesTable.requirementId, requirementIds),
      ),
    );
  const counts: Record<string, { total: number; passing: number; failing: number; blocked: number; draft: number }> = {};
  for (const r of rows) {
    if (!r.requirementId) continue;
    const c = counts[r.requirementId] ?? { total: 0, passing: 0, failing: 0, blocked: 0, draft: 0 };
    c.total++;
    if (r.status === "passing") c.passing++;
    else if (r.status === "failing") c.failing++;
    else if (r.status === "blocked") c.blocked++;
    else c.draft++;
    counts[r.requirementId] = c;
  }
  res.json({ counts });
});

// =============================================================
// GET /api/test-cases/export-bundle?projectId=&reportId=
// Returns a ZIP containing all test cases (Markdown + JSON) plus
// the latest test-execution AI report — the artefact you'd push
// back to your repo so compliance can re-run.
// =============================================================
router.get("/test-cases/export-bundle", async (req, res) => {
  const projectId = String(req.query.projectId ?? "");
  if (!projectId) {
    res.status(400).json({ error: "projectId required" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, projectId, "viewer");
  if (!access) return;

  const reportId = typeof req.query.reportId === "string" ? req.query.reportId : null;

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const cases = await db
    .select()
    .from(testCasesTable)
    .where(eq(testCasesTable.projectId, projectId))
    .orderBy(desc(testCasesTable.updatedAt));

  const reqs = await db
    .select({ id: requirementsTable.id, code: requirementsTable.code, title: requirementsTable.title })
    .from(requirementsTable)
    .where(eq(requirementsTable.projectId, projectId));
  const reqByid = new Map(reqs.map((r) => [r.id, r] as const));

  // Resolve which AI report to bundle.
  let report = null as Awaited<ReturnType<typeof db.select>>[number] | null;
  if (reportId) {
    const [r] = await db
      .select()
      .from(aiReportsTable)
      .where(and(eq(aiReportsTable.id, reportId), eq(aiReportsTable.projectId, projectId)));
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

  const zip = new AdmZip();

  // Per-case Markdown files, grouped by level.
  for (const c of cases) {
    const reqLabel = c.requirementId ? reqByid.get(c.requirementId)?.code ?? null : null;
    const safeTitle = c.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "test";
    const fileName = `auditee/test-cases/${c.level}/${c.id.slice(0, 8)}-${safeTitle}.md`;
    const md = renderTestCaseMarkdown(c, reqLabel);
    zip.addFile(fileName, Buffer.from(md, "utf8"));
  }

  // Single combined JSON for machine processing / CI.
  zip.addFile(
    "auditee/test-cases.json",
    Buffer.from(
      JSON.stringify(
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
            sourceRefs: c.sourceRefs,
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
            tags: c.tags,
          })),
        },
        null,
        2,
      ),
      "utf8",
    ),
  );

  // Test-execution report as Markdown.
  if (report) {
    const content = (report as any).content;
    const reportMd = [
      `# ${content?.title ?? report.title}`,
      "",
      content?.subtitle ? `_${content.subtitle}_\n` : "",
      "## Executive summary",
      content?.executiveSummary ?? "(none)",
      "",
      ...((content?.sections ?? []) as Array<{ heading: string; body: string }>).map(
        (s) => `## ${s.heading}\n\n${s.body}\n`,
      ),
    ]
      .filter(Boolean)
      .join("\n");
    zip.addFile("auditee/REPORT.md", Buffer.from(reportMd, "utf8"));
  }

  // README — instructions for the receiving repo.
  const readme = `# Auditee — Generated Test Bundle

**Project:** ${project.name}
**Generated:** ${new Date().toISOString()}
**Total cases:** ${cases.length}

## Layout

\`\`\`
auditee/
├── REPORT.md               # latest AI test-execution report
├── test-cases.json         # machine-readable copy of every case
└── test-cases/
    ├── unit/
    ├── integration/
    ├── system/
    ├── acceptance/
    └── operational/
\`\`\`

## How to push this back to your repo

1. Unzip this archive at the root of your repository.
2. Commit \`auditee/\` so your CI / compliance pipeline can re-run the suite.
3. Re-import the bundle into Auditee (or hit POST /api/ai/run-test-suite) to refresh verdicts after fixes.

Each \`.md\` file is human- and Git-friendly, so reviewers can comment line-by-line in pull-request review.
`;
  zip.addFile("auditee/README.md", Buffer.from(readme, "utf8"));

  const buf = zip.toBuffer();
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `auditee-tests-${project.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${stamp}.zip`;

  await logActivity("test_case", `Exported test bundle (${cases.length} cases)`, "User");

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Length", String(buf.length));
  res.send(buf);
});

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
  if (c.tags.length > 0) lines.push(`_Tags: ${c.tags.map((t) => `\`${t}\``).join(", ")}_`);
  return lines.join("\n");
}

// projectsTable is referenced indirectly to satisfy lint when linked endpoints
// expand in future iterations.
void projectsTable;
void requirementsTable;
void VALID_LEVELS; void VALID_DISCIPLINES; void VALID_PARADIGMS; void VALID_MODES;

export default router;
