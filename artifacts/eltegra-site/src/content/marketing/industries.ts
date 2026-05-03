import {
  Heart,
  Banknote,
  Car,
  Radio,
  ShieldCheck,
  Network,
  FileText,
  Bot,
  Workflow,
  AlertTriangle,
  Lock,
  Cpu,
  Activity,
  ListChecks,
  GitBranch,
  Database,
  Zap,
  Users,
} from "lucide-react";
import type { MarketingPageData } from "@/components/marketing/MarketingPage";

export const HEALTHCARE: MarketingPageData = {
  path: "/ai-for-healthcare",
  eyebrow: "Healthcare & MedTech",
  EyebrowIcon: Heart,
  title: "Ship medical software that",
  highlight: "passes FDA, IEC 62304 and HIPAA — first time",
  description:
    "Auditee turns your clinical brief, EHR integration, telehealth flow or SaMD design into a fully traceable, audit-ready requirements graph — with IEC 62304 software-lifecycle artefacts, HIPAA technical-safeguard mapping, and FDA 21 CFR Part 11 evidence built in.",
  seoTitle: "AI for Healthcare — IEC 62304, HIPAA & FDA Software Compliance | Auditee",
  seoDescription:
    "Auditee for healthcare and medical-device teams: IEC 62304 lifecycle artefacts, HIPAA Security Rule mapping, FDA 21 CFR Part 11/820, telehealth and SaMD requirements, traceability matrices, and continuous audit evidence.",
  keywords: [
    "AI for healthcare",
    "IEC 62304 software",
    "HIPAA compliance software",
    "FDA 21 CFR Part 11",
    "SaMD requirements",
    "telehealth compliance",
    "medical device software",
  ],
  primaryCta: { label: "Open the platform", href: "/app/sources" },
  secondaryCta: { label: "Book a healthcare demo", href: "/contact" },
  capabilities: [
    {
      icon: ShieldCheck,
      title: "IEC 62304 lifecycle artefacts",
      desc: "Software safety classification (A/B/C), software development plan, architecture, unit/integration test records and SOUP register — all generated and kept current.",
    },
    {
      icon: Lock,
      title: "HIPAA Security Rule mapping",
      desc: "Every Administrative, Physical and Technical Safeguard (45 CFR §164.308–.312) is mapped to controls, evidence and your codebase. Idle timeout enforced platform-wide.",
    },
    {
      icon: FileText,
      title: "FDA 21 CFR Part 11 + Part 820",
      desc: "Audit trails, electronic signatures, change control and DHF/DMR document threading for SaMD and quality system records.",
    },
    {
      icon: Heart,
      title: "Telehealth & SaMD blueprints",
      desc: "Templates for telehealth platforms, remote patient monitoring, AI/ML-enabled SaMD and clinical decision support — drafted requirements you can review, not start from scratch.",
    },
    {
      icon: AlertTriangle,
      title: "Risk + hazard analysis",
      desc: "ISO 14971-aligned risk register linked back to requirements; gap analysis surfaces missing safety, privacy and accessibility requirements automatically.",
    },
    {
      icon: Network,
      title: "End-to-end traceability",
      desc: "Every clinical requirement traced to architecture, source code, test case and audit evidence. Bidirectional — perfect for FDA pre-sub or notified-body review.",
    },
  ],
  pillars: [
    {
      title: "For Quality & Regulatory",
      bullets: [
        "Living Design History File (DHF) and Software Development Plan",
        "Pre-built audit checklists for FDA QSR, MDR Annex II, ISO 13485",
        "Recurring audits surface drift before the auditor arrives",
      ],
    },
    {
      title: "For Engineering",
      bullets: [
        "Reverse-engineer legacy clinical software (C++, C#, Java) into requirements",
        "Generate IEC 62304 Class B/C unit and integration test cases automatically",
        "Pull DOORS / Polarion / Jama requirements; push back to Jira",
      ],
    },
    {
      title: "For Product & Clinical",
      bullets: [
        "Smart Interview captures clinician workflows in plain English",
        "Generated BRD / PRD / FRD ready for stakeholder review",
        "Clear protected-health-information (PHI) flow diagrams",
      ],
    },
  ],
  standardsTitle: "Healthcare standards covered out of the box",
  standards: [
    "IEC 62304",
    "ISO 13485",
    "ISO 14971",
    "FDA 21 CFR Part 11",
    "FDA 21 CFR Part 820",
    "FDA QMSR",
    "HIPAA Security Rule",
    "HIPAA Privacy Rule",
    "HITECH",
    "EU MDR",
    "GDPR (EU/UK)",
    "ONC HTI-1",
  ],
  outcomes: [
    { metric: "10×", label: "faster IEC 62304 documentation" },
    { metric: "60%", label: "fewer audit findings on first cycle" },
    { metric: "100%", label: "PHI flows traceable to controls" },
    { metric: "Zero", label: "spreadsheets to maintain" },
  ],
  closingTitle: "From clinical brief to FDA submission, end-to-end",
  closingBody:
    "Auditee replaces the patchwork of Word docs, Excel risk registers and DOORS exports with one living source of truth — versioned, traceable and audit-ready every day, not just before the audit.",
};

