/**
 * Idempotent seed for the built-in demo projects.
 *
 * Creates the system workspace `ws-demo` (if absent), then upserts demo
 * projects across four industry verticals:
 *   A. Healthcare / Medical Devices
 *   B. Financial Services
 *   C. Automotive / Industrial Safety
 *   D. Cybersecurity / Cloud
 *
 * Run via:  pnpm --filter @workspace/scripts run seed:demo
 *
 * Safe to re-run. Existing rows are left untouched via ON CONFLICT DO NOTHING.
 */

import { randomUUID } from "node:crypto";
import {
  db,
  workspacesTable,
  projectsTable,
  requirementsTable,
  pdlcStagesTable,
  projectSourcesTable,
  defectsTable,
  capaActionsTable,
  testCasesTable,
  aiReportsTable,
  recurringAuditsTable,
  codeArtifactsTable,
  traceabilityLinksTable,
  legacySystemsTable,
  aiConversationsTable,
  complianceEvidenceTable,
  workflowsTable,
  workflowRunsTable,
  workflowStepRunsTable,
} from "./index";

const DEMO_WS_ID = "ws-demo";
const DEMO_WS_OWNER = "user_system_demo";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function pdlcFor(
  projectId: string,
  completions: [number, number, number, number, number, number],
  blockers: [number, number, number, number, number, number],
) {
  const stages = ["ideation", "design", "development", "testing", "launch", "governance"];
  const titles = ["Ideation", "Design", "Development", "Testing", "Launch", "Governance"];
  return stages.map((stage, i) => ({
    id: `${projectId}-pdlc-${stage}`,
    projectId,
    stage,
    title: titles[i],
    completion: completions[i],
    blockers: blockers[i],
    sortOrder: i,
  }));
}

type ReqSpec = {
  id: string;
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
};

// ─────────────────────────────────────────────────────────────────────────────
// Demo workspace
// ─────────────────────────────────────────────────────────────────────────────

async function ensureDemoWorkspace() {
  await db
    .insert(workspacesTable)
    .values({
      id: DEMO_WS_ID,
      name: "Auditee Demo",
      plan: "enterprise",
      seatLimit: 9999,
      ownerUserId: DEMO_WS_OWNER,
    })
    .onConflictDoNothing();
}

// ─────────────────────────────────────────────────────────────────────────────
// Project definitions
// ─────────────────────────────────────────────────────────────────────────────

