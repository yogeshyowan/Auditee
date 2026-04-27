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
  activityEventsTable,
  legacySystemsTable,
  aiConversationsTable,
  capaActionsTable,
  projectSourcesTable,
  sourceFilesTable,
} from "@workspace/db";
import { inArray } from "drizzle-orm";
import { count as drizzleCount } from "drizzle-orm";
import { desc } from "drizzle-orm";
import { jsonCompletion, AIUnavailableError, AIResponseError } from "../lib/ai";

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
router.post("/ai/generate-requirements", aiHandler(async (req, res) => {
  const body = {
    projectId: requireString(req.body?.projectId, "projectId", { min: 1 }),
    brief: requireString(req.body?.brief, "brief", { min: 20, max: 8000 }),
  };
  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, body.projectId));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const frameworks = await db
    .select({
      id: complianceFrameworksTable.id,
      code: complianceFrameworksTable.code,
      name: complianceFrameworksTable.name,
    })
    .from(complianceFrameworksTable);

  const system = `You are Montana, an enterprise requirements analyst. From a product brief, extract a small, well-formed set of requirements (3-8). Return strict JSON of shape:
{"requirements":[{"title":string,"description":string,"type":"BRD"|"PRD"|"FRD"|"NFR","priority":"low"|"medium"|"high"|"critical","tags":string[],"linkedFrameworkCodes":string[]}]}
Rules:
- title: <=90 chars, action-oriented.
- description: 1-3 sentences, testable.
- type: BRD=business goal, PRD=product capability, FRD=functional behaviour, NFR=non-functional (performance, security, compliance).
- linkedFrameworkCodes must be a subset of these codes: ${frameworks.map((f) => f.code).join(", ") || "(none)"}. Only include when truly relevant.
- Output JSON only, no commentary.`;

  const user = `Project: ${project.name}\nProject context: ${project.description ?? ""}\n\nBrief:\n${body.brief}`;

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
  const created: Array<typeof requirementsTable.$inferSelect> = [];
  for (const r of result.requirements) {
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
        owner: "Montana",
        tags: r.tags ?? [],
        linkedFrameworks,
      })
      .returning();
    created.push(row);
    await logActivity(
      "requirement",
      `${code} drafted by Montana from brief`,
      "Montana",
      code,
    );
  }

  res.status(201).json({ created, count: created.length });
}));

// =============================================================
// AI: Analyze Code — match to requirements + create artifact + links
// =============================================================
router.post("/ai/analyze-code", aiHandler(async (req, res) => {
  const body = {
    projectId: requireString(req.body?.projectId, "projectId", { min: 1 }),
    filePath: requireString(req.body?.filePath, "filePath", { min: 1, max: 500 }),
    symbol: requireString(req.body?.symbol, "symbol", { min: 1, max: 200 }),
    language: requireString(req.body?.language, "language", { min: 1, max: 40 }),
    code: requireString(req.body?.code, "code", { min: 10, max: 20000 }),
  };
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

  const system = `You are Montana's code-to-requirements analyst. Given a code snippet and a list of project requirements, identify which requirements the code implements, tests, or violates.
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
    `Montana linked ${body.symbol} to ${linksCreated.length} requirement(s)`,
    "Montana",
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
router.post("/ai/compliance-audit", aiHandler(async (req, res) => {
  const body = {
    projectId: requireString(req.body?.projectId, "projectId", { min: 1 }),
    frameworkId: requireString(req.body?.frameworkId, "frameworkId", { min: 1 }),
    sourceIds: Array.isArray(req.body?.sourceIds) ? (req.body.sourceIds as string[]).filter(Boolean) : undefined,
  };
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

  const system = `You are Montana's compliance auditor. For each control of the given framework, evaluate whether the project adequately covers it AND explicitly enumerate "required evidence vs found evidence vs missing evidence" so the user gets a clean conformance report.

You have THREE inputs to reason from:
1) The project's requirements (formal documented behaviour).
2) The framework's controls (what must be true).
3) Project sources — actual files ingested from GitHub / Jira / uploads / etc. These are real evidence. Cite them when they prove or disprove a control.

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

  const user = `Framework: ${framework.code} — ${framework.name}\nProject: ${project.name}\n\nControls:\n${controls.map((c) => `${c.code}: ${c.title} — ${c.description}`).join("\n")}\n\nRequirements:\n${reqs.map((r) => `${r.code} [${r.type}/${r.status}]: ${r.title} — ${r.description}`).join("\n") || "(none)"}\n\nProject sources & evidence:\n${evidenceBlock}`;

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

  await logActivity(
    "compliance",
    `Montana ran ${framework.code} audit on ${project.name}: ${result.overallVerdict}${capasCreated ? ` · ${capasCreated} CAPA(s) opened` : ""}${includedSources.length ? ` · ${includedSources.length} source(s), ${totalCitedFiles} file(s) cited` : ""}`,
    "Montana",
    framework.code,
  );

  res.json({
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
    ...result,
  });
}));

