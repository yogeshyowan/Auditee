// ----------------------------------------------------------------------------
// standards-blueprints.ts
// ----------------------------------------------------------------------------
// Central mapping from compliance frameworks → the *document-writing rules* a
// generated artefact (BRD/PRD/FRD/Test Cases/Requirements) MUST observe when
// that framework is in scope for the project.
//
// Each blueprint declares:
//   - `matches(codeOrName)`: predicate to attach the blueprint to a framework
//     (we pattern-match on substrings so synonymous codes like "ISO 27001"
//     and "ISO/IEC 27001" both hit).
//   - `label`: short human label used in prompts and citations.
//   - `documentSections`: required section topics that must appear in any
//     generated document (BRD/PRD/FRD/Test Cases). The model is instructed to
//     fold these into the existing canonical section structure rather than
//     replacing it.
//   - `requirementCoverage`: control-area topics the model MUST emit at least
//     one requirement for when generating a fresh requirements set.
//   - `citationHint`: a one-liner the model uses to remind itself how to cite
//     this framework's controls in the body text.
//
// Call `selectStandardsBlueprints(frameworks)` to get the union of blueprints
// that apply, then `renderStandardsAddendum(blueprints, mode)` to render the
// prompt addendum that goes into the system message.
// ----------------------------------------------------------------------------

