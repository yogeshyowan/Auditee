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
} from "@workspace/db";
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

  const system = `You are EltegraAI, an enterprise requirements analyst. From a product brief, extract a small, well-formed set of requirements (3-8). Return strict JSON of shape:
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
        owner: "EltegraAI",
        tags: r.tags ?? [],
        linkedFrameworks,
      })
      .returning();
    created.push(row);
    await logActivity(
      "requirement",
      `${code} drafted by EltegraAI from brief`,
      "EltegraAI",
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

  const system = `You are EltegraAI's code-to-requirements analyst. Given a code snippet and a list of project requirements, identify which requirements the code implements, tests, or violates.
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
    `EltegraAI linked ${body.symbol} to ${linksCreated.length} requirement(s)`,
    "EltegraAI",
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

  const system = `You are EltegraAI's compliance auditor. For each control of the given framework, evaluate whether the project's requirements adequately cover it.
Return strict JSON:
{"overallVerdict":"strong"|"adequate"|"weak"|"failing","headlineFindings":string[],"controlAssessments":[{"controlCode":string,"verdict":"met"|"partial"|"gap","coveringRequirementCodes":string[],"recommendation":string}]}
Rules:
- controlCode must be one of the provided codes.
- coveringRequirementCodes is a list of project requirement codes (may be empty).
- verdict 'met' = clearly covered, 'partial' = some coverage with gaps, 'gap' = no meaningful coverage.
- recommendation: one concrete next step (1 sentence).
- headlineFindings: 2-4 short bullets summarising the audit.`;

  const user = `Framework: ${framework.code} — ${framework.name}\nProject: ${project.name}\n\nControls:\n${controls.map((c) => `${c.code}: ${c.title} — ${c.description}`).join("\n")}\n\nRequirements:\n${reqs.map((r) => `${r.code} [${r.type}/${r.status}]: ${r.title} — ${r.description}`).join("\n") || "(none)"}`;

  type AuditResult = {
    overallVerdict: "strong" | "adequate" | "weak" | "failing";
    headlineFindings: string[];
    controlAssessments: Array<{
      controlCode: string;
      verdict: "met" | "partial" | "gap";
      coveringRequirementCodes: string[];
      recommendation: string;
    }>;
  };
  const result = await jsonCompletion<AuditResult>(system, user);

  await logActivity(
    "compliance",
    `EltegraAI ran ${framework.code} audit on ${project.name}: ${result.overallVerdict}`,
    "EltegraAI",
    framework.code,
  );

  res.json({
    framework: { id: framework.id, code: framework.code, name: framework.name },
    project: { id: project.id, name: project.name },
    ...result,
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

  const sysPrompt = `You are EltegraAI's legacy modernization analyst. Read the legacy code and extract the implicit business and functional requirements it encodes. Identify hidden risks (compliance gaps, brittle patterns, hard-coded business rules).
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
            owner: "EltegraAI (legacy)",
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
    `EltegraAI extracted ${result.requirements.length} requirements from ${system.name}`,
    "EltegraAI",
    system.name,
  );

  res.json({
    legacySystemId: system.id,
    ...result,
    createdRequirementCount: createdRequirements.length,
  });
}));

// =============================================================
// AI: Ask Eltegra — natural language Q&A across project data
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

  const sysPrompt = `You are EltegraAI, an AI-native PDLC platform assistant. Answer questions using ONLY the structured project context provided. Cite specific requirement codes (e.g., HEL-0001), framework codes, or system names when relevant.
Return strict JSON:
{"answer":string,"citations":string[],"confidence":"low"|"medium"|"high"}
- answer: clear, concise (<=200 words), markdown allowed.
- citations: identifiers you referenced (codes/names).
- If the context doesn't contain enough information, say so honestly with confidence "low".`;

  const userPrompt = `Question: ${body.question}\n\nContext:\n${JSON.stringify(context).slice(0, 24000)}`;

  type AskResult = { answer: string; citations: string[]; confidence: "low" | "medium" | "high" };
  const result = await jsonCompletion<AskResult>(sysPrompt, userPrompt);

  res.json(result);
}));

export default router;