// =============================================================
// AI: Traceability / Completeness audit
// For each requirement, evaluates coverage across:
//   design  →  code  →  tests  →  test reports
// using existing traceability_links + uploaded source files.
// =============================================================
router.post("/ai/traceability-audit", aiHandler(async (req, res) => {
  const projectId = requireString(req.body?.projectId, "projectId", { min: 1 });
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

  // Heuristic pre-classification of paths into design/code/test/report buckets.
  // The AI uses these as hints but can override.
  const isDesign = (p: string) =>
    /\.(md|mdx|adoc|rst)$/i.test(p) ||
    /(^|\/)(docs?|design|architecture|adr|specs?)\//i.test(p) ||
    /(README|ARCHITECTURE|DESIGN|SPEC|RFC)\.(md|txt)$/i.test(p);
  const isTest = (p: string) =>
    /(\.|_|\/)(test|spec)s?(\.|\/)/i.test(p) ||
    /(^|\/)(tests?|__tests__|cypress|e2e|playwright)\//i.test(p) ||
    /\.(test|spec)\.[jt]sx?$/i.test(p);
  const isReport = (p: string) =>
    /(coverage|junit|cobertura|allure|playwright-report|test-results|cypress\/results|reports?)\b/i.test(p) ||
    /\.(xml|json|html)$/i.test(p) && /(report|coverage|junit|allure)/i.test(p);
  const isCode = (p: string) =>
    /\.(ts|tsx|js|jsx|py|go|rs|java|kt|cs|cpp|c|h|hpp|rb|php|swift|m|mm|sql)$/i.test(p) &&
    !isTest(p);

  const buckets: Record<string, { design: string[]; code: string[]; tests: string[]; reports: string[] }> = {};
  for (const s of sourceSummaries) {
    buckets[s.id] = { design: [], code: [], tests: [], reports: [] };
    for (const p of s.paths) {
      if (isReport(p)) buckets[s.id].reports.push(p);
      else if (isTest(p)) buckets[s.id].tests.push(p);
      else if (isDesign(p)) buckets[s.id].design.push(p);
      else if (isCode(p)) buckets[s.id].code.push(p);
    }
  }

  const sourceBlock = sourceSummaries.length === 0
    ? "(no project sources connected — completeness will rely on declared traceability links only)"
    : sourceSummaries.map((s) => {
        const b = buckets[s.id]!;
        const fmt = (label: string, arr: string[]) =>
          `${label} (${arr.length}):\n${arr.slice(0, 80).map((p) => `  - ${p}`).join("\n") || "  (none detected)"}`;
        return `### Source: ${s.label} [${s.kind}] — ${s.fileCount} files\n${fmt("Design / docs", b.design)}\n${fmt("Code", b.code)}\n${fmt("Tests", b.tests)}\n${fmt("Test reports", b.reports)}`;
      }).join("\n\n");

  const reqBlock = reqs.map((r) => {
    const ls = linksByReq.get(r.id) ?? [];
    return `${r.code} [${r.type}/${r.status}] ${r.title}\n  description: ${(r.description ?? "").slice(0, 280)}\n  declared links: ${ls.length === 0 ? "(none)" : ls.map((l) => `${l.kind}→${l.path}`).join(", ")}`;
  }).join("\n");

  const system = `You are Montana's traceability & completeness auditor. For every requirement, decide whether it is covered at FOUR stages of the development lifecycle:
  1) Design — has a design doc / architecture note / ADR explained how this will be built?
  2) Code — does the implementation exist in source files?
  3) Tests — are there test cases (unit / integration / e2e) for this requirement?
  4) Test reports — is there evidence the tests have actually been run (coverage report, JUnit XML, CI artifact, etc.)?

Use BOTH the declared traceability links AND the source file listings to decide. Match by requirement code (e.g. HEL-0001) appearing in path/filename, by feature keyword, or by obvious domain mapping. Be conservative — if you cannot cite any artefact, mark "missing".

Return strict JSON:
{
 "overallVerdict":"strong"|"adequate"|"weak"|"failing",
 "headlineFindings": string[],
 "requirementCoverage":[{
   "requirementCode": string,
   "design":   {"status":"covered"|"partial"|"missing", "artifacts": string[], "note": string},
   "code":     {"status":"covered"|"partial"|"missing", "artifacts": string[], "note": string},
   "tests":    {"status":"covered"|"partial"|"missing", "artifacts": string[], "note": string},
   "reports":  {"status":"covered"|"partial"|"missing", "artifacts": string[], "note": string},
   "recommendation": string
 }]
}
Rules:
- Return EXACTLY ONE entry per provided requirement code, no duplicates, no extras. The list must contain every code in the "Requirements" block, even if all four stages are missing.
- requirementCode must be one of the provided codes (verbatim).
- artifacts: file paths verbatim from the listings or declared links. Do not invent paths. May be empty.
- note: ONE short sentence explaining what was (or wasn't) found.
- recommendation: ONE concrete next action for this requirement (e.g. "Add e2e test in tests/auth.e2e.ts covering MFA flow").
- headlineFindings: 2–4 short bullets about systemic gaps (e.g. "12 of 18 requirements have no test coverage").`;

  const user = `Project: ${project.name}\n\nRequirements (${reqs.length}):\n${reqBlock}\n\nProject sources:\n${sourceBlock}`;

  type CoverageStage = { status: "covered" | "partial" | "missing"; artifacts: string[]; note: string };
  type ReqCoverage = {
    requirementCode: string;
    design: CoverageStage;
    code: CoverageStage;
    tests: CoverageStage;
    reports: CoverageStage;
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
  // fully missing across all 4 stages, so completeness can never be inflated by omissions.
  const MISSING_STAGE: { status: "missing"; artifacts: string[]; note: string } = {
    status: "missing",
    artifacts: [],
    note: "Model returned no coverage entry for this requirement.",
  };
  function normalizeStage(s: any): { status: "covered" | "partial" | "missing"; artifacts: string[]; note: string } {
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
  const reconciled = reqs.map((req) => {
    const m = modelByCode.get(req.code);
    return {
      requirementCode: req.code,
      design: m ? normalizeStage(m.design) : { ...MISSING_STAGE },
      code: m ? normalizeStage(m.code) : { ...MISSING_STAGE },
      tests: m ? normalizeStage(m.tests) : { ...MISSING_STAGE },
      reports: m ? normalizeStage(m.reports) : { ...MISSING_STAGE },
      recommendation:
        m && typeof m.recommendation === "string" && m.recommendation.trim()
          ? m.recommendation
          : "Establish design, code, tests, and reports for this requirement.",
    };
  });

  // Compute completeness % — average of 4 stage scores across ALL project requirements
  // (not just those returned by the model). covered=1, partial=0.5, missing=0
  function scoreStage(s: { status: string }): number {
    if (s.status === "covered") return 1;
    if (s.status === "partial") return 0.5;
    return 0;
  }
  let totalScore = 0;
  const stageTotals = { design: 0, code: 0, tests: 0, reports: 0 };
  for (const r of reconciled) {
    const d = scoreStage(r.design);
    const c = scoreStage(r.code);
    const t = scoreStage(r.tests);
    const rp = scoreStage(r.reports);
    totalScore += (d + c + t + rp) / 4;
    stageTotals.design += d;
    stageTotals.code += c;
    stageTotals.tests += t;
    stageTotals.reports += rp;
  }
  const totalReqs = reconciled.length;
  const completenessPercentage = totalReqs > 0 ? Math.round((totalScore / totalReqs) * 100) : 0;
  const stagePercentages = {
    design: totalReqs ? Math.round((stageTotals.design / totalReqs) * 100) : 0,
    code: totalReqs ? Math.round((stageTotals.code / totalReqs) * 100) : 0,
    tests: totalReqs ? Math.round((stageTotals.tests / totalReqs) * 100) : 0,
    reports: totalReqs ? Math.round((stageTotals.reports / totalReqs) * 100) : 0,
  };

  await logActivity(
    "compliance",
    `Montana ran traceability/completeness audit on ${project.name}: ${result.overallVerdict} (${completenessPercentage}%)`,
    "Montana",
    project.slug ?? project.id,
  );

  res.json({
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
      designCount: buckets[s.id]?.design.length ?? 0,
      codeCount: buckets[s.id]?.code.length ?? 0,
      testCount: buckets[s.id]?.tests.length ?? 0,
      reportCount: buckets[s.id]?.reports.length ?? 0,
    })),
  });
}));

