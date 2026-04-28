import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  db,
  aiReportsTable,
  projectsTable,
  requirementsTable,
  complianceFrameworksTable,
  complianceControlsTable,
  traceabilityLinksTable,
  codeArtifactsTable,
  capaActionsTable,
  activityEventsTable,
  type ReportContent,
} from "@workspace/db";
import { jsonCompletion, AIUnavailableError, AIResponseError } from "../lib/ai";
import { selectStandardsBlueprints, renderStandardsAddendum } from "../lib/standards-blueprints";
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import { inArray } from "drizzle-orm";
import { consumeCredit } from "../middlewares/creditMiddleware";
import { requireProjectAccessInline } from "../lib/projectAccess";

const router: IRouter = Router();

function asyncH(fn: (req: import("express").Request, res: import("express").Response) => Promise<void>) {
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
      console.error(`[reports] ${req.path} failed:`, err);
      res.status(status).json({ error: err?.message ?? "Internal error" });
    }
  };
}

router.get("/reports", async (req, res) => {
  const projectId = typeof req.query.projectId === "string" ? req.query.projectId : undefined;
  if (!projectId) {
    res.status(400).json({ error: "projectId is required" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, projectId, "auditor");
  if (access === false) return;
  const rows = await db
    .select()
    .from(aiReportsTable)
    .where(eq(aiReportsTable.projectId, projectId))
    .orderBy(desc(aiReportsTable.updatedAt));
  res.json({ reports: rows });
});

router.get("/reports/:id", async (req, res) => {
  const [row] = await db.select().from(aiReportsTable).where(eq(aiReportsTable.id, req.params.id!));
  if (!row) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  if (row.projectId) {
    const access = await requireProjectAccessInline(req, res, row.projectId, "auditor");
    if (access === false) return;
  }
  res.json(row);
});

router.delete("/reports/:id", async (req, res) => {
  const [target] = await db
    .select({ projectId: aiReportsTable.projectId })
    .from(aiReportsTable)
    .where(eq(aiReportsTable.id, req.params.id!))
    .limit(1);
  if (target?.projectId) {
    const access = await requireProjectAccessInline(req, res, target.projectId, "developer");
    if (access === false) return;
  }
  await db.delete(aiReportsTable).where(eq(aiReportsTable.id, req.params.id!));
  res.status(204).end();
});

const TONE_SYSTEM: Record<string, string> = {
  executive:
    "Tone: executive board-room. Punchy, plain English, business outcomes first, minimal jargon. Use short paragraphs.",
  technical:
    "Tone: senior technical/engineering audience. Precise, deeper detail, reference architecture and standards, acceptable to use jargon.",
  regulator:
    "Tone: external auditor / regulator. Formal, traceable, neutral, citation-heavy, avoid speculation, anchor every claim to evidence codes.",
};

function emptyContent(title: string): ReportContent {
  return { title, executiveSummary: "", sections: [], evidence: [] };
}

router.post("/reports/generate", consumeCredit(), asyncH(async (req, res) => {
  const b = req.body ?? {};
  const projectId = typeof b.projectId === "string" ? b.projectId : null;
  if (!projectId) {
    res.status(400).json({ error: "projectId is required" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, projectId, "developer");
  if (access === false) return;
  const kind: string = [
    "compliance_audit",
    "requirements_summary",
    "traceability",
    "exec_brief",
    "brd",
    "prd",
    "frd",
    "test_cases",
    "architecture_doc",
    "hld",
    "lld",
    "deployment_doc",
    "user_manual",
  ].includes(b.kind)
    ? b.kind
    : "exec_brief";
  const tone: string = ["executive", "technical", "regulator"].includes(b.tone) ? b.tone : "executive";
  // Accept either the legacy singular `frameworkId` (back-compat) or the new
  // `frameworkIds: string[]` (multi-standard). The first valid id (when
  // present) is also stored on the report row in the singular `frameworkId`
  // column so existing UIs/filters keep working.
  const rawFrameworkIds = Array.isArray(b.frameworkIds)
    ? (b.frameworkIds as unknown[]).filter((x): x is string => typeof x === "string" && x.length > 0)
    : (typeof b.frameworkId === "string" && b.frameworkId.length > 0 ? [b.frameworkId] : []);
  // De-duplicate while preserving user-input order — the FIRST id picked is
  // the one we persist as the primary framework on the row, so listing /
  // filtering stays predictable.
  const frameworkIds = Array.from(new Set(rawFrameworkIds)).slice(0, 8);
  const primaryFrameworkId = frameworkIds[0] ?? null;

  // Compliance audit reports are meaningless without a standard to audit
  // against — enforce server-side (the UI also disables submit, but a direct
  // API call must still fail loudly).
  if (kind === "compliance_audit" && frameworkIds.length === 0) {
    res.status(400).json({ error: "compliance_audit reports require at least one standard in frameworkIds" });
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const reqs = await db.select().from(requirementsTable).where(eq(requirementsTable.projectId, projectId));
  const capas = await db.select().from(capaActionsTable).where(eq(capaActionsTable.projectId, projectId));
  const links = await db
    .select({
      reqCode: requirementsTable.code,
      reqTitle: requirementsTable.title,
      kind: traceabilityLinksTable.kind,
      filePath: codeArtifactsTable.filePath,
      symbol: codeArtifactsTable.symbol,
    })
    .from(traceabilityLinksTable)
    .innerJoin(requirementsTable, eq(traceabilityLinksTable.requirementId, requirementsTable.id))
    .innerJoin(codeArtifactsTable, eq(traceabilityLinksTable.codeArtifactId, codeArtifactsTable.id))
    .where(eq(requirementsTable.projectId, projectId));

  // Load every selected framework + the union of their controls. The first
  // matched framework is exposed as the singular `framework` field for back
  // compat with the existing report payload shape.
  let frameworks: typeof complianceFrameworksTable.$inferSelect[] = [];
  let controls: typeof complianceControlsTable.$inferSelect[] = [];
  if (frameworkIds.length > 0) {
    frameworks = await db
      .select()
      .from(complianceFrameworksTable)
      .where(inArray(complianceFrameworksTable.id, frameworkIds));
    if (frameworks.length > 0) {
      controls = await db
        .select()
        .from(complianceControlsTable)
        .where(inArray(complianceControlsTable.frameworkId, frameworks.map((f) => f.id)));
      // SQL `inArray` does not preserve input order — re-sort the loaded
      // frameworks back into the user-picked order so the singular `framework`
      // field below truly reflects the user's primary choice.
      const orderIndex = new Map(frameworkIds.map((id, i) => [id, i]));
      frameworks.sort((a, b) => (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0));
    }
  }
  const framework = frameworks[0];
  const standardsBlueprints = selectStandardsBlueprints(frameworks);
  const standardsAddendum = renderStandardsAddendum(standardsBlueprints, "document");

  const evidence: ReportContent["evidence"] = [
    ...reqs.map((r) => ({ id: r.code, label: r.title, source: "requirement" })),
    ...capas.map((c) => ({ id: c.code, label: c.title, source: "capa" })),
    ...controls.map((c) => ({ id: c.code, label: c.title, source: "control" })),
  ];

  const KIND_BLUEPRINT: Record<string, { label: string; sectionGuide: string; minSections: number; maxSections: number }> = {
    brd: {
      label: "Business Requirements Document",
      sectionGuide: `This is a CANONICAL Business Requirements Document. Produce these sections, in this order, using EXACTLY these headings (you may add at most one extra section if the project's data clearly demands it):
  1. "Business Context & Problem Statement" — why this initiative exists, current pain, market or regulatory pressure.
  2. "Stakeholders & Sponsors" — who funds it, who decides, who is impacted; if specific names aren't present in the data, describe roles.
  3. "Business Objectives & Success Metrics" — measurable outcomes the business expects; quantify wherever the data supports it.
  4. "Scope — In Scope / Out of Scope" — explicit bullet lists for each, derived from the requirement set.
  5. "Functional Requirements" — group by capability; cite the BRD/PRD/FRD requirement codes from the evidence list.
  6. "Non-Functional Requirements" — performance, security, availability, compliance; cite NFR codes from the evidence list.
  7. "Constraints, Assumptions & Dependencies" — technical, regulatory, contractual.
  8. "Risks & Mitigations" — top 3-6 with likelihood/impact qualifiers; reference any CAPA codes when applicable.
  9. "Acceptance Criteria & Sign-off" — what 'done' means at a business level; reference traceability where it exists.`,
      minSections: 7,
      maxSections: 10,
    },
    exec_brief: { label: "executive briefing", sectionGuide: "", minSections: 4, maxSections: 7 },
    compliance_audit: { label: "compliance audit report", sectionGuide: "", minSections: 4, maxSections: 7 },
    requirements_summary: { label: "requirements summary", sectionGuide: "", minSections: 4, maxSections: 7 },
    traceability: { label: "traceability narrative", sectionGuide: "", minSections: 4, maxSections: 7 },
    prd: {
      label: "Product Requirements Document",
      sectionGuide: `This is a CANONICAL Product Requirements Document — written for the engineering and design teams that will actually build the product. Produce these sections, in this order, using EXACTLY these headings:
  1. "Product Overview" — one-paragraph product positioning + the user/customer being served.
  2. "Goals & Non-Goals" — what shipping this product means; explicitly call out what is OUT of scope.
  3. "Personas & Use Cases" — primary and secondary users, with 2-4 representative scenarios.
  4. "User Stories & Acceptance Criteria" — group by epic; each story uses "As a … I want … so that …" + Given/When/Then acceptance bullets. Cite requirement codes.
  5. "Functional Requirements" — what the system must do; cite codes from the evidence list.
  6. "Non-Functional Requirements" — perf, security, accessibility, scalability targets with numeric thresholds.
  7. "UX Flows & Wireframes" — describe primary flows in prose (no images); call out edge cases and empty/error states.
  8. "Release Plan & Milestones" — phasing, dependencies, rollout strategy (dark launch / feature flag / GA).
  9. "Open Questions & Risks" — top 3-6 with owner and resolution date placeholders.`,
      minSections: 7,
      maxSections: 10,
    },
    frd: {
      label: "Functional Requirements Document",
      sectionGuide: `This is a CANONICAL Functional Requirements Document — the implementation contract between product and engineering. Produce these sections, in this order, using EXACTLY these headings:
  1. "System Context & Architecture" — narrative description of where this fits in the wider architecture; key services and integrations.
  2. "Functional Specifications" — itemised, numbered functions (FR-1, FR-2…) with input/output and behaviour for each. Cite requirement codes.
  3. "Data Model" — entities, attributes, key relationships, ownership boundaries (no SQL — narrative + bullets).
  4. "Interface Specifications" — every external API / event / queue this feature exposes or consumes; method, payload shape, expected status codes.
  5. "Business Rules & Validation" — invariants, constraints, derived fields, calculation rules.
  6. "Error Handling & Edge Cases" — categorised by severity; user-facing messaging vs. log-only.
  7. "Security & Compliance Controls" — auth/authz model, PII handling, audit logging; cite control codes from the evidence list.
  8. "Test Strategy" — unit / integration / e2e coverage plan; explicit links back to acceptance criteria.
  9. "Operational Concerns" — observability hooks, runbooks, rollback procedure.`,
      minSections: 7,
      maxSections: 10,
    },
    test_cases: {
      label: "Test Case Suite",
      sectionGuide: `This is a CANONICAL Test Case Suite generated from the project's requirements. Produce these sections, in this order, using EXACTLY these headings:
  1. "Suite Overview" — what this suite covers, total cases, breakdown by type.
  2. "Functional Test Cases" — for each major requirement, write 2-4 test cases. EACH case uses this exact format inside the section body:
     - "TC-<code>-NN — <short title>"
     - Preconditions:
     - Steps: numbered list
     - Expected result:
     - Linked requirement: <REQ code from evidence>
     - Priority: P0 / P1 / P2
  3. "Negative & Edge Case Tests" — boundary, invalid input, race condition cases — same format as above.
  4. "Non-Functional Tests" — performance, load, security, accessibility tests — same format.
  5. "Integration & E2E Scenarios" — multi-step user journeys spanning multiple requirements.
  6. "Regression Coverage Map" — narrative summary of which requirements have what level of test coverage; flag any gaps explicitly.
  7. "Execution & Maintenance Notes" — recommended test environments, data setup, ownership.`,
      minSections: 6,
      maxSections: 8,
    },
    architecture_doc: {
      label: "Architecture Description",
      sectionGuide: `This is a CANONICAL Architecture Description aligned to ISO/IEC/IEEE 42010:2022 (Systems and software engineering — Architecture description). Produce these sections, in this order, using EXACTLY these headings:
  1. "System Overview & Mission" — one-paragraph statement of what the system is for and the value it delivers; cite the BRD/PRD codes.
  2. "Stakeholders & Concerns" — table-style list (in prose) of every distinct stakeholder (sponsor, end-user, regulator, ops, security, finance, supplier) and their primary architectural concerns (e.g., latency, auditability, cost, data residency).
  3. "Architecture Drivers" — quality attributes (security, scalability, availability, performance, modifiability, cost) ordered by priority with quantified targets where the data supports it.
  4. "System Context" — what is inside vs. outside the system boundary; external actors, upstream/downstream systems, integration points.
  5. "Logical / Functional View" — major capabilities and how they map to coarse-grained components/services. Cite functional requirement codes per capability.
  6. "Process / Runtime View" — key runtime scenarios (auth, primary user journey, batch, failure recovery) described as numbered step sequences. Cite NFR codes for performance/SLA targets.
  7. "Data View" — entities, ownership, data flow, retention, classification (PII / regulated / public); cite data-related controls.
  8. "Deployment View" — physical topology: environments, regions, network zones, third-party SaaS dependencies; call out high-availability and disaster-recovery posture.
  9. "Cross-cutting Concerns" — security, identity, observability, internationalisation, accessibility — one paragraph each.
  10. "Architecture Decision Records (ADRs)" — list 4-8 significant decisions in this format inside the section body: "ADR-NN — <title>: Context / Decision / Consequences". Cite the requirement or compliance code each decision is anchored to.
  11. "Risks, Trade-offs & Open Questions" — top 3-6 architectural risks with likelihood/impact and proposed mitigations.`,
      minSections: 9,
      maxSections: 11,
    },
    hld: {
      label: "High-Level Design",
      sectionGuide: `This is a CANONICAL High-Level Software Design Description aligned to IEEE 1016. Produce these sections, in this order, using EXACTLY these headings:
  1. "Design Overview & Drivers" — one-paragraph summary plus the design drivers (quality attributes, constraints) inherited from the architecture.
  2. "Module Decomposition" — top-level modules / services / packages and their responsibilities. One bullet per module: name, responsibility, owns-which-data, depends-on. Cite requirement codes that justify each module.
  3. "Component Interactions" — describe the 4-8 most important component-to-component interactions in narrative form. For each: trigger, participants, message/payload summary, expected outcome.
  4. "External Interface Design" — every API the system exposes (REST / GraphQL / gRPC / events). For each: purpose, method+path or topic, request shape (bullets), response shape, error semantics. Cite interface-related requirements/controls.
  5. "Data Design (HL)" — major entities, relationships, ownership boundaries, key indices, data lifecycle. No SQL — narrative + bulleted attributes.
  6. "Tech Stack & Frameworks" — chosen languages, frameworks, datastores, message brokers, third-party services; one-line justification per choice tied to a driver.
  7. "Cross-cutting Design Concerns" — auth/authz, logging, metrics, tracing, config, secrets, error model — one paragraph each.
  8. "Design Constraints & Assumptions" — explicit list; flag anything the architecture assumed that the HLD now relies on.
  9. "Open Design Questions" — 3-6 unresolved decisions with proposed options and a recommendation.`,
      minSections: 7,
      maxSections: 10,
    },
    lld: {
      label: "Low-Level Design",
      sectionGuide: `This is a CANONICAL Low-Level Software Design Description aligned to IEEE 1016. Produce these sections, in this order, using EXACTLY these headings:
  1. "LLD Scope & Module Map" — which HLD modules this LLD covers; one paragraph per covered module restating its responsibility.
  2. "Class / Module Specifications" — for each significant class/module: name, purpose, key fields, key methods (signatures), invariants, owners. Cite requirement codes the class implements.
  3. "Function / Method Specifications" — for the 6-12 most critical functions, write a spec block: "<FunctionName>(args) -> ReturnType — Purpose / Preconditions / Postconditions / Side-effects / Error cases". Cite requirement codes.
  4. "API Endpoint Contracts" — every public endpoint with: HTTP method+path, auth requirement, path/query/body params (with types and validation rules), success response schema, error response schema, status codes. Cite interface requirements.
  5. "Data Structures & Schema" — table-by-table breakdown: columns (name, type, nullable, default), primary key, foreign keys, unique constraints, indexes, retention. Cite data requirements/controls.
  6. "Algorithms & Pseudocode" — for any non-trivial algorithm (matching, scoring, scheduling, conflict resolution): purpose, inputs, outputs, step-by-step pseudocode, complexity (Big-O), edge cases.
  7. "Error Handling, Logging & Tracing" — error taxonomy, retry policy, log level conventions, correlation/trace ID propagation rules.
  8. "Concurrency, Transactions & State" — locking strategy, transaction boundaries, idempotency keys, optimistic vs. pessimistic concurrency, state machines (with allowed transitions).`,
      minSections: 7,
      maxSections: 9,
    },
    deployment_doc: {
      label: "Deployment Document",
      sectionGuide: `This is a CANONICAL Deployment Document covering build, release, operations and rollback. Produce these sections, in this order, using EXACTLY these headings:
  1. "Deployment Overview" — what gets deployed, how often, by whom, what the SLOs are.
  2. "Environment Topology" — list every environment (dev / qa / staging / prod / dr) with intended purpose, data classification, who has access, and how it differs from prod.
  3. "Infrastructure Components" — compute, datastores, queues, caches, CDN, secrets store, identity provider — one bullet per component naming the provider, region, sizing/scale tier, and the requirement/control it backs.
  4. "Build & CI Pipeline" — source repo layout, branch strategy, CI stages (lint → unit → integration → security scan → build → publish), artefact storage, signing.
  5. "Release Strategy" — promotion model (manual gate / blue-green / canary / progressive), feature-flag conventions, schema-migration playbook, backwards-compat policy.
  6. "Configuration & Secrets Management" — how config differs across envs, where secrets live, rotation cadence, who can read them, audit trail.
  7. "Monitoring, Alerting & Observability" — metrics dashboards, log aggregation, distributed tracing, SLI/SLO/SLA, on-call routing, alert thresholds.
  8. "Backup, Recovery & DR" — what's backed up, RPO, RTO, restore drill cadence, DR region failover steps.
  9. "Rollback Procedure" — step-by-step rollback for the most likely failure modes (bad release, bad migration, regional outage). Include decision criteria.
  10. "Operational Runbook" — common incident playbooks (high error rate, slow API, full disk, expired cert), each as ordered steps with expected outputs.`,
      minSections: 8,
      maxSections: 10,
    },
    user_manual: {
      label: "User Manual",
      sectionGuide: `This is a CANONICAL User Manual aligned to IEEE 1063 (Software user documentation). Audience-first, task-oriented, screen-aware. Produce these sections, in this order, using EXACTLY these headings:
  1. "Audience & Conventions" — who this manual is for (named personas/roles), prerequisite knowledge, typographic conventions, support channel.
  2. "Getting Started" — first-run checklist: how to access the system, sign in, create a workspace/project, and reach the home screen. Numbered steps.
  3. "Key Concepts" — define every domain term the user will see in the UI (workspace, project, requirement, traceability link, control, framework, etc.) in 1-2 sentences each.
  4. "How-to: Core Tasks" — for each of the top 6-10 user goals (e.g. "Create a requirement", "Generate a BRD", "Run a gap analysis", "Invite a teammate"), write a numbered step-by-step procedure. Each step references the actual UI element ("click the **Generate report** button in the top-right").
  5. "Reference: Screens & Settings" — for each major screen: name, purpose, key controls, data shown, common actions. List user roles and what each can/can't do.
  6. "Permissions & Roles" — table-style summary (in prose) of workspace roles and project roles, with what each role can and cannot do.
  7. "Troubleshooting & FAQ" — top 8-15 issues a user will hit, each as "Symptom → Cause → Resolution" plus an FAQ block.
  8. "Glossary" — alphabetised plain-English definitions for every acronym and product-specific term used in this manual.`,
      minSections: 7,
      maxSections: 9,
    },
  };
  const blueprint = KIND_BLUEPRINT[kind] ?? KIND_BLUEPRINT.exec_brief!;

  const sysPrompt = `You are Auditee, an AI-native PDLC platform that produces enterprise-grade ${blueprint.label}s.

${TONE_SYSTEM[tone]}

Return STRICT JSON of shape:
{"title": string, "subtitle": string, "executiveSummary": string, "sections": [{"id": string, "heading": string, "body": string, "citations": string[]}]}

Rules:
- ${blueprint.minSections} to ${blueprint.maxSections} sections, each 120-260 words.
- Body uses GitHub-flavoured Markdown. Use bullet lists where useful.
- Every section must include 'citations' — IDs from the provided evidence list (requirement codes, CAPA codes, control codes). Empty array is acceptable only when the section is purely contextual.
- executiveSummary: 80-160 words, plain English.
- Do NOT invent codes or facts that aren't in the supplied data. If data is sparse, say so explicitly rather than fabricating.
- Output JSON only.${blueprint.sectionGuide ? `\n\nSection blueprint:\n${blueprint.sectionGuide}` : ""}${standardsAddendum}`;

  const evidenceForPrompt = evidence.slice(0, 200);
  const payload = {
    project: { name: project.name, description: project.description, owner: project.owner },
    reportKind: kind,
    framework: framework ? { code: framework.code, name: framework.name, status: framework.status } : null,
    applicableFrameworks: frameworks.map((f) => ({ code: f.code, name: f.name, status: f.status })),
    requirements: reqs.slice(0, 80).map((r) => ({
      code: r.code,
      title: r.title,
      type: r.type,
      status: r.status,
      priority: r.priority,
      description: r.description.slice(0, 400),
    })),
    capas: capas.slice(0, 40).map((c) => ({
      code: c.code,
      title: c.title,
      severity: c.severity,
      status: c.status,
      controlCode: c.controlCode,
    })),
    controls: controls.map((c) => ({ code: c.code, title: c.title, status: c.status })),
    traceabilityLinks: links.slice(0, 80),
    evidenceCatalog: evidenceForPrompt,
    extraInstructions: typeof b.instructions === "string" ? b.instructions.slice(0, 1000) : "",
  };

  type GenResult = {
    title: string;
    subtitle?: string;
    executiveSummary: string;
    sections: Array<{ id?: string; heading: string; body: string; citations?: string[] }>;
  };
  const result = await jsonCompletion<GenResult>(sysPrompt, JSON.stringify(payload).slice(0, 28000), { maxTokens: 12288 });

  const content: ReportContent = {
    title: result.title?.slice(0, 200) || `${project.name} — ${kind.replace("_", " ")}`,
    subtitle: result.subtitle?.slice(0, 240),
    executiveSummary: result.executiveSummary ?? "",
    sections: (result.sections ?? []).slice(0, 12).map((s, i) => ({
      id: s.id ?? `s-${i + 1}`,
      heading: s.heading.slice(0, 200),
      body: s.body,
      citations: Array.isArray(s.citations) ? s.citations.slice(0, 30) : [],
    })),
    evidence: evidenceForPrompt,
  };

  const [saved] = await db
    .insert(aiReportsTable)
    .values({
      id: randomUUID(),
      projectId,
      frameworkId: primaryFrameworkId,
      kind,
      tone,
      title: content.title,
      status: "draft",
      content,
      history: [{ at: new Date().toISOString(), instruction: "initial generation" }],
    })
    .returning();

  await db.insert(activityEventsTable).values({
    id: randomUUID(),
    kind: "report",
    message: `Auditee generated ${kind.replace("_", " ")} report: ${content.title}`,
    actor: "Auditee",
    entityCode: saved.id,
  });

  res.status(201).json(saved);
}));

router.post("/reports/:id/refine", consumeCredit(), asyncH(async (req, res) => {
  const id = req.params.id!;
  const instruction = typeof req.body?.instruction === "string" ? req.body.instruction.trim() : "";
  if (instruction.length < 3) {
    res.status(400).json({ error: "instruction is required" });
    return;
  }
  const [report] = await db.select().from(aiReportsTable).where(eq(aiReportsTable.id, id));
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  if (report.projectId) {
    const access = await requireProjectAccessInline(req, res, report.projectId, "developer");
    if (access === false) return;
  }
  const sysPrompt = `You are Auditee refining an existing report. Apply the user's instruction PRECISELY without re-writing untouched sections.
${TONE_SYSTEM[report.tone] ?? TONE_SYSTEM.executive}

Return STRICT JSON of the SAME shape as input:
{"title": string, "subtitle": string, "executiveSummary": string, "sections": [{"id": string, "heading": string, "body": string, "citations": string[]}]}

Rules:
- Preserve section IDs from the input where possible.
- Citations may only reference IDs in the provided evidence list.
- Output JSON only.`;
  const userPrompt = `Instruction: ${instruction}\n\nCurrent report:\n${JSON.stringify(report.content).slice(0, 24000)}`;
  type Refined = ReportContent;
  const refined = await jsonCompletion<Refined>(sysPrompt, userPrompt, { maxTokens: 12288 });

  const newContent: ReportContent = {
    title: refined.title?.slice(0, 200) || report.content.title,
    subtitle: refined.subtitle?.slice(0, 240),
    executiveSummary: refined.executiveSummary ?? report.content.executiveSummary,
    sections: (refined.sections ?? []).slice(0, 12).map((s, i) => ({
      id: s.id ?? `s-${i + 1}`,
      heading: s.heading?.slice(0, 200) ?? `Section ${i + 1}`,
      body: s.body ?? "",
      citations: Array.isArray(s.citations) ? s.citations.slice(0, 30) : [],
    })),
    evidence: report.content.evidence,
  };

  const [updated] = await db
    .update(aiReportsTable)
    .set({
      title: newContent.title,
      content: newContent,
      history: [...report.history, { at: new Date().toISOString(), instruction }],
      updatedAt: new Date(),
    })
    .where(eq(aiReportsTable.id, id))
    .returning();
  res.json(updated);
}));

router.patch("/reports/:id", async (req, res) => {
  const id = req.params.id!;
  const [target] = await db
    .select({ projectId: aiReportsTable.projectId, status: aiReportsTable.status })
    .from(aiReportsTable)
    .where(eq(aiReportsTable.id, id))
    .limit(1);
  if (target?.projectId) {
    // Approval / sign-off (status changes only) → reviewer+ is enough.
    // Editing title/content → developer+.
    const editingContent =
      typeof req.body?.title === "string" || (req.body?.content && typeof req.body.content === "object");
    const minRole = editingContent ? "developer" : "reviewer";
    const access = await requireProjectAccessInline(req, res, target.projectId, minRole);
    if (access === false) return;
  }
  const updates: Partial<typeof aiReportsTable.$inferInsert> = { updatedAt: new Date() };
  if (typeof req.body?.title === "string") updates.title = req.body.title.slice(0, 200);
  if (typeof req.body?.status === "string") updates.status = req.body.status;
  if (req.body?.content && typeof req.body.content === "object") updates.content = req.body.content;
  const [row] = await db.update(aiReportsTable).set(updates).where(eq(aiReportsTable.id, id)).returning();
  if (!row) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  res.json(row);
});

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;",
  );
}

function markdownToHtml(md: string): string {
  // Minimal MD → HTML for headings, bold, italic, code, lists, paragraphs.
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let inList = false;
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^\s*[-*]\s+/.test(line)) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${inline(line.replace(/^\s*[-*]\s+/, ""))}</li>`);
      continue;
    }
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
    if (line.length === 0) {
      out.push("");
      continue;
    }
    const h = /^(#{1,4})\s+(.+)$/.exec(line);
    if (h) {
      const level = Math.min(h[1]!.length + 2, 6);
      out.push(`<h${level}>${inline(h[2]!)}</h${level}>`);
      continue;
    }
    out.push(`<p>${inline(line)}</p>`);
  }
  if (inList) out.push("</ul>");
  return out.join("\n");

  function inline(s: string): string {
    return escapeHtml(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|\W)_([^_]+)_/g, "$1<em>$2</em>");
  }
}

function buildHtml(report: typeof aiReportsTable.$inferSelect): string {
  const c = report.content;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(c.title)}</title>
<style>
  :root { color-scheme: light; }
  body { font-family: 'Inter', system-ui, sans-serif; max-width: 820px; margin: 40px auto; padding: 0 24px; color: #0f172a; line-height: 1.55; }
  h1 { font-size: 28px; margin-bottom: 4px; }
  h2 { font-size: 18px; margin-top: 28px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
  .meta { color: #64748b; font-size: 13px; margin-bottom: 24px; }
  .summary { background: #f1f5f9; padding: 16px 20px; border-left: 3px solid #0ea5e9; border-radius: 4px; margin: 16px 0 28px; }
  .citations { font-size: 12px; color: #64748b; margin-top: 8px; }
  .citations span { display: inline-block; background: #e2e8f0; color: #0f172a; border-radius: 4px; padding: 2px 6px; margin-right: 4px; font-family: 'JetBrains Mono', monospace; }
  ul { padding-left: 22px; }
  code { background: #f1f5f9; padding: 1px 5px; border-radius: 3px; font-size: 0.92em; }
  hr { border: 0; border-top: 1px solid #e2e8f0; margin: 28px 0 12px; }
  footer { color: #94a3b8; font-size: 12px; margin-top: 40px; }
  @media print { body { margin: 16mm; } h2 { page-break-after: avoid; } section { page-break-inside: avoid; } }
</style></head><body>
<h1>${escapeHtml(c.title)}</h1>
${c.subtitle ? `<div class="meta">${escapeHtml(c.subtitle)}</div>` : ""}
<div class="meta">Generated by Auditee · ${new Date(report.updatedAt).toISOString().split("T")[0]} · tone: ${escapeHtml(report.tone)}</div>
<div class="summary"><strong>Executive Summary</strong><div>${markdownToHtml(c.executiveSummary)}</div></div>
${c.sections
  .map(
    (s) => `<section><h2>${escapeHtml(s.heading)}</h2>${markdownToHtml(s.body)}${
      s.citations && s.citations.length
        ? `<div class="citations">Evidence: ${s.citations.map((id) => `<span>${escapeHtml(id)}</span>`).join("")}</div>`
        : ""
    }</section>`,
  )
  .join("\n")}
<hr/><h2>Evidence Index</h2><ul>${c.evidence
    .slice(0, 80)
    .map((e) => `<li><code>${escapeHtml(e.id)}</code> — ${escapeHtml(e.label)} <em>(${escapeHtml(e.source)})</em></li>`)
    .join("")}</ul>
<footer>Auto-generated. Use Ctrl/Cmd+P → Save as PDF for a printable copy.</footer>
</body></html>`;
}

function buildDocx(report: typeof aiReportsTable.$inferSelect): Document {
  const c = report.content;
  const paragraphs: Paragraph[] = [];
  paragraphs.push(new Paragraph({ text: c.title, heading: HeadingLevel.TITLE }));
  if (c.subtitle) paragraphs.push(new Paragraph({ text: c.subtitle, heading: HeadingLevel.HEADING_3 }));
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated by Auditee · ${new Date(report.updatedAt).toISOString().split("T")[0]} · tone: ${report.tone}`,
          italics: true,
          color: "64748B",
        }),
      ],
    }),
  );
  paragraphs.push(new Paragraph({ text: "Executive Summary", heading: HeadingLevel.HEADING_1 }));
  for (const line of c.executiveSummary.split(/\n+/)) {
    if (line.trim()) paragraphs.push(new Paragraph({ children: [new TextRun(line.trim())] }));
  }
  for (const s of c.sections) {
    paragraphs.push(new Paragraph({ text: s.heading, heading: HeadingLevel.HEADING_1 }));
    for (const raw of s.body.split(/\n+/)) {
      const line = raw.trim();
      if (!line) continue;
      if (/^[-*]\s+/.test(line)) {
        paragraphs.push(new Paragraph({ text: line.replace(/^[-*]\s+/, ""), bullet: { level: 0 } }));
      } else {
        paragraphs.push(new Paragraph({ children: [new TextRun(line)] }));
      }
    }
    if (s.citations && s.citations.length) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Evidence: ", bold: true, color: "64748B" }),
            new TextRun({ text: s.citations.join(", "), color: "64748B" }),
          ],
        }),
      );
    }
  }
  paragraphs.push(new Paragraph({ text: "Evidence Index", heading: HeadingLevel.HEADING_1 }));
  for (const e of c.evidence.slice(0, 200)) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${e.id}`, bold: true }),
          new TextRun({ text: ` — ${e.label} (${e.source})` }),
        ],
      }),
    );
  }
  return new Document({ sections: [{ children: paragraphs }] });
}