export type StandardsBlueprint = {
  label: string;
  matches: (token: string) => boolean;
  documentSections: string[];
  requirementCoverage: string[];
  citationHint: string;
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

const has = (token: string, ...needles: string[]) => {
  const t = norm(token);
  return needles.some((n) => t.includes(norm(n)));
};

export const STANDARDS_BLUEPRINTS: StandardsBlueprint[] = [
  {
    label: "ISO/IEC 27001",
    matches: (t) => has(t, "iso27001", "isoiec27001"),
    documentSections: [
      "Information Security Management System scope statement",
      "Risk assessment & treatment summary mapped to Annex A controls",
      "Statement of Applicability (SoA) cross-reference",
      "Access control & cryptographic policy alignment",
    ],
    requirementCoverage: [
      "Information classification and handling rules",
      "Access control (identity, authentication, least-privilege, segregation of duties)",
      "Cryptographic controls at rest and in transit",
      "Logging, monitoring and incident response",
      "Supplier and third-party security obligations",
      "Business continuity and backup",
    ],
    citationHint: "Cite Annex A control identifiers (e.g. A.5.15, A.8.24) when referencing controls.",
  },
  {
    label: "ISO/IEC 27002",
    matches: (t) => has(t, "iso27002", "isoiec27002"),
    documentSections: [
      "Mapping of each functional area to ISO/IEC 27002 control themes (Organizational, People, Physical, Technological)",
    ],
    requirementCoverage: [
      "Acceptable use, screening and awareness",
      "Secure configuration and change management",
      "Network and communications security",
      "Application security and secure development lifecycle",
    ],
    citationHint: "Use 27002 control numbers (e.g. 5.10, 8.28) inline.",
  },
  {
    label: "SOC 2",
    matches: (t) => has(t, "soc2"),
    documentSections: [
      "Trust Services Criteria (Security, Availability, Confidentiality, Processing Integrity, Privacy) mapping",
      "Control description, owner, frequency, evidence type for each in-scope criterion",
    ],
    requirementCoverage: [
      "Logical access provisioning, review and de-provisioning",
      "Change management with peer review and audit trail",
      "System availability monitoring and incident response",
      "Vendor risk management",
      "Encryption and key management",
    ],
    citationHint: "Reference TSC criteria codes (CC1.x, CC6.x, A1.x) in the body.",
  },
  {
    label: "HIPAA",
    matches: (t) => has(t, "hipaa"),
    documentSections: [
      "PHI handling boundaries (collection, use, storage, transmission, destruction)",
      "Administrative, Physical and Technical Safeguards mapping",
      "Business Associate Agreement (BAA) flow-down",
      "Breach notification and incident response timing (≤60 days)",
    ],
    requirementCoverage: [
      "Unique user identification and emergency access procedure",
      "Automatic logoff and encryption of PHI at rest/in transit",
      "Audit controls and tamper-evident logging of PHI access",
      "Minimum necessary access and role-based authorisation",
      "Sanction policy and workforce training",
    ],
    citationHint: "Cite §164.308 / §164.312 / §164.314 paragraph references.",
  },
  {
    label: "FDA 21 CFR Part 11",
    matches: (t) => has(t, "21cfrpart11", "21cfr11", "fdacfr11", "part11"),
    documentSections: [
      "Electronic-records integrity controls",
      "Electronic-signature workflow (identity binding, intent capture, non-repudiation)",
      "System validation evidence per GAMP 5 category",
      "Audit-trail retention and reviewability",
    ],
    requirementCoverage: [
      "Tamper-evident audit trails on every record CRUD event",
      "Electronic signature components: printed name, date, meaning",
      "Closed-system access controls and authority checks",
      "Periodic and event-based system validation",
      "Record retention, archival and retrieval procedures",
    ],
    citationHint: "Cite §11.10 / §11.50 / §11.70 / §11.200 requirements.",
  },
  {
    label: "GDPR",
    matches: (t) => has(t, "gdpr"),
    documentSections: [
      "Lawful basis and processing purpose for each personal-data flow",
      "Data Protection Impact Assessment (DPIA) trigger and outcome",
      "Subject rights (access, rectification, erasure, portability) implementation",
      "Cross-border transfer safeguards (SCCs, adequacy)",
    ],
    requirementCoverage: [
      "Consent capture, withdrawal and audit",
      "Data minimisation and storage limitation",
      "72-hour breach notification workflow",
      "Records of processing activities (RoPA)",
      "Privacy by design and default in feature behaviour",
    ],
    citationHint: "Cite GDPR Articles (Art. 5, 25, 32, 33) inline.",
  },
  {
    label: "PCI DSS 4.0",
    matches: (t) => has(t, "pcidss"),
    documentSections: [
      "Cardholder Data Environment (CDE) scope diagram (narrative)",
      "12-requirement mapping with applicability",
      "Authenticated and unauthenticated scan plan",
      "Customised approach justification (if used)",
    ],
    requirementCoverage: [
      "Network segmentation between CDE and non-CDE",
      "Strong cryptography for stored and transmitted PAN",
      "MFA for all access into the CDE",
      "Quarterly vulnerability scans and annual penetration tests",
      "File-integrity monitoring on critical files",
    ],
    citationHint: "Cite PCI DSS requirement numbers (e.g. Req. 3.5.1, 8.4.2).",
  },
  {
    label: "NIST CSF 2.0",
    matches: (t) => has(t, "nistcsf"),
    documentSections: [
      "Function mapping (Govern, Identify, Protect, Detect, Respond, Recover)",
      "Tier and current/target profile statement",
    ],
    requirementCoverage: [
      "Asset inventory and risk-tier classification",
      "Continuous monitoring and anomaly detection",
      "Response and recovery playbooks",
      "Supply-chain risk management",
    ],
    citationHint: "Cite CSF subcategory IDs (e.g. PR.AC-1, DE.CM-7).",
  },
  {
    label: "NIST 800-53",
    matches: (t) => has(t, "nist80053"),
    documentSections: [
      "Control baseline statement (Low / Moderate / High)",
      "Tailoring rationale for any controls inherited or excluded",
    ],
    requirementCoverage: [
      "AC, AU, CM, IA, IR, SC and SI control families",
      "Continuous monitoring (CA-7) plan",
    ],
    citationHint: "Cite control IDs (AC-2(1), AU-12, IR-4(1)).",
  },
  {
    label: "IEC 62304",
    matches: (t) => has(t, "iec62304"),
    documentSections: [
      "Software Safety Classification (Class A / B / C) declaration",
      "Risk control measures mapped to identified hazards (per ISO 14971)",
      "Software development plan and configuration management",
      "Problem resolution and change-control workflow",
    ],
    requirementCoverage: [
      "Software requirements analysis with explicit risk-control trace",
      "Architecture design with segregation by safety class",
      "Unit and integration verification with coverage targets per class",
      "Anomaly handling, problem reports and CAPA loop",
      "Software Of Unknown Provenance (SOUP) inventory and risk assessment",
    ],
    citationHint: "Cite IEC 62304 clause numbers (5.2, 5.5, 7.x, 8.x, 9.x).",
  },
  {
    label: "ISO 13485",
    matches: (t) => has(t, "iso13485"),
    documentSections: [
      "Design and Development Plan with verification & validation milestones",
      "Design History File (DHF) reference structure",
      "Risk management file linkage (ISO 14971)",
    ],
    requirementCoverage: [
      "Design inputs, outputs, reviews and transfers",
      "CAPA process integration",
      "Document and record control",
    ],
    citationHint: "Cite ISO 13485 clauses (4.2.x, 7.3.x, 8.5.x).",
  },
  {
    label: "ISO 26262",
    matches: (t) => has(t, "iso26262"),
    documentSections: [
      "Item definition and ASIL allocation per hazard",
      "Functional, technical and software safety requirement decomposition",
      "Safety case skeleton with verification objectives",
    ],
    requirementCoverage: [
      "ASIL-decomposed safety requirements with verification method",
      "Confirmation measures (independence levels) per ASIL",
      "Tool qualification (TCL/TQL) statements for any tool in the chain",
    ],
    citationHint: "Cite ISO 26262 part:clause (e.g. Part 6, Clause 8.4.5).",
  },
  {
    label: "IEC 61508",
    matches: (t) => has(t, "iec61508"),
    documentSections: [
      "Safety Integrity Level (SIL) target with target failure measures",
      "Safety lifecycle phase mapping",
    ],
    requirementCoverage: [
      "Hardware fault tolerance and diagnostic coverage",
      "Systematic capability claim per SIL",
      "Validation against the safety requirements specification",
    ],
    citationHint: "Cite IEC 61508 part:clause (e.g. Part 3, 7.2).",
  },
  {
    label: "IEC 62443",
    matches: (t) => has(t, "iec62443"),
    documentSections: [
      "Zone & Conduit model for the system under control",
      "Security Level (SL-T) targets per zone",
      "Patch management and secure update path",
    ],
    requirementCoverage: [
      "Identification and authentication control (IAC) family",
      "Use control (UC) and system integrity (SI) requirements",
      "Restricted data flow (RDF) between zones",
      "Timely response to events (TRE) with SOC integration",
    ],
    citationHint: "Cite IEC 62443 FR/SR/CR identifiers (e.g. SR 1.1, CR 3.4).",
  },
  {
    label: "DO-178C",
    matches: (t) => has(t, "do178"),
    documentSections: [
      "Software Level (DAL A-E) declaration with rationale",
      "Plans for Software Aspects of Certification (PSAC) outline",
      "Verification independence statement per objective",
      "Structural coverage objective (statement / decision / MC/DC) per DAL",
    ],
    requirementCoverage: [
      "High-level and low-level software requirements with explicit trace",
      "Robustness test cases for every requirement",
      "Tool Qualification Level (TQL) statement for each tool used",
    ],
    citationHint: "Cite DO-178C objective tables (Table A-3 #N) and Annex A entries.",
  },
  {
    label: "ASPICE",
    matches: (t) => has(t, "aspice"),
    documentSections: [
      "Process group coverage map (ACQ / SYS / SWE / VAL / SUP / MAN)",
      "Bidirectional trace from stakeholder needs → system → software → unit",
    ],
    requirementCoverage: [
      "SYS.2 system requirements analysis outputs",
      "SWE.1 software requirements analysis with attributes per item",
      "Verification criteria for each requirement (SWE.4 / SWE.6)",
      "Configuration & change management evidence (SUP.8 / SUP.10)",
    ],
    citationHint: "Cite Automotive SPICE process IDs (SYS.2.BP1, SWE.1.BP3).",
  },
  {
    label: "CMMI",
    matches: (t) => has(t, "cmmi"),
    documentSections: [
      "Practice-area mapping (Estimating, Planning, Monitor & Control, Verification, Validation)",
      "Maturity / Capability Level target statement",
    ],
    requirementCoverage: [
      "Estimation method evidence (EST)",
      "Planning artefacts and dependencies (PLAN)",
      "Monitoring cadence and corrective action triggers (MC)",
    ],
    citationHint: "Cite CMMI practice IDs (PLAN 2.1, MC 1.2, VV 3.1).",
  },
  {
    label: "EU AI Act",
    matches: (t) => has(t, "euaiact", "aiact"),
    documentSections: [
      "AI system risk classification (prohibited / high-risk / limited / minimal)",
      "Conformity assessment route and post-market monitoring plan",
      "Technical documentation per Annex IV",
    ],
    requirementCoverage: [
      "Data governance and bias monitoring",
      "Human-oversight mechanisms",
      "Accuracy, robustness, and cybersecurity targets",
      "Logging and traceability of AI decisions",
    ],
    citationHint: "Cite EU AI Act Article numbers (Art. 9, 10, 14, 15).",
  },
  {
    label: "NIS2",
    matches: (t) => has(t, "nis2"),
    documentSections: [
      "Essential / important entity classification",
      "Incident-reporting flow with the 24h early warning + 72h notification deadlines",
    ],
    requirementCoverage: [
      "Risk-management measures from Article 21",
      "Supply-chain security and reporting obligations",
    ],
    citationHint: "Cite NIS2 Articles (Art. 21, 23).",
  },
  {
    label: "DORA",
    matches: (t) => has(t, "dora"),
    documentSections: [
      "ICT risk-management framework alignment",
      "Threat-led penetration testing (TLPT) plan",
      "ICT third-party arrangements register reference",
    ],
    requirementCoverage: [
      "ICT incident classification and reporting timeline",
      "Operational resilience testing programme",
      "Critical third-party concentration risk monitoring",
    ],
    citationHint: "Cite DORA Article numbers (Art. 5, 17, 24, 28).",
  },
];

/**
 * Returns the deduped set of blueprints that match any of the supplied
 * frameworks. We match against both the framework code AND name, so input
 * data like { code: "ISO 27001", name: "Information Security" } still attaches
 * the ISO/IEC 27001 blueprint.
 */
export function selectStandardsBlueprints(
  frameworks: Array<{ code?: string | null; name?: string | null }>,
): StandardsBlueprint[] {
  const out: StandardsBlueprint[] = [];
  const seen = new Set<string>();
  for (const fw of frameworks) {
    const tokens = [fw.code ?? "", fw.name ?? ""].filter(Boolean);
    for (const bp of STANDARDS_BLUEPRINTS) {
      if (seen.has(bp.label)) continue;
      if (tokens.some((tok) => bp.matches(tok))) {
        out.push(bp);
        seen.add(bp.label);
      }
    }
  }
  return out;
}

/**
 * Render the addendum that goes at the END of the system prompt for either a
 * document generator (`mode = "document"`) or the requirements generator
 * (`mode = "requirements"`). Returns an empty string when no blueprints apply.
 */
export function renderStandardsAddendum(
  blueprints: StandardsBlueprint[],
  mode: "document" | "requirements",
): string {
  if (blueprints.length === 0) return "";
  const lines: string[] = [
    "",
    "=== APPLICABLE STANDARDS — MANDATORY COMPLIANCE ===",
    `The following ${blueprints.length === 1 ? "standard is" : "standards are"} in scope for this project. The output MUST visibly address the topics listed below for each standard. Do NOT skip any of these — if a topic genuinely does not apply, state so explicitly and explain why in one short sentence.`,
    "",
  ];
  for (const bp of blueprints) {
    lines.push(`-- ${bp.label} --`);
    if (mode === "document") {
      lines.push(`Required document coverage:`);
      for (const s of bp.documentSections) lines.push(`  • ${s}`);
    } else {
      lines.push(`Required requirement coverage (emit at least one requirement per topic):`);
      for (const s of bp.requirementCoverage) lines.push(`  • ${s}`);
    }
    lines.push(`Citation rule: ${bp.citationHint}`);
    lines.push("");
  }
  lines.push(
    mode === "document"
      ? "Fold these required topics into the existing canonical section structure. Do NOT replace the canonical sections; extend them."
      : "Each generated requirement that addresses one of the topics above MUST list the corresponding standard's code in linkedFrameworkCodes.",
  );
  return lines.join("\n");
}