// =============================================================
// AI: Legacy Code Extractor — pull implicit requirements
// =============================================================
router.post("/ai/legacy-extract", aiHandler(async (req, res) => {
  const body = {
    legacySystemId: requireString(req.body?.legacySystemId, "legacySystemId", { min: 1 }),
    code: requireString(req.body?.code, "code", { min: 20, max: 40000 }),
    projectId: optionalString(req.body?.projectId),
  };
  const [system] = await db
    .select()
    .from(legacySystemsTable)
    .where(eq(legacySystemsTable.id, body.legacySystemId));
  if (!system) {
    res.status(404).json({ error: "Legacy system not found" });
    return;
  }

  const sysPrompt = `You are Montana's legacy modernization analyst. Read the legacy code and extract the implicit business and functional requirements it encodes. Identify hidden risks (compliance gaps, brittle patterns, hard-coded business rules).
Return strict JSON:
{"summary":string,"requirements":[{"title":string,"description":string,"type":"BRD"|"PRD"|"FRD"|"NFR","priority":"low"|"medium"|"high"|"critical","tags":string[]}],"risks":[{"severity":"low"|"medium"|"high","title":string,"detail":string}],"modernizationNotes":string}
Rules:
- 3-8 requirements, each grounded in the actual code.
- 1-5 risks, each clearly tied to something in the code.
- Output JSON only.`;

  const userPrompt = `Legacy system: ${system.name} (${system.language})\nDescription: ${system.description ?? ""}\n\nCode:\n\`\`\`${system.language.toLowerCase()}\n${body.code}\n\`\`\``;

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
  if (body.projectId) {
    const [project] = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, body.projectId));
    if (project) {
      for (const r of result.requirements) {
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
            owner: "Montana (legacy)",
            tags: [...(r.tags ?? []), "legacy", system.name],
            linkedFrameworks: [],
          })
          .returning();
        createdRequirements.push(row);
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
    `Montana extracted ${result.requirements.length} requirements from ${system.name}`,
    "Montana",
    system.name,
  );

  res.json({
    legacySystemId: system.id,
    ...result,
    createdRequirementCount: createdRequirements.length,
  });
}));