const PROJECTS: {
  id: string;
  name: string;
  slug: string;
  description: string;
  owner: string;
  complianceScore: number;
  domain: string;
}[] = [
  // ── A. Healthcare / Medical Devices ───────────────────────────────────────
  {
    id: "proj-demo-helios",
    name: "Helios — Patient Onboarding",
    slug: "demo-helios",
    description:
      "AI-driven patient onboarding for a multi-state healthcare network. Covers identity verification, HIPAA consent capture, role-based PHI access and immutable audit trails.",
    owner: "Avery Kim",
    complianceScore: 92,
    domain: "Healthcare",
  },
  {
    id: "proj-demo-orion",
    name: "Orion — Cardiac Monitor Firmware",
    slug: "demo-orion",
    description:
      "Safety-critical firmware for an implantable cardiac rhythm monitor. IEC 62304 software lifecycle, ISO 13485 QMS integration, and 21 CFR 820 design controls.",
    owner: "Dr. Lena Fischer",
    complianceScore: 87,
    domain: "Medical Devices",
  },
  {
    id: "proj-demo-aesop",
    name: "Aesop — Clinical Trial eCRF",
    slug: "demo-aesop",
    description:
      "Electronic Case Report Form system for Phase III oncology trials. FDA 21 CFR Part 11 electronic signatures, ICH E6(R2) GCP compliance, and GDPR data export.",
    owner: "Dr. Rohan Mehta",
    complianceScore: 83,
    domain: "Clinical Trials",
  },
  {
    id: "proj-demo-nexus",
    name: "Nexus — Hospital EHR Modernisation",
    slug: "demo-nexus",
    description:
      "Migration from a 15-year-old on-premise EHR to a cloud-native HL7 FHIR R4 platform. HIPAA Security Rule, GDPR data-residency controls, and HITRUST CSF alignment.",
    owner: "Camille Osei",
    complianceScore: 76,
    domain: "Healthcare IT",
  },

  // ── B. Financial Services ─────────────────────────────────────────────────
  {
    id: "proj-demo-atlas",
    name: "Atlas — Trade Settlement Engine",
    slug: "demo-atlas",
    description:
      "Modernising a 12-year-old C# trade settlement monolith into event-driven microservices. SOC 2 Type II, PCI DSS 4.0 tokenisation, and T+1 settlement mandate.",
    owner: "Marcus Chen",
    complianceScore: 78,
    domain: "Capital Markets",
  },
  {
    id: "proj-demo-vega",
    name: "Vega — Claims Intelligence",
    slug: "demo-vega",
    description:
      "AI-driven claims triage, fraud scoring and adjudication assistant for a Tier-1 insurance carrier. GDPR explainability, SOC 2 audit trail, 7-year log retention.",
    owner: "Priya Natarajan",
    complianceScore: 86,
    domain: "Insurance",
  },
  {
    id: "proj-demo-sterling",
    name: "Sterling — Core Banking Platform",
    slug: "demo-sterling",
    description:
      "COBOL mainframe to cloud-native ledger migration for a regional bank. PCI DSS 4.0, GDPR data sovereignty, DORA operational resilience and ISO 27001 ISMS.",
    owner: "James O'Brien",
    complianceScore: 71,
    domain: "Banking",
  },
  {
    id: "proj-demo-nova",
    name: "Nova — Crypto Exchange Compliance",
    slug: "demo-nova",
    description:
      "Regulatory compliance layer for a EU-regulated crypto exchange: MiCA licensing controls, AML/KYC transaction monitoring, PCI DSS for fiat on-ramp, and GDPR.",
    owner: "Sofia Andreou",
    complianceScore: 68,
    domain: "FinTech",
  },

  // ── C. Automotive / Industrial Safety ─────────────────────────────────────
  {
    id: "proj-demo-ares",
    name: "Ares — ADAS Vision Stack",
    slug: "demo-ares",
    description:
      "Level 3 autonomous driving perception and path-planning stack. ISO 26262 ASIL-D, ASPICE 4.0 SWE processes, and ISO/SAE 21434 cybersecurity engineering.",
    owner: "Elena Bauer",
    complianceScore: 81,
    domain: "Automotive",
  },
  {
    id: "proj-demo-titan",
    name: "Titan — Industrial PLC Control System",
    slug: "demo-titan",
    description:
      "Safety instrumented system for a high-pressure chemical process plant. IEC 61508 SIL 3 functional safety, IEC 62443 industrial cybersecurity, and IEC 61511.",
    owner: "Kenji Watanabe",
    complianceScore: 89,
    domain: "Industrial Safety",
  },
  {
    id: "proj-demo-apollo",
    name: "Apollo — EV Battery Management System",
    slug: "demo-apollo",
    description:
      "Battery management controller for a next-generation 800 V EV platform. ISO 26262 ASIL-C, IEC 62133-2 cell safety, UN ECE R100 homologation evidence.",
    owner: "Nadia Kozlov",
    complianceScore: 84,
    domain: "Automotive",
  },

  // ── D. Cybersecurity / Cloud ──────────────────────────────────────────────
  {
    id: "proj-demo-bastion",
    name: "Bastion — Cloud Security Posture",
    slug: "demo-bastion",
    description:
      "Continuous cloud security posture management platform for a Fortune 500 SaaS company. SOC 2 Type II (all 5 TSC), ISO/IEC 27001:2022, and NIST CSF 2.0.",
    owner: "Tariq Hassan",
    complianceScore: 94,
    domain: "Cloud Security",
  },
  {
    id: "proj-demo-aegis",
    name: "Aegis — Identity & Access Platform",
    slug: "demo-aegis",
    description:
      "Enterprise IAM platform handling 2 M monthly active users. GDPR consent flows, SOC 2 access controls, NIST SP 800-63-3 AAL2 authenticators, and zero-trust architecture.",
    owner: "Amara Diallo",
    complianceScore: 90,
    domain: "Identity Security",
  },
  {
    id: "proj-demo-cipher",
    name: "Cipher — API Gateway & Zero Trust",
    slug: "demo-cipher",
    description:
      "API gateway and micro-segmentation overlay implementing NIST Zero Trust Architecture. PCI DSS 4.0 network segmentation, ISO/IEC 27001 A.8.20, and OWASP API Top 10 controls.",
    owner: "Leo Fernandez",
    complianceScore: 88,
    domain: "Network Security",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Requirements
// ─────────────────────────────────────────────────────────────────────────────

const REQUIREMENTS: ReqSpec[] = [
  // ── Helios ─────────────────────────────────────────────────────────────────
  { id: "req-helios-001", projectId: "proj-demo-helios", code: "HEL-0001", title: "Verify patient identity using government-issued ID", description: "On intake, verify patient identity using a government-issued document and capture the verification artifact for the immutable audit trail.", type: "FRD", status: "implemented", priority: "critical", owner: "Avery Kim", tags: ["intake", "identity"], linkedFrameworks: ["HIPAA", "SOC 2"] },
  { id: "req-helios-002", projectId: "proj-demo-helios", code: "HEL-0002", title: "Capture HIPAA consent at first touchpoint", description: "Patients must explicitly consent to data collection and treatment under HIPAA before any PHI is stored.", type: "FRD", status: "implemented", priority: "critical", owner: "Priya Natarajan", tags: ["consent", "hipaa"], linkedFrameworks: ["HIPAA"] },
  { id: "req-helios-003", projectId: "proj-demo-helios", code: "HEL-0003", title: "Role-based access for clinical staff", description: "Only authorised clinical staff with appropriate role assignments can view PHI fields. Role changes logged to immutable audit trail.", type: "FRD", status: "implemented", priority: "high", owner: "Marcus Chen", tags: ["access", "rbac"], linkedFrameworks: ["HIPAA", "SOC 2", "ISO/IEC 27001"] },
  { id: "req-helios-004", projectId: "proj-demo-helios", code: "HEL-0004", title: "Audit trail for every PHI read", description: "Every read of a PHI field must be logged with actor, timestamp and reason code in an immutable audit log retained for 7 years.", type: "FRD", status: "verified", priority: "critical", owner: "Compliance", tags: ["audit", "hipaa"], linkedFrameworks: ["HIPAA", "FDA 21 CFR Part 11"] },
  { id: "req-helios-005", projectId: "proj-demo-helios", code: "HEL-0005", title: "Right-to-erasure workflow", description: "Provide a user-initiated workflow to fully erase non-mandatory PHI within 30 days of request, with audit evidence.", type: "FRD", status: "in_review", priority: "high", owner: "Privacy", tags: ["gdpr", "erasure"], linkedFrameworks: ["GDPR"] },
  { id: "req-helios-006", projectId: "proj-demo-helios", code: "HEL-0006", title: "Onboarding completion under 4 minutes (P95)", description: "End-to-end onboarding flow must complete in under 4 minutes at P95 across supported devices including iOS, Android and Chrome desktop.", type: "NFR", status: "in_review", priority: "high", owner: "Avery Kim", tags: ["performance"], linkedFrameworks: [] },
  { id: "req-helios-007", projectId: "proj-demo-helios", code: "HEL-0007", title: "PHI encrypted at rest with HSM-backed keys", description: "All PHI must be encrypted at rest using HSM-managed customer-controlled keys (AES-256-GCM).", type: "NFR", status: "implemented", priority: "critical", owner: "Security Eng", tags: ["encryption"], linkedFrameworks: ["HIPAA", "SOC 2", "ISO/IEC 27001"] },
  { id: "req-helios-008", projectId: "proj-demo-helios", code: "HEL-0008", title: "30-minute idle session timeout", description: "Authenticated clinical sessions must auto-terminate after 30 minutes of inactivity with a 2-minute warning notification.", type: "FRD", status: "implemented", priority: "high", owner: "Security Eng", tags: ["session"], linkedFrameworks: ["HIPAA", "PCI DSS 4.0"] },

  // ── Orion ──────────────────────────────────────────────────────────────────
  { id: "req-orion-001", projectId: "proj-demo-orion", code: "ORN-0001", title: "Software safety classification ASIL B equivalent", description: "Firmware components controlling therapy delivery must be classified IEC 62304 Class C with full traceability to hazard analysis.", type: "FRD", status: "verified", priority: "critical", owner: "Dr. Fischer", tags: ["safety", "62304"], linkedFrameworks: ["IEC 62304", "ISO 13485"] },
  { id: "req-orion-002", projectId: "proj-demo-orion", code: "ORN-0002", title: "Closed-loop therapy inhibit in < 200 ms", description: "Detection-to-inhibit latency for oversensing events must not exceed 200 ms at all temperatures within operating range.", type: "NFR", status: "in_review", priority: "critical", owner: "Firmware Team", tags: ["timing", "safety"], linkedFrameworks: ["IEC 62304"] },
  { id: "req-orion-003", projectId: "proj-demo-orion", code: "ORN-0003", title: "Wireless telemetry authentication", description: "All over-the-air programmer sessions must use mutual certificate authentication and AES-128 session encryption.", type: "FRD", status: "implemented", priority: "critical", owner: "Security Eng", tags: ["wireless", "security"], linkedFrameworks: ["ISO 13485", "IEC 62304"] },
  { id: "req-orion-004", projectId: "proj-demo-orion", code: "ORN-0004", title: "Device history record linkage", description: "Every firmware release must be traceable to the Device History Record via revision hash, V&V report IDs and risk control measures.", type: "FRD", status: "approved", priority: "high", owner: "QA", tags: ["dhr", "traceability"], linkedFrameworks: ["21 CFR 820", "ISO 13485"] },
  { id: "req-orion-005", projectId: "proj-demo-orion", code: "ORN-0005", title: "SOUP validation for FreeRTOS 10.5", description: "Validate FreeRTOS 10.5.1 as Software of Unknown Provenance: obtain published CVE list, run SBOM diff, document residual risks.", type: "FRD", status: "in_review", priority: "high", owner: "Dr. Fischer", tags: ["soup", "sbom"], linkedFrameworks: ["IEC 62304"] },
  { id: "req-orion-006", projectId: "proj-demo-orion", code: "ORN-0006", title: "Post-market surveillance data feed", description: "Device diagnostics telemetry must feed an automated PMS dashboard alerting on trending anomalies within 24 hours of detection.", type: "PRD", status: "draft", priority: "medium", owner: "Regulatory Affairs", tags: ["pms"], linkedFrameworks: ["MDR 2017/745", "ISO 13485"] },

  // ── Aesop ──────────────────────────────────────────────────────────────────
  { id: "req-aesop-001", projectId: "proj-demo-aesop", code: "AES-0001", title: "Electronic signature with two-factor authentication", description: "All eCRF signature events must use two-factor authentication per FDA 21 CFR Part 11.200 requirements.", type: "FRD", status: "implemented", priority: "critical", owner: "Dr. Mehta", tags: ["esignature", "21cfr11"], linkedFrameworks: ["FDA 21 CFR Part 11"] },
  { id: "req-aesop-002", projectId: "proj-demo-aesop", code: "AES-0002", title: "Audit trail for all data entry changes", description: "Every field modification must capture the prior value, new value, actor, timestamp and reason code in a tamper-evident audit trail.", type: "FRD", status: "implemented", priority: "critical", owner: "Platform", tags: ["audit", "21cfr11"], linkedFrameworks: ["FDA 21 CFR Part 11", "ICH E6"] },
  { id: "req-aesop-003", projectId: "proj-demo-aesop", code: "AES-0003", title: "GDPR-compliant data export for subjects", description: "Subjects must be able to request a machine-readable export of all their captured data within 30 days of request.", type: "FRD", status: "in_review", priority: "high", owner: "Privacy", tags: ["gdpr", "export"], linkedFrameworks: ["GDPR"] },
  { id: "req-aesop-004", projectId: "proj-demo-aesop", code: "AES-0004", title: "Randomisation and blind-breaking controls", description: "Treatment code reveal must require two authorised roles with logged justification; emergency unblinding available 24/7.", type: "FRD", status: "approved", priority: "critical", owner: "Clinical Ops", tags: ["randomisation"], linkedFrameworks: ["ICH E6"] },
  { id: "req-aesop-005", projectId: "proj-demo-aesop", code: "AES-0005", title: "System validation: IQ/OQ/PQ documentation", description: "Full installation, operational and performance qualification packs to be produced before first patient use at any study site.", type: "FRD", status: "in_review", priority: "high", owner: "QA", tags: ["validation", "iqoqpq"], linkedFrameworks: ["FDA 21 CFR Part 11", "21 CFR 820"] },

  // ── Nexus ──────────────────────────────────────────────────────────────────
  { id: "req-nexus-001", projectId: "proj-demo-nexus", code: "NEX-0001", title: "HL7 FHIR R4 patient resource API", description: "Expose patient demographics, encounters and observations as HL7 FHIR R4 REST resources with OAuth 2.0 SMART authorisation.", type: "FRD", status: "implemented", priority: "critical", owner: "Camille Osei", tags: ["fhir", "interoperability"], linkedFrameworks: ["HIPAA"] },
  { id: "req-nexus-002", projectId: "proj-demo-nexus", code: "NEX-0002", title: "EU data residency for GDPR patients", description: "EU patient records must remain in EU-West storage regions at all times; cross-region replication disabled for GDPR scope data.", type: "NFR", status: "approved", priority: "critical", owner: "Privacy", tags: ["gdpr", "data-residency"], linkedFrameworks: ["GDPR"] },
  { id: "req-nexus-003", projectId: "proj-demo-nexus", code: "NEX-0003", title: "Legacy data migration with zero data loss", description: "Migrate 14 TB of legacy patient records with a verified record-count reconciliation and zero tolerance for data loss or corruption.", type: "BRD", status: "in_review", priority: "critical", owner: "Migration Team", tags: ["migration"], linkedFrameworks: ["HIPAA"] },
  { id: "req-nexus-004", projectId: "proj-demo-nexus", code: "NEX-0004", title: "HITRUST CSF r2 certification scope", description: "Cloud-native EHR platform must achieve HITRUST CSF r2 certification covering all 19 HIPAA domains within 18 months of go-live.", type: "BRD", status: "draft", priority: "high", owner: "Compliance", tags: ["hitrust", "certification"], linkedFrameworks: ["HIPAA", "ISO/IEC 27001"] },

  // ── Atlas ──────────────────────────────────────────────────────────────────
  { id: "req-atlas-001", projectId: "proj-demo-atlas", code: "ATL-0001", title: "Pre-trade risk gating", description: "All orders must pass a pre-trade risk gate enforcing position, exposure and credit limits with sub-millisecond latency.", type: "FRD", status: "implemented", priority: "critical", owner: "Marcus Chen", tags: ["risk"], linkedFrameworks: ["SOC 2", "ISO/IEC 27001"] },
  { id: "req-atlas-002", projectId: "proj-demo-atlas", code: "ATL-0002", title: "T+1 settlement cycle support", description: "Support T+1 settlement cycle for all in-scope equity and fixed-income asset classes ahead of regulatory deadline.", type: "BRD", status: "approved", priority: "critical", owner: "Marcus Chen", tags: ["settlement"], linkedFrameworks: [] },
  { id: "req-atlas-003", projectId: "proj-demo-atlas", code: "ATL-0003", title: "Cardholder data tokenisation", description: "Tokenise all cardholder data at the perimeter; no PAN at rest in any domain service or message queue.", type: "FRD", status: "implemented", priority: "critical", owner: "Payments Eng", tags: ["pci", "tokenisation"], linkedFrameworks: ["PCI DSS 4.0"] },
  { id: "req-atlas-004", projectId: "proj-demo-atlas", code: "ATL-0004", title: "Settlement throughput 50k trades/min", description: "Engine must sustain 50,000 trades per minute peak with sub-second end-to-end latency at P99.", type: "NFR", status: "in_review", priority: "high", owner: "Platform", tags: ["performance"], linkedFrameworks: [] },
  { id: "req-atlas-005", projectId: "proj-demo-atlas", code: "ATL-0005", title: "Daily three-way reconciliation", description: "Daily three-way reconciliation between books-of-record, custodian feeds and clearing house positions, with automated break alerts.", type: "FRD", status: "implemented", priority: "high", owner: "Operations", tags: ["recon"], linkedFrameworks: ["SOC 2"] },
  { id: "req-atlas-006", projectId: "proj-demo-atlas", code: "ATL-0006", title: "Disaster recovery RTO 15 min / RPO 1 min", description: "RTO of 15 minutes and RPO of 1 minute for the settlement core; tested via quarterly chaos exercises.", type: "NFR", status: "approved", priority: "high", owner: "SRE", tags: ["resilience", "dr"], linkedFrameworks: ["SOC 2", "DORA"] },

  // ── Vega ───────────────────────────────────────────────────────────────────
  { id: "req-vega-001", projectId: "proj-demo-vega", code: "VEG-0001", title: "Auto-triage incoming claims", description: "Automatically route incoming claims to the right adjuster pod based on claim type, severity and complexity score.", type: "FRD", status: "implemented", priority: "high", owner: "Priya Natarajan", tags: ["triage"], linkedFrameworks: [] },
  { id: "req-vega-002", projectId: "proj-demo-vega", code: "VEG-0002", title: "Fraud scoring on intake", description: "Generate an ML fraud score for each incoming claim and flag high-risk cases for Special Investigations Unit review.", type: "FRD", status: "in_review", priority: "high", owner: "Fraud Ops", tags: ["fraud", "ml"], linkedFrameworks: [] },
  { id: "req-vega-003", projectId: "proj-demo-vega", code: "VEG-0003", title: "Adjudication explainability (GDPR Art. 22)", description: "Every automated decision must include a human-readable rationale and links to relevant policy clauses — required by GDPR Art. 22.", type: "FRD", status: "approved", priority: "critical", owner: "Priya Natarajan", tags: ["xai", "gdpr"], linkedFrameworks: ["GDPR"] },
  { id: "req-vega-004", projectId: "proj-demo-vega", code: "VEG-0004", title: "Immutable audit log — 7-year retention", description: "Retain all adjudication audit logs for 7 years in immutable storage, meeting jurisdictional insurance regulations.", type: "NFR", status: "verified", priority: "high", owner: "Compliance", tags: ["audit", "retention"], linkedFrameworks: ["SOC 2", "GDPR", "ISO/IEC 27001"] },
  { id: "req-vega-005", projectId: "proj-demo-vega", code: "VEG-0005", title: "Customer self-service claims portal", description: "Self-service portal for customers to track claim status, upload supporting documents and message adjusters securely.", type: "PRD", status: "draft", priority: "medium", owner: "Product", tags: ["portal", "ux"], linkedFrameworks: ["GDPR"] },

  // ── Sterling ───────────────────────────────────────────────────────────────
  { id: "req-sterling-001", projectId: "proj-demo-sterling", code: "STR-0001", title: "COBOL ledger cutover with zero balance discrepancy", description: "End-of-day ledger balances must reconcile to the cent against the legacy COBOL system throughout the 90-day parallel-run period.", type: "BRD", status: "in_review", priority: "critical", owner: "James O'Brien", tags: ["migration", "ledger"], linkedFrameworks: [] },
  { id: "req-sterling-002", projectId: "proj-demo-sterling", code: "STR-0002", title: "PCI DSS 4.0 network segmentation", description: "Cardholder data environment must be isolated via micro-segmentation; no shared authentication with out-of-scope systems.", type: "FRD", status: "implemented", priority: "critical", owner: "Security Eng", tags: ["pci", "segmentation"], linkedFrameworks: ["PCI DSS 4.0"] },
  { id: "req-sterling-003", projectId: "proj-demo-sterling", code: "STR-0003", title: "DORA ICT incident classification and reporting", description: "ICT incidents must be classified, triaged and reported to the competent authority within 4 hours of detection per DORA Art. 19.", type: "FRD", status: "approved", priority: "high", owner: "CISO", tags: ["dora", "incident"], linkedFrameworks: ["DORA"] },
  { id: "req-sterling-004", projectId: "proj-demo-sterling", code: "STR-0004", title: "GDPR data sovereignty — EU personal data", description: "EU customer personal data must not leave EU borders; third-party processors must sign SCCs before onboarding.", type: "FRD", status: "implemented", priority: "high", owner: "Privacy", tags: ["gdpr", "sovereignty"], linkedFrameworks: ["GDPR"] },
  { id: "req-sterling-005", projectId: "proj-demo-sterling", code: "STR-0005", title: "ISO 27001 ISMS scope declaration", description: "Define and document the ISMS scope covering all cloud-native banking services, with a gap analysis against Annex A controls.", type: "FRD", status: "draft", priority: "high", owner: "CISO", tags: ["iso27001", "isms"], linkedFrameworks: ["ISO/IEC 27001"] },

  // ── Nova ───────────────────────────────────────────────────────────────────
  { id: "req-nova-001", projectId: "proj-demo-nova", code: "NOV-0001", title: "MiCA CASP licensing controls", description: "Implement and evidence all organisational, governance and capital-adequacy controls required for MiCA Crypto-Asset Service Provider authorisation.", type: "BRD", status: "in_review", priority: "critical", owner: "Sofia Andreou", tags: ["mica", "licensing"], linkedFrameworks: [] },
  { id: "req-nova-002", projectId: "proj-demo-nova", code: "NOV-0002", title: "Real-time AML transaction monitoring", description: "Screen all transactions ≥ €1,000 against OFAC, EU sanctions lists and internal risk rules within 500 ms of submission.", type: "FRD", status: "implemented", priority: "critical", owner: "Compliance", tags: ["aml", "sanctions"], linkedFrameworks: ["PCI DSS 4.0"] },
  { id: "req-nova-003", projectId: "proj-demo-nova", code: "NOV-0003", title: "KYC/KYB onboarding — FATF VASP standards", description: "Customer onboarding must complete FATF Virtual Asset Service Provider Level 2 KYC with document verification and liveness check.", type: "FRD", status: "implemented", priority: "critical", owner: "Compliance", tags: ["kyc", "fatf"], linkedFrameworks: ["GDPR"] },
  { id: "req-nova-004", projectId: "proj-demo-nova", code: "NOV-0004", title: "Cold wallet key ceremony — HSM-backed", description: "Cold wallet key generation must use an air-gapped HSM ceremony with at least 3-of-5 key custodian quorum, video-recorded and notarised.", type: "FRD", status: "approved", priority: "critical", owner: "Custody Eng", tags: ["custody", "hsm"], linkedFrameworks: ["ISO/IEC 27001"] },

  // ── Ares ───────────────────────────────────────────────────────────────────
  { id: "req-ares-001", projectId: "proj-demo-ares", code: "ARS-0001", title: "ASIL-D perception pipeline", description: "Object detection and classification pipeline must achieve ASIL-D integrity; redundant sensor channels with voted output.", type: "FRD", status: "implemented", priority: "critical", owner: "Elena Bauer", tags: ["asil", "perception"], linkedFrameworks: ["ISO 26262"] },
  { id: "req-ares-002", projectId: "proj-demo-ares", code: "ARS-0002", title: "Cybersecurity threat analysis (TARA)", description: "Complete Threat Analysis and Risk Assessment per ISO/SAE 21434 for all external communication interfaces before SOP.", type: "FRD", status: "in_review", priority: "critical", owner: "Cyber Eng", tags: ["tara", "21434"], linkedFrameworks: ["ISO/SAE 21434"] },
  { id: "req-ares-003", projectId: "proj-demo-ares", code: "ARS-0003", title: "ASPICE SWE.1–SWE.6 process compliance", description: "Software engineering work products for ASPICE Level 2 assessment: SRS, SDD, unit test specs, integration test specs, and review records.", type: "FRD", status: "in_review", priority: "high", owner: "SW Process", tags: ["aspice", "swe"], linkedFrameworks: ["ASPICE 4.0"] },
  { id: "req-ares-004", projectId: "proj-demo-ares", code: "ARS-0004", title: "Minimum risk condition — highway to standstill", description: "On Level 3 system failure, execute Minimum Risk Condition manoeuvre: safe deceleration to standstill within 10 s, hazard lights on.", type: "FRD", status: "approved", priority: "critical", owner: "Safety Eng", tags: ["mrc", "fallback"], linkedFrameworks: ["ISO 26262"] },
  { id: "req-ares-005", projectId: "proj-demo-ares", code: "ARS-0005", title: "OTA update authentication and rollback", description: "Over-the-air software updates must be cryptographically signed (Ed25519), verified before flash, and support automatic rollback on failure.", type: "FRD", status: "approved", priority: "high", owner: "Cyber Eng", tags: ["ota", "security"], linkedFrameworks: ["ISO/SAE 21434", "ASPICE 4.0"] },

  // ── Titan ──────────────────────────────────────────────────────────────────
  { id: "req-titan-001", projectId: "proj-demo-titan", code: "TTN-0001", title: "SIL 3 safety function — emergency shutdown", description: "Emergency shutdown safety function must meet IEC 61508 SIL 3: PFD ≤ 10⁻⁴ per demand with full independence from basic process control.", type: "FRD", status: "verified", priority: "critical", owner: "Kenji Watanabe", tags: ["sil3", "esd"], linkedFrameworks: ["IEC 61508"] },
  { id: "req-titan-002", projectId: "proj-demo-titan", code: "TTN-0002", title: "IEC 62443 security level SL 2", description: "All PLC-to-SCADA communication must achieve IEC 62443-3-3 Security Level 2: encrypted channels, authenticated endpoints, tamper logging.", type: "FRD", status: "implemented", priority: "critical", owner: "OT Security", tags: ["ics", "sl2"], linkedFrameworks: ["IEC 62443"] },
  { id: "req-titan-003", projectId: "proj-demo-titan", code: "TTN-0003", title: "Proof-test interval — 12-month schedule", description: "Safety instrumented functions must undergo full proof-test at ≤12-month intervals; test records retained for equipment lifetime.", type: "FRD", status: "approved", priority: "high", owner: "Maintenance", tags: ["proof-test", "sis"], linkedFrameworks: ["IEC 61508", "IEC 61511"] },
  { id: "req-titan-004", projectId: "proj-demo-titan", code: "TTN-0004", title: "Air-gap for safety network", description: "Safety network (ESD / F&G) must be physically air-gapped from the business IT network; no data diodes permitted without written HAZOP justification.", type: "NFR", status: "implemented", priority: "critical", owner: "OT Security", tags: ["airgap", "network"], linkedFrameworks: ["IEC 62443"] },

  // ── Apollo ─────────────────────────────────────────────────────────────────
  { id: "req-apollo-001", projectId: "proj-demo-apollo", code: "APL-0001", title: "Thermal runaway detection < 2 ms", description: "Cell temperature and voltage deviation algorithms must trigger protection within 2 ms of event onset — ASIL-C timing requirement.", type: "NFR", status: "implemented", priority: "critical", owner: "Nadia Kozlov", tags: ["thermal", "safety"], linkedFrameworks: ["ISO 26262"] },
  { id: "req-apollo-002", projectId: "proj-demo-apollo", code: "APL-0002", title: "IEC 62133-2 cell abuse testing traceability", description: "Cell-level abuse test results (overcharge, nail penetration, crush) must be linked to each battery system variant in the design record.", type: "FRD", status: "verified", priority: "critical", owner: "Battery Eng", tags: ["iec62133", "abuse"], linkedFrameworks: ["ISO 26262"] },
  { id: "req-apollo-003", projectId: "proj-demo-apollo", code: "APL-0003", title: "State-of-charge estimation accuracy ± 2%", description: "SoC estimation must be within ±2% of true capacity across all operating temperatures (−30 °C to +60 °C) and cycle counts.", type: "NFR", status: "in_review", priority: "high", owner: "Algorithm Team", tags: ["soc", "accuracy"], linkedFrameworks: [] },
  { id: "req-apollo-004", projectId: "proj-demo-apollo", code: "APL-0004", title: "UN ECE R100 homologation evidence pack", description: "Compile homologation documentation for UN ECE Regulation 100 covering electrical safety, isolation resistance and post-crash integrity.", type: "FRD", status: "draft", priority: "high", owner: "Regulatory Affairs", tags: ["homologation", "r100"], linkedFrameworks: [] },

  // ── Bastion ────────────────────────────────────────────────────────────────
  { id: "req-bastion-001", projectId: "proj-demo-bastion", code: "BST-0001", title: "Continuous misconfiguration detection (CSPM)", description: "Scan all cloud accounts for CIS Benchmark deviations every 15 minutes; critical findings must auto-create tickets within 5 minutes.", type: "FRD", status: "implemented", priority: "critical", owner: "Tariq Hassan", tags: ["cspm", "cis"], linkedFrameworks: ["SOC 2", "ISO/IEC 27001"] },
  { id: "req-bastion-002", projectId: "proj-demo-bastion", code: "BST-0002", title: "SOC 2 Type II — all 5 Trust Service Criteria", description: "Collect and maintain continuous evidence for Security, Availability, Confidentiality, Processing Integrity and Privacy TSC throughout the audit period.", type: "BRD", status: "in_review", priority: "critical", owner: "Compliance", tags: ["soc2", "tsc"], linkedFrameworks: ["SOC 2"] },
  { id: "req-bastion-003", projectId: "proj-demo-bastion", code: "BST-0003", title: "NIST CSF 2.0 maturity tier 3", description: "Achieve NIST CSF 2.0 Tier 3 (Repeatable) across all six functions: Govern, Identify, Protect, Detect, Respond, Recover.", type: "BRD", status: "approved", priority: "high", owner: "CISO", tags: ["nist-csf"], linkedFrameworks: ["NIST CSF 2.0"] },
  { id: "req-bastion-004", projectId: "proj-demo-bastion", code: "BST-0004", title: "Vulnerability SLA: critical ≤ 4 hours", description: "Critical CVEs must be triaged and a remediation ticket created within 4 hours of scanner detection; high severity within 24 hours.", type: "NFR", status: "implemented", priority: "high", owner: "SecOps", tags: ["vuln-mgmt", "sla"], linkedFrameworks: ["SOC 2", "ISO/IEC 27001", "NIST CSF 2.0"] },

  // ── Aegis ──────────────────────────────────────────────────────────────────
  { id: "req-aegis-001", projectId: "proj-demo-aegis", code: "AEG-0001", title: "NIST SP 800-63-3 AAL2 authentication", description: "All privileged actions must require AAL2 authentication: password + TOTP or FIDO2 hardware token.", type: "FRD", status: "implemented", priority: "critical", owner: "Amara Diallo", tags: ["mfa", "nist800-63"], linkedFrameworks: ["SOC 2", "NIST CSF 2.0"] },
  { id: "req-aegis-002", projectId: "proj-demo-aegis", code: "AEG-0002", title: "GDPR consent management and withdrawal", description: "Users must be able to grant, view and withdraw each consent purpose individually; withdrawal must propagate to all downstream processors within 24 hours.", type: "FRD", status: "implemented", priority: "critical", owner: "Privacy", tags: ["gdpr", "consent"], linkedFrameworks: ["GDPR"] },
  { id: "req-aegis-003", projectId: "proj-demo-aegis", code: "AEG-0003", title: "Zero-trust network access policy engine", description: "Every service-to-service call must be evaluated by the policy engine against identity, device posture and data classification — no implicit trust.", type: "FRD", status: "in_review", priority: "high", owner: "Network Sec", tags: ["ztna", "zero-trust"], linkedFrameworks: ["SOC 2", "NIST CSF 2.0"] },
  { id: "req-aegis-004", projectId: "proj-demo-aegis", code: "AEG-0004", title: "Privileged access workstation (PAW) policy", description: "All production credential access must originate from a PAW with EDR, disk encryption and no internet access. Policy enforced via device posture checks.", type: "FRD", status: "approved", priority: "high", owner: "IAM Eng", tags: ["paw", "privileged"], linkedFrameworks: ["ISO/IEC 27001", "SOC 2"] },

  // ── Cipher ─────────────────────────────────────────────────────────────────
  { id: "req-cipher-001", projectId: "proj-demo-cipher", code: "CPH-0001", title: "OWASP API Top 10 — full coverage", description: "API gateway must enforce mitigations for all OWASP API Security Top 10 (2023) risks including broken object-level authorisation and unrestricted resource consumption.", type: "FRD", status: "implemented", priority: "critical", owner: "Leo Fernandez", tags: ["owasp", "apigw"], linkedFrameworks: ["PCI DSS 4.0", "ISO/IEC 27001"] },
  { id: "req-cipher-002", projectId: "proj-demo-cipher", code: "CPH-0002", title: "mTLS enforcement on all east-west traffic", description: "All east-west service communication must use mutual TLS 1.3 with short-lived certificates issued by an internal CA with 24-hour TTL.", type: "NFR", status: "implemented", priority: "critical", owner: "Platform", tags: ["mtls", "pki"], linkedFrameworks: ["PCI DSS 4.0", "ISO/IEC 27001"] },
  { id: "req-cipher-003", projectId: "proj-demo-cipher", code: "CPH-0003", title: "API rate limiting — per-client and global", description: "Rate-limit every API endpoint: per-client burst of 100 req/s and global ceiling of 10,000 req/s; returns 429 with Retry-After header.", type: "NFR", status: "implemented", priority: "high", owner: "Platform", tags: ["rate-limit"], linkedFrameworks: ["PCI DSS 4.0"] },
  { id: "req-cipher-004", projectId: "proj-demo-cipher", code: "CPH-0004", title: "PCI DSS 4.0 network segmentation validation", description: "Quarterly pen-test to validate CDE segmentation controls; network diagram updated within 5 business days of any topology change.", type: "FRD", status: "in_review", priority: "high", owner: "Security Eng", tags: ["pci", "segmentation", "pentest"], linkedFrameworks: ["PCI DSS 4.0"] },
];

// ─────────────────────────────────────────────────────────────────────────────
// PDLC stage data (per project)
// ─────────────────────────────────────────────────────────────────────────────

const PDLC_DATA: Record<string, { completions: [number,number,number,number,number,number]; blockers: [number,number,number,number,number,number] }> = {
  "proj-demo-helios":  { completions: [100, 92, 71, 54, 22, 88], blockers: [0,1,2,3,1,0] },
  "proj-demo-orion":   { completions: [100, 100, 83, 60, 35, 72], blockers: [0,0,1,2,0,1] },
  "proj-demo-aesop":   { completions: [100, 95, 74, 48, 18, 65], blockers: [0,0,2,3,0,1] },
  "proj-demo-nexus":   { completions: [100, 85, 52, 28, 8, 55], blockers: [0,2,3,2,0,1] },
  "proj-demo-atlas":   { completions: [100, 80, 48, 22, 5, 64], blockers: [0,2,4,2,0,1] },
  "proj-demo-vega":    { completions: [100, 100, 86, 70, 41, 92], blockers: [0,0,1,2,0,0] },
  "proj-demo-sterling":{ completions: [100, 88, 45, 18, 3, 50], blockers: [0,1,4,2,0,2] },
  "proj-demo-nova":    { completions: [100, 90, 60, 30, 12, 45], blockers: [0,0,2,3,1,2] },
  "proj-demo-ares":    { completions: [100, 95, 78, 55, 30, 80], blockers: [0,0,1,2,0,1] },
  "proj-demo-titan":   { completions: [100, 100, 90, 80, 65, 95], blockers: [0,0,0,1,0,0] },
  "proj-demo-apollo":  { completions: [100, 97, 82, 63, 40, 78], blockers: [0,0,1,2,0,1] },
  "proj-demo-bastion": { completions: [100, 100, 95, 90, 85, 98], blockers: [0,0,0,0,0,0] },
  "proj-demo-aegis":   { completions: [100, 100, 88, 75, 60, 92], blockers: [0,0,1,1,0,0] },
  "proj-demo-cipher":  { completions: [100, 100, 92, 80, 70, 90], blockers: [0,0,0,1,0,0] },
};

// ─────────────────────────────────────────────────────────────────────────────
// Per-module demo data for the six anchor projects.
// Anchor projects span all four verticals so every module page shows a rich,
// cross-industry sample when viewed in demo mode.
// ─────────────────────────────────────────────────────────────────────────────

const ANCHORS = [
  "proj-demo-helios",
  "proj-demo-orion",
  "proj-demo-atlas",
  "proj-demo-vega",
  "proj-demo-ares",
  "proj-demo-bastion",
] as const;

const NOW = new Date();
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86400_000);
const daysAhead = (d: number) => new Date(NOW.getTime() + d * 86400_000);

// ── Project sources ─────────────────────────────────────────────────────────
const PROJECT_SOURCES = [
  // Helios
  { id: "src-helios-github",  projectId: "proj-demo-helios",  kind: "github",  label: "acme-health/helios-onboarding",   status: "ready", fileCount: 4821, byteCount: 18_400_000, lastSyncAt: daysAgo(1) },
  { id: "src-helios-jira",    projectId: "proj-demo-helios",  kind: "jira",    label: "Jira — HEL board",                status: "ready", fileCount: 612,  byteCount: 0,           lastSyncAt: daysAgo(0) },
  { id: "src-helios-gdrive",  projectId: "proj-demo-helios",  kind: "gdrive",  label: "Google Drive — Helios SOPs",      status: "ready", fileCount: 84,   byteCount: 124_900_000, lastSyncAt: daysAgo(2) },
  // Orion
  { id: "src-orion-github",   projectId: "proj-demo-orion",   kind: "github",  label: "acme-health/orion-firmware",      status: "ready", fileCount: 1542, byteCount: 9_300_000,   lastSyncAt: daysAgo(1) },
  { id: "src-orion-ado",      projectId: "proj-demo-orion",   kind: "alm",     label: "Azure DevOps — Orion FW Bugs",    status: "ready", fileCount: 318,  byteCount: 0,           lastSyncAt: daysAgo(0) },
  { id: "src-orion-zip",      projectId: "proj-demo-orion",   kind: "zip",     label: "DHF-Orion-v3.2.zip",              status: "ready", fileCount: 247,  byteCount: 88_100_000,  lastSyncAt: daysAgo(7) },
  // Atlas
  { id: "src-atlas-github",   projectId: "proj-demo-atlas",   kind: "github",  label: "acme-fin/atlas-settlement",       status: "ready", fileCount: 6210, byteCount: 41_200_000,  lastSyncAt: daysAgo(0) },
  { id: "src-atlas-jira",     projectId: "proj-demo-atlas",   kind: "jira",    label: "Jira — ATL board",                status: "ready", fileCount: 974,  byteCount: 0,           lastSyncAt: daysAgo(0) },
  { id: "src-atlas-jenkins",  projectId: "proj-demo-atlas",   kind: "jenkins", label: "Jenkins — atlas-ci",              status: "ready", fileCount: 0,    byteCount: 0,           lastSyncAt: daysAgo(0) },
  // Vega
  { id: "src-vega-github",    projectId: "proj-demo-vega",    kind: "github",  label: "acme-ins/vega-claims",            status: "ready", fileCount: 3210, byteCount: 22_700_000,  lastSyncAt: daysAgo(1) },
  { id: "src-vega-jira",      projectId: "proj-demo-vega",    kind: "jira",    label: "Jira — VEG board",                status: "ready", fileCount: 540,  byteCount: 0,           lastSyncAt: daysAgo(0) },
  // Ares
  { id: "src-ares-github",    projectId: "proj-demo-ares",    kind: "github",  label: "acme-auto/ares-adas",             status: "ready", fileCount: 8420, byteCount: 64_500_000,  lastSyncAt: daysAgo(0) },
  { id: "src-ares-ado",       projectId: "proj-demo-ares",    kind: "alm",     label: "Azure DevOps — Ares Defects",     status: "ready", fileCount: 1102, byteCount: 0,           lastSyncAt: daysAgo(0) },
  { id: "src-ares-folder",    projectId: "proj-demo-ares",    kind: "folder",  label: "ASPICE Workproducts",             status: "ready", fileCount: 412,  byteCount: 152_300_000, lastSyncAt: daysAgo(3) },
  // Bastion
  { id: "src-bastion-github", projectId: "proj-demo-bastion", kind: "github",  label: "acme-sec/bastion-cspm",           status: "ready", fileCount: 2940, byteCount: 19_100_000,  lastSyncAt: daysAgo(0) },
  { id: "src-bastion-jira",   projectId: "proj-demo-bastion", kind: "jira",    label: "Jira — BST board",                status: "ready", fileCount: 388,  byteCount: 0,           lastSyncAt: daysAgo(0) },
  { id: "src-bastion-aws",    projectId: "proj-demo-bastion", kind: "aws_s3",  label: "S3 — bastion-evidence-locker",    status: "ready", fileCount: 1854, byteCount: 412_800_000, lastSyncAt: daysAgo(1) },
];

// ── Defects ─────────────────────────────────────────────────────────────────
type DefectSpec = {
  id: string; projectId: string; sourceId: string; externalSystem: string;
  externalId: string; key: string; externalUrl?: string;
  title: string; description: string;
  status: string; severity: string; priority: string; component: string;
  raisedAt: Date; resolvedAt?: Date | null;
};
const DEFECTS: DefectSpec[] = [
  // Helios — Jira HEL
  { id: "def-helios-001", projectId: "proj-demo-helios", sourceId: "src-helios-jira", externalSystem: "jira", externalId: "HEL-1042", key: "HEL-1042", title: "Onboarding step skipped after browser back-button", description: "Patients pressing the browser back-button on the consent step bypass HIPAA consent capture in 0.4% of sessions.", status: "open",        severity: "critical", priority: "p1", component: "Onboarding Flow",   raisedAt: daysAgo(4) },
  { id: "def-helios-002", projectId: "proj-demo-helios", sourceId: "src-helios-jira", externalSystem: "jira", externalId: "HEL-1051", key: "HEL-1051", title: "PHI audit log timestamp drift on EU edge nodes",      description: "EU-West edge nodes log PHI read events with up to 7s clock drift, breaking 7-year retention chain-of-custody.", status: "in_progress", severity: "major",    priority: "p2", component: "Audit Log",        raisedAt: daysAgo(9) },
  { id: "def-helios-003", projectId: "proj-demo-helios", sourceId: "src-helios-jira", externalSystem: "jira", externalId: "HEL-1067", key: "HEL-1067", title: "Right-to-erasure workflow stalls at ITSM handoff",   description: "GDPR erasure tickets routed to legacy ITSM never trigger the downstream erase job; 3 tickets exceeded 30-day SLA.", status: "open",        severity: "major",    priority: "p1", component: "Privacy",         raisedAt: daysAgo(2) },
  { id: "def-helios-004", projectId: "proj-demo-helios", sourceId: "src-helios-jira", externalSystem: "jira", externalId: "HEL-0993", key: "HEL-0993", title: "Session timeout warning not announced to screen reader", description: "WCAG 2.2 SC 4.1.3: 30-min idle timeout warning toast not announced — affects screen-reader users.", status: "resolved", severity: "minor", priority: "p3", component: "Accessibility", raisedAt: daysAgo(21), resolvedAt: daysAgo(6) },
  { id: "def-helios-005", projectId: "proj-demo-helios", sourceId: "src-helios-jira", externalSystem: "jira", externalId: "HEL-1078", key: "HEL-1078", title: "ID upload accepts expired documents",                description: "Government ID OCR step accepts documents whose expiry date has passed, bypassing identity-verification policy.", status: "open",        severity: "major",    priority: "p2", component: "Intake",          raisedAt: daysAgo(1) },
  { id: "def-helios-006", projectId: "proj-demo-helios", sourceId: "src-helios-jira", externalSystem: "jira", externalId: "HEL-1085", key: "HEL-1085", title: "P95 onboarding completion regressed to 4m48s",       description: "Last release degraded P95 completion from 3m58s to 4m48s — breaches HEL-0006 SLA.", status: "in_progress", severity: "major",    priority: "p2", component: "Performance",     raisedAt: daysAgo(0) },

  // Orion — ADO
  { id: "def-orion-001", projectId: "proj-demo-orion", sourceId: "src-orion-ado", externalSystem: "azure_devops", externalId: "8841", key: "ORN-8841", title: "OTA programmer session retains key after timeout",     description: "Mutual-cert OTA programmer session keeps AES-128 key in RAM 18s past session-end — risk of replay if device reboots in window.", status: "in_progress", severity: "critical", priority: "p1", component: "Telemetry",        raisedAt: daysAgo(5) },
  { id: "def-orion-002", projectId: "proj-demo-orion", sourceId: "src-orion-ado", externalSystem: "azure_devops", externalId: "8855", key: "ORN-8855", title: "Therapy inhibit latency 240ms on -10°C corner",         description: "Closed-loop inhibit measured at 240ms at -10°C ambient — exceeds 200ms requirement (ORN-0002).", status: "open", severity: "critical", priority: "p1", component: "Firmware/Detect",  raisedAt: daysAgo(3) },
  { id: "def-orion-003", projectId: "proj-demo-orion", sourceId: "src-orion-ado", externalSystem: "azure_devops", externalId: "8861", key: "ORN-8861", title: "FreeRTOS heap fragmentation after 72h",                 description: "Long-soak test shows FreeRTOS heap fragmenting to 14% after 72h, risking malloc failures during therapy events.", status: "in_progress", severity: "major", priority: "p2", component: "RTOS",             raisedAt: daysAgo(8) },
  { id: "def-orion-004", projectId: "proj-demo-orion", sourceId: "src-orion-ado", externalSystem: "azure_devops", externalId: "8702", key: "ORN-8702", title: "DHF link missing for v3.2.1 firmware build",          description: "Firmware revision hash for v3.2.1 not auto-linked to DHF — manual workaround applied; root cause TBD.", status: "resolved",    severity: "major",    priority: "p2", component: "Build/Trace",      raisedAt: daysAgo(30), resolvedAt: daysAgo(12) },
  { id: "def-orion-005", projectId: "proj-demo-orion", sourceId: "src-orion-ado", externalSystem: "azure_devops", externalId: "8870", key: "ORN-8870", title: "Programmer UI mis-renders Cyrillic patient names",     description: "Patient names with Cyrillic chars render as mojibake in the device programmer UI.", status: "open",        severity: "minor",    priority: "p3", component: "Programmer UI",   raisedAt: daysAgo(1) },
  { id: "def-orion-006", projectId: "proj-demo-orion", sourceId: "src-orion-ado", externalSystem: "azure_devops", externalId: "8878", key: "ORN-8878", title: "PMS telemetry dropouts on 4G hand-off",                description: "Post-market surveillance feed loses 0.7% of telemetry packets on cellular hand-off events.", status: "open",        severity: "major",    priority: "p2", component: "PMS",              raisedAt: daysAgo(0) },

  // Atlas — Jira ATL
  { id: "def-atlas-001", projectId: "proj-demo-atlas", sourceId: "src-atlas-jira", externalSystem: "jira", externalId: "ATL-2204", key: "ATL-2204", title: "Pre-trade gate latency p99 = 1.4ms",                  description: "Pre-trade risk gate p99 latency drifted from 0.8ms to 1.4ms after Kafka client upgrade — risks missing T+1 cut-off.", status: "in_progress", severity: "critical", priority: "p1", component: "RiskGate",        raisedAt: daysAgo(2) },
  { id: "def-atlas-002", projectId: "proj-demo-atlas", sourceId: "src-atlas-jira", externalSystem: "jira", externalId: "ATL-2197", key: "ATL-2197", title: "Tokeniser leaks PAN to debug log under retry",       description: "Under DB retry, payment tokeniser logs raw PAN to debug.log — direct PCI DSS 4.0 Req 3.5.1 breach.", status: "open",        severity: "critical", priority: "p1", component: "Tokeniser",       raisedAt: daysAgo(1) },
  { id: "def-atlas-003", projectId: "proj-demo-atlas", sourceId: "src-atlas-jira", externalSystem: "jira", externalId: "ATL-2188", key: "ATL-2188", title: "Recon break alerts duplicated for split fills",      description: "Three-way reconciliation generates duplicate break alerts for partially-filled trades — Ops noise.", status: "in_progress", severity: "major",    priority: "p2", component: "Reconciliation",  raisedAt: daysAgo(7) },
  { id: "def-atlas-004", projectId: "proj-demo-atlas", sourceId: "src-atlas-jira", externalSystem: "jira", externalId: "ATL-2150", key: "ATL-2150", title: "DR drill: failover RTO measured 18m",                description: "Q1 DR exercise measured RTO of 18m vs 15m requirement (ATL-0006); root cause = stale DNS TTL.", status: "resolved",    severity: "major",    priority: "p2", component: "SRE",             raisedAt: daysAgo(50), resolvedAt: daysAgo(24) },
  { id: "def-atlas-005", projectId: "proj-demo-atlas", sourceId: "src-atlas-jira", externalSystem: "jira", externalId: "ATL-2210", key: "ATL-2210", title: "Settlement throughput drops to 38k/min under GC",   description: "JVM GC pauses on settlement-engine reduce throughput to 38k/min for ~12s — fails ATL-0004 P99 SLA.", status: "open",        severity: "major",    priority: "p2", component: "SettlementEngine", raisedAt: daysAgo(0) },
  { id: "def-atlas-006", projectId: "proj-demo-atlas", sourceId: "src-atlas-jira", externalSystem: "jira", externalId: "ATL-2215", key: "ATL-2215", title: "Audit log gap during Kafka rebalance",               description: "Settlement audit-log Kafka consumer drops 200ms of records during partition rebalance — SOC 2 finding.", status: "open",        severity: "major",    priority: "p1", component: "AuditLog",        raisedAt: daysAgo(0) },

  // Vega — Jira VEG
  { id: "def-vega-001", projectId: "proj-demo-vega", sourceId: "src-vega-jira", externalSystem: "jira", externalId: "VEG-934", key: "VEG-934", title: "Auto-triage misroutes commercial property claims",     description: "ML triage misroutes 2.1% of commercial property claims to personal-lines pod — re-work cost ~₹4.2L/mo.", status: "open",        severity: "major", priority: "p2", component: "Triage",          raisedAt: daysAgo(3) },
  { id: "def-vega-002", projectId: "proj-demo-vega", sourceId: "src-vega-jira", externalSystem: "jira", externalId: "VEG-940", key: "VEG-940", title: "Fraud score model drift: F1 dropped 0.81→0.74",         description: "Monthly model monitoring shows F1 drift on fraud scorer; suspected data drift on commercial auto segment.", status: "in_progress", severity: "major", priority: "p2", component: "FraudML",         raisedAt: daysAgo(6) },
  { id: "def-vega-003", projectId: "proj-demo-vega", sourceId: "src-vega-jira", externalSystem: "jira", externalId: "VEG-948", key: "VEG-948", title: "GDPR Art.22 rationale truncated above 4 KB",            description: "Adjudication rationale text gets truncated at 4 KB in customer-facing portal; breaches XAI requirement (VEG-0003).", status: "open",        severity: "major", priority: "p1", component: "Adjudication",    raisedAt: daysAgo(1) },
  { id: "def-vega-004", projectId: "proj-demo-vega", sourceId: "src-vega-jira", externalSystem: "jira", externalId: "VEG-911", key: "VEG-911", title: "Retention job purged audit logs 6 months early",       description: "Mis-configured retention policy deleted ~120k audit log rows 6 months before 7-year horizon. CAPA opened.", status: "resolved",    severity: "critical", priority: "p1", component: "AuditLog",        raisedAt: daysAgo(45), resolvedAt: daysAgo(20) },
  { id: "def-vega-005", projectId: "proj-demo-vega", sourceId: "src-vega-jira", externalSystem: "jira", externalId: "VEG-955", key: "VEG-955", title: "Self-service portal upload rejects HEIC images",        description: "Portal claim-evidence uploader rejects HEIC images from iOS users — accessibility/usability issue.", status: "open",        severity: "minor", priority: "p3", component: "Portal",          raisedAt: daysAgo(0) },
  { id: "def-vega-006", projectId: "proj-demo-vega", sourceId: "src-vega-jira", externalSystem: "jira", externalId: "VEG-960", key: "VEG-960", title: "SIU dashboard misses high-risk flags after restart",   description: "Special Investigations Unit dashboard fails to surface fraud-flagged claims for ~5min after pod restart.", status: "in_progress", severity: "major", priority: "p2", component: "SIU Dashboard",   raisedAt: daysAgo(0) },

  // Ares — ADO
  { id: "def-ares-001", projectId: "proj-demo-ares", sourceId: "src-ares-ado", externalSystem: "azure_devops", externalId: "11204", key: "ARES-11204", title: "Lane-keep assist drift on faded lane markings",       description: "Perception model exhibits 14cm lane-centre drift on heavily-faded markings — exceeds ASIL D safety goal.", status: "in_progress", severity: "critical", priority: "p1", component: "Perception",      raisedAt: daysAgo(4) },
  { id: "def-ares-002", projectId: "proj-demo-ares", sourceId: "src-ares-ado", externalSystem: "azure_devops", externalId: "11211", key: "ARES-11211", title: "MISRA C++ violation count regressed to 47",            description: "Static analysis shows 47 MISRA C++ 2008 violations introduced in path-planner refactor — fails ASPICE SUP.10.", status: "open",        severity: "major",    priority: "p2", component: "PathPlanner",     raisedAt: daysAgo(2) },
  { id: "def-ares-003", projectId: "proj-demo-ares", sourceId: "src-ares-ado", externalSystem: "azure_devops", externalId: "11220", key: "ARES-11220", title: "ECU bootloader fails CRC check on cold start",         description: "Cold-start CRC verification of bootloader image fails 1 in ~4000 starts — root cause TBD.", status: "open",        severity: "critical", priority: "p1", component: "Bootloader",      raisedAt: daysAgo(1) },
  { id: "def-ares-004", projectId: "proj-demo-ares", sourceId: "src-ares-ado", externalSystem: "azure_devops", externalId: "11150", key: "ARES-11150", title: "CAN bus arbitration timeouts on test-rig 4",          description: "CAN-FD test-rig 4 reports occasional 200µs arbitration timeouts; not reproducible on rig 1-3.", status: "resolved",    severity: "minor",    priority: "p3", component: "CAN/HW",           raisedAt: daysAgo(35), resolvedAt: daysAgo(15) },
  { id: "def-ares-005", projectId: "proj-demo-ares", sourceId: "src-ares-ado", externalSystem: "azure_devops", externalId: "11225", key: "ARES-11225", title: "OTA update package 2 MB above flash budget",          description: "v4.7 OTA package exceeds reserved flash partition by 2 MB — release blocked pending compression.", status: "in_progress", severity: "major",    priority: "p2", component: "OTA",              raisedAt: daysAgo(0) },
  { id: "def-ares-006", projectId: "proj-demo-ares", sourceId: "src-ares-ado", externalSystem: "azure_devops", externalId: "11230", key: "ARES-11230", title: "Cybersecurity: TLS 1.2 fallback enabled on diag port", description: "Diag port allows TLS 1.2 fallback — violates ISO 21434 cyber requirement; needs hardening.", status: "open",        severity: "critical", priority: "p1", component: "DiagPort",         raisedAt: daysAgo(0) },

  // Bastion — Jira BST
  { id: "def-bastion-001", projectId: "proj-demo-bastion", sourceId: "src-bastion-jira", externalSystem: "jira", externalId: "BST-512", key: "BST-512", title: "Critical CVE auto-ticket missed 4h SLA",         description: "CVE-2026-1248 was triaged in 6h12m vs 4h SLA (BST-0004) — paging escalation rule mis-configured.", status: "in_progress", severity: "major",    priority: "p2", component: "VulnMgmt",        raisedAt: daysAgo(2) },
  { id: "def-bastion-002", projectId: "proj-demo-bastion", sourceId: "src-bastion-jira", externalSystem: "jira", externalId: "BST-518", key: "BST-518", title: "Drift: prod IAM role grew 12 unused permissions", description: "CSPM drift report shows prod-eks-app role accumulated 12 unused permissions — violates least-privilege baseline.", status: "open",        severity: "major",    priority: "p2", component: "IAM Drift",       raisedAt: daysAgo(3) },
  { id: "def-bastion-003", projectId: "proj-demo-bastion", sourceId: "src-bastion-jira", externalSystem: "jira", externalId: "BST-524", key: "BST-524", title: "False-positive storm on S3 public-bucket scanner", description: "S3 public-bucket scanner emitted 412 false positives after AWS API change — noise drowning real findings.", status: "in_progress", severity: "major",    priority: "p2", component: "Scanner",         raisedAt: daysAgo(5) },
  { id: "def-bastion-004", projectId: "proj-demo-bastion", sourceId: "src-bastion-jira", externalSystem: "jira", externalId: "BST-481", key: "BST-481", title: "Evidence locker S3 versioning was disabled",     description: "Quarterly review found versioning OFF on bastion-evidence-locker — re-enabled, full audit trail re-built.", status: "resolved",    severity: "critical", priority: "p1", component: "EvidenceLocker",  raisedAt: daysAgo(60), resolvedAt: daysAgo(28) },
  { id: "def-bastion-005", projectId: "proj-demo-bastion", sourceId: "src-bastion-jira", externalSystem: "jira", externalId: "BST-528", key: "BST-528", title: "NIST CSF 2.0 RC.RP-2 evidence not auto-collected", description: "NIST CSF 2.0 control RC.RP-2 (recovery plan testing) evidence requires manual upload — needs automation.", status: "open",        severity: "minor",    priority: "p3", component: "Compliance",      raisedAt: daysAgo(1) },
  { id: "def-bastion-006", projectId: "proj-demo-bastion", sourceId: "src-bastion-jira", externalSystem: "jira", externalId: "BST-533", key: "BST-533", title: "GuardDuty findings ingested 22 min late",        description: "GuardDuty -> Bastion ingestion lagged 22 min during us-east-1 event — exceeded 15-min detection SLA.", status: "in_progress", severity: "major",    priority: "p2", component: "Ingestion",       raisedAt: daysAgo(0) },
];

// ── CAPA actions ────────────────────────────────────────────────────────────
const CAPA_ACTIONS = [
  { id: "capa-helios-001", projectId: "proj-demo-helios", code: "CAPA-HEL-001", title: "Block back-button bypass of HIPAA consent",          description: "Add server-side state guard so /consent cannot be skipped via browser back. Linked to HEL-1042.", severity: "critical", status: "in_progress", owner: "Avery Kim",       source: "ai_audit",   evidenceCount: 4, tags: ["hipaa","onboarding"], dueAt: daysAhead(7),  frameworkId: "fw-hipaa",       controlCode: "164.308(a)(4)" },
  { id: "capa-helios-002", projectId: "proj-demo-helios", code: "CAPA-HEL-002", title: "Resolve 7s clock drift on EU edge nodes",              description: "Deploy chrony with strict step thresholds on EU-West edge nodes; alert on >100ms drift.",         severity: "high",     status: "in_progress", owner: "SRE",             source: "inspection", evidenceCount: 2, tags: ["audit","time-sync"], dueAt: daysAhead(14), frameworkId: "fw-hipaa",       controlCode: "164.312(b)" },
  { id: "capa-helios-003", projectId: "proj-demo-helios", code: "CAPA-HEL-003", title: "Reject expired ID documents at OCR step",              description: "OCR step must reject documents with past expiry dates and route to human review.",                severity: "high",     status: "open",        owner: "Avery Kim",       source: "manual",     evidenceCount: 0, tags: ["intake"],            dueAt: daysAhead(10), frameworkId: "fw-hipaa",       controlCode: "164.514(d)" },
  { id: "capa-helios-004", projectId: "proj-demo-helios", code: "CAPA-HEL-004", title: "Restore P95 < 4 min onboarding SLO",                   description: "Profile and remediate regression introduced in v2.18; gate releases on synthetic SLO check.",      severity: "high",     status: "open",        owner: "Performance",     source: "manual",     evidenceCount: 0, tags: ["performance"],       dueAt: daysAhead(21), frameworkId: null,             controlCode: null },
  { id: "capa-helios-005", projectId: "proj-demo-helios", code: "CAPA-HEL-005", title: "Erasure SLA: ITSM bridge for 30-day GDPR window",      description: "Replace legacy ITSM hand-off with direct API call; auto-trigger erase job on ticket creation.",   severity: "critical", status: "open",        owner: "Privacy",         source: "ai_audit",   evidenceCount: 1, tags: ["gdpr","erasure"],    dueAt: daysAhead(28), frameworkId: "fw-gdpr",        controlCode: "Art.17" },

  { id: "capa-orion-001",  projectId: "proj-demo-orion",  code: "CAPA-ORN-001", title: "Wipe OTA session keys at session-end",                 description: "Ensure AES-128 OTA session key is zeroized within 100ms of session-end. Linked to ORN-8841.",     severity: "critical", status: "in_progress", owner: "Security Eng",    source: "ai_audit",   evidenceCount: 3, tags: ["security","ota"],    dueAt: daysAhead(14), frameworkId: "fw-iec-62304",   controlCode: "5.5.3" },
  { id: "capa-orion-002",  projectId: "proj-demo-orion",  code: "CAPA-ORN-002", title: "Meet 200ms inhibit latency at all corners",            description: "Optimise interrupt path to meet 200ms requirement at -10°C. Re-run V&V at all 6 thermal corners.", severity: "critical", status: "open",        owner: "Firmware Team",   source: "manual",     evidenceCount: 0, tags: ["timing","safety"],   dueAt: daysAhead(30), frameworkId: "fw-iec-62304",   controlCode: "5.6.1" },
  { id: "capa-orion-003",  projectId: "proj-demo-orion",  code: "CAPA-ORN-003", title: "FreeRTOS heap fragmentation mitigation",               description: "Switch heap_5 → static-pool allocator for therapy-critical tasks; document SOUP impact.",          severity: "high",     status: "in_progress", owner: "Firmware Team",   source: "manual",     evidenceCount: 1, tags: ["soup","rtos"],       dueAt: daysAhead(45), frameworkId: "fw-iec-62304",   controlCode: "8.1.2" },
  { id: "capa-orion-004",  projectId: "proj-demo-orion",  code: "CAPA-ORN-004", title: "Auto-link firmware revision to DHF",                   description: "CI step shall publish revision-hash → DHF entry to traceability service on every release tag.",     severity: "medium",   status: "done",        owner: "QA",              source: "ai_audit",   evidenceCount: 5, tags: ["dhf","traceability"],closedAt: daysAgo(8), frameworkId: "fw-21cfr-820",controlCode: "820.30(j)" },
  { id: "capa-orion-005",  projectId: "proj-demo-orion",  code: "CAPA-ORN-005", title: "PMS feed packet-loss < 0.1% on cellular hand-off",     description: "Add adaptive retry & batched upload to bring PMS feed loss below 0.1% during 4G hand-off.",        severity: "high",     status: "open",        owner: "Regulatory Affairs",source: "manual",   evidenceCount: 0, tags: ["pms"],               dueAt: daysAhead(60), frameworkId: "fw-eu-mdr-2017-745", controlCode: "Annex III" },

  { id: "capa-atlas-001",  projectId: "proj-demo-atlas",  code: "CAPA-ATL-001", title: "Eliminate PAN logging under retry",                     description: "Tokeniser must scrub PAN from all log paths including DB-retry exception traces. Audit log infra.", severity: "critical", status: "in_progress", owner: "Payments Eng",    source: "ai_audit",   evidenceCount: 2, tags: ["pci"],               dueAt: daysAhead(7),  frameworkId: "fw-pci-dss-4",   controlCode: "3.5.1" },
  { id: "capa-atlas-002",  projectId: "proj-demo-atlas",  code: "CAPA-ATL-002", title: "Restore pre-trade gate p99 ≤ 1ms",                      description: "Roll back Kafka client upgrade or pin to v3.5.x; add p99 SLO alert.",                              severity: "critical", status: "open",        owner: "Marcus Chen",     source: "manual",     evidenceCount: 0, tags: ["latency"],           dueAt: daysAhead(5),  frameworkId: null,             controlCode: null },
  { id: "capa-atlas-003",  projectId: "proj-demo-atlas",  code: "CAPA-ATL-003", title: "Eliminate audit log gap during Kafka rebalance",        description: "Switch to cooperative-sticky assignor and tune session.timeout.ms to prevent 200ms audit gaps.",   severity: "high",     status: "open",        owner: "Platform",        source: "ai_audit",   evidenceCount: 1, tags: ["soc2","audit"],      dueAt: daysAhead(21), frameworkId: "fw-soc2",        controlCode: "CC7.2" },
  { id: "capa-atlas-004",  projectId: "proj-demo-atlas",  code: "CAPA-ATL-004", title: "Q1 DR drill RTO regression",                            description: "Reduce DNS TTL on settlement endpoints to 60s; pre-warm replica cache.",                          severity: "high",     status: "done",        owner: "SRE",             source: "manual",     evidenceCount: 4, tags: ["dr"],                closedAt: daysAgo(20),frameworkId: "fw-dora",       controlCode: "Art.11" },
  { id: "capa-atlas-005",  projectId: "proj-demo-atlas",  code: "CAPA-ATL-005", title: "GC tuning to sustain 50k trades/min",                   description: "Migrate JVM to ZGC; validate at 60k trades/min in staging.",                                       severity: "medium",   status: "in_progress", owner: "SettlementEngine",source: "manual",     evidenceCount: 1, tags: ["performance"],       dueAt: daysAhead(30), frameworkId: null,             controlCode: null },

  { id: "capa-vega-001",   projectId: "proj-demo-vega",   code: "CAPA-VEG-001", title: "Re-train fraud scorer on commercial-auto segment",      description: "Refresh training set with last 90d commercial-auto data; target F1 ≥ 0.80.",                       severity: "high",     status: "in_progress", owner: "Fraud Ops",       source: "ai_audit",   evidenceCount: 2, tags: ["ml-drift"],          dueAt: daysAhead(21), frameworkId: null,             controlCode: null },
  { id: "capa-vega-002",   projectId: "proj-demo-vega",   code: "CAPA-VEG-002", title: "Fix GDPR Art.22 rationale truncation",                  description: "Increase rationale field to 32 KB; add explicit truncation marker if exceeded.",                  severity: "critical", status: "open",        owner: "Adjudication",    source: "ai_audit",   evidenceCount: 0, tags: ["gdpr","xai"],        dueAt: daysAhead(10), frameworkId: "fw-gdpr",        controlCode: "Art.22" },
  { id: "capa-vega-003",   projectId: "proj-demo-vega",   code: "CAPA-VEG-003", title: "Audit log retention policy guardrail",                  description: "Add retention policy linter + 4-eyes approval before any retention setting can decrease.",         severity: "critical", status: "done",        owner: "Compliance",      source: "inspection", evidenceCount: 6, tags: ["audit","retention"], closedAt: daysAgo(20),frameworkId: "fw-soc2",       controlCode: "CC7.3" },
  { id: "capa-vega-004",   projectId: "proj-demo-vega",   code: "CAPA-VEG-004", title: "Retrain triage classifier — commercial property",      description: "Add commercial property exemplars; reduce mis-route to <0.5%.",                                    severity: "medium",   status: "open",        owner: "Priya Natarajan", source: "manual",     evidenceCount: 0, tags: ["triage"],            dueAt: daysAhead(30), frameworkId: null,             controlCode: null },
  { id: "capa-vega-005",   projectId: "proj-demo-vega",   code: "CAPA-VEG-005", title: "SIU dashboard cold-start cache pre-warm",               description: "Pre-warm cache on pod startup; surface flagged claims within 30s of restart.",                     severity: "medium",   status: "in_progress", owner: "SIU Dashboard",   source: "manual",     evidenceCount: 1, tags: ["resilience"],        dueAt: daysAhead(14), frameworkId: null,             controlCode: null },

  { id: "capa-ares-001",   projectId: "proj-demo-ares",   code: "CAPA-ARES-001", title: "Lane-keep drift on faded markings — model rev",       description: "Augment perception training set with faded-marking imagery; re-validate against ASIL D safety goal.", severity: "critical", status: "in_progress", owner: "Perception",  source: "ai_audit",   evidenceCount: 3, tags: ["asil-d","perception"],dueAt: daysAhead(45), frameworkId: "fw-iso-26262",   controlCode: "Part 6 §7" },
  { id: "capa-ares-002",   projectId: "proj-demo-ares",   code: "CAPA-ARES-002", title: "MISRA C++ violation cleanup in path-planner",         description: "Remediate 47 MISRA C++ 2008 violations; reinstate static-analysis gate in CI.",                    severity: "high",     status: "in_progress", owner: "PathPlanner",  source: "inspection", evidenceCount: 1, tags: ["aspice","misra"],     dueAt: daysAhead(30), frameworkId: "fw-aspice-4",    controlCode: "SUP.10" },
  { id: "capa-ares-003",   projectId: "proj-demo-ares",   code: "CAPA-ARES-003", title: "Bootloader CRC failure — root cause",                  description: "Instrument cold-start path; capture flash signal-integrity traces; deliver root cause within 30d.", severity: "critical", status: "open",        owner: "Bootloader",   source: "manual",     evidenceCount: 0, tags: ["bootloader","safety"],dueAt: daysAhead(30), frameworkId: "fw-iso-26262",   controlCode: "Part 5 §7" },
  { id: "capa-ares-004",   projectId: "proj-demo-ares",   code: "CAPA-ARES-004", title: "OTA package size — compression strategy",              description: "Adopt brotli-11 + delta-update encoding to fit OTA package within reserved flash partition.",      severity: "high",     status: "open",        owner: "OTA",          source: "manual",     evidenceCount: 0, tags: ["ota"],                dueAt: daysAhead(20), frameworkId: null,             controlCode: null },
  { id: "capa-ares-005",   projectId: "proj-demo-ares",   code: "CAPA-ARES-005", title: "Disable TLS 1.2 fallback on diag port",                description: "Enforce TLS 1.3 only; add cyber-test case in regression suite.",                                  severity: "critical", status: "in_progress", owner: "Security Eng", source: "ai_audit",   evidenceCount: 2, tags: ["iso21434","cyber"],   dueAt: daysAhead(10), frameworkId: null,             controlCode: null },

  { id: "capa-bastion-001",projectId: "proj-demo-bastion",code: "CAPA-BST-001", title: "Fix 4h critical-CVE paging escalation",                description: "Re-configure PagerDuty escalation ladder; add CVE-criticality routing rule + SLO alert at 3h45.",  severity: "high",     status: "in_progress", owner: "SecOps",          source: "ai_audit",   evidenceCount: 2, tags: ["vuln-mgmt","sla"],   dueAt: daysAhead(7),  frameworkId: "fw-soc2",        controlCode: "CC7.2" },
  { id: "capa-bastion-002",projectId: "proj-demo-bastion",code: "CAPA-BST-002", title: "IAM least-privilege drift — auto-prune",                description: "Auto-detect & propose pruning of unused IAM permissions every 30 days via policy-as-code.",        severity: "high",     status: "open",        owner: "Tariq Hassan",    source: "ai_audit",   evidenceCount: 0, tags: ["iam","least-privilege"],dueAt: daysAhead(30),frameworkId: "fw-iso-27001",  controlCode: "A.5.15" },
  { id: "capa-bastion-003",projectId: "proj-demo-bastion",code: "CAPA-BST-003", title: "S3 scanner false-positive suppression",                 description: "Update scanner ruleset post AWS API change; tune confidence thresholds.",                          severity: "medium",   status: "in_progress", owner: "Scanner",         source: "manual",     evidenceCount: 1, tags: ["scanner"],           dueAt: daysAhead(14), frameworkId: null,             controlCode: null },
  { id: "capa-bastion-004",projectId: "proj-demo-bastion",code: "CAPA-BST-004", title: "S3 versioning enforcement on evidence locker",          description: "Enforce S3 Object Lock + versioning on all evidence-locker buckets via SCP.",                      severity: "critical", status: "done",        owner: "EvidenceLocker",  source: "inspection", evidenceCount: 7, tags: ["audit","s3"],        closedAt: daysAgo(28),frameworkId: "fw-iso-27001", controlCode: "A.8.13" },
  { id: "capa-bastion-005",projectId: "proj-demo-bastion",code: "CAPA-BST-005", title: "Automate NIST CSF 2.0 RC.RP-2 evidence",                description: "Auto-collect recovery-plan-test evidence from chaos exercises; map to RC.RP-2 control.",            severity: "low",      status: "open",        owner: "Compliance",      source: "manual",     evidenceCount: 0, tags: ["nist-csf"],          dueAt: daysAhead(45), frameworkId: "fw-nist-csf",    controlCode: "RC.RP-2" },
];

// ── Test cases ──────────────────────────────────────────────────────────────
const TEST_CASES = [
  // Helios
  { id: "tc-helios-001", projectId: "proj-demo-helios", requirementId: "req-helios-001", title: "Verify gov-ID accepted (happy path)",                     type: "functional", level: "system", discipline: "functional", paradigm: "procedural",         mode: "dynamic", sourceKind: "requirement", priority: "high",     status: "passing",  steps: ["Navigate to /onboarding","Upload valid passport","Pass OCR","Submit"], expected: "Onboarding state advances to 'consent'.", lastRunAt: daysAgo(1), lastRunNote: "Passed on staging build 4821." },
  { id: "tc-helios-002", projectId: "proj-demo-helios", requirementId: "req-helios-001", title: "Reject expired government ID",                             type: "negative",   level: "system", discipline: "negative",   paradigm: "procedural",         mode: "dynamic", sourceKind: "requirement", priority: "high",     status: "failing",  steps: ["Upload expired passport","Pass OCR","Submit"], expected: "Request rejected, user prompted to upload current ID.", lastRunAt: daysAgo(0), lastRunNote: "Currently failing — links to HEL-1078." },
  { id: "tc-helios-003", projectId: "proj-demo-helios", requirementId: "req-helios-002", title: "Consent capture survives back-button",                     type: "negative",   level: "acceptance", discipline: "regression", paradigm: "procedural",   mode: "dynamic", sourceKind: "requirement", priority: "critical", status: "failing",  steps: ["Reach consent","Press browser back","Re-enter onboarding"], expected: "Consent is required again before any PHI write.", lastRunAt: daysAgo(0), lastRunNote: "Bug HEL-1042 reproduces." },
  { id: "tc-helios-004", projectId: "proj-demo-helios", requirementId: "req-helios-004", title: "Audit log captures actor + reason for PHI read",          type: "functional", level: "integration", discipline: "regulatory", paradigm: "bdd",         mode: "dynamic", sourceKind: "requirement", priority: "critical", status: "passing",  steps: ["Authenticate as clinician","GET /patient/:id","Inspect audit log"], expected: "Audit row contains actor, ts, reason.", gherkin: "Given a clinician\nWhen they read patient PHI\nThen the audit log records actor, timestamp and reason", lastRunAt: daysAgo(2), lastRunNote: "" },
  { id: "tc-helios-005", projectId: "proj-demo-helios", requirementId: "req-helios-006", title: "P95 onboarding completion < 4 minutes",                    type: "non_functional", level: "operational", discipline: "performance", paradigm: "procedural", mode: "dynamic", sourceKind: "requirement", priority: "high", status: "failing",  steps: ["Run k6 onboarding scenario, 200 VUs, 30 min"], expected: "P95 < 240s.", lastRunAt: daysAgo(0), lastRunNote: "Last run P95 = 288s — see HEL-1085." },
  { id: "tc-helios-006", projectId: "proj-demo-helios", requirementId: "req-helios-007", title: "PHI encryption KMS key alias is HSM-backed",               type: "functional", level: "system", discipline: "security",   paradigm: "procedural",         mode: "dynamic", sourceKind: "requirement", priority: "critical", status: "passing",  steps: ["aws kms describe-key --key-id <alias>","Assert Origin = AWS_CLOUDHSM"], expected: "Origin == AWS_CLOUDHSM.", lastRunAt: daysAgo(7), lastRunNote: "" },
  { id: "tc-helios-007", projectId: "proj-demo-helios", requirementId: "req-helios-008", title: "Idle session terminates at 30 min",                       type: "functional", level: "acceptance", discipline: "security",  paradigm: "procedural",        mode: "dynamic", sourceKind: "requirement", priority: "high",     status: "passing",  steps: ["Login","Idle 28 min","Verify warning at 28m","Idle further","Verify logout at 30m"], expected: "Warning + logout at correct times.", lastRunAt: daysAgo(3), lastRunNote: "" },

  // Orion
  { id: "tc-orion-001", projectId: "proj-demo-orion", requirementId: "req-orion-002", title: "Therapy inhibit latency at 25 °C corner",                   type: "non_functional", level: "system", discipline: "reliability", paradigm: "procedural",   mode: "dynamic", sourceKind: "requirement", priority: "critical", status: "passing",  steps: ["Inject oversensing event","Measure detect→inhibit latency"], expected: "Latency < 200 ms (3-sigma).", lastRunAt: daysAgo(2), lastRunNote: "" },
  { id: "tc-orion-002", projectId: "proj-demo-orion", requirementId: "req-orion-002", title: "Therapy inhibit latency at -10 °C corner",                  type: "non_functional", level: "system", discipline: "reliability", paradigm: "procedural",   mode: "dynamic", sourceKind: "requirement", priority: "critical", status: "failing",  steps: ["Cool DUT to -10°C","Inject oversensing event","Measure latency"], expected: "Latency < 200 ms.", lastRunAt: daysAgo(0), lastRunNote: "Last run = 240 ms — see ORN-8855." },
  { id: "tc-orion-003", projectId: "proj-demo-orion", requirementId: "req-orion-003", title: "OTA programmer mTLS handshake — happy path",                type: "functional", level: "integration", discipline: "security",  paradigm: "procedural",        mode: "dynamic", sourceKind: "requirement", priority: "critical", status: "passing",  steps: ["Initiate OTA programmer session with valid cert chain"], expected: "Session established with AES-128 keys.", lastRunAt: daysAgo(5), lastRunNote: "" },
  { id: "tc-orion-004", projectId: "proj-demo-orion", requirementId: "req-orion-003", title: "OTA programmer mTLS — revoked client cert",                 type: "negative",   level: "integration", discipline: "security",  paradigm: "procedural",        mode: "dynamic", sourceKind: "requirement", priority: "critical", status: "passing",  steps: ["Present revoked client cert","Initiate session"], expected: "Connection refused, OCSP/CRL check logged.", lastRunAt: daysAgo(5), lastRunNote: "" },
  { id: "tc-orion-005", projectId: "proj-demo-orion", requirementId: "req-orion-004", title: "Firmware revision auto-links to DHF",                       type: "functional", level: "integration", discipline: "regulatory", paradigm: "procedural",       mode: "dynamic", sourceKind: "requirement", priority: "high",     status: "passing",  steps: ["Tag firmware v3.x.y","Run release pipeline","Inspect DHF entry"], expected: "DHF entry contains revision hash + V&V refs.", lastRunAt: daysAgo(8), lastRunNote: "Validates CAPA-ORN-004." },
  { id: "tc-orion-006", projectId: "proj-demo-orion", requirementId: "req-orion-005", title: "FreeRTOS SOUP — CVE diff vs SBOM",                          type: "functional", level: "integration", discipline: "regulatory", paradigm: "exploratory",      mode: "static",  sourceKind: "requirement", priority: "high",     status: "draft",    steps: ["Run sbom-diff against current FreeRTOS 10.5.1"], expected: "Documented residual risks; no unaddressed CVEs.", lastRunAt: null, lastRunNote: "" },

  // Atlas
  { id: "tc-atlas-001", projectId: "proj-demo-atlas", requirementId: "req-atlas-001", title: "Pre-trade gate enforces credit limit",                       type: "functional", level: "system", discipline: "functional", paradigm: "bdd",                mode: "dynamic", sourceKind: "requirement", priority: "critical", status: "passing",  steps: ["Submit order exceeding credit limit"], expected: "Order rejected with REASON_CREDIT_BREACH.", gherkin: "Given a client with credit limit X\nWhen they submit an order Y > X\nThen the order is rejected with REASON_CREDIT_BREACH", lastRunAt: daysAgo(1), lastRunNote: "" },
  { id: "tc-atlas-002", projectId: "proj-demo-atlas", requirementId: "req-atlas-003", title: "PAN never appears in any service log",                      type: "negative",   level: "operational", discipline: "security",  paradigm: "exploratory",       mode: "dynamic", sourceKind: "requirement", priority: "critical", status: "failing",  steps: ["Submit transaction; force DB retry","grep all logs for PAN regex"], expected: "Zero matches.", lastRunAt: daysAgo(0), lastRunNote: "Found PAN in debug.log — ATL-2197." },
  { id: "tc-atlas-003", projectId: "proj-demo-atlas", requirementId: "req-atlas-004", title: "Settlement throughput sustained 50k tx/min for 30 min",      type: "non_functional", level: "operational", discipline: "performance", paradigm: "procedural",   mode: "dynamic", sourceKind: "requirement", priority: "high",     status: "failing",  steps: ["Load 50k tx/min for 30 min","Capture P99 latency + throughput"], expected: "P99 < 1s, throughput stable.", lastRunAt: daysAgo(0), lastRunNote: "GC pauses dropped to 38k/min — ATL-2210." },
  { id: "tc-atlas-004", projectId: "proj-demo-atlas", requirementId: "req-atlas-005", title: "Daily three-way reconciliation balances",                    type: "functional", level: "integration", discipline: "functional", paradigm: "procedural",       mode: "dynamic", sourceKind: "requirement", priority: "high",     status: "passing",  steps: ["Run EOD recon job"], expected: "Books, custodian, clearer all agree to the cent.", lastRunAt: daysAgo(1), lastRunNote: "" },
  { id: "tc-atlas-005", projectId: "proj-demo-atlas", requirementId: "req-atlas-006", title: "DR drill: failover RTO ≤ 15 min",                            type: "non_functional", level: "operational", discipline: "reliability", paradigm: "procedural",  mode: "dynamic", sourceKind: "requirement", priority: "critical", status: "passing",  steps: ["Trigger region failover","Measure restoration of trading"], expected: "RTO ≤ 15m, RPO ≤ 1m.", lastRunAt: daysAgo(20), lastRunNote: "Q2 drill = 13m12s; Q1 was 18m (CAPA-ATL-004)." },
  { id: "tc-atlas-006", projectId: "proj-demo-atlas", requirementId: "req-atlas-002", title: "T+1 settlement window honoured for in-scope assets",        type: "functional", level: "system", discipline: "regulatory", paradigm: "procedural",         mode: "dynamic", sourceKind: "requirement", priority: "critical", status: "passing",  steps: ["Run end-of-day batch","Verify trade settlement timestamps"], expected: "All in-scope trades settled by T+1 cut-off.", lastRunAt: daysAgo(1), lastRunNote: "" },

  // Vega
  { id: "tc-vega-001", projectId: "proj-demo-vega", requirementId: "req-vega-001", title: "Auto-triage routes correctly per claim type",                     type: "functional", level: "integration", discipline: "functional", paradigm: "procedural",       mode: "dynamic", sourceKind: "requirement", priority: "high",     status: "failing",  steps: ["Submit 500 mixed-type claims","Verify pod assignment"], expected: "Mis-route < 0.5%.", lastRunAt: daysAgo(2), lastRunNote: "Mis-route = 2.1% — VEG-934." },
  { id: "tc-vega-002", projectId: "proj-demo-vega", requirementId: "req-vega-002", title: "Fraud scorer F1 ≥ 0.80 on hold-out",                            type: "non_functional", level: "operational", discipline: "reliability", paradigm: "functional_property",mode: "dynamic", sourceKind: "requirement", priority: "high",     status: "failing",  steps: ["Score hold-out set","Compute F1"], expected: "F1 ≥ 0.80.", lastRunAt: daysAgo(0), lastRunNote: "Last F1 = 0.74." },
  { id: "tc-vega-003", projectId: "proj-demo-vega", requirementId: "req-vega-003", title: "Adjudication rationale shown to user (GDPR Art.22)",            type: "functional", level: "acceptance", discipline: "regulatory", paradigm: "bdd",              mode: "dynamic", sourceKind: "requirement", priority: "critical", status: "failing",  steps: ["Trigger automated decision","Open customer portal","Inspect rationale"], expected: "Full rationale visible without truncation.", gherkin: "Given an automated adjudication decision\nWhen the customer views their claim\nThen they can read the full machine rationale", lastRunAt: daysAgo(1), lastRunNote: "Rationale truncated > 4 KB — VEG-948." },
  { id: "tc-vega-004", projectId: "proj-demo-vega", requirementId: "req-vega-004", title: "Audit log retention enforced 7 years",                          type: "functional", level: "operational", discipline: "regulatory", paradigm: "procedural",      mode: "dynamic", sourceKind: "requirement", priority: "critical", status: "passing",  steps: ["Inspect retention policy","Verify Object Lock duration"], expected: "Object Lock = 7 years; alarm if drifted.", lastRunAt: daysAgo(5), lastRunNote: "Validates CAPA-VEG-003." },
  { id: "tc-vega-005", projectId: "proj-demo-vega", requirementId: "req-vega-005", title: "Self-service portal accepts HEIC + JPEG + PDF uploads",         type: "functional", level: "acceptance", discipline: "usability",  paradigm: "procedural",       mode: "dynamic", sourceKind: "requirement", priority: "medium",   status: "failing",  steps: ["Upload HEIC, JPEG, PDF samples"], expected: "All accepted; previews rendered.", lastRunAt: daysAgo(0), lastRunNote: "HEIC rejected — VEG-955." },

  // Ares
  { id: "tc-ares-001", projectId: "proj-demo-ares", requirementId: null, title: "Lane-keep: < 10 cm drift on standard markings",                            type: "non_functional", level: "system", discipline: "reliability", paradigm: "procedural",   mode: "dynamic", sourceKind: "requirement", priority: "critical", status: "passing",  steps: ["Run open-loop drive scenario, well-marked highway"], expected: "Mean drift < 10 cm.", lastRunAt: daysAgo(2), lastRunNote: "" },
  { id: "tc-ares-002", projectId: "proj-demo-ares", requirementId: null, title: "Lane-keep: < 10 cm drift on faded markings",                              type: "non_functional", level: "system", discipline: "reliability", paradigm: "procedural",   mode: "dynamic", sourceKind: "requirement", priority: "critical", status: "failing",  steps: ["Run open-loop drive scenario, faded markings"], expected: "Mean drift < 10 cm.", lastRunAt: daysAgo(0), lastRunNote: "Mean drift = 14 cm — ARES-11204." },
  { id: "tc-ares-003", projectId: "proj-demo-ares", requirementId: null, title: "Static analysis: zero MISRA C++ violations on path-planner",              type: "functional", level: "unit",   discipline: "regulatory", paradigm: "procedural",         mode: "static",  sourceKind: "code",        priority: "high",     status: "failing",  steps: ["Run cppcheck/MISRA","Inspect violation count for path-planner module"], expected: "Zero violations.", lastRunAt: daysAgo(2), lastRunNote: "47 violations — ARES-11211." },
  { id: "tc-ares-004", projectId: "proj-demo-ares", requirementId: null, title: "Bootloader CRC verifies on cold start (1000 cycles)",                     type: "functional", level: "integration", discipline: "reliability", paradigm: "procedural",   mode: "dynamic", sourceKind: "code",        priority: "critical", status: "failing",  steps: ["Cold-cycle DUT 1000 times","Log boot CRC result"], expected: "1000/1000 pass.", lastRunAt: daysAgo(1), lastRunNote: "1 in ~4000 fails — ARES-11220." },
  { id: "tc-ares-005", projectId: "proj-demo-ares", requirementId: null, title: "OTA package size within reserved partition",                              type: "functional", level: "system", discipline: "functional", paradigm: "procedural",         mode: "static",  sourceKind: "report",      priority: "high",     status: "failing",  steps: ["Inspect OTA artefact size vs partition manifest"], expected: "Size ≤ partition.", lastRunAt: daysAgo(0), lastRunNote: "2 MB over budget — ARES-11225." },
  { id: "tc-ares-006", projectId: "proj-demo-ares", requirementId: null, title: "Diag port refuses TLS < 1.3",                                              type: "negative",   level: "integration", discipline: "security",   paradigm: "procedural",      mode: "dynamic", sourceKind: "code",        priority: "critical", status: "failing",  steps: ["Connect to diag port forcing TLS 1.2"], expected: "Connection refused.", lastRunAt: daysAgo(0), lastRunNote: "Currently allows TLS 1.2 — ARES-11230." },

  // Bastion
  { id: "tc-bastion-001", projectId: "proj-demo-bastion", requirementId: "req-bastion-001", title: "CSPM CIS scan completes within 15 min window",        type: "non_functional", level: "operational", discipline: "performance", paradigm: "procedural",  mode: "dynamic", sourceKind: "requirement", priority: "critical", status: "passing",  steps: ["Trigger full CIS scan across all accounts"], expected: "Completes within 15 min.", lastRunAt: daysAgo(0), lastRunNote: "" },
  { id: "tc-bastion-002", projectId: "proj-demo-bastion", requirementId: "req-bastion-001", title: "Critical CIS finding auto-creates ticket < 5 min",     type: "functional", level: "integration", discipline: "functional", paradigm: "bdd",              mode: "dynamic", sourceKind: "requirement", priority: "critical", status: "passing",  steps: ["Inject mock critical finding","Wait 5 min"], expected: "Ticket created in linked tracker.", gherkin: "Given a critical CIS finding\nWhen detected by CSPM\nThen a ticket is auto-created within 5 minutes", lastRunAt: daysAgo(1), lastRunNote: "" },
  { id: "tc-bastion-003", projectId: "proj-demo-bastion", requirementId: "req-bastion-002", title: "SOC 2 evidence ingestion daily success",               type: "functional", level: "operational", discipline: "regulatory", paradigm: "procedural",      mode: "dynamic", sourceKind: "requirement", priority: "high",     status: "passing",  steps: ["Inspect last 7d evidence ingest jobs"], expected: "All succeed; failures retried < 1h.", lastRunAt: daysAgo(0), lastRunNote: "" },
  { id: "tc-bastion-004", projectId: "proj-demo-bastion", requirementId: "req-bastion-004", title: "Vuln SLA: critical CVE triaged ≤ 4h",                  type: "non_functional", level: "operational", discipline: "reliability", paradigm: "procedural",   mode: "dynamic", sourceKind: "requirement", priority: "high",     status: "failing",  steps: ["Compute MTTR for last 30d critical CVEs"], expected: "MTTR ≤ 4h.", lastRunAt: daysAgo(2), lastRunNote: "Mean = 5.4h — BST-512." },
  { id: "tc-bastion-005", projectId: "proj-demo-bastion", requirementId: "req-bastion-003", title: "NIST CSF 2.0 maturity self-assessment",                type: "functional", level: "operational", discipline: "regulatory", paradigm: "exploratory",     mode: "static",  sourceKind: "report",      priority: "high",     status: "draft",    steps: ["Score each function against Tier 3 criteria"], expected: "All six functions ≥ Tier 3.", lastRunAt: null, lastRunNote: "" },
  { id: "tc-bastion-006", projectId: "proj-demo-bastion", requirementId: null,            title: "Evidence locker S3 bucket has Object Lock enabled",     type: "functional", level: "operational", discipline: "security",   paradigm: "procedural",      mode: "static",  sourceKind: "code",        priority: "critical", status: "passing",  steps: ["aws s3api get-object-lock-configuration --bucket bastion-evidence-locker"], expected: "ObjectLockEnabled = Enabled.", lastRunAt: daysAgo(7), lastRunNote: "Validates CAPA-BST-004." },
];

// ── Code artifacts + traceability links ─────────────────────────────────────
const CODE_ARTIFACTS = [
  { id: "ca-helios-1", projectId: "proj-demo-helios", filePath: "src/onboarding/consent.ts",          language: "typescript", symbol: "captureConsent",         kind: "function", repoUrl: "https://github.com/acme-health/helios-onboarding/blob/main/src/onboarding/consent.ts" },
  { id: "ca-helios-2", projectId: "proj-demo-helios", filePath: "src/audit/phiAuditLog.ts",           language: "typescript", symbol: "PhiAuditLogger",         kind: "class",    repoUrl: "https://github.com/acme-health/helios-onboarding/blob/main/src/audit/phiAuditLog.ts" },
  { id: "ca-helios-3", projectId: "proj-demo-helios", filePath: "src/auth/sessionTimeout.ts",         language: "typescript", symbol: "enforceIdleTimeout",     kind: "function", repoUrl: "https://github.com/acme-health/helios-onboarding/blob/main/src/auth/sessionTimeout.ts" },
  { id: "ca-helios-4", projectId: "proj-demo-helios", filePath: "src/encryption/kms.ts",              language: "typescript", symbol: "PhiKmsClient",           kind: "class",    repoUrl: "https://github.com/acme-health/helios-onboarding/blob/main/src/encryption/kms.ts" },
  { id: "ca-helios-5", projectId: "proj-demo-helios", filePath: "src/intake/idVerification.ts",       language: "typescript", symbol: "verifyGovId",            kind: "function", repoUrl: "https://github.com/acme-health/helios-onboarding/blob/main/src/intake/idVerification.ts" },
  { id: "ca-orion-1",  projectId: "proj-demo-orion",  filePath: "firmware/src/therapy/inhibit.c",     language: "c",          symbol: "therapy_inhibit_isr",    kind: "function", repoUrl: "https://github.com/acme-health/orion-firmware/blob/main/firmware/src/therapy/inhibit.c" },
  { id: "ca-orion-2",  projectId: "proj-demo-orion",  filePath: "firmware/src/comms/ota_session.c",   language: "c",          symbol: "ota_session_open",       kind: "function", repoUrl: "https://github.com/acme-health/orion-firmware/blob/main/firmware/src/comms/ota_session.c" },
  { id: "ca-orion-3",  projectId: "proj-demo-orion",  filePath: "firmware/src/dhf/release_link.c",    language: "c",          symbol: "publish_dhf_link",       kind: "function", repoUrl: "https://github.com/acme-health/orion-firmware/blob/main/firmware/src/dhf/release_link.c" },
  { id: "ca-orion-4",  projectId: "proj-demo-orion",  filePath: "firmware/src/rtos/heap_static.c",    language: "c",          symbol: "static_pool_alloc",      kind: "function", repoUrl: "https://github.com/acme-health/orion-firmware/blob/main/firmware/src/rtos/heap_static.c" },
  { id: "ca-atlas-1",  projectId: "proj-demo-atlas",  filePath: "services/risk-gate/src/Gate.java",   language: "java",       symbol: "PreTradeRiskGate",       kind: "class",    repoUrl: "https://github.com/acme-fin/atlas-settlement/blob/main/services/risk-gate/src/Gate.java" },
  { id: "ca-atlas-2",  projectId: "proj-demo-atlas",  filePath: "services/tokeniser/src/Tokeniser.java", language: "java",    symbol: "PanTokeniser",           kind: "class",    repoUrl: "https://github.com/acme-fin/atlas-settlement/blob/main/services/tokeniser/src/Tokeniser.java" },
  { id: "ca-atlas-3",  projectId: "proj-demo-atlas",  filePath: "services/recon/src/ThreeWay.java",   language: "java",       symbol: "ThreeWayReconciler",     kind: "class",    repoUrl: "https://github.com/acme-fin/atlas-settlement/blob/main/services/recon/src/ThreeWay.java" },
  { id: "ca-atlas-4",  projectId: "proj-demo-atlas",  filePath: "services/dr/src/Failover.java",      language: "java",       symbol: "RegionFailover",         kind: "class",    repoUrl: "https://github.com/acme-fin/atlas-settlement/blob/main/services/dr/src/Failover.java" },
  { id: "ca-vega-1",   projectId: "proj-demo-vega",   filePath: "src/triage/router.py",               language: "python",     symbol: "ClaimsRouter",           kind: "class",    repoUrl: "https://github.com/acme-ins/vega-claims/blob/main/src/triage/router.py" },
  { id: "ca-vega-2",   projectId: "proj-demo-vega",   filePath: "src/fraud/scorer.py",                language: "python",     symbol: "FraudScorer",            kind: "class",    repoUrl: "https://github.com/acme-ins/vega-claims/blob/main/src/fraud/scorer.py" },
  { id: "ca-vega-3",   projectId: "proj-demo-vega",   filePath: "src/adjudication/explain.py",        language: "python",     symbol: "build_rationale",        kind: "function", repoUrl: "https://github.com/acme-ins/vega-claims/blob/main/src/adjudication/explain.py" },
  { id: "ca-vega-4",   projectId: "proj-demo-vega",   filePath: "src/audit/retention.py",             language: "python",     symbol: "RetentionGuard",         kind: "class",    repoUrl: "https://github.com/acme-ins/vega-claims/blob/main/src/audit/retention.py" },
  { id: "ca-ares-1",   projectId: "proj-demo-ares",   filePath: "perception/src/lane_keep.cpp",       language: "cpp",        symbol: "LaneKeepEstimator",      kind: "class",    repoUrl: "https://github.com/acme-auto/ares-adas/blob/main/perception/src/lane_keep.cpp" },
  { id: "ca-ares-2",   projectId: "proj-demo-ares",   filePath: "planner/src/path_planner.cpp",       language: "cpp",        symbol: "PathPlanner",            kind: "class",    repoUrl: "https://github.com/acme-auto/ares-adas/blob/main/planner/src/path_planner.cpp" },
  { id: "ca-ares-3",   projectId: "proj-demo-ares",   filePath: "boot/src/bootloader.c",              language: "c",          symbol: "verify_image_crc",       kind: "function", repoUrl: "https://github.com/acme-auto/ares-adas/blob/main/boot/src/bootloader.c" },
  { id: "ca-ares-4",   projectId: "proj-demo-ares",   filePath: "diag/src/diag_tls.c",                language: "c",          symbol: "diag_tls_handshake",     kind: "function", repoUrl: "https://github.com/acme-auto/ares-adas/blob/main/diag/src/diag_tls.c" },
  { id: "ca-bastion-1",projectId: "proj-demo-bastion",filePath: "scanner/src/cis_scan.go",            language: "go",         symbol: "CisScanner",             kind: "class",    repoUrl: "https://github.com/acme-sec/bastion-cspm/blob/main/scanner/src/cis_scan.go" },
  { id: "ca-bastion-2",projectId: "proj-demo-bastion",filePath: "scanner/src/auto_ticket.go",         language: "go",         symbol: "AutoTicket",             kind: "function", repoUrl: "https://github.com/acme-sec/bastion-cspm/blob/main/scanner/src/auto_ticket.go" },
  { id: "ca-bastion-3",projectId: "proj-demo-bastion",filePath: "vuln/src/sla_tracker.go",            language: "go",         symbol: "SlaTracker",             kind: "class",    repoUrl: "https://github.com/acme-sec/bastion-cspm/blob/main/vuln/src/sla_tracker.go" },
  { id: "ca-bastion-4",projectId: "proj-demo-bastion",filePath: "evidence/src/object_lock.go",        language: "go",         symbol: "EnsureObjectLock",       kind: "function", repoUrl: "https://github.com/acme-sec/bastion-cspm/blob/main/evidence/src/object_lock.go" },
];

const TRACE_LINKS = [
  // Helios
  { id: "tl-helios-1", requirementId: "req-helios-002", codeArtifactId: "ca-helios-1", kind: "implements" },
  { id: "tl-helios-2", requirementId: "req-helios-004", codeArtifactId: "ca-helios-2", kind: "implements" },
  { id: "tl-helios-3", requirementId: "req-helios-008", codeArtifactId: "ca-helios-3", kind: "implements" },
  { id: "tl-helios-4", requirementId: "req-helios-007", codeArtifactId: "ca-helios-4", kind: "implements" },
  { id: "tl-helios-5", requirementId: "req-helios-001", codeArtifactId: "ca-helios-5", kind: "implements" },
  // Orion
  { id: "tl-orion-1",  requirementId: "req-orion-002",  codeArtifactId: "ca-orion-1",  kind: "implements" },
  { id: "tl-orion-2",  requirementId: "req-orion-003",  codeArtifactId: "ca-orion-2",  kind: "implements" },
  { id: "tl-orion-3",  requirementId: "req-orion-004",  codeArtifactId: "ca-orion-3",  kind: "implements" },
  { id: "tl-orion-4",  requirementId: "req-orion-005",  codeArtifactId: "ca-orion-4",  kind: "implements" },
  // Atlas
  { id: "tl-atlas-1",  requirementId: "req-atlas-001",  codeArtifactId: "ca-atlas-1",  kind: "implements" },
  { id: "tl-atlas-2",  requirementId: "req-atlas-003",  codeArtifactId: "ca-atlas-2",  kind: "implements" },
  { id: "tl-atlas-3",  requirementId: "req-atlas-005",  codeArtifactId: "ca-atlas-3",  kind: "implements" },
  { id: "tl-atlas-4",  requirementId: "req-atlas-006",  codeArtifactId: "ca-atlas-4",  kind: "implements" },
  // Vega
  { id: "tl-vega-1",   requirementId: "req-vega-001",   codeArtifactId: "ca-vega-1",   kind: "implements" },
  { id: "tl-vega-2",   requirementId: "req-vega-002",   codeArtifactId: "ca-vega-2",   kind: "implements" },
  { id: "tl-vega-3",   requirementId: "req-vega-003",   codeArtifactId: "ca-vega-3",   kind: "implements" },
  { id: "tl-vega-4",   requirementId: "req-vega-004",   codeArtifactId: "ca-vega-4",   kind: "implements" },
  // Ares
  { id: "tl-ares-1",   requirementId: "req-ares-001",   codeArtifactId: "ca-ares-1",   kind: "implements" },
  { id: "tl-ares-2",   requirementId: "req-ares-002",   codeArtifactId: "ca-ares-2",   kind: "implements" },
  { id: "tl-ares-3",   requirementId: "req-ares-003",   codeArtifactId: "ca-ares-3",   kind: "implements" },
  { id: "tl-ares-4",   requirementId: "req-ares-004",   codeArtifactId: "ca-ares-4",   kind: "implements" },
  // Bastion
  { id: "tl-bastion-1",requirementId: "req-bastion-001",codeArtifactId: "ca-bastion-1",kind: "implements" },
  { id: "tl-bastion-2",requirementId: "req-bastion-001",codeArtifactId: "ca-bastion-2",kind: "implements" },
  { id: "tl-bastion-3",requirementId: "req-bastion-004",codeArtifactId: "ca-bastion-3",kind: "implements" },
  { id: "tl-bastion-4",requirementId: "req-bastion-002",codeArtifactId: "ca-bastion-4",kind: "implements" },
];

// ── AI reports ──────────────────────────────────────────────────────────────
function reportContent(title: string, summary: string, sections: { id: string; heading: string; body: string }[], evidence: { id: string; label: string; source: string }[]) {
  return { title, executiveSummary: summary, sections, evidence };
}

const AI_REPORTS = [
  { id: "rep-helios-1", projectId: "proj-demo-helios", frameworkId: "fw-hipaa",     kind: "compliance_audit",      tone: "regulator", title: "HIPAA Security Rule — Q1 Audit",                  status: "finalised",
    content: reportContent("HIPAA Security Rule — Q1 Audit",
      "Helios is broadly aligned with HIPAA Security Rule §164.308–§164.312. Two material gaps are tracked under CAPA-HEL-001 (consent bypass) and CAPA-HEL-005 (erasure SLA).",
      [
        { id: "s1", heading: "Administrative Safeguards", body: "Workforce training records up to date; access reviews quarterly. CAPA-HEL-001 open against 164.308(a)(4)." },
        { id: "s2", heading: "Technical Safeguards",      body: "PHI encrypted at rest (HSM); session timeout enforced; audit log integrity controls in place." },
        { id: "s3", heading: "Findings & Recommendations", body: "Close CAPA-HEL-001 within 7 days; deploy chrony to remediate audit-log clock drift (CAPA-HEL-002)." },
      ],
      [
        { id: "e1", label: "HEL-0004 — PHI read audit log",  source: "requirement" },
        { id: "e2", label: "HEL-0007 — HSM encryption",       source: "requirement" },
        { id: "e3", label: "PhiAuditLogger.ts",                source: "code" },
      ]),
  },
  { id: "rep-helios-2", projectId: "proj-demo-helios", frameworkId: "fw-gdpr",      kind: "exec_brief",            tone: "executive", title: "GDPR Readiness — Executive Brief", status: "draft",
    content: reportContent("GDPR Readiness — Executive Brief",
      "EU patient data is now resident in EU-West with replication disabled. Right-to-erasure SLA at risk due to legacy ITSM bridge.",
      [
        { id: "s1", heading: "Strengths",   body: "Data residency, consent capture, audit trail." },
        { id: "s2", heading: "Risks",        body: "Erasure 30-day SLA breaches in 3 cases this quarter (CAPA-HEL-005)." },
      ],
      [{ id: "e1", label: "HEL-0005 — Right-to-erasure", source: "requirement" }]),
  },

  { id: "rep-orion-1",  projectId: "proj-demo-orion",  frameworkId: "fw-iec-62304", kind: "compliance_audit",      tone: "regulator", title: "IEC 62304 — Software Lifecycle Audit",            status: "finalised",
    content: reportContent("IEC 62304 — Software Lifecycle Audit",
      "Orion firmware classified Class C with full DHF traceability. SOUP validation in progress (FreeRTOS 10.5.1).",
      [
        { id: "s1", heading: "Software Safety Classification", body: "Orion firmware components controlling therapy delivery are classified Class C per IEC 62304 §4.3." },
        { id: "s2", heading: "Verification & Validation",       body: "All Class C requirements have V&V coverage. Two tests currently failing (-10°C latency)." },
        { id: "s3", heading: "SOUP Management",                  body: "FreeRTOS 10.5.1 validation in progress — see CAPA-ORN-003 for residual risk treatment." },
      ],
      [{ id: "e1", label: "ORN-0001 — Class C classification", source: "requirement" }, { id: "e2", label: "DHF release-link CI step", source: "code" }]),
  },
  { id: "rep-orion-2",  projectId: "proj-demo-orion",  frameworkId: "fw-21cfr-820", kind: "traceability",          tone: "technical", title: "FDA 21 CFR 820.30 Traceability Matrix",           status: "draft",
    content: reportContent("FDA 21 CFR 820.30 Traceability Matrix",
      "Bidirectional traceability complete for 5 of 6 requirements; ORN-0006 (PMS) pending implementation.",
      [{ id: "s1", heading: "Coverage", body: "Reqs → Code → Tests → DHF coverage at 83%." }],
      [{ id: "e1", label: "DHF v3.2", source: "report" }]),
  },

  { id: "rep-atlas-1",  projectId: "proj-demo-atlas",  frameworkId: "fw-pci-dss-4", kind: "compliance_audit",      tone: "regulator", title: "PCI DSS 4.0 — Continuous Audit",                  status: "finalised",
    content: reportContent("PCI DSS 4.0 — Continuous Audit",
      "Network segmentation validated; tokenisation in place; one open finding on PAN logging under retry (ATL-2197 / CAPA-ATL-001).",
      [
        { id: "s1", heading: "Cardholder Data Environment", body: "CDE micro-segmented; quarterly pen-test pending Jul-26." },
        { id: "s2", heading: "Findings",                     body: "PAN appears in debug.log under DB retry — critical CAPA in progress." },
      ],
      [{ id: "e1", label: "ATL-0003 — Tokenisation", source: "requirement" }, { id: "e2", label: "PanTokeniser.java", source: "code" }]),
  },
  { id: "rep-atlas-2",  projectId: "proj-demo-atlas",  frameworkId: "fw-soc2",      kind: "exec_brief",            tone: "executive", title: "SOC 2 Type II — Mid-Period Brief",               status: "draft",
    content: reportContent("SOC 2 Type II — Mid-Period Brief",
      "Q1 DR drill remediated; audit-log gap on Kafka rebalance is the single open material finding.",
      [{ id: "s1", heading: "Trust Service Criteria", body: "Security, Availability, Processing Integrity green; Confidentiality has one open finding (CAPA-ATL-003)." }],
      [{ id: "e1", label: "Q1 DR drill report", source: "report" }]),
  },

  { id: "rep-vega-1",   projectId: "proj-demo-vega",   frameworkId: "fw-gdpr",      kind: "compliance_audit",      tone: "regulator", title: "GDPR Art.22 — Automated Decisioning Review",      status: "finalised",
    content: reportContent("GDPR Art.22 — Automated Decisioning Review",
      "Adjudication explainability mostly in place; truncation bug breaches Art.22 transparency (VEG-948 / CAPA-VEG-002).",
      [{ id: "s1", heading: "Explainability", body: "Rationale generated for every automated decision; portal currently truncates at 4 KB." }],
      [{ id: "e1", label: "VEG-0003 — XAI requirement", source: "requirement" }]),
  },
  { id: "rep-vega-2",   projectId: "proj-demo-vega",   frameworkId: "fw-soc2",      kind: "requirements_summary",  tone: "technical", title: "Vega Requirements & V&V Summary",                status: "draft",
    content: reportContent("Vega Requirements & V&V Summary",
      "5 requirements; 2 currently failing V&V (triage mis-route, fraud F1 drift).",
      [{ id: "s1", heading: "Status", body: "Implemented: 2 · In review: 2 · Verified: 1." }],
      [{ id: "e1", label: "Vega test suite", source: "test_suite" }]),
  },

  { id: "rep-ares-1",   projectId: "proj-demo-ares",   frameworkId: "fw-iso-26262", kind: "compliance_audit",      tone: "regulator", title: "ISO 26262 — ASIL D Lane-Keep Safety Case",        status: "finalised",
    content: reportContent("ISO 26262 — ASIL D Lane-Keep Safety Case",
      "Open ASIL D finding on faded-marking lane-keep drift (ARES-11204). Safety case cannot be closed until CAPA-ARES-001 is complete.",
      [
        { id: "s1", heading: "Safety Goal SG-LK-01", body: "Lateral drift ≤ 10 cm at 100 km/h. Currently failing on faded markings." },
        { id: "s2", heading: "FMEDA",                 body: "Diagnostic coverage = 99.1% — meets ASIL D target." },
      ],
      [{ id: "e1", label: "FMEDA report v1.4", source: "report" }, { id: "e2", label: "lane_keep.cpp", source: "code" }]),
  },
  { id: "rep-ares-2",   projectId: "proj-demo-ares",   frameworkId: "fw-aspice-4",  kind: "exec_brief",            tone: "executive", title: "ASPICE 4.0 — SUP.10 Configuration Mgmt Brief",   status: "draft",
    content: reportContent("ASPICE 4.0 — SUP.10 Configuration Mgmt Brief",
      "Path-planner refactor regressed MISRA C++ count to 47; CI gate to be reinstated as part of CAPA-ARES-002.",
      [{ id: "s1", heading: "Findings", body: "47 MISRA violations introduced by recent refactor." }],
      [{ id: "e1", label: "Static analysis run", source: "report" }]),
  },

  { id: "rep-bastion-1",projectId: "proj-demo-bastion",frameworkId: "fw-soc2",      kind: "compliance_audit",      tone: "regulator", title: "SOC 2 Type II — All 5 TSC Continuous Audit",     status: "finalised",
    content: reportContent("SOC 2 Type II — All 5 TSC Continuous Audit",
      "All TSC operating effectively; SLA breach on critical CVE triage (BST-512 / CAPA-BST-001) is the only open material finding.",
      [{ id: "s1", heading: "Trust Service Criteria", body: "Security, Availability, Confidentiality, Processing Integrity, Privacy — all green except CC7.2." }],
      [{ id: "e1", label: "BST-0004 — Vuln SLA", source: "requirement" }]),
  },
  { id: "rep-bastion-2",projectId: "proj-demo-bastion",frameworkId: "fw-nist-csf",  kind: "exec_brief",            tone: "executive", title: "NIST CSF 2.0 Maturity Brief",                    status: "draft",
    content: reportContent("NIST CSF 2.0 Maturity Brief",
      "All six functions at Tier 3 (Repeatable). RC.RP-2 evidence collection still manual — see CAPA-BST-005.",
      [{ id: "s1", heading: "Function Scores", body: "Govern T3 · Identify T3 · Protect T3 · Detect T3 · Respond T3 · Recover T3." }],
      [{ id: "e1", label: "NIST CSF 2.0 self-assessment", source: "report" }]),
  },
];

// ── Recurring audits ────────────────────────────────────────────────────────
const RECURRING_AUDITS = [
  { id: "ra-helios-hipaa",   projectId: "proj-demo-helios",  frameworkId: "fw-hipaa",       cadence: "weekly",    hourUtc: 13, notifyTo: "compliance@acme-health.example",  active: true,  nextRunAt: daysAhead(2),  lastRunAt: daysAgo(5),  lastRunStatus: "success" },
  { id: "ra-orion-62304",    projectId: "proj-demo-orion",   frameworkId: "fw-iec-62304",   cadence: "weekly",    hourUtc: 13, notifyTo: "qa@acme-health.example",          active: true,  nextRunAt: daysAhead(3),  lastRunAt: daysAgo(4),  lastRunStatus: "success" },
  { id: "ra-atlas-pci",      projectId: "proj-demo-atlas",   frameworkId: "fw-pci-dss-4",   cadence: "daily",     hourUtc: 6,  notifyTo: "secops@acme-fin.example",         active: true,  nextRunAt: daysAhead(1),  lastRunAt: daysAgo(0),  lastRunStatus: "success" },
  { id: "ra-vega-gdpr",      projectId: "proj-demo-vega",    frameworkId: "fw-gdpr",        cadence: "monthly",   hourUtc: 9,  notifyTo: "privacy@acme-ins.example",        active: true,  nextRunAt: daysAhead(20), lastRunAt: daysAgo(10), lastRunStatus: "success" },
  { id: "ra-ares-26262",     projectId: "proj-demo-ares",    frameworkId: "fw-iso-26262",   cadence: "weekly",    hourUtc: 13, notifyTo: "safety@acme-auto.example",        active: true,  nextRunAt: daysAhead(4),  lastRunAt: daysAgo(3),  lastRunStatus: "warning" },
  { id: "ra-bastion-soc2",   projectId: "proj-demo-bastion", frameworkId: "fw-soc2",        cadence: "daily",     hourUtc: 4,  notifyTo: "ciso@acme-sec.example",           active: true,  nextRunAt: daysAhead(1),  lastRunAt: daysAgo(0),  lastRunStatus: "success" },
  { id: "ra-bastion-nist",   projectId: "proj-demo-bastion", frameworkId: "fw-nist-csf",    cadence: "weekly",    hourUtc: 4,  notifyTo: "ciso@acme-sec.example",           active: true,  nextRunAt: daysAhead(5),  lastRunAt: daysAgo(2),  lastRunStatus: "success" },
];

// ── Legacy systems (global — shared across all workspaces) ─────────────────
const LEGACY_SYSTEMS = [
  { id: "legacy-tradecore",     name: "TradeCore Engine",       language: "C#",          description: "Monolithic trade settlement service. .NET Framework 4.6, 1,184 stored procs, deeply tied to SQL Server 2014.",      locScanned: 482000, requirementsExtracted: 614, riskScore: 72, modernizationStatus: "in_progress" },
  { id: "legacy-patient-ui",    name: "Patient Records UI",     language: "Angular 1.x", description: "AngularJS frontend for legacy patient records, no test coverage, blocking HIPAA audit findings.",                  locScanned:  96000, requirementsExtracted: 211, riskScore: 84, modernizationStatus: "scoping" },
  { id: "legacy-pricing-lib",   name: "Pricing Library",        language: "C++",         description: "Quant pricing library used by 6 downstream services. Slow to onboard new engineers.",                                  locScanned: 138000, requirementsExtracted:  92, riskScore: 41, modernizationStatus: "stable" },
  { id: "legacy-claims-adj",    name: "Claims Adjudication",    language: "COBOL",       description: "Mainframe claims adjudication batch jobs. 30-year-old codebase with tribal knowledge concentrated in two engineers.", locScanned: 211000, requirementsExtracted: 367, riskScore: 91, modernizationStatus: "scoping" },
  { id: "legacy-branch-bank",   name: "Branch Banking Console", language: "Java 6",      description: "Swing desktop console used by 1,200 branch tellers; runs on internal Citrix farm.",                                    locScanned: 174000, requirementsExtracted: 248, riskScore: 58, modernizationStatus: "in_progress" },
];

// ── AI conversations (Ask Auditee history per anchor project) ──────────────
const AI_CONVERSATIONS = [
  { id: "conv-helios-1",  projectId: "proj-demo-helios",  question: "What's blocking our HIPAA audit readiness this sprint?",                  answer: "Two open items: (1) Right-to-erasure SLA — the legacy ITSM bridge is missing the auto-trigger to the erase job (CAPA-HEL-005, due in 28 days). (2) PHI residency replication — EU-West replication is disabled but the runbook hasn't been signed off. Both are tracked in CAPAs and the HIPAA Gap Analysis report.",  confidence: "high",   citations: ["capa-helios-005", "report-helios-hipaa"],  createdAt: daysAgo(1) },
  { id: "conv-helios-2",  projectId: "proj-demo-helios",  question: "Show me requirements without test coverage.",                              answer: "3 requirements have no linked test cases: HEL-0005 (Right-to-erasure workflow), HEL-0007 (Audit log immutability), HEL-0009 (Break-glass access review). I recommend generating test suites for HEL-0005 first since it's tied to an open critical CAPA.",                                                                                                                  confidence: "high",   citations: ["req-helios-005"],                          createdAt: daysAgo(3) },
  { id: "conv-orion-1",   projectId: "proj-demo-orion",   question: "Are we ready for the IEC 62304 Class C audit?",                            answer: "Mostly. Software safety classification, risk control measures, and unit test coverage all sit above 85%. Outstanding gap: SOUP (Software of Unknown Provenance) inventory is missing for 4 third-party libs. Until that's logged, the auditor will flag clause 5.3.4.",                                                                                                              confidence: "medium", citations: ["report-orion-62304"],                       createdAt: daysAgo(2) },
  { id: "conv-orion-2",   projectId: "proj-demo-orion",   question: "Generate a CAPA for the SOUP gap.",                                        answer: "Drafted CAPA-ORI-006: 'Complete SOUP inventory for third-party libs (lodash, axios, openssl, libpng)'. Suggested owner: QA. Suggested due date: 14 days. Tagged to control IEC-62304 §8.1.2. Open the CAPA module to publish.",                                                                                                                                                          confidence: "high",   citations: [],                                          createdAt: daysAgo(2) },
  { id: "conv-atlas-1",   projectId: "proj-demo-atlas",   question: "What's our PCI DSS 4.0 readiness score?",                                  answer: "Current readiness is 78%. Strongest controls: network segmentation, encryption-at-rest, MFA on admin paths. Weakest: requirement 10.6 (log review automation) and 11.4.1 (IDS/IPS coverage on cardholder VLAN). The PCI Readiness report has the full breakdown.",                                                                                                                  confidence: "high",   citations: ["report-atlas-pci"],                        createdAt: daysAgo(1) },
  { id: "conv-atlas-2",   projectId: "proj-demo-atlas",   question: "Any defects tied to CAPA-ATL-003?",                                        answer: "Yes — DEF-ATL-1012 (token rotation timing window) and DEF-ATL-1015 (lateral-call audit gap) are both linked. Both are in 'in progress' state with engineering ETA next sprint.",                                                                                                                                                                                                       confidence: "high",   citations: [],                                          createdAt: daysAgo(4) },
  { id: "conv-vega-1",    projectId: "proj-demo-vega",    question: "Summarise GDPR Article 17 compliance for this project.",                   answer: "Article 17 (right to erasure) is partially compliant. Erasure UX is live in production, but downstream warehouse purge runs on a 90-day cadence — that exceeds the 30-day SLA. Recommended action: shorten the warehouse purge to weekly and add an audit log row per erase event.",                                                                                                  confidence: "medium", citations: ["report-vega-gdpr"],                         createdAt: daysAgo(5) },
  { id: "conv-vega-2",    projectId: "proj-demo-vega",    question: "Which controls have the most evidence?",                                   answer: "Top 3 by evidence count: GDPR Art.32 (12 items — encryption + access reviews), Art.30 (9 items — RoPA exports), Art.33 (7 items — breach drill records). Lowest coverage: Art.35 DPIA refresh.",                                                                                                                                                                                       confidence: "high",   citations: [],                                          createdAt: daysAgo(6) },
  { id: "conv-ares-1",    projectId: "proj-demo-ares",    question: "Walk me through the ASIL-D allocation for the brake-by-wire ECU.",         answer: "ECU is decomposed under ISO 26262-9 into ASIL-D (primary actuation) + ASIL-B(D) (redundant monitor). Hardware metrics PMHF and SPFM both clear the ASIL-D budget. Software is partitioned: actuation runs in QM-elevated partition with freedom-from-interference proven via memory protection.",                                                                                       confidence: "high",   citations: ["report-ares-26262"],                       createdAt: daysAgo(2) },
  { id: "conv-ares-2",    projectId: "proj-demo-ares",    question: "Show open safety defects.",                                                answer: "2 open: DEF-ARE-2031 (watchdog timeout race during diagnostic session — major) and DEF-ARE-2034 (sensor plausibility check disabled in service mode — critical). DEF-ARE-2034 is blocking the next homologation submission.",                                                                                                                                                            confidence: "high",   citations: [],                                          createdAt: daysAgo(3) },
  { id: "conv-bastion-1", projectId: "proj-demo-bastion", question: "Are we SOC 2 Type II audit-ready?",                                        answer: "Yes for Security and Availability TSCs. Confidentiality TSC has one open item: vendor-management evidence for a sub-processor added 60 days ago is not yet attached to control CC9.2. Recommend uploading the vendor SOC 2 report before the auditor field visit.",                                                                                                                  confidence: "high",   citations: ["report-bastion-soc2"],                     createdAt: daysAgo(1) },
  { id: "conv-bastion-2", projectId: "proj-demo-bastion", question: "What's the status of NIST CSF 2.0 mapping?",                               answer: "GOVERN, IDENTIFY, PROTECT, DETECT functions are 90%+ mapped. RESPOND is 72% — playbook for ransomware needs a tabletop exercise log. RECOVER is 65% — DR drill scheduled for next month will close the largest gap.",                                                                                                                                                                  confidence: "medium", citations: ["report-bastion-nist"],                     createdAt: daysAgo(4) },
];

// ── Compliance evidence (AI-asserted artefacts per control) ────────────────
const COMPLIANCE_EVIDENCE = [
  { id: "ev-helios-1", projectId: "proj-demo-helios",  controlId: "164.312(a)(1)",  frameworkId: "fw-hipaa",       kind: "requirement", refId: "req-helios-001", refLabel: "HEL-0001 — Encryption at rest for PHI",                source: "trace", status: "verified",     note: "Linked via trace-helios-001"      },
  { id: "ev-helios-2", projectId: "proj-demo-helios",  controlId: "164.312(b)",     frameworkId: "fw-hipaa",       kind: "requirement", refId: "req-helios-002", refLabel: "HEL-0002 — Immutable audit log retention",              source: "ai",    status: "ai_asserted",  note: "AI audit asserted on " + daysAgo(1).toISOString().slice(0,10) },
  { id: "ev-helios-3", projectId: "proj-demo-helios",  controlId: "Art.17",         frameworkId: "fw-gdpr",        kind: "report",      refId: "report-helios-hipaa", refLabel: "HIPAA Gap Analysis (AI report)",                   source: "ai",    status: "ai_asserted",  note: "Cited section 3.2 — erasure SLA"  },
  { id: "ev-orion-1",  projectId: "proj-demo-orion",   controlId: "5.5",            frameworkId: "fw-iec-62304",   kind: "test_result", refId: "tc-orion-001",   refLabel: "TC-ORI-001 — Unit test: dose calc bounds",              source: "trace", status: "verified",     note: "PASS in last build"               },
  { id: "ev-orion-2",  projectId: "proj-demo-orion",   controlId: "7.1",            frameworkId: "fw-iec-62304",   kind: "requirement", refId: "req-orion-001",  refLabel: "ORI-0001 — Risk control measures for dose overdelivery", source: "trace", status: "verified",     note: ""                                  },
  { id: "ev-orion-3",  projectId: "proj-demo-orion",   controlId: "8.1.2",          frameworkId: "fw-iec-62304",   kind: "note",        refId: null,             refLabel: "SOUP inventory pending — 4 libs",                       source: "ai",    status: "ai_asserted",  note: "Flagged by AI audit as gap"        },
  { id: "ev-atlas-1",  projectId: "proj-demo-atlas",   controlId: "3.4",            frameworkId: "fw-pci-dss-4",   kind: "requirement", refId: "req-atlas-001",  refLabel: "ATL-0001 — PAN tokenization at edge",                  source: "trace", status: "verified",     note: ""                                  },
  { id: "ev-atlas-2",  projectId: "proj-demo-atlas",   controlId: "10.6",           frameworkId: "fw-pci-dss-4",   kind: "report",      refId: "report-atlas-pci", refLabel: "PCI Readiness Report (AI)",                          source: "ai",    status: "ai_asserted",  note: "Log review automation gap"         },
  { id: "ev-atlas-3",  projectId: "proj-demo-atlas",   controlId: "8.3",            frameworkId: "fw-pci-dss-4",   kind: "file",        refId: null,             refLabel: "MFA enrollment policy v3.pdf",                          source: "user",  status: "verified",     note: "Uploaded by SecOps"                },
  { id: "ev-vega-1",   projectId: "proj-demo-vega",    controlId: "Art.32",         frameworkId: "fw-gdpr",        kind: "requirement", refId: "req-vega-001",   refLabel: "VEG-0001 — Encryption in transit and at rest",          source: "trace", status: "verified",     note: ""                                  },
  { id: "ev-vega-2",   projectId: "proj-demo-vega",    controlId: "Art.30",         frameworkId: "fw-gdpr",        kind: "file",        refId: null,             refLabel: "RoPA-export-Q1.xlsx",                                   source: "user",  status: "verified",     note: ""                                  },
  { id: "ev-vega-3",   projectId: "proj-demo-vega",    controlId: "Art.17",         frameworkId: "fw-gdpr",        kind: "note",        refId: null,             refLabel: "Warehouse purge cadence exceeds 30-day SLA",            source: "ai",    status: "ai_asserted",  note: "Flagged for CAPA"                  },
  { id: "ev-ares-1",   projectId: "proj-demo-ares",    controlId: "Part 9 §5",      frameworkId: "fw-iso-26262",   kind: "requirement", refId: "req-ares-001",   refLabel: "ARE-0001 — ASIL-D decomposition for brake-by-wire ECU", source: "trace", status: "verified",     note: ""                                  },
  { id: "ev-ares-2",   projectId: "proj-demo-ares",    controlId: "Part 6 §7",      frameworkId: "fw-iso-26262",   kind: "test_result", refId: "tc-ares-001",    refLabel: "TC-ARE-001 — HIL: brake actuator response under fault", source: "trace", status: "verified",     note: "PASS"                              },
  { id: "ev-ares-3",   projectId: "proj-demo-ares",    controlId: "Part 4 §7",      frameworkId: "fw-iso-26262",   kind: "report",      refId: "report-ares-26262", refLabel: "ISO 26262 Functional Safety Assessment",            source: "ai",    status: "ai_asserted",  note: ""                                  },
  { id: "ev-bastion-1",projectId: "proj-demo-bastion", controlId: "CC6.1",          frameworkId: "fw-soc2",        kind: "requirement", refId: "req-bastion-001",refLabel: "BAS-0001 — Logical access controls baseline",           source: "trace", status: "verified",     note: ""                                  },
  { id: "ev-bastion-2",projectId: "proj-demo-bastion", controlId: "CC7.2",          frameworkId: "fw-soc2",        kind: "report",      refId: "report-bastion-soc2", refLabel: "SOC 2 Type II Readiness",                          source: "ai",    status: "ai_asserted",  note: ""                                  },
  { id: "ev-bastion-3",projectId: "proj-demo-bastion", controlId: "CC9.2",          frameworkId: "fw-soc2",        kind: "note",        refId: null,             refLabel: "Vendor SOC 2 report pending for new sub-processor",     source: "ai",    status: "ai_asserted",  note: "Open finding"                      },
];

// ── Workflows (compliance workflow templates + an in-flight run) ───────────
const WORKFLOWS = [
  {
    id: "wf-capa-triage",
    name: "CAPA Triage & Closure",
    description: "Standard CAPA lifecycle: triage → root-cause → action plan → verification → closure.",
    version: 1,
    status: "active",
    trigger: "on_capa_created",
    definition: {
      steps: [
        { id: "s1", name: "Triage severity & owner",        type: "task" as const,      assignee: "Quality",   dueOffsetDays: 2 },
        { id: "s2", name: "Root cause analysis (5-Whys)",   type: "task" as const,      assignee: "Engineering", dueOffsetDays: 7 },
        { id: "s3", name: "Draft action plan",              type: "ai_action" as const, aiPrompt: "Suggest containment + corrective + preventive actions for this CAPA.", outputKey: "draftPlan" },
        { id: "s4", name: "QA approval",                    type: "approval" as const,  assignee: "QA Lead",   dueOffsetDays: 3 },
        { id: "s5", name: "Verify effectiveness (30 days)", type: "stop" as const,      blockedUntil: [{ expr: "daysSinceImplementation >= 30", reason: "Minimum 30-day verification window" }] },
        { id: "s6", name: "Close CAPA",                     type: "task" as const,      assignee: "Quality",   dueOffsetDays: 1 },
      ],
    },
  },
  {
    id: "wf-audit-followup",
    name: "Audit Finding Follow-Up",
    description: "Convert audit findings into tracked actions with owner, evidence, and management review.",
    version: 1,
    status: "active",
    trigger: "on_audit_completed",
    definition: {
      steps: [
        { id: "s1", name: "Categorise findings",       type: "ai_action" as const, aiPrompt: "Group findings by control family and severity.", outputKey: "groupedFindings" },
        { id: "s2", name: "Assign owners",             type: "task" as const,      assignee: "Compliance", dueOffsetDays: 3 },
        { id: "s3", name: "Collect evidence",          type: "task" as const,      assignee: "Engineering", dueOffsetDays: 14 },
        { id: "s4", name: "Management review",         type: "approval" as const,  assignee: "CISO",       dueOffsetDays: 5 },
      ],
    },
  },
  {
    id: "wf-req-change",
    name: "Requirement Change Control",
    description: "Impact-assess and approve changes to baselined requirements.",
    version: 1,
    status: "active",
    trigger: "on_requirement_status_change",
    definition: {
      steps: [
        { id: "s1", name: "Impact analysis (downstream tests, code, controls)", type: "ai_action" as const, aiPrompt: "List all artefacts impacted by this requirement change.", outputKey: "impact" },
        { id: "s2", name: "CAB review",                                          type: "approval" as const,  assignee: "Change Board", dueOffsetDays: 5 },
        { id: "s3", name: "Update traceability",                                 type: "task" as const,      assignee: "Quality",      dueOffsetDays: 2 },
      ],
    },
  },
];

const WORKFLOW_RUNS = [
  { id: "wfr-helios-capa-005", workflowId: "wf-capa-triage",    projectId: "proj-demo-helios",  status: "blocked",   currentStepId: "s5", blockedReason: "Awaiting 30-day verification window", context: { capaId: "capa-helios-005" }, startedBy: "system",                  startedAt: daysAgo(12), completedAt: null },
  { id: "wfr-orion-audit-q2",  workflowId: "wf-audit-followup", projectId: "proj-demo-orion",   status: "running",   currentStepId: "s3", blockedReason: null,                                  context: { auditId: "ra-orion-62304" }, startedBy: "qa@acme-health.example",  startedAt: daysAgo(6),  completedAt: null },
  { id: "wfr-bastion-soc2",    workflowId: "wf-audit-followup", projectId: "proj-demo-bastion", status: "completed", currentStepId: "s4", blockedReason: null,                                  context: { auditId: "ra-bastion-soc2" }, startedBy: "ciso@acme-sec.example",  startedAt: daysAgo(20), completedAt: daysAgo(2) },
];

const WORKFLOW_STEP_RUNS = [
  // wfr-helios-capa-005
  { id: "wsr-helios-1", runId: "wfr-helios-capa-005", stepId: "s1", stepName: "Triage severity & owner",        stepType: "task",      status: "done",        assignee: "Quality",     output: { severity: "critical", owner: "Privacy" }, blockedReason: null,                                       dueAt: daysAgo(10), startedAt: daysAgo(12), completedAt: daysAgo(11) },
  { id: "wsr-helios-2", runId: "wfr-helios-capa-005", stepId: "s2", stepName: "Root cause analysis (5-Whys)",   stepType: "task",      status: "done",        assignee: "Engineering", output: { rootCause: "ITSM bridge missing direct API call" }, blockedReason: null,                            dueAt: daysAgo(5),  startedAt: daysAgo(11), completedAt: daysAgo(6) },
  { id: "wsr-helios-3", runId: "wfr-helios-capa-005", stepId: "s3", stepName: "Draft action plan",              stepType: "ai_action", status: "done",        assignee: null,          output: { draftPlan: "Replace ITSM hand-off with direct API; auto-trigger erase job." }, blockedReason: null, dueAt: null,        startedAt: daysAgo(6),  completedAt: daysAgo(6) },
  { id: "wsr-helios-4", runId: "wfr-helios-capa-005", stepId: "s4", stepName: "QA approval",                    stepType: "approval",  status: "done",        assignee: "QA Lead",     output: { approvedBy: "QA Lead", at: daysAgo(4).toISOString() }, blockedReason: null,                       dueAt: daysAgo(3),  startedAt: daysAgo(6),  completedAt: daysAgo(4) },
  { id: "wsr-helios-5", runId: "wfr-helios-capa-005", stepId: "s5", stepName: "Verify effectiveness (30 days)", stepType: "stop",      status: "blocked",     assignee: null,          output: {},                                                  blockedReason: "Minimum 30-day verification window",       dueAt: daysAhead(26), startedAt: daysAgo(4), completedAt: null },
  { id: "wsr-helios-6", runId: "wfr-helios-capa-005", stepId: "s6", stepName: "Close CAPA",                     stepType: "task",      status: "pending",     assignee: "Quality",     output: {},                                                  blockedReason: null,                                       dueAt: daysAhead(27), startedAt: daysAhead(26), completedAt: null },
  // wfr-orion-audit-q2
  { id: "wsr-orion-1",  runId: "wfr-orion-audit-q2",  stepId: "s1", stepName: "Categorise findings",            stepType: "ai_action", status: "done",        assignee: null,          output: { groupedFindings: { soup: 4, classification: 0, risk: 1 } }, blockedReason: null,                           dueAt: null,        startedAt: daysAgo(6),  completedAt: daysAgo(6) },
  { id: "wsr-orion-2",  runId: "wfr-orion-audit-q2",  stepId: "s2", stepName: "Assign owners",                  stepType: "task",      status: "done",        assignee: "Compliance",  output: { assignments: 5 },                                  blockedReason: null,                                       dueAt: daysAgo(3),  startedAt: daysAgo(6),  completedAt: daysAgo(4) },
  { id: "wsr-orion-3",  runId: "wfr-orion-audit-q2",  stepId: "s3", stepName: "Collect evidence",               stepType: "task",      status: "in_progress", assignee: "Engineering", output: {},                                                  blockedReason: null,                                       dueAt: daysAhead(8), startedAt: daysAgo(4),  completedAt: null },
  { id: "wsr-orion-4",  runId: "wfr-orion-audit-q2",  stepId: "s4", stepName: "Management review",              stepType: "approval",  status: "pending",     assignee: "CISO",        output: {},                                                  blockedReason: null,                                       dueAt: daysAhead(13), startedAt: daysAhead(8), completedAt: null },
  // wfr-bastion-soc2 (all done)
  { id: "wsr-bastion-1",runId: "wfr-bastion-soc2",    stepId: "s1", stepName: "Categorise findings",            stepType: "ai_action", status: "done",        assignee: null,          output: { groupedFindings: { security: 0, availability: 0, confidentiality: 1 } }, blockedReason: null,             dueAt: null,         startedAt: daysAgo(20), completedAt: daysAgo(20) },
  { id: "wsr-bastion-2",runId: "wfr-bastion-soc2",    stepId: "s2", stepName: "Assign owners",                  stepType: "task",      status: "done",        assignee: "Compliance",  output: { assignments: 1 },                                  blockedReason: null,                                       dueAt: daysAgo(17), startedAt: daysAgo(20), completedAt: daysAgo(18) },
  { id: "wsr-bastion-3",runId: "wfr-bastion-soc2",    stepId: "s3", stepName: "Collect evidence",               stepType: "task",      status: "done",        assignee: "Engineering", output: { evidenceItems: 3 },                                blockedReason: null,                                       dueAt: daysAgo(6),  startedAt: daysAgo(18), completedAt: daysAgo(7) },
  { id: "wsr-bastion-4",runId: "wfr-bastion-soc2",    stepId: "s4", stepName: "Management review",              stepType: "approval",  status: "done",        assignee: "CISO",        output: { approvedBy: "CISO", at: daysAgo(2).toISOString() }, blockedReason: null,                                      dueAt: daysAgo(1),  startedAt: daysAgo(7),  completedAt: daysAgo(2) },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

export async function seedDemoProjects() {
  await ensureDemoWorkspace();

  // Upsert projects
  const projectRows = PROJECTS.map((p) => ({
    ...p,
    workspaceId: DEMO_WS_ID,
    isDemo: true,
  }));
  await db.insert(projectsTable).values(projectRows).onConflictDoNothing();

  // Upsert requirements — safe because we use fixed deterministic IDs
  if (REQUIREMENTS.length > 0) {
    await db.insert(requirementsTable).values(REQUIREMENTS).onConflictDoNothing();
  }

  // Upsert PDLC stages — safe because IDs are deterministic
  const allPdlc = PROJECTS.flatMap((p) => {
    const d = PDLC_DATA[p.id];
    return d ? pdlcFor(p.id, d.completions, d.blockers) : [];
  });
  if (allPdlc.length > 0) {
    await db.insert(pdlcStagesTable).values(allPdlc).onConflictDoNothing();
  }

  // Per-module data for the six anchor projects.
  if (PROJECT_SOURCES.length > 0) {
    await db.insert(projectSourcesTable).values(PROJECT_SOURCES).onConflictDoNothing();
  }
  if (DEFECTS.length > 0) {
    await db.insert(defectsTable).values(DEFECTS).onConflictDoNothing();
  }
  if (CAPA_ACTIONS.length > 0) {
    await db.insert(capaActionsTable).values(CAPA_ACTIONS).onConflictDoNothing();
  }
  if (TEST_CASES.length > 0) {
    await db.insert(testCasesTable).values(TEST_CASES).onConflictDoNothing();
  }
  if (CODE_ARTIFACTS.length > 0) {
    await db.insert(codeArtifactsTable).values(CODE_ARTIFACTS).onConflictDoNothing();
  }
  if (TRACE_LINKS.length > 0) {
    await db.insert(traceabilityLinksTable).values(TRACE_LINKS).onConflictDoNothing();
  }
  if (AI_REPORTS.length > 0) {
    await db.insert(aiReportsTable).values(AI_REPORTS).onConflictDoNothing();
  }
  if (RECURRING_AUDITS.length > 0) {
    await db.insert(recurringAuditsTable).values(RECURRING_AUDITS).onConflictDoNothing();
  }
  if (LEGACY_SYSTEMS.length > 0) {
    await db.insert(legacySystemsTable).values(LEGACY_SYSTEMS).onConflictDoNothing();
  }
  if (AI_CONVERSATIONS.length > 0) {
    await db.insert(aiConversationsTable).values(AI_CONVERSATIONS).onConflictDoNothing();
  }
  if (COMPLIANCE_EVIDENCE.length > 0) {
    await db.insert(complianceEvidenceTable).values(COMPLIANCE_EVIDENCE).onConflictDoNothing();
  }
  if (WORKFLOWS.length > 0) {
    await db.insert(workflowsTable).values(WORKFLOWS).onConflictDoNothing();
  }
  if (WORKFLOW_RUNS.length > 0) {
    await db.insert(workflowRunsTable).values(WORKFLOW_RUNS).onConflictDoNothing();
  }
  if (WORKFLOW_STEP_RUNS.length > 0) {
    await db.insert(workflowStepRunsTable).values(WORKFLOW_STEP_RUNS).onConflictDoNothing();
  }

  console.log(
    `Demo seed complete: ${PROJECTS.length} projects, ${REQUIREMENTS.length} requirements, ${allPdlc.length} PDLC stages, ` +
    `${PROJECT_SOURCES.length} sources, ${DEFECTS.length} defects, ${CAPA_ACTIONS.length} CAPAs, ${TEST_CASES.length} test cases, ` +
    `${CODE_ARTIFACTS.length} code artifacts, ${TRACE_LINKS.length} trace links, ${AI_REPORTS.length} AI reports, ${RECURRING_AUDITS.length} recurring audits, ` +
    `${LEGACY_SYSTEMS.length} legacy systems, ${AI_CONVERSATIONS.length} AI conversations, ${COMPLIANCE_EVIDENCE.length} evidence rows, ` +
    `${WORKFLOWS.length} workflows, ${WORKFLOW_RUNS.length} runs, ${WORKFLOW_STEP_RUNS.length} step runs. ` +
    `Anchors: ${ANCHORS.join(", ")}.`,
  );
}