export const FINANCE: MarketingPageData = {
  path: "/ai-for-finance",
  eyebrow: "Finance & Fintech",
  EyebrowIcon: Banknote,
  title: "Build banking, payments and",
  highlight: "trading software the regulators trust",
  description:
    "Auditee gives finance teams an AI-native PDLC platform mapped to PCI DSS v4, SOC 2, RBI / DPDP, SOX, GLBA and ISO 27001 — with continuous control evidence, fraud-detection requirements blueprints and full traceability from BRD to deployed code.",
  seoTitle: "AI for Finance — PCI DSS, SOC 2, SOX, RBI & ISO 27001 | Auditee",
  seoDescription:
    "Auditee for fintech, banking, payments and capital markets: PCI DSS v4, SOC 2 Type II, SOX, GLBA, RBI / DPDP and ISO 27001 evidence automation, fraud-detection BRDs, end-to-end traceability and continuous audit readiness.",
  keywords: [
    "AI for finance",
    "PCI DSS v4",
    "SOC 2 fintech",
    "SOX software compliance",
    "fraud detection requirements",
    "core banking modernization",
    "RBI compliance software",
  ],
  primaryCta: { label: "Open the platform", href: "/app/sources" },
  secondaryCta: { label: "Talk to finance team", href: "/contact" },
  capabilities: [
    {
      icon: ShieldCheck,
      title: "PCI DSS v4 evidence engine",
      desc: "Every PCI DSS v4 requirement mapped to controls, evidence and code — with automatic alerts when a payment-flow change breaks scope.",
    },
    {
      icon: Lock,
      title: "SOC 2, SOX, GLBA & ISO 27001",
      desc: "Multi-framework crosswalk so the same evidence satisfies SOC 2 Type II, SOX ITGCs, GLBA Safeguards and ISO 27001:2022 simultaneously.",
    },
    {
      icon: Bot,
      title: "Fraud-detection blueprint",
      desc: "Pre-built requirements set for fraud-detection rule engines, behavioural-biometrics models, KYC/AML workflows and case-management UIs.",
    },
    {
      icon: Workflow,
      title: "Core-banking modernization",
      desc: "Reverse-engineer legacy COBOL / Java / mainframe systems into requirements you can rebuild against. RegTech-first approach.",
    },
    {
      icon: AlertTriangle,
      title: "Risk-based gap detection",
      desc: "AI surfaces missing AML, sanctions-screening, audit-trail and segregation-of-duties requirements before they ship.",
    },
    {
      icon: Network,
      title: "Trade-to-trade traceability",
      desc: "From product spec to settlement code: every transaction path explainable, every control linked to its requirement and evidence.",
    },
  ],
  pillars: [
    {
      title: "For Risk & Compliance",
      bullets: [
        "Continuous PCI DSS v4 / SOC 2 evidence collection",
        "RBI Master Direction on IT Governance / DPDP-ready",
        "One-click control-narrative export for examiners",
      ],
    },
    {
      title: "For Engineering",
      bullets: [
        "Modernize legacy core systems with AI-derived requirements",
        "Generate test suites for payment, trading and AML rule engines",
        "Pull from JIRA / Azure DevOps / GitHub for full lineage",
      ],
    },
    {
      title: "For Product",
      bullets: [
        "Ship new fintech features without the compliance bottleneck",
        "Auto-generated BRD / FRD for product committees and audit",
        "Side-by-side review of design, code and control coverage",
      ],
    },
  ],
  standardsTitle: "Financial-services frameworks covered",
  standards: [
    "PCI DSS v4",
    "SOC 2 Type II",
    "ISO/IEC 27001:2022",
    "ISO/IEC 27701",
    "SOX ITGC",
    "GLBA Safeguards",
    "NIST 800-53",
    "NIST 800-171",
    "RBI Master Directions (IT)",
    "DPDP (India)",
    "GDPR",
    "DORA (EU)",
  ],
  outcomes: [
    { metric: "12×", label: "faster control-evidence collection" },
    { metric: "0", label: "Excel control matrices to maintain" },
    { metric: "70%", label: "less effort per recurring audit" },
    { metric: "100%", label: "payment flows traceable" },
  ],
  closingTitle: "Examiner-ready every day. Not just at quarter-end.",
  closingBody:
    "Auditee turns the audit prep marathon into a live dashboard — your control narratives, evidence and exception register stay current as code ships, not three weeks before the auditor walks in.",
};

