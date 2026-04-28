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
import { renderWithCompanyTemplate } from "../lib/companyTemplate";

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
    // Core
    "compliance_audit",
    "requirements_summary",
    "traceability",
    "exec_brief",
    // Requirements / Design / Build
    "brd",
    "prd",
    "frd",
    "test_cases",
    "architecture_doc",
    "hld",
    "lld",
    "deployment_doc",
    "user_manual",
    // Functional safety (ISO 26262, IEC 61508, EN 50128, ISO 13849)
    "safety_plan",
    "hara",
    "safety_concept",
    "tech_safety_concept",
    "safety_case",
    "fmea",
    "fta",
    "dia",
    "srs_safety",
    // Cybersecurity (ISO/SAE 21434, IEC 62443, ISO 27001, NIST)
    "cybersecurity_plan",
    "tara",
    "cybersecurity_concept",
    "cybersecurity_case",
    "security_risk_assessment",
    // Software aspects (DO-178C, IEC 62304, IEEE 730)
    "psac",
    "software_dev_plan",
    "software_verification_plan",
    "software_qa_plan",
    "soup_list",
    // Configuration & quality
    "scmp",
    "ci_list",
    "change_control_plan",
    "vnv_plan",
    // Risk
    "risk_management_plan",
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
    test_execution_report: {
      label: "Test Execution Report",
      sectionGuide: `This is a CANONICAL Test Execution Report capturing the outcome of an AI-driven test run. Produce these sections, in this order, using EXACTLY these headings:
  1. "Run Summary" — total cases run, pass / fail / inconclusive counts, overall pass rate, scope of source material reviewed.
  2. "Per-Case Verdicts" — for each test case, write a sub-block in this exact format inside the section body:
     - "[VERDICT] <Test Case Title>"
     - Level / Discipline:
     - Evidence:
     - Reasoning:
  3. "Failures & Inconclusive Cases" — group the non-passing cases; for each, give a short remediation suggestion.
  4. "Coverage & Confidence" — narrative on how representative the run was (which levels/disciplines were exercised), and any blind spots.
  5. "Recommendations" — top 3-6 next actions for the team (fix bugs, broaden test data, re-run after change).`,
      minSections: 4,
      maxSections: 6,
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
    // ============================================================
    // FUNCTIONAL SAFETY (ISO 26262 / IEC 61508 / ISO 13849 / EN 50128)
    // ============================================================
    safety_plan: {
      label: "Safety Plan",
      sectionGuide: `This is a CANONICAL functional Safety Plan aligned to ISO 26262-2 / IEC 61508-1. Produce these sections, in this order, using EXACTLY these headings:
  1. "Scope & Item Definition" — the item/system the plan governs, lifecycle phase, intended use, operational environment, vehicle/system class.
  2. "Safety Goals & Integrity Level" — top-level safety goals derived from HARA; assigned ASIL/SIL/PL with rationale; cite requirement codes.
  3. "Safety Lifecycle & Milestones" — phases (concept, development, production, operation, decommissioning) with deliverables and gating reviews.
  4. "Roles, Responsibilities & Competence" — Safety Manager, Functional Safety Engineer, Independent Assessor; competence requirements and training plan.
  5. "Tailoring & Justifications" — every clause/work product tailored or omitted with rationale; reference the standard sub-clause.
  6. "Methods, Tools & Tool Qualification" — methods chosen per phase, TCL/TD assessment for software tools, tool confidence rationale.
  7. "Confirmation Measures & Independent Assessment" — confirmation reviews, functional safety audit, functional safety assessment with independence levels.
  8. "Communication & Interfaces" — DIA references, interfaces with cybersecurity, with quality, with project management; meeting cadence.
  9. "Change & Configuration Management" — link to SCMP and CI list; change-impact rules for safety-related items.
  10. "Issue, Anomaly & Field Monitoring" — production/field feedback loop, anomaly classification, residual-risk reassessment trigger.`,
      minSections: 8,
      maxSections: 10,
    },
    hara: {
      label: "HARA — Hazard Analysis & Risk Assessment",
      sectionGuide: `This is a CANONICAL Hazard Analysis and Risk Assessment per ISO 26262-3 (or IEC 61508-1 §7.4 for industrial). Produce these sections, in this order, using EXACTLY these headings:
  1. "Item Definition Recap" — boundary, functions, operating modes, interfaces; cite the BRD/PRD codes.
  2. "Operational Situation Analysis" — situations the item operates in (driving scenarios, road type, weather, traffic density, driver state); enumerate the catalogue used.
  3. "Hazard Identification" — list each hazardous event in the format "HAZ-NN — Function/Malfunction → Effect at vehicle level → Possible accident". Cover loss of function, unintended activation, incorrect output, stuck values, untimely.
  4. "Severity (S) Classification" — for each hazard assign S0–S3 with one-sentence rationale anchored to AIS injury class.
  5. "Exposure (E) Classification" — for each hazard assign E0–E4 with rationale (frequency or duration).
  6. "Controllability (C) Classification" — for each hazard assign C0–C3 with rationale (driver/operator avoidability).
  7. "ASIL / SIL Determination" — for each hazard derive ASIL (or SIL/PL for IEC 61508 / ISO 13849) from S×E×C; tabulate in prose.
  8. "Safety Goals" — one Safety Goal per top-rated hazard; format "SG-NN — <statement>" with assigned ASIL and safe-state definition. Cite requirement codes that will inherit from each goal.
  9. "Assumptions, Verification & Open Items" — explicit assumptions of use (AoU), verification method per safety goal, items deferred to system design.`,
      minSections: 8,
      maxSections: 10,
    },
    safety_concept: {
      label: "Functional Safety Concept (FSC)",
      sectionGuide: `This is a CANONICAL Functional Safety Concept per ISO 26262-3 §7. Produce these sections, in this order, using EXACTLY these headings:
  1. "Inputs from HARA" — restate Safety Goals (with ASIL) and the safe states they protect; cite HAZ/SG codes.
  2. "Functional Safety Requirements (FSR)" — derive FSRs that satisfy each Safety Goal; format "FSR-NN [ASIL X] — <requirement>" with parent SG and target system function. Cite requirement codes.
  3. "Allocation to Preliminary Architecture" — assign each FSR to a logical element (sensor, controller, actuator, monitor, watchdog, plausibility check, fallback); explain ASIL decomposition where applied.
  4. "Operating Modes & Safe States" — for each safety goal, name the safe state(s), the transition trigger, and the entry/exit conditions.
  5. "Fault Tolerance & Fault Reaction Time Interval (FTTI)" — for each FSR, define FTTI, fault tolerance time, single-point and multi-point fault metrics targets.
  6. "Warning & Degradation Strategy" — driver warning, derating, limp-home, recovery; required HMI signals.
  7. "Verification of the FSC" — review and analysis methods (walkthrough, FMEA, FTA refs), and how FSRs trace to TSC and downstream HW/SW requirements.
  8. "Assumptions, Constraints & Open Items" — assumptions of use, environmental constraints, items deferred to TSC.`,
      minSections: 7,
      maxSections: 9,
    },
    tech_safety_concept: {
      label: "Technical Safety Concept (TSC)",
      sectionGuide: `This is a CANONICAL Technical Safety Concept per ISO 26262-4 §7. Produce these sections, in this order, using EXACTLY these headings:
  1. "Inputs from FSC" — list inherited Functional Safety Requirements with ASIL; cite FSR codes.
  2. "System Architecture (Technical View)" — block diagram in narrative form: ECUs, sensors, actuators, communication buses (CAN/LIN/Ethernet), redundancy structure, monitoring elements.
  3. "Technical Safety Requirements (TSR)" — derive TSRs from each FSR; format "TSR-NN [ASIL X] — <requirement>" with parent FSR and HW/SW allocation. Include diagnostic and monitoring TSRs.
  4. "Safety Mechanisms" — list every safety mechanism (range checks, plausibility, watchdogs, lock-step CPU, ECC, end-to-end protection); link to the TSR each detects/mitigates and the diagnostic coverage target (DC).
  5. "HW/SW Allocation & Interfaces" — which TSRs are realised in HW vs SW; interface contracts (signal name, range, timing, ASIL); reference HSI document.
  6. "Quantitative Targets" — PMHF/SPFM/LFM targets per ASIL; FTTI and fault reaction time per TSR; failure rate budgets.
  7. "ASIL Decomposition & Independence Arguments" — every decomposition with rationale; freedom-from-interference arguments (timing, memory, exchange of information).
  8. "Verification & Integration Strategy" — verification methods per TSR (analysis, simulation, HIL, vehicle test), integration sequence, acceptance criteria.`,
      minSections: 7,
      maxSections: 9,
    },
    safety_case: {
      label: "Safety Case",
      sectionGuide: `This is a CANONICAL Safety Case (assurance argument) per ISO 26262-2 / IEC 61508-1 / DO-178C §11.20. Use a Goal-Structuring-Notation-style argument in prose. Produce these sections, in this order, using EXACTLY these headings:
  1. "Top Claim" — single sentence: "The <item> is acceptably safe for its intended use in <context>." Anchor to ASIL/SIL/DAL.
  2. "Argument Strategy" — how the top claim is decomposed (by Safety Goal, by lifecycle phase, by hazard category); name the decomposition strategy.
  3. "Sub-Claims by Safety Goal" — for each SG: a sub-claim, supporting sub-arguments, and the evidence references (FSC, TSC, FMEA, FTA, test reports, field data).
  4. "Process Compliance Argument" — claim that the development process conformed to the standard; reference Safety Plan, audits, and confirmation measures.
  5. "Product Compliance Argument" — claim that the product satisfies all Safety Goals; reference verification, validation, integration tests, quantitative metric achievement (PMHF/SPFM/LFM).
  6. "Independent Assessment & Confirmation Measures" — assessor reports, confirmation reviews, audit findings and their disposition.
  7. "Residual Risk & Operational Constraints" — known limitations, assumptions of use, operator/driver instructions required for safe operation.
  8. "Open Issues, Justifications & Caveats" — every open item with disposition plan; explicit justification for any tailoring or deviation.`,
      minSections: 7,
      maxSections: 9,
    },
    fmea: {
      label: "FMEA / FMEDA",
      sectionGuide: `This is a CANONICAL Failure Mode and Effects Analysis (System / Design / Process / FMEDA flavour as appropriate). Produce these sections, in this order, using EXACTLY these headings:
  1. "Scope, Boundary & Type" — what is under analysis (system / design / process / hardware), system boundary, interfaces; FMEA type (DFMEA/PFMEA/FMEDA) and standard followed (AIAG-VDA / SAE J1739 / IEC 60812).
  2. "Function & Block Decomposition" — functions analysed and the items realising them; for FMEDA include the basic-element list with failure-rate source (SN 29500 / IEC 62380).
  3. "Failure Modes Catalogue" — for each item: every failure mode considered (no/loss, intermittent, stuck, drift, premature, untimely, incorrect output).
  4. "Effects Analysis (Local / Next-Higher / End)" — for each failure mode: local effect, effect on next-higher level, end effect on the user/vehicle/process. Cite the safety goal violated where applicable.
  5. "Severity / Occurrence / Detection (S/O/D) and RPN or Action Priority" — assign S, O, D per AIAG-VDA AP table (or compute RPN) for each failure mode; tabulate in prose.
  6. "Diagnostic Coverage & Safety Mechanisms (FMEDA-specific)" — for each failure mode list the safety mechanism, diagnostic coverage, and classification (safe / detected dangerous / undetected dangerous).
  7. "Quantitative Metrics (FMEDA only)" — SPFM, LFM, PMHF computed against ASIL targets; pass/fail per safety goal.
  8. "Recommended Actions & Owners" — for any AP=H/RPN above threshold or unmet metric, recommended action, owner, due date, re-evaluation result.`,
      minSections: 6,
      maxSections: 8,
    },
    fta: {
      label: "Fault Tree Analysis (FTA)",
      sectionGuide: `This is a CANONICAL Fault Tree Analysis per IEC 61025 / NUREG-0492 used as a deductive complement to FMEA. Produce these sections, in this order, using EXACTLY these headings:
  1. "Scope & Top Event" — the undesired top event under analysis (typically a Safety Goal violation); cite SG code and associated ASIL/SIL.
  2. "System Description & Boundary" — what is in scope; assumptions, success criteria, mission time.
  3. "Fault Tree Structure" — describe the tree in narrative + indented bullet form. Use AND / OR / NOT / k-of-n gates; each intermediate event has a label "IE-NN" and basic events "BE-NN" with description and source data reference.
  4. "Cut Set Analysis" — list the minimal cut sets (or representative top-N if many); identify single-point failures, common-cause failures, order of cut sets.
  5. "Quantitative Analysis" — assign failure rates / probabilities to basic events; compute top-event probability and importance measures (Fussell-Vesely, Birnbaum) for the top contributors.
  6. "Common-Cause & Dependency Analysis" — explicit treatment of CCF (β-factor or similar), shared resources, software CCF, environmental commonality.
  7. "Findings & Design Implications" — single points of failure to remove, weak gates needing redundancy or safety mechanism, links to FMEDA results and TSC mechanisms.
  8. "Assumptions, Limitations & Open Items" — data sources, confidence intervals, items deferred to detailed design.`,
      minSections: 6,
      maxSections: 8,
    },
    dia: {
      label: "Development Interface Agreement (DIA)",
      sectionGuide: `This is a CANONICAL Development Interface Agreement per ISO 26262-8 §5 between customer (e.g., OEM) and supplier (e.g., Tier-1). Produce these sections, in this order, using EXACTLY these headings:
  1. "Parties & Item Scope" — customer and supplier, item/system covered, applicable variants, contract reference.
  2. "Activity Responsibility Matrix (RACI)" — for every safety lifecycle work product (Safety Plan, HARA, FSC, TSC, HSI, integration, V&V, assessment) state R/A/C/I per party.
  3. "Joint Activities & Reviews" — kick-off, technical reviews, safety audits, FSA, milestone gates; cadence and decision authority.
  4. "Information & Work-Product Exchange" — exact deliverables exchanged each direction, format, classification, delivery channel, retention.
  5. "Tailoring of Standard" — every clause tailored, omitted or deviated; rationale and approver.
  6. "Tools, Methods & Languages" — agreed engineering tools, qualification status (TCL), modelling languages, units, naming conventions.
  7. "Communication, Issue & Change Management" — escalation path, response SLAs, change request process, anomaly reporting, joint CCB.
  8. "Confidentiality, IP & Compliance" — handling of confidential data, IP ownership of work products, export-control, archival.`,
      minSections: 6,
      maxSections: 8,
    },
    srs_safety: {
      label: "Safety Requirements Specification",
      sectionGuide: `This is a CANONICAL Safety Requirements Specification per IEC 61508-1 §7.10 (or ISO 26262 software/hardware safety requirements). Produce these sections, in this order, using EXACTLY these headings:
  1. "Scope & Inputs" — the SIL/ASIL targets inherited; reference Safety Plan and FSC/TSC.
  2. "Safety Functions Catalogue" — each safety function (SF-NN) with description, demand mode (low/high/continuous), associated safe state.
  3. "Safety Integrity Requirements" — per SF: target SIL/ASIL, PFD/PFH targets, fault tolerance (HFT), SFF, diagnostic coverage; cite the standard tables used.
  4. "Functional Safety Requirements" — itemised "SR-NN" with shall-statements, parent SF, allocation (sensor/logic/actuator/HW/SW), verification method.
  5. "Operational & Environmental Constraints" — temperature, EMC, vibration, humidity, supply voltage, expected mission profile.
  6. "Interface & Independence Requirements" — required interfaces, freedom-from-interference (timing, memory, communication), partitioning constraints.
  7. "Validation & Acceptance Criteria" — pass/fail criteria per SF; coverage targets; verification method matrix.
  8. "Traceability & Change Control" — bidirectional trace to FSC/TSC and to downstream HW/SW; change-impact rules for safety-classified rows.`,
      minSections: 6,
      maxSections: 8,
    },
    // ============================================================
    // CYBERSECURITY (ISO/SAE 21434 / IEC 62443 / ISO 27001 / NIST)
    // ============================================================
    cybersecurity_plan: {
      label: "Cybersecurity Plan",
      sectionGuide: `This is a CANONICAL Cybersecurity Plan aligned to ISO/SAE 21434 §6 (or IEC 62443-4-1 SM-1 for industrial). Produce these sections, in this order, using EXACTLY these headings:
  1. "Scope & Item Definition" — item/system covered, lifecycle phase, intended use, threat exposure profile.
  2. "Cybersecurity Goals & Risk Acceptance Criteria" — top-level goals from TARA; risk treatment policy; acceptable residual-risk bands.
  3. "Lifecycle Phases & Milestones" — concept, product development, post-development, end-of-cybersecurity-support; deliverables and gates per phase.
  4. "Roles, Responsibilities & Competence" — Cybersecurity Manager, Cybersecurity Engineer, PSIRT, independent assessor; competence and training plan.
  5. "Tailoring & Justifications" — every clause/work product tailored or omitted with rationale; reference standard clause.
  6. "Methods, Tools & Cryptography Policy" — chosen analysis methods, secure-coding standards, crypto algorithm/keylength baseline, tool list and qualification.
  7. "Cybersecurity Interface to Functional Safety & Quality" — coordination touchpoints with safety lifecycle (joint reviews, shared evidence), DIA references, link to QMS.
  8. "Vulnerability, Incident & Field Monitoring" — vulnerability management process, PSIRT workflow, CVE intake, field telemetry, incident response.
  9. "Distributed Cybersecurity Activities" — cybersecurity interface agreement (CIA) with suppliers; supplier capability assessment; off-the-shelf component handling.
  10. "End-of-Cybersecurity-Support" — criteria for declaring EOCS, customer notification, secure decommissioning.`,
      minSections: 8,
      maxSections: 10,
    },
    tara: {
      label: "TARA — Threat Analysis & Risk Assessment",
      sectionGuide: `This is a CANONICAL Threat Analysis and Risk Assessment per ISO/SAE 21434 §15 (or IEC 62443-3-2 for industrial). Produce these sections, in this order, using EXACTLY these headings:
  1. "Item Definition & Asset Identification" — system boundary, functions, interfaces; enumerate cybersecurity assets (data, functions, keys, credentials) with their cybersecurity properties (C/I/A/Authenticity/Authorization/Non-repudiation).
  2. "Damage Scenarios" — for each asset/property, possible damage scenario "DS-NN — <description>" with impact category (safety, financial, operational, privacy) and impact rating (severe/major/moderate/negligible).
  3. "Threat Scenarios" — derive threat scenarios "TS-NN — <attacker action> on <asset.property> causing <DS>" using STRIDE or equivalent enumeration.
  4. "Attack Path Analysis" — for each TS, decompose into attack paths "AP-NN" with sequential attack steps, required tools, and entry points (debug ports, OBD, telematics, OTA, supply chain).
  5. "Attack Feasibility Rating" — per attack path, rate elapsed time, expertise, knowledge, window of opportunity, equipment (per ISO 21434 Annex G or CVSS); derive feasibility (high/medium/low/very-low).
  6. "Risk Determination" — combine impact (from DS) and feasibility (from AP) into risk value 1–5 per threat scenario; tabulate.
  7. "Risk Treatment Decisions" — per risk: avoid / reduce / share / retain; required cybersecurity goals "CG-NN" with target residual risk; cite requirement codes that will inherit.
  8. "Assumptions, Limitations & Open Items" — assumptions of use, environment, items deferred to cybersecurity concept; review trigger conditions.`,
      minSections: 7,
      maxSections: 9,
    },
    cybersecurity_concept: {
      label: "Cybersecurity Concept",
      sectionGuide: `This is a CANONICAL Cybersecurity Concept per ISO/SAE 21434 §9. Produce these sections, in this order, using EXACTLY these headings:
  1. "Inputs from TARA" — restate Cybersecurity Goals with associated risk levels; cite CG codes.
  2. "Cybersecurity Requirements (CSR)" — derive CSRs from each CG; format "CSR-NN — <shall statement>" with parent CG and target subsystem. Cover access control, authentication, integrity, confidentiality, availability, secure boot, secure update, logging.
  3. "Allocation to Architecture" — map each CSR to an architectural element (HSM, secure element, gateway, MAC, TLS terminator, IDS); justify the placement.
  4. "Cybersecurity Controls Catalogue" — per control: type (preventive/detective/corrective), technology, configuration baseline, expected strength.
  5. "Key, Identity & Credential Management" — key hierarchy, generation, distribution, rotation, revocation; identity provisioning; credential storage.
  6. "Secure Boot, Update & Diagnostics" — chain of trust, signature scheme, anti-rollback, update integrity, JTAG/UDS lockdown.
  7. "Monitoring, Logging & Incident Response" — what is logged, where, retention, integrity protection; on-board vs off-board IDS; PSIRT escalation.
  8. "Verification of the Concept" — methods (review, threat-model walkthrough, pen-test scope) and traceability to downstream cybersecurity specs.`,
      minSections: 6,
      maxSections: 9,
    },
    cybersecurity_case: {
      label: "Cybersecurity Case",
      sectionGuide: `This is a CANONICAL Cybersecurity Case per ISO/SAE 21434 §6.4.5 — an argued, evidence-backed claim of cybersecurity for the item across the lifecycle. Produce these sections, in this order, using EXACTLY these headings:
  1. "Top Claim" — single sentence: "The <item> achieves its cybersecurity goals to an acceptable residual risk for its intended use." State scope and version.
  2. "Argument Strategy" — how the top claim is decomposed (by cybersecurity goal, by attack path, by lifecycle phase).
  3. "Sub-Claims by Cybersecurity Goal" — for each CG: sub-claim, sub-arguments, evidence references (TARA, concept, design, verification, pen-test, field).
  4. "Process Compliance Argument" — claim of conformance to ISO 21434 / 62443 process; reference Cybersecurity Plan, audits, assessor reports.
  5. "Product Compliance Argument" — claim that the product realises the cybersecurity controls; reference verification & validation results, vulnerability scans, fuzz testing, pen-test reports.
  6. "Operational & Post-Development Argument" — claim of continued cybersecurity through monitoring, vulnerability management, incident response, secure update.
  7. "Residual Risk & Operational Caveats" — known unmitigated threats, accepted risks with rationale, required customer/operator actions.
  8. "Open Issues, Caveats & Maintenance Plan" — open items with disposition, conditions that trigger reassessment, EOCS plan.`,
      minSections: 7,
      maxSections: 9,
    },
    security_risk_assessment: {
      label: "Security Risk Assessment",
      sectionGuide: `This is a CANONICAL Security Risk Assessment aligned to NIST SP 800-30 / ISO 27005 / IEC 62443-3-2 — applicable when the project follows an enterprise/industrial security framework rather than ISO 21434. Produce these sections, in this order, using EXACTLY these headings:
  1. "System Characterisation" — purpose, boundary, data classification, users, interfaces, hosting model; cite requirement codes for system context.
  2. "Asset Inventory & Valuation" — every asset (data store, service, key material, credential) with confidentiality/integrity/availability rating.
  3. "Threat Source Identification" — adversarial (nation-state, criminal, insider) and non-adversarial (accidental, environmental) sources with capability/intent rating.
  4. "Vulnerability Identification" — known vulnerabilities (CWE/CVE references, mis-configurations, design weaknesses); link to assets.
  5. "Likelihood & Impact Determination" — for each threat × vulnerability pair, rate likelihood (Very Low–Very High) and impact (Very Low–Very High) with rationale.
  6. "Risk Ranking & Treatment" — composite risk score per threat scenario; treatment decision (mitigate / transfer / accept / avoid); residual risk after treatment.
  7. "Recommended Controls (with framework mapping)" — per high/medium risk: control description mapped to NIST SP 800-53 / ISO 27001 Annex A / CIS controls; cite control codes.
  8. "Assumptions, Constraints & Reassessment Triggers" — explicit assumptions, boundary conditions, schedule for periodic reassessment, change triggers.`,
      minSections: 6,
      maxSections: 8,
    },
    // ============================================================
    // SOFTWARE ASPECTS (DO-178C / IEC 62304 / IEEE 730)
    // ============================================================
    psac: {
      label: "Plan for Software Aspects of Certification (PSAC)",
      sectionGuide: `This is a CANONICAL Plan for Software Aspects of Certification per RTCA DO-178C §11.1. Produce these sections, in this order, using EXACTLY these headings:
  1. "System Overview" — aircraft/system, intended function, software's role; reference system safety assessment.
  2. "Software Overview" — partitions, executables, target hardware, languages, third-party components.
  3. "Certification Considerations" — applicable means of compliance, certification basis, software level (DAL A–E), justification for level.
  4. "Software Lifecycle" — chosen lifecycle model, transition criteria between phases, integral processes (verification, configuration management, quality assurance).
  5. "Software Lifecycle Data" — list every plan and standard (SDP, SVP, SCMP, SQAP, requirements, design, code, test results) with format and control category (CC1/CC2).
  6. "Schedule & Milestones" — high-level schedule with SOI (Stage of Involvement) reviews 1–4 and certification authority engagement.
  7. "Additional Considerations" — tool qualification (per DO-330), previously developed software, COTS/SOUP, deactivated code, parameter data items, model-based development (DO-331), object-oriented (DO-332), formal methods (DO-333).
  8. "Compliance Substantiation" — how each DO-178C objective will be satisfied per software level; reference V&V plans and SQA plan.`,
      minSections: 7,
      maxSections: 9,
    },
    software_dev_plan: {
      label: "Software Development Plan (SDP)",
      sectionGuide: `This is a CANONICAL Software Development Plan per DO-178C §11.2 / IEC 62304 §5.1 / IEEE 12207. Produce these sections, in this order, using EXACTLY these headings:
  1. "Scope & Software Classification" — software item, intended function, safety class (DAL or IEC 62304 A/B/C), governing standards.
  2. "Lifecycle Model & Phases" — chosen model (V-model / iterative); phases with entry/exit criteria, inputs, outputs, transition criteria.
  3. "Development Environment" — target & host hardware, OS, compilers, debuggers, simulators with versions; tool qualification status.
  4. "Standards & Methods" — requirements standards, design standards, coding standards (e.g., MISRA C / CERT / AUTOSAR C++), modelling notations, design methods.
  5. "Software Architecture & Module Strategy" — high-level architectural style, partitioning approach, control/data coupling rules, module size limits.
  6. "Reuse, COTS & SOUP Policy" — criteria for accepting reused / COTS / SOUP components; documentation expectations; risk analysis for unknown provenance items.
  7. "Deviation, Anomaly & Problem Reporting" — process for raising and tracking problem reports, deviation handling, anomaly classification.
  8. "Schedule, Resources & Roles" — staffing, key roles, training, milestone schedule aligned to PSAC; review and audit cadence.`,
      minSections: 6,
      maxSections: 8,
    },
    software_verification_plan: {
      label: "Software Verification Plan (SVP)",
      sectionGuide: `This is a CANONICAL Software Verification Plan per DO-178C §11.3 / IEC 62304 §5.6. Produce these sections, in this order, using EXACTLY these headings:
  1. "Scope & Verification Objectives" — software item under verification, software level / safety class, applicable objectives table reference (DO-178C Annex A or IEC 62304).
  2. "Verification Methods" — review, analysis, test (low-level test, software integration test, hardware-software integration test); independence requirements per level.
  3. "Reviews & Analyses" — per artefact (requirements, design, code, test cases): review checklist, analysis type (data/control coupling, WCET, stack, partition integrity, accuracy), entry/exit criteria.
  4. "Test Environment & Tools" — target vs host, simulators, instrumentation, coverage tools; tool qualification per DO-330 if applicable.
  5. "Test Selection & Coverage Criteria" — requirements-based test selection, equivalence/boundary, robustness; structural coverage targets (statement / decision / MC/DC) per level; data and control coupling coverage.
  6. "Verification of Verification" — review of test cases & procedures, review of test results, structural coverage analysis & resolution of unintended functions and dead/deactivated code.
  7. "Re-verification & Regression Strategy" — change-impact analysis, regression scope determination, automated re-run policy.
  8. "Records, Independence & Schedule" — verification records to be produced, independence matrix, milestones aligned to SDP.`,
      minSections: 6,
      maxSections: 8,
    },
    software_qa_plan: {
      label: "Software Quality Assurance Plan (SQAP)",
      sectionGuide: `This is a CANONICAL Software Quality Assurance Plan per IEEE 730 / DO-178C §11.5. Produce these sections, in this order, using EXACTLY these headings:
  1. "Purpose, Scope & References" — software item, applicable standards, contract reference, related plans.
  2. "SQA Organisation & Independence" — SQA roles, reporting line, independence from development, authority to escalate and stop work.
  3. "SQA Activities & Tasks" — process audits, product audits, conformance reviews, witness of tests, transition reviews; cadence per phase.
  4. "Standards, Practices & Conventions" — standards SQA will assess against (coding, documentation, requirements, configuration management); criteria for compliance.
  5. "Reviews & Audits" — formal reviews to be witnessed (PDR, CDR, FCA, PCA, transition reviews); checklist availability; non-conformance handling.
  6. "Problem Reporting, Corrective & Preventive Action" — anomaly intake, classification, root-cause analysis, CAPA cadence; trend reporting.
  7. "Tools, Techniques & Methodologies" — SQA tools (issue tracker, audit checklist tool, metrics dashboard) and metrics tracked (defect density, review effectiveness, escape rate).
  8. "Records, Reports & Retention" — SQA records produced, distribution, retention period, archival rules; final SQA conformity report contents.`,
      minSections: 6,
      maxSections: 8,
    },
    soup_list: {
      label: "SOUP / Third-Party Software List",
      sectionGuide: `This is a CANONICAL SOUP (Software of Unknown Provenance) / OTS / Third-Party Software inventory aligned to IEC 62304 §5.3.3 / §8.1.2 (also useful for DO-178C COTS handling and supply-chain compliance). Produce these sections, in this order, using EXACTLY these headings:
  1. "Scope & Inclusion Criteria" — what counts as SOUP/OTS in this project (binary libraries, OS components, drivers, OSS dependencies, COTS toolchains used in the product).
  2. "SOUP Inventory" — itemised list. For EACH item provide: "SOUP-NN — <name> v<version>" with: supplier/origin, license, intended functional use, target deployment artifact, integrator owner.
  3. "Functional & Performance Requirements per SOUP" — for each item, the functional requirements the system levies on it and the performance requirements (response time, throughput, memory, accuracy).
  4. "Hardware & Software Operating Environment Required by Each SOUP" — OS, runtime, dependencies, ports, configuration baseline.
  5. "Risk & Anomaly Analysis per SOUP" — known anomalies (CVEs, supplier bug lists), risk to safety/security, mitigations (wrappers, monitors, version pinning), residual risk.
  6. "Verification & Acceptance Strategy" — what testing/evaluation each item undergoes (smoke test, functional test, fuzz, static analysis, license compliance scan); acceptance criteria.
  7. "Vulnerability & Update Monitoring" — process for monitoring CVEs, supplier advisories, end-of-life; cadence; trigger conditions for re-qualification.
  8. "Change Control & Re-evaluation Triggers" — when a SOUP version is bumped, what re-verification is required; link to SCMP and CI list.`,
      minSections: 6,
      maxSections: 8,
    },
    // ============================================================
    // CONFIGURATION & QUALITY
    // ============================================================
    scmp: {
      label: "Software Configuration Management Plan (SCMP)",
      sectionGuide: `This is a CANONICAL Software Configuration Management Plan per IEEE 828 / DO-178C §11.4 / IEC 62304 §8. Produce these sections, in this order, using EXACTLY these headings:
  1. "Scope & SCM Objectives" — items governed by SCM, applicable software level, governing standards.
  2. "SCM Organisation & Authorities" — Configuration Manager, CCB composition, approval authority per change category, responsibilities matrix.
  3. "Configuration Identification" — naming convention for CIs and baselines; identification scheme for files, modules, documents, builds; version-numbering rules.
  4. "Baselines" — list of baselines (functional, allocated, product, release) with content, who establishes, who approves, when frozen.
  5. "Change Control" — change request workflow, classification (cosmetic/normal/safety-impacting), impact analysis requirements, CCB cadence, emergency change handling.
  6. "Configuration Status Accounting" — what status records are maintained, reporting cadence, traceability between change requests, problem reports, baselines, and releases.
  7. "Configuration Audits" — Functional Configuration Audit (FCA), Physical Configuration Audit (PCA), in-process audits; independence and entry criteria.
  8. "Tooling, Storage, Backup & Archival" — repositories, branching strategy, access control, backup cadence, retention period, archival of as-built records.`,
      minSections: 6,
      maxSections: 8,
    },
    ci_list: {
      label: "Configuration Item List (CI List)",
      sectionGuide: `This is a CANONICAL Configuration Item List — the formal inventory of every Configuration Item under SCM control for this project (per DO-178C SCI / IEC 62304 §8 / IEEE 828). Produce these sections, in this order, using EXACTLY these headings:
  1. "Scope & Baseline Reference" — release/baseline this CI list represents, effective date, related SCMP version.
  2. "CI Categorisation Scheme" — categories used (Plans, Standards, Requirements, Design, Source code, Test cases & results, Tools & environments, Build artefacts, Documents, Data items); CC1 vs CC2 classification rules.
  3. "Plans & Standards CIs" — list each plan/standard CI: "CI-NN — <name>" with version, category, control class, owner, repository path.
  4. "Requirements & Design CIs" — system & software requirements specs, architecture & design docs, interface control docs.
  5. "Source Code & Build CIs" — source modules, build scripts, makefiles, linker scripts, generated code, configuration files; include parameter data items if applicable.
  6. "Verification & Validation CIs" — review records, test cases, test procedures, test results, coverage reports, analysis reports.
  7. "Tools & Environment CIs" — compilers, linkers, simulators, test tools with version; tool qualification artefacts where required.
  8. "Third-Party / SOUP / COTS CIs" — every external item with supplier, version, license; cross-reference SOUP list.
  9. "Records, Status & Retention" — current status per CI (draft/approved/released/superseded), location, retention period.`,
      minSections: 6,
      maxSections: 9,
    },
    change_control_plan: {
      label: "Change Control Plan",
      sectionGuide: `This is a CANONICAL Change Control / Change Management Plan covering how changes to controlled artefacts are proposed, evaluated, approved and implemented (per IEEE 828, ISO 9001 §8.5.6, IEC 62304 §6 / §8). Produce these sections, in this order, using EXACTLY these headings:
  1. "Scope & Applicability" — what artefacts are under change control, lifecycle phase coverage, link to SCMP.
  2. "Change Request Workflow" — states (Submitted → Triaged → Analysed → Approved/Rejected → Implemented → Verified → Closed), entry/exit criteria per state, average SLA per state.
  3. "Roles & Authorities (CCB)" — Change Control Board composition, voting rules, quorum, escalation; emergency CCB; safety/cyber-impact veto authority.
  4. "Change Classification" — categories (cosmetic, minor, major, safety-impacting, cyber-impacting, regulatory-impacting); decision criteria per category; required evidence per category.
  5. "Impact Analysis Requirements" — mandatory impact analyses (requirements impact, design impact, test impact, safety re-analysis trigger, cybersecurity re-analysis trigger, schedule/cost impact); template fields.
  6. "Implementation & Verification" — branching strategy, peer review requirement, regression-test scope determination, sign-off rules before merge to baseline.
  7. "Emergency / Hot-Fix Process" — accelerated workflow, post-hoc review requirement, retrospective documentation.
  8. "Records, Metrics & Audits" — change-request register, traceability to baselines and releases, metrics (cycle time, rejection rate, escape rate), audit cadence.`,
      minSections: 6,
      maxSections: 8,
    },
    vnv_plan: {
      label: "Verification & Validation Plan (V&V)",
      sectionGuide: `This is a CANONICAL Verification & Validation Plan per IEEE 1012 / ISO 26262-8 §9 / IEC 62304 §5.6 & §5.7. Produce these sections, in this order, using EXACTLY these headings:
  1. "Scope, Integrity Level & References" — system/software, assigned integrity level (IEEE 1012 Levels 1–4, or ASIL/SIL/DAL), applicable standards.
  2. "V&V Strategy" — distinction between verification (built right) vs validation (built the right thing); planned methods at each lifecycle phase (requirements V&V, design V&V, implementation V&V, integration V&V, qualification, acceptance).
  3. "V&V Tasks per Lifecycle Phase" — for each phase: inputs, V&V tasks (review, inspection, walkthrough, analysis, simulation, prototyping, test), outputs, exit criteria.
  4. "Independence & Roles" — who performs V&V, level of independence required per IEEE 1012 (organisational / financial / managerial); IV&V authority.
  5. "Test Strategy & Coverage" — test levels (unit, integration, system, acceptance), test selection method, coverage targets, traceability requirement (req → test → result).
  6. "Tools, Environments & Data" — V&V tools, test environments, test-data generation strategy, simulator validity.
  7. "Anomaly Reporting & Re-verification" — anomaly classification, regression-test selection, change-impact rules.
  8. "Records, Metrics & Reports" — V&V records produced, dashboards, final V&V report contents, sign-off authority.`,
      minSections: 6,
      maxSections: 8,
    },
    // ============================================================
    // RISK MANAGEMENT
    // ============================================================
    risk_management_plan: {
      label: "Risk Management Plan",
      sectionGuide: `This is a CANONICAL Risk Management Plan applicable across project, product safety (ISO 14971 for medical), and enterprise risk (ISO 31000). Produce these sections, in this order, using EXACTLY these headings:
  1. "Scope, Context & Risk Categories" — boundaries of the risk management activity, categories considered (safety, cybersecurity, project, regulatory, supply-chain, financial), governing standard.
  2. "Risk Management Process" — stages: identification → analysis → evaluation → treatment → monitoring → communication; cadence and triggers for re-execution.
  3. "Roles & Responsibilities" — Risk Owner, Risk Manager, escalation authority; integration with Safety Manager and Cybersecurity Manager.
  4. "Risk Identification Techniques" — methods used (HAZOP, FMEA, FTA, TARA, brainstorming, lessons-learned reviews, checklists); inputs per technique.
  5. "Risk Acceptance Criteria" — quantitative or qualitative thresholds; risk-matrix legend (likelihood × consequence); ALARP / GAMAB / MEM principle if applicable.
  6. "Risk Register Format" — required fields per risk: ID, description, category, owner, likelihood, consequence, inherent score, controls, residual score, treatment, due date, status.
  7. "Risk Treatment & Controls" — strategies (avoid / reduce / share / retain); how controls are derived, implemented, verified; integration with CAPA.
  8. "Monitoring, Review & Communication" — review cadence, escalation thresholds, reporting (executive risk dashboard, board), stakeholder communication policy.
  9. "Records, Retention & Audit" — risk register storage, version control, audit trail, retention period; alignment with regulatory submission requirements.`,
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
    // If the workspace owning this report's project has a company template
    // uploaded, render through the template (preserves header, footer, logo,
    // styles). Otherwise fall back to the standard builder. The query string
    // ?template=skip lets users explicitly bypass the template (useful for
    // debugging or when the template is broken).
    const skipTemplate = String(req.query.template ?? "").toLowerCase() === "skip";
    let buf: Buffer | null = null;
    if (!skipTemplate && report.projectId) {
      const [proj] = await db
        .select({ workspaceId: projectsTable.workspaceId })
        .from(projectsTable)
        .where(eq(projectsTable.id, report.projectId));
      if (proj?.workspaceId) {
        try {
          buf = await renderWithCompanyTemplate(proj.workspaceId, {
            title: report.title,
            subtitle: report.content.subtitle ?? null,
            tone: report.tone,
            updatedAt: report.updatedAt,
            content: report.content,
          });
        } catch (err: any) {
          res.status(500).json({
            error:
              "Company template failed to render. Re-upload a valid .docx with the standard placeholders, " +
              "or append ?template=skip to the export URL to bypass it. Detail: " +
              (err?.message ?? String(err)),
          });
          return;
        }
      }
    }
    if (!buf) {
      const doc = buildDocx(report);
      buf = await Packer.toBuffer(doc);
    }
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
