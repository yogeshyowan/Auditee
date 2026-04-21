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
  pdlcStagesTable,
  legacySystemsTable,
} from "@workspace/db";

async function clear() {
  await db.delete(traceabilityLinksTable);
  await db.delete(activityEventsTable);
  await db.delete(complianceControlsTable);
  await db.delete(complianceFrameworksTable);
  await db.delete(pdlcStagesTable);
  await db.delete(legacySystemsTable);
  await db.delete(codeArtifactsTable);
  await db.delete(requirementsTable);
  await db.delete(projectsTable);
}

async function seed() {
  await clear();

  // Projects
  const projects = [
    {
      id: "proj-helios",
      name: "Helios — Patient Onboarding",
      slug: "helios",
      description:
        "AI-driven patient onboarding for a multi-state healthcare network. HIPAA-regulated.",
      owner: "Avery Kim",
      complianceScore: 92,
    },
    {
      id: "proj-atlas",
      name: "Atlas — Trade Settlement",
      slug: "atlas",
      description:
        "Modernizing a 12-year-old C# trade settlement engine into event-driven services.",
      owner: "Marcus Chen",
      complianceScore: 78,
    },
    {
      id: "proj-vega",
      name: "Vega — Claims Intelligence",
      slug: "vega",
      description:
        "Insurance claims intake, triage and adjudication assistant for Tier-1 carrier.",
      owner: "Priya Natarajan",
      complianceScore: 86,
    },
  ];
  await db.insert(projectsTable).values(projects);

  // Compliance frameworks
  const frameworks = [
    {
      id: "fw-soc2",
      code: "SOC2",
      name: "SOC 2 Type II",
      category: "Trust Services",
      status: "passing",
      score: 96,
      controlsTotal: 64,
      lastAuditAt: new Date("2026-02-12T10:00:00Z"),
    },
    {
      id: "fw-hipaa",
      code: "HIPAA",
      name: "HIPAA Security Rule",
      category: "Healthcare",
      status: "passing",
      score: 94,
      controlsTotal: 42,
      lastAuditAt: new Date("2026-03-04T10:00:00Z"),
    },
    {
      id: "fw-gdpr",
      code: "GDPR",
      name: "EU General Data Protection Regulation",
      category: "Privacy",
      status: "warning",
      score: 81,
      controlsTotal: 38,
      lastAuditAt: new Date("2026-01-22T10:00:00Z"),
    },
    {
      id: "fw-pci",
      code: "PCI-DSS",
      name: "Payment Card Industry DSS",
      category: "Payments",
      status: "warning",
      score: 79,
      controlsTotal: 51,
      lastAuditAt: new Date("2026-02-28T10:00:00Z"),
    },
    {
      id: "fw-iso",
      code: "ISO 27001",
      name: "ISO/IEC 27001:2022",
      category: "Information Security",
      status: "passing",
      score: 90,
      controlsTotal: 93,
      lastAuditAt: new Date("2026-03-19T10:00:00Z"),
    },
    {
      id: "fw-fda",
      code: "FDA 21 CFR 11",
      name: "FDA Electronic Records",
      category: "Healthcare",
      status: "gap",
      score: 67,
      controlsTotal: 27,
      lastAuditAt: new Date("2025-12-04T10:00:00Z"),
    },
  ];
  await db.insert(complianceFrameworksTable).values(frameworks);

  // Compliance controls
  const controlSpecs: Array<{
    frameworkId: string;
    code: string;
    title: string;
    description: string;
    status: string;
    owner: string;
    evidenceCount: number;
  }> = [
    { frameworkId: "fw-soc2", code: "CC6.1", title: "Logical access security controls", description: "Implement logical access security software, infrastructure, and architectures over protected information assets.", status: "met", owner: "Security Eng", evidenceCount: 12 },
    { frameworkId: "fw-soc2", code: "CC7.2", title: "System operations monitoring", description: "Monitor system components for anomalies indicative of malicious acts, natural disasters, and errors.", status: "met", owner: "SRE", evidenceCount: 8 },
    { frameworkId: "fw-soc2", code: "CC8.1", title: "Change management", description: "Authorize, design, develop, configure, document, test, approve, and implement changes.", status: "partial", owner: "Platform", evidenceCount: 4 },
    { frameworkId: "fw-hipaa", code: "164.308(a)(1)", title: "Security management process", description: "Implement policies and procedures to prevent, detect, contain and correct security violations.", status: "met", owner: "Compliance", evidenceCount: 9 },
    { frameworkId: "fw-hipaa", code: "164.312(a)(1)", title: "Access control", description: "Implement technical policies and procedures for electronic information systems.", status: "met", owner: "Security Eng", evidenceCount: 11 },
    { frameworkId: "fw-hipaa", code: "164.312(b)", title: "Audit controls", description: "Implement hardware, software, and procedural mechanisms that record and examine activity.", status: "partial", owner: "Platform", evidenceCount: 5 },
    { frameworkId: "fw-gdpr", code: "Art.30", title: "Records of processing activities", description: "Maintain records of all categories of processing activities under the controller's responsibility.", status: "partial", owner: "Privacy", evidenceCount: 3 },
    { frameworkId: "fw-gdpr", code: "Art.32", title: "Security of processing", description: "Implement appropriate technical and organisational measures to ensure security.", status: "met", owner: "Security Eng", evidenceCount: 7 },
    { frameworkId: "fw-gdpr", code: "Art.17", title: "Right to erasure", description: "Provide the data subject with the right to obtain the erasure of personal data.", status: "gap", owner: "Privacy", evidenceCount: 1 },
    { frameworkId: "fw-pci", code: "Req.3", title: "Protect stored cardholder data", description: "Render PAN unreadable anywhere it is stored using strong cryptography.", status: "met", owner: "Payments Eng", evidenceCount: 6 },
    { frameworkId: "fw-pci", code: "Req.10", title: "Track and monitor all access", description: "Implement audit trails to link all access to system components to each individual user.", status: "partial", owner: "SRE", evidenceCount: 4 },
    { frameworkId: "fw-iso", code: "A.5.15", title: "Access control policy", description: "Rules for physical and logical access to information and other associated assets.", status: "met", owner: "Security Eng", evidenceCount: 8 },
    { frameworkId: "fw-iso", code: "A.8.16", title: "Monitoring activities", description: "Networks, systems and applications shall be monitored for anomalous behaviour.", status: "met", owner: "SRE", evidenceCount: 6 },
    { frameworkId: "fw-fda", code: "11.10(a)", title: "Validation of systems", description: "Validation of systems to ensure accuracy, reliability, consistent intended performance.", status: "partial", owner: "QA", evidenceCount: 3 },
    { frameworkId: "fw-fda", code: "11.10(e)", title: "Audit trails", description: "Use of secure, computer-generated, time-stamped audit trails.", status: "gap", owner: "Platform", evidenceCount: 1 },
    { frameworkId: "fw-fda", code: "11.200", title: "Electronic signatures", description: "Electronic signatures shall employ at least two distinct identification components.", status: "met", owner: "Platform", evidenceCount: 5 },
  ];
  await db.insert(complianceControlsTable).values(
    controlSpecs.map((c) => ({ id: randomUUID(), ...c })),
  );

  // PDLC stages — for Helios
  const stagesByProject: Record<string, Array<{ stage: string; title: string; completion: number; blockers: number }>> = {
    "proj-helios": [
      { stage: "ideation", title: "Ideation", completion: 100, blockers: 0 },
      { stage: "design", title: "Design", completion: 92, blockers: 1 },
      { stage: "development", title: "Development", completion: 71, blockers: 2 },
      { stage: "testing", title: "Testing", completion: 54, blockers: 3 },
      { stage: "launch", title: "Launch", completion: 22, blockers: 1 },
      { stage: "governance", title: "Governance", completion: 88, blockers: 0 },
    ],
    "proj-atlas": [
      { stage: "ideation", title: "Ideation", completion: 100, blockers: 0 },
      { stage: "design", title: "Design", completion: 80, blockers: 2 },
      { stage: "development", title: "Development", completion: 48, blockers: 4 },
      { stage: "testing", title: "Testing", completion: 22, blockers: 2 },
      { stage: "launch", title: "Launch", completion: 5, blockers: 0 },
      { stage: "governance", title: "Governance", completion: 64, blockers: 1 },
    ],
    "proj-vega": [
      { stage: "ideation", title: "Ideation", completion: 100, blockers: 0 },
      { stage: "design", title: "Design", completion: 100, blockers: 0 },
      { stage: "development", title: "Development", completion: 86, blockers: 1 },
      { stage: "testing", title: "Testing", completion: 70, blockers: 2 },
      { stage: "launch", title: "Launch", completion: 41, blockers: 0 },
      { stage: "governance", title: "Governance", completion: 92, blockers: 0 },
    ],
  };
  for (const [pid, stages] of Object.entries(stagesByProject)) {
    await db.insert(pdlcStagesTable).values(
      stages.map((s, idx) => ({
        id: randomUUID(),
        projectId: pid,
        stage: s.stage,
        title: s.title,
        completion: s.completion,
        blockers: s.blockers,
        sortOrder: idx,
      })),
    );
  }

  // Legacy systems
  await db.insert(legacySystemsTable).values([
    {
      id: randomUUID(),
      name: "TradeCore Engine",
      language: "C#",
      description: "Monolithic trade settlement service. .NET Framework 4.6, 1,184 stored procs, deeply tied to SQL Server 2014.",
      locScanned: 482000,
      requirementsExtracted: 614,
      riskScore: 72,
      modernizationStatus: "in_progress",
    },
    {
      id: randomUUID(),
      name: "Patient Records UI",
      language: "Angular 1.x",
      description: "AngularJS frontend for legacy patient records, no test coverage, blocking HIPAA audit findings.",
      locScanned: 96000,
      requirementsExtracted: 211,
      riskScore: 84,
      modernizationStatus: "scoping",
    },
    {
      id: randomUUID(),
      name: "Pricing Library",
      language: "C++",
      description: "Quant pricing library used by 6 downstream services. Slow to onboard new engineers.",
      locScanned: 138000,
      requirementsExtracted: 92,
      riskScore: 41,
      modernizationStatus: "stable",
    },
    {
      id: randomUUID(),
      name: "Claims Adjudication SP Suite",
      language: "SQL",
      description: "Thousands of stored procedures embedding business rules across 9 schemas.",
      locScanned: 64000,
      requirementsExtracted: 318,
      riskScore: 67,
      modernizationStatus: "in_progress",
    },
    {
      id: randomUUID(),
      name: "Branch Banking COBOL",
      language: "COBOL",
      description: "Mainframe batch jobs running nightly. Source-of-truth ledgers — must remain consistent during cutover.",
      locScanned: 220000,
      requirementsExtracted: 178,
      riskScore: 91,
      modernizationStatus: "assessment",
    },
  ]);

  // Code artifacts (per Helios + Atlas)
  const code = [
    { projectId: "proj-helios", filePath: "src/intake/identity.ts", symbol: "verifyPatientIdentity", language: "TypeScript", kind: "function" },
    { projectId: "proj-helios", filePath: "src/intake/consent.ts", symbol: "captureConsent", language: "TypeScript", kind: "function" },
    { projectId: "proj-helios", filePath: "src/intake/intake.controller.ts", symbol: "IntakeController", language: "TypeScript", kind: "class" },
    { projectId: "proj-helios", filePath: "src/audit/audit.service.ts", symbol: "AuditService", language: "TypeScript", kind: "service" },
    { projectId: "proj-helios", filePath: "src/access/rbac.ts", symbol: "enforceRoleAccess", language: "TypeScript", kind: "function" },
    { projectId: "proj-helios", filePath: "src/notifications/email.ts", symbol: "sendOnboardingEmail", language: "TypeScript", kind: "function" },
    { projectId: "proj-atlas", filePath: "src/Settlement/Engine.cs", symbol: "SettlementEngine.Run", language: "C#", kind: "function" },
    { projectId: "proj-atlas", filePath: "src/Settlement/Reconciliation.cs", symbol: "Reconcile", language: "C#", kind: "function" },
    { projectId: "proj-atlas", filePath: "src/Risk/RiskGate.cs", symbol: "PreTradeRiskGate", language: "C#", kind: "service" },
    { projectId: "proj-vega", filePath: "src/triage/router.ts", symbol: "routeClaim", language: "TypeScript", kind: "function" },
    { projectId: "proj-vega", filePath: "src/adjudication/decide.ts", symbol: "adjudicate", language: "TypeScript", kind: "function" },
    { projectId: "proj-vega", filePath: "src/audit/log.ts", symbol: "writeAuditLog", language: "TypeScript", kind: "function" },
  ].map((c) => ({ id: randomUUID(), repoUrl: null, ...c }));
  await db.insert(codeArtifactsTable).values(code);

  // Requirements
  type ReqSpec = {
    projectId: string;
    code: string;
    title: string;
    description: string;
    type: "BRD" | "PRD" | "FRD" | "NFR";
    status: string;
    priority: string;
    owner: string;
    tags: string[];
    linkedFrameworks: string[];
    linkCodeSymbols?: string[];
  };
  const reqs: ReqSpec[] = [
    // Helios
    { projectId: "proj-helios", code: "HEL-0001", title: "Verify patient identity using government-issued ID", description: "On intake, the system must verify patient identity using a government-issued document and capture the verification artifact for audit.", type: "FRD", status: "implemented", priority: "critical", owner: "Avery Kim", tags: ["intake", "identity"], linkedFrameworks: ["fw-hipaa", "fw-soc2"], linkCodeSymbols: ["verifyPatientIdentity", "AuditService"] },
    { projectId: "proj-helios", code: "HEL-0002", title: "Capture HIPAA consent at first touchpoint", description: "Patients must explicitly consent to data collection and treatment under HIPAA before any PHI is stored.", type: "FRD", status: "implemented", priority: "critical", owner: "Priya Natarajan", tags: ["consent", "hipaa"], linkedFrameworks: ["fw-hipaa"], linkCodeSymbols: ["captureConsent"] },
    { projectId: "proj-helios", code: "HEL-0003", title: "Onboarding completion under 4 minutes (P95)", description: "End-to-end onboarding flow must complete in under 4 minutes at the P95 percentile across supported devices.", type: "NFR", status: "in_review", priority: "high", owner: "Avery Kim", tags: ["performance"], linkedFrameworks: [] },
    { projectId: "proj-helios", code: "HEL-0004", title: "Role-based access for clinical staff", description: "Only authorized clinical staff with appropriate role assignments can view PHI fields.", type: "FRD", status: "implemented", priority: "high", owner: "Marcus Chen", tags: ["access", "rbac"], linkedFrameworks: ["fw-hipaa", "fw-soc2", "fw-iso"], linkCodeSymbols: ["enforceRoleAccess"] },
    { projectId: "proj-helios", code: "HEL-0005", title: "Audit trail for every PHI read", description: "Every read of a PHI field must be logged with actor, timestamp, and reason code in an immutable audit log.", type: "FRD", status: "verified", priority: "critical", owner: "Compliance", tags: ["audit", "hipaa"], linkedFrameworks: ["fw-hipaa", "fw-fda"], linkCodeSymbols: ["AuditService"] },
    { projectId: "proj-helios", code: "HEL-0006", title: "Onboarding email cadence", description: "Send onboarding emails at T+0, T+24h, T+72h with deep-links to next-step actions.", type: "PRD", status: "approved", priority: "medium", owner: "Avery Kim", tags: ["growth"], linkedFrameworks: [], linkCodeSymbols: ["sendOnboardingEmail"] },
    { projectId: "proj-helios", code: "HEL-0007", title: "Right-to-erasure workflow", description: "Provide a user-initiated workflow to fully erase non-mandatory PHI within 30 days of request.", type: "FRD", status: "draft", priority: "high", owner: "Privacy", tags: ["gdpr"], linkedFrameworks: ["fw-gdpr"] },
    { projectId: "proj-helios", code: "HEL-0008", title: "Mobile and tablet first design", description: "Onboarding flow must be fully usable on iOS, Android tablets and Chrome on desktop, with offline draft support.", type: "BRD", status: "approved", priority: "high", owner: "Design", tags: ["mobile"], linkedFrameworks: [] },
    { projectId: "proj-helios", code: "HEL-0009", title: "Encrypt PHI at rest with HSM-backed keys", description: "All PHI must be encrypted at rest using HSM-managed customer-controlled keys.", type: "NFR", status: "implemented", priority: "critical", owner: "Security Eng", tags: ["encryption"], linkedFrameworks: ["fw-hipaa", "fw-soc2", "fw-iso"] },

    // Atlas
    { projectId: "proj-atlas", code: "ATL-0001", title: "Pre-trade risk gating", description: "All orders must pass a pre-trade risk gate enforcing position, exposure and credit limits.", type: "FRD", status: "implemented", priority: "critical", owner: "Marcus Chen", tags: ["risk"], linkedFrameworks: ["fw-soc2", "fw-iso"], linkCodeSymbols: ["PreTradeRiskGate"] },
    { projectId: "proj-atlas", code: "ATL-0002", title: "T+1 settlement cycle", description: "Support T+1 settlement cycle for in-scope asset classes by Q3 cutover.", type: "BRD", status: "approved", priority: "critical", owner: "Marcus Chen", tags: ["settlement"], linkedFrameworks: [] },
    { projectId: "proj-atlas", code: "ATL-0003", title: "Reconciliation against custodian feeds", description: "Daily three-way reconciliation between books, custodian and clearing house, with break alerts.", type: "FRD", status: "implemented", priority: "high", owner: "Operations", tags: ["recon"], linkedFrameworks: ["fw-soc2"], linkCodeSymbols: ["Reconcile"] },
    { projectId: "proj-atlas", code: "ATL-0004", title: "Settlement throughput 50k trades/min", description: "Engine must sustain 50,000 trades per minute peak throughput with sub-second latency.", type: "NFR", status: "in_review", priority: "high", owner: "Platform", tags: ["performance"], linkedFrameworks: [], linkCodeSymbols: ["SettlementEngine.Run"] },
    { projectId: "proj-atlas", code: "ATL-0005", title: "Replace SQL stored procedures with services", description: "Extract business logic from 1,100+ SQL stored procedures into bounded services.", type: "PRD", status: "draft", priority: "medium", owner: "Marcus Chen", tags: ["modernization"], linkedFrameworks: [] },
    { projectId: "proj-atlas", code: "ATL-0006", title: "Disaster recovery RTO 15 minutes", description: "Recovery time objective must be 15 minutes; recovery point objective 1 minute.", type: "NFR", status: "approved", priority: "high", owner: "SRE", tags: ["resilience"], linkedFrameworks: ["fw-soc2", "fw-iso"] },
    { projectId: "proj-atlas", code: "ATL-0007", title: "Cardholder data tokenization", description: "Tokenize all cardholder data at the perimeter; no PAN at rest in domain services.", type: "FRD", status: "approved", priority: "critical", owner: "Payments Eng", tags: ["pci"], linkedFrameworks: ["fw-pci"] },

    // Vega
    { projectId: "proj-vega", code: "VEG-0001", title: "Auto-triage incoming claims", description: "Automatically route incoming claims to the right adjuster pod based on type, severity and complexity.", type: "FRD", status: "implemented", priority: "high", owner: "Priya Natarajan", tags: ["triage"], linkedFrameworks: [], linkCodeSymbols: ["routeClaim"] },
    { projectId: "proj-vega", code: "VEG-0002", title: "Fraud scoring on intake", description: "Generate a fraud score for each incoming claim and flag high-risk for SIU review.", type: "FRD", status: "in_review", priority: "high", owner: "Fraud Ops", tags: ["fraud"], linkedFrameworks: [] },
    { projectId: "proj-vega", code: "VEG-0003", title: "Adjudication explainability", description: "Every automated decision must include a human-readable rationale and links to relevant policy clauses.", type: "FRD", status: "approved", priority: "critical", owner: "Priya Natarajan", tags: ["xai"], linkedFrameworks: ["fw-gdpr"], linkCodeSymbols: ["adjudicate"] },
    { projectId: "proj-vega", code: "VEG-0004", title: "Audit log retention 7 years", description: "Retain immutable audit logs for 7 years to meet jurisdictional and regulatory requirements.", type: "NFR", status: "verified", priority: "high", owner: "Compliance", tags: ["audit"], linkedFrameworks: ["fw-iso", "fw-gdpr"], linkCodeSymbols: ["writeAuditLog"] },
    { projectId: "proj-vega", code: "VEG-0005", title: "Customer-facing claims portal", description: "Self-service portal for customers to view status, upload documents and message adjusters.", type: "PRD", status: "draft", priority: "medium", owner: "Product", tags: ["portal"], linkedFrameworks: [] },
    { projectId: "proj-vega", code: "VEG-0006", title: "Multi-language support", description: "UI and notifications must support English, Spanish, French Canadian and Mandarin.", type: "BRD", status: "approved", priority: "medium", owner: "Product", tags: ["i18n"], linkedFrameworks: [] },
  ];
  const reqRows = reqs.map((r) => {
    const id = randomUUID();
    return { id, spec: r };
  });
  await db.insert(requirementsTable).values(
    reqRows.map(({ id, spec }) => ({
      id,
      projectId: spec.projectId,
      code: spec.code,
      title: spec.title,
      description: spec.description,
      type: spec.type,
      status: spec.status,
      priority: spec.priority,
      owner: spec.owner,
      tags: spec.tags,
      linkedFrameworks: spec.linkedFrameworks,
    })),
  );

  // Traceability links
  const symbolToCode = new Map(code.map((c) => [c.symbol, c.id]));
  const links = [];
  for (const { id, spec } of reqRows) {
    for (const sym of spec.linkCodeSymbols ?? []) {
      const codeId = symbolToCode.get(sym);
      if (codeId) {
        links.push({
          id: randomUUID(),
          requirementId: id,
          codeArtifactId: codeId,
          kind: "implements",
        });
      }
    }
  }
  if (links.length) await db.insert(traceabilityLinksTable).values(links);

  // Activity events
  const now = Date.now();
  const events = [
    { kind: "requirement", message: "HEL-0007 right-to-erasure workflow drafted", actor: "Privacy", entityCode: "HEL-0007", offsetMins: 12 },
    { kind: "code", message: "Linked verifyPatientIdentity to HEL-0001", actor: "EltegraAI", entityCode: "HEL-0001", offsetMins: 47 },
    { kind: "compliance", message: "SOC 2 control CC8.1 evidence refreshed", actor: "Platform", entityCode: "CC8.1", offsetMins: 92 },
    { kind: "gap", message: "GDPR Art.17 flagged: missing right-to-erasure implementation", actor: "EltegraAI", entityCode: "Art.17", offsetMins: 145 },
    { kind: "requirement", message: "ATL-0001 pre-trade risk gating verified in pre-prod", actor: "Marcus Chen", entityCode: "ATL-0001", offsetMins: 200 },
    { kind: "requirement", message: "VEG-0002 fraud scoring moved to in_review", actor: "Fraud Ops", entityCode: "VEG-0002", offsetMins: 280 },
    { kind: "code", message: "AuditService deployed to staging cluster", actor: "Platform", entityCode: "HEL-0005", offsetMins: 360 },
    { kind: "compliance", message: "HIPAA quarterly attestation completed", actor: "Compliance", entityCode: "HIPAA", offsetMins: 420 },
    { kind: "gap", message: "FDA 21 CFR 11 audit trail control 11.10(e) regressed to gap", actor: "EltegraAI", entityCode: "11.10(e)", offsetMins: 540 },
    { kind: "requirement", message: "HEL-0009 encryption at rest implemented", actor: "Security Eng", entityCode: "HEL-0009", offsetMins: 660 },
    { kind: "requirement", message: "VEG-0003 adjudication explainability approved", actor: "Priya Natarajan", entityCode: "VEG-0003", offsetMins: 780 },
    { kind: "code", message: "PreTradeRiskGate test coverage at 94%", actor: "QA", entityCode: "ATL-0001", offsetMins: 900 },
  ];
  await db.insert(activityEventsTable).values(
    events.map((e) => ({
      id: randomUUID(),
      kind: e.kind,
      message: e.message,
      actor: e.actor,
      entityCode: e.entityCode,
      createdAt: new Date(now - e.offsetMins * 60_000),
    })),
  );

  console.log("Seeded successfully.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
