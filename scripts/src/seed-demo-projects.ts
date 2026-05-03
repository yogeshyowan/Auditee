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
} from "@workspace/db";

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
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function seedDemoProjects() {
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

  console.log(
    `Demo seed complete: ${PROJECTS.length} projects, ${REQUIREMENTS.length} requirements, ${allPdlc.length} PDLC stages.`,
  );
  process.exit(0);
}

seedDemoProjects().catch((err) => {
  console.error(err);
  process.exit(1);
});