export const AUTOMOTIVE: MarketingPageData = {
  path: "/ai-for-automotive",
  eyebrow: "Automotive & Mobility",
  EyebrowIcon: Car,
  title: "Engineer ASPICE, ISO 26262 and",
  highlight: "UNECE-compliant vehicle software",
  description:
    "Auditee gives automotive OEMs and Tier-1s an AI-native requirements and compliance platform mapped to Automotive SPICE, ISO 26262 (ASIL A–D), ISO/SAE 21434 cybersecurity and UNECE WP.29 — with full traceability from system requirement to ECU code and HIL test.",
  seoTitle: "AI for Automotive — ASPICE, ISO 26262, ISO 21434 | Auditee",
  seoDescription:
    "Auditee for automotive OEMs and Tier-1s: Automotive SPICE process compliance, ISO 26262 functional safety (ASIL A–D), ISO/SAE 21434 cybersecurity, UNECE WP.29 R155/R156 and end-to-end traceability for ECU software.",
  keywords: [
    "AI for automotive",
    "ASPICE compliance",
    "ISO 26262",
    "ISO 21434 cybersecurity",
    "ASIL D requirements",
    "UNECE WP.29",
    "ECU software requirements",
  ],
  primaryCta: { label: "Open the platform", href: "/app/sources" },
  secondaryCta: { label: "Talk to automotive team", href: "/contact" },
  capabilities: [
    {
      icon: ShieldCheck,
      title: "Automotive SPICE process gates",
      desc: "SYS.1–SYS.5 / SWE.1–SWE.6 process compliance with auto-generated work products and assessor-ready evidence.",
    },
    {
      icon: AlertTriangle,
      title: "ISO 26262 functional safety",
      desc: "Hazard analysis, ASIL decomposition (A–D), safety goals, FSR/TSR/SwSR — all linked end-to-end with safety-case structure baked in.",
    },
    {
      icon: Lock,
      title: "ISO/SAE 21434 cybersecurity",
      desc: "TARA, cybersecurity goals, CAL classification and secure-development lifecycle aligned to UNECE WP.29 R155/R156.",
    },
    {
      icon: Cpu,
      title: "ECU & domain controller blueprints",
      desc: "Pre-built requirement sets for powertrain, chassis, ADAS, infotainment and OTA update systems — adapt, don't start from scratch.",
    },
    {
      icon: Network,
      title: "Trace to HIL & MIL test",
      desc: "Bidirectional traceability between system requirement, software requirement, source file and HIL/MIL test record.",
    },
    {
      icon: Workflow,
      title: "DOORS / Polarion / Jama bridge",
      desc: "Plug into your incumbent ALM stack — pull, dedup, enrich with AI; push status back. No rip-and-replace.",
    },
  ],
  pillars: [
    {
      title: "For Functional Safety",
      bullets: [
        "Living safety case with ASIL decomposition graph",
        "Automatic hazard-to-requirement traceability",
        "Audit-ready evidence pack for assessors",
      ],
    },
    {
      title: "For Cybersecurity",
      bullets: [
        "TARA refresh on every architectural change",
        "ISO 21434 work products and CSMS evidence",
        "UNECE R155 type-approval evidence package",
      ],
    },
    {
      title: "For Software Engineering",
      bullets: [
        "Generate MISRA / AUTOSAR-aware test cases",
        "Reverse-engineer legacy ECU code into requirements",
        "Continuous gap detection on every merge",
      ],
    },
  ],
  standardsTitle: "Automotive frameworks covered",
  standards: [
    "Automotive SPICE 4.0",
    "ISO 26262 (Parts 1–12)",
    "ISO/SAE 21434",
    "UNECE WP.29 R155",
    "UNECE WP.29 R156",
    "ISO 21448 (SOTIF)",
    "AUTOSAR",
    "MISRA C/C++",
    "ISO 9001",
    "IATF 16949",
  ],
  outcomes: [
    { metric: "8×", label: "faster ASPICE work-product creation" },
    { metric: "ASIL D", label: "supported, end-to-end" },
    { metric: "100%", label: "requirements traced to test" },
    { metric: "0", label: "manual traceability matrices" },
  ],
  closingTitle: "From concept to type-approval, one knowledge graph",
  closingBody:
    "Auditee unifies system, hardware, software, safety and cybersecurity requirements into a single living graph — the same artefact your developers ship from is the artefact your assessor reviews.",
};