router.get("/reports/:id/export", asyncH(async (req, res) => {
  const id = req.params.id!;
  const format = (typeof req.query.format === "string" ? req.query.format : "html").toLowerCase();
  const [report] = await db.select().from(aiReportsTable).where(eq(aiReportsTable.id, id));
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  if (report.projectId) {
    const access = await requireProjectAccessInline(req, res, report.projectId, "auditor");
    if (access === false) return;
  }
  const baseName = report.title.replace(/[^\w\d-]+/g, "-").slice(0, 80) || "report";
  if (format === "html") {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", `inline; filename="${baseName}.html"`);
    res.send(buildHtml(report));
    return;
  }
  if (format === "docx") {
    const doc = buildDocx(report);
    const buf = await Packer.toBuffer(doc);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${baseName}.docx"`);
    res.send(buf);
    return;
  }
  if (format === "pdf") {
    // Honest implementation: deliver print-ready HTML and instruct the browser
    // to use its native PDF print pipeline. No headless Chromium dependency required.
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", `inline; filename="${baseName}.html"`);
    res.send(
      buildHtml(report).replace(
        "</body>",
        `<script>window.addEventListener('load', () => setTimeout(() => window.print(), 350));</script></body>`,
      ),
    );
    return;
  }
  res.status(400).json({ error: "format must be html, docx, or pdf" });
}));

export default router;