// =============================================================
// AI: Ask Montana — natural language Q&A across project data
// =============================================================
router.post("/ai/ask", aiHandler(async (req, res) => {
  const body = {
    question: requireString(req.body?.question, "question", { min: 3, max: 2000 }),
    projectId: optionalString(req.body?.projectId),
  };

  const projects = await db.select().from(projectsTable);
  const requirements = body.projectId
    ? await db
        .select()
        .from(requirementsTable)
        .where(eq(requirementsTable.projectId, body.projectId))
    : await db.select().from(requirementsTable).limit(60);
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

  const sysPrompt = `You are Montana, an AI-native PDLC platform assistant. Answer questions using ONLY the structured project context provided. Cite specific requirement codes (e.g., HEL-0001), framework codes, or system names when relevant.
Return strict JSON:
{"answer":string,"citations":string[],"confidence":"low"|"medium"|"high"}
- answer: clear, concise (<=200 words), markdown allowed.
- citations: identifiers you referenced (codes/names).
- If the context doesn't contain enough information, say so honestly with confidence "low".`;

  const userPrompt = `Question: ${body.question}\n\nContext:\n${JSON.stringify(context).slice(0, 24000)}`;

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
  const limitRaw = Number(req.query.limit ?? 50);
  const limit = Math.max(1, Math.min(200, Number.isFinite(limitRaw) ? limitRaw : 50));
  const rows = projectId
    ? await db
        .select()
        .from(aiConversationsTable)
        .where(eq(aiConversationsTable.projectId, projectId))
        .orderBy(desc(aiConversationsTable.createdAt))
        .limit(limit)
    : await db
        .select()
        .from(aiConversationsTable)
        .orderBy(desc(aiConversationsTable.createdAt))
        .limit(limit);
  res.json({ conversations: rows });
}));

router.delete("/ai/ask/history/:id", aiHandler(async (req, res) => {
  const id = requireString(req.params.id, "id", { min: 1 });
  await db.delete(aiConversationsTable).where(eq(aiConversationsTable.id, id));
  res.json({ ok: true });
}));

export default router;