export const TELECOM: MarketingPageData = {
  path: "/ai-for-telecom",
  eyebrow: "Telecom & 5G",
  EyebrowIcon: Radio,
  title: "Build OSS / BSS / 5G core",
  highlight: "with carrier-grade traceability",
  description:
    "Auditee gives telecom operators and NEPs an AI-native requirements platform aligned to 3GPP, ETSI NFV, TM Forum Open APIs, MEF LSO and ITU-T standards — with full traceability from RFI / RFP through OSS/BSS code to live network test.",
  seoTitle: "AI for Telecom — 3GPP, ETSI NFV, TM Forum & 5G Compliance | Auditee",
  seoDescription:
    "Auditee for telecom: 3GPP / ETSI NFV / TM Forum / MEF LSO mapped requirements, OSS/BSS modernization, 5G core and RAN BRDs, network-element test generation and end-to-end carrier-grade traceability.",
  keywords: [
    "AI for telecom",
    "3GPP requirements",
    "ETSI NFV",
    "TM Forum Open APIs",
    "OSS BSS modernization",
    "5G core requirements",
    "MEF LSO",
  ],
  primaryCta: { label: "Open the platform", href: "/app/sources" },
  secondaryCta: { label: "Talk to telecom team", href: "/contact" },
  capabilities: [
    {
      icon: Network,
      title: "3GPP / ETSI / TM Forum mapping",
      desc: "Generated requirements link to 3GPP TS series, ETSI NFV reference architecture, TM Forum Open API IDs and MEF LSO services automatically.",
    },
    {
      icon: Workflow,
      title: "OSS / BSS modernization",
      desc: "Reverse-engineer legacy OSS/BSS (Java, C, Oracle PL/SQL) into requirement sets ready for cloud-native rebuild on TM Forum ODA.",
    },
    {
      icon: Cpu,
      title: "5G core & RAN blueprints",
      desc: "Pre-built requirements for SMF/AMF/UPF, slicing, edge compute and Open RAN xApps/rApps. Adapt to your architecture in hours, not weeks.",
    },
    {
      icon: ShieldCheck,
      title: "Lawful intercept & GDPR",
      desc: "Built-in checks for ETSI lawful-intercept, ENISA security baseline and GDPR data-subject rights across subscriber and CDR systems.",
    },
    {
      icon: AlertTriangle,
      title: "RFP / RFI gap analysis",
      desc: "Drop in any operator RFP — Auditee surfaces missing functional, performance and SLA requirements before you respond.",
    },
    {
      icon: Database,
      title: "Subscriber-data lineage",
      desc: "Trace subscriber attribute lineage from CRM / OCS through provisioning, billing and CDR mediation — for audit and migration alike.",
    },
  ],
  pillars: [
    {
      title: "For Network Engineering",
      bullets: [
        "5G SA / NSA, slicing, MEC and Open RAN templates",
        "Generated test cases mapped to 3GPP test specifications",
        "Continuous trace from feature to network element to KPI",
      ],
    },
    {
      title: "For OSS / BSS Product",
      bullets: [
        "TM Forum ODA-aligned requirement structures",
        "Open API ID linking on every functional requirement",
        "Modernization roadmaps from legacy code analysis",
      ],
    },
    {
      title: "For Security & Compliance",
      bullets: [
        "ENISA / NIS2 control coverage tracking",
        "Lawful-intercept (ETSI TS 102 232) requirement set",
        "GDPR data-subject rights mapped to subscriber systems",
      ],
    },
  ],
  standardsTitle: "Telecom standards covered",
  standards: [
    "3GPP (Release 15–18)",
    "ETSI NFV / MANO",
    "TM Forum Open APIs",
    "TM Forum ODA",
    "MEF LSO",
    "ITU-T M.3400 / TMN",
    "Open RAN Alliance",
    "ENISA NIS2",
    "GDPR",
    "ETSI TS 102 232 (LI)",
  ],
  outcomes: [
    { metric: "10×", label: "faster RFP response cycle" },
    { metric: "5G-ready", label: "blueprints out of the box" },
    { metric: "100%", label: "traceability across OSS/BSS" },
    { metric: "Zero", label: "spreadsheet RTMs" },
  ],
  closingTitle: "From RFP to live network, all in one graph",
  closingBody:
    "Auditee replaces the chain of Excel RTMs, Confluence wikis and DOORS modules with one AI-native graph that operators, NEPs and integrators can all share — and that updates as the network does.",
};

export const INDUSTRIES = [HEALTHCARE, FINANCE, AUTOMOTIVE, TELECOM];
