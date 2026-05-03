import {
  Briefcase,
  Code2,
  ClipboardList,
  ShieldCheck,
  Network,
  FileText,
  Bot,
  Workflow,
  AlertTriangle,
  Lock,
  Activity,
  ListChecks,
  GitBranch,
  Database,
  Zap,
  Users,
  TrendingUp,
  Target,
  CircuitBoard,
} from "lucide-react";
import type { MarketingPageData } from "@/components/marketing/MarketingPage";

export const FOR_CPO: MarketingPageData = {
  path: "/cpo",
  eyebrow: "For Chief Product Officers",
  EyebrowIcon: Target,
  title: "Ship faster, prove value,",
  highlight: "and never wait on the doc-juggle again",
  description:
    "Auditee gives CPOs an AI-native control plane for the entire product development lifecycle — from idea capture through requirements, design, engineering and audit — with portfolio-level visibility and a board-ready ROI story.",
  seoTitle: "Auditee for CPOs — AI Product Development Platform | Auditee",
  seoDescription:
    "An AI-native PDLC platform built for Chief Product Officers: portfolio visibility, requirements quality scoring, audit readiness and ROI dashboards across every product line.",
  keywords: ["CPO platform", "product portfolio management", "AI product development", "PDLC platform"],
  primaryCta: { label: "See the platform", href: "/app/dashboard" },
  secondaryCta: { label: "Book CPO walkthrough", href: "/contact" },
  capabilities: [
    {
      icon: TrendingUp,
      title: "Portfolio dashboard",
      desc: "One screen, every product line: requirements quality, compliance coverage, defect leakage, velocity, recurring-audit drift.",
    },
    {
      icon: Bot,
      title: "Smart Interview intake",
      desc: "Stakeholders describe what they want in plain English; Auditee returns a complete, structured requirement set in minutes.",
    },
    {
      icon: FileText,
      title: "Auto-generated BRD / PRD / FRD",
      desc: "Board-quality product documents generated from the live requirement graph — never out of sync with what's actually being built.",
    },
    {
      icon: ListChecks,
      title: "Requirements quality score",
      desc: "Per-product quality, gap and traceability score so you know where to invest before the next quarterly review.",
    },
    {
      icon: ShieldCheck,
      title: "Compliance built in",
      desc: "23+ frameworks mapped — your products ship audit-ready, not 'audit-eventually'.",
    },
    {
      icon: Activity,
      title: "ROI you can defend",
      desc: "Quantify time saved on requirements, gap detection, audits and rework — with a board-ready ROI calculator.",
    },
  ],
  pillars: [
    {
      title: "Strategic visibility",
      bullets: [
        "Cross-product portfolio rollups",
        "Roadmap risk scored by gap and compliance debt",
        "Vendor and integration footprint at a glance",
      ],
    },
    {
      title: "Operational leverage",
      bullets: [
        "10× faster requirements drafting per PM",
        "AI gap detection cuts late-stage rework",
        "Recurring audits keep evidence current",
      ],
    },
    {
      title: "Board-grade reporting",
      bullets: [
        "ROI calculator + downloadable PDF",
        "Compliance posture across 23+ frameworks",
        "Investor / sales deck export",
      ],
    },
  ],
  outcomes: [
    { metric: "10×", label: "faster requirements per PM" },
    { metric: "60%", label: "less audit-prep effort" },
    { metric: "1", label: "platform replaces 6+ tools" },
    { metric: "100%", label: "products audit-ready" },
  ],
  closingTitle: "Run product like an operating system, not a spreadsheet sport",
  closingBody:
    "Auditee gives every CPO the same operational rigour the CFO has had for decades — portfolio visibility, defensible numbers, audit-grade evidence — without slowing teams down.",
};

export const FOR_CTO: MarketingPageData = {
  path: "/cto",
  eyebrow: "For CTOs & VPs of Engineering",
  EyebrowIcon: CircuitBoard,
  title: "Modernize legacy, ship safer,",
  highlight: "and pass every audit on autopilot",
  description:
    "Auditee gives engineering leaders an AI-native platform that reverse-engineers legacy code into requirements, generates test suites, surfaces missing controls before they ship, and keeps audit evidence current as production changes.",
  seoTitle: "Auditee for CTOs — AI Requirements, Tests & Compliance | Auditee",
  seoDescription:
    "An AI-native engineering platform for CTOs: legacy modernization, AI-generated test cases, gap detection, continuous audit evidence and full traceability from requirement to deployed code.",
  keywords: ["CTO platform", "legacy modernization", "AI test generation", "engineering compliance"],
  primaryCta: { label: "See the platform", href: "/app/sources" },
  secondaryCta: { label: "Book engineering deep-dive", href: "/contact" },
  capabilities: [
    {
      icon: Code2,
      title: "Legacy reverse-engineering",
      desc: "Point Auditee at a Java, C++, C#, COBOL, Angular or PL/SQL repo — get back a complete, classified, traceable requirements set.",
    },
    {
      icon: Workflow,
      title: "AI test-case generation",
      desc: "Every requirement automatically becomes a structured test case (positive, negative, boundary, edge). Export to JUnit, pytest, NUnit, Postman.",
    },
    {
      icon: AlertTriangle,
      title: "Gap detection at merge time",
      desc: "AI scans every change for missing security, performance, accessibility and regulatory requirements before code reaches production.",
    },
    {
      icon: GitBranch,
      title: "End-to-end traceability",
      desc: "Find the function that owns any requirement, and the requirement behind any function. Bidirectional, indexed, instant.",
    },
    {
      icon: ShieldCheck,
      title: "Always-fresh evidence",
      desc: "SOC 2 / ISO 27001 / HIPAA / FDA / ASPICE evidence regenerated continuously from your live system, not pulled together at audit time.",
    },
    {
      icon: Database,
      title: "Plug into your stack",
      desc: "GitHub, GitLab, Azure DevOps, Jira, Slack, DOORS, Jama, Polarion, codeBeamer, Helix RM, Visure — connect, don't migrate.",
    },
  ],
  pillars: [
    {
      title: "Engineering velocity",
      bullets: [
        "Cut requirement-to-test time from days to minutes",
        "Reduce defect leakage with continuous gap detection",
        "Bring legacy under traceability without a rewrite",
      ],
    },
    {
      title: "Security & compliance",
      bullets: [
        "Append-only audit logs for HIPAA / SOC 2 / PCI",
        "SAML / OIDC SSO with idle-timeout enforcement",
        "Per-control evidence pack ready on demand",
      ],
    },
    {
      title: "Architecture leverage",
      bullets: [
        "Codebase knowledge graph for onboarding & refactor",
        "API contract analysis with OpenAPI codegen",
        "Recurring audit jobs surface drift automatically",
      ],
    },
  ],
  outcomes: [
    { metric: "10×", label: "faster requirements coverage" },
    { metric: "70%", label: "less audit-prep effort" },
    { metric: "Any", label: "stack — connect, don't migrate" },
    { metric: "0", label: "ad-hoc Excel RTMs" },
  ],
  closingTitle: "Stop choosing between speed and safety",
  closingBody:
    "Auditee gives engineering leaders the leverage to modernize legacy estates, ship faster on greenfield work, and keep audit and security teams happy — all from one knowledge graph.",
};

export const FOR_BA: MarketingPageData = {
  path: "/business-analyst",
  eyebrow: "For Business Analysts",
  EyebrowIcon: Briefcase,
  title: "Trade ChatGPT chaos for a",
  highlight: "structured AI co-analyst that traces everything",
  description:
    "Auditee gives Senior BAs an AI co-analyst that turns interviews, brain-dumps and uploaded BRDs into clean, classified, prioritized requirement sets — with built-in gap detection, BRD/PRD/FRD generation and bidirectional traceability.",
  seoTitle: "Auditee for Business Analysts — AI Requirements Co-analyst | Auditee",
  seoDescription:
    "An AI requirements co-analyst built for Senior BAs: Smart Interview discovery, AI-generated BRDs, gap detection, RM-tool ingestion, source-attributed traceability and one-click document export.",
  keywords: ["business analyst AI", "AI BRD generation", "Smart Interview", "requirements gathering AI"],
  primaryCta: { label: "Open the workspace", href: "/app/interview" },
  secondaryCta: { label: "Book BA walkthrough", href: "/contact" },
  capabilities: [
    {
      icon: Bot,
      title: "Smart Interview discovery",
      desc: "AI-driven interview asks the right 5–10 follow-ups; you answer in plain English; out comes a complete classified requirement set.",
    },
    {
      icon: FileText,
      title: "AI BRD / PRD / FRD generation",
      desc: "One-click generation of full Business / Product / Functional documents from your live req graph. DOCX, PDF, HTML, Markdown.",
    },
    {
      icon: AlertTriangle,
      title: "Gap detection",
      desc: "AI flags missing, duplicate, conflicting and weak requirements — categorised and severity-ranked so you know what to fix first.",
    },
    {
      icon: ListChecks,
      title: "Tagging & classification",
      desc: "Every requirement auto-classified BRD / PRD / FRD / NFR with priority, type, status and framework links — no manual tagging.",
    },
    {
      icon: Network,
      title: "Source-attributed traceability",
      desc: "Every imported req keeps its origin (system + external ID + URL). Filter by source, audit each origin separately, never lose lineage.",
    },
    {
      icon: Users,
      title: "In-context comments",
      desc: "Discuss each requirement on the requirement — not in Slack, not in email, not in a doc with five reviewers fighting over track-changes.",
    },
  ],
  pillars: [
    {
      title: "Discovery, not transcription",
      bullets: [
        "Smart Interview from a one-paragraph idea",
        "Auto-generated personas, journeys and stories",
        "AI prompts to push back on weak requirements",
      ],
    },
    {
      title: "Document generation",
      bullets: [
        "BRD / PRD / FRD / NFR with one click",
        "Stakeholder-ready DOCX / PDF in seconds",
        "Always in sync with the source of truth",
      ],
    },
    {
      title: "Trace and prove",
      bullets: [
        "Bidirectional links to code, tests and controls",
        "Status workflow: Draft → Review → Approved",
        "Evidence pack export for sign-off and audit",
      ],
    },
  ],
  outcomes: [
    { metric: "10×", label: "faster requirement drafting" },
    { metric: "0", label: "ChatGPT copy-paste chaos" },
    { metric: "1", label: "knowledge graph for the team" },
    { metric: "100%", label: "requirements with traceability" },
  ],
  closingTitle: "Stop being a documentation engine. Start being an analyst.",
  closingBody:
    "Auditee absorbs the documentation grind so Senior BAs can spend their time where it actually matters — solving real business problems and challenging weak requirements.",
};

export const FOR_QA: MarketingPageData = {
  path: "/qa-and-compliance",
  eyebrow: "For QA & Compliance",
  EyebrowIcon: ShieldCheck,
  title: "From spreadsheet purgatory to",
  highlight: "always-fresh evidence across 23+ frameworks",
  description:
    "Auditee gives QA leads and compliance teams a single platform for AI-generated test cases, requirement-linked evidence, recurring audits, CAPA workflow and per-control coverage scoring across SOC 2, ISO 27001, HIPAA, FDA, IEC 62304, ASPICE, PCI DSS, NIST 800-53 and more.",
  seoTitle: "Auditee for QA & Compliance — AI Test Generation + Audit Evidence | Auditee",
  seoDescription:
    "An AI-native QA and compliance platform: generated test cases linked to requirements, recurring audit jobs, CAPA workflow, append-only audit logs and per-control evidence across 23+ frameworks.",
  keywords: ["QA platform", "compliance automation", "AI test generation", "audit evidence", "CAPA"],
  primaryCta: { label: "See the platform", href: "/app/compliance" },
  secondaryCta: { label: "Book compliance demo", href: "/contact" },
  capabilities: [
    {
      icon: Workflow,
      title: "AI test-case generation",
      desc: "Every requirement turns into a full structured test case (positive / negative / boundary / edge) — exportable to your existing test framework.",
    },
    {
      icon: ShieldCheck,
      title: "Per-control evidence",
      desc: "Each control across SOC 2, ISO 27001, HIPAA, IEC 62304, FDA Part 11, ASPICE, PCI DSS, NIST 800-53 etc. has live evidence regenerated continuously.",
    },
    {
      icon: Activity,
      title: "Recurring audits",
      desc: "Scheduled daily / weekly / monthly audit jobs surface drift and missing evidence before the auditor arrives.",
    },
    {
      icon: AlertTriangle,
      title: "CAPA workflow",
      desc: "Corrective and Preventive Actions tracked from finding to closure with linked requirements, owners and due dates.",
    },
    {
      icon: Lock,
      title: "Append-only audit logs",
      desc: "Immutable, exportable audit trail meeting HIPAA § 164.312, SOC 2 CC7 and PCI DSS Req 10 — out of the box.",
    },
    {
      icon: ListChecks,
      title: "Defect-to-requirement loop",
      desc: "Every defect is linked back to the requirement and code that caused it — root-cause analysis without the archaeology.",
    },
  ],
  pillars: [
    {
      title: "QA acceleration",
      bullets: [
        "AI-generated test cases per requirement",
        "Coverage gaps surfaced automatically",
        "Push results back to JIRA / Azure DevOps",
      ],
    },
    {
      title: "Continuous compliance",
      bullets: [
        "23+ frameworks mapped out of the box",
        "Custom Standards for org-specific controls",
        "Recurring audit jobs catch drift early",
      ],
    },
    {
      title: "Audit-ready every day",
      bullets: [
        "One-click evidence pack export",
        "Append-only audit logs for HIPAA / SOC 2 / PCI",
        "CAPA workflow with linked artefacts",
      ],
    },
  ],
  outcomes: [
    { metric: "23+", label: "frameworks supported" },
    { metric: "70%", label: "less audit-prep effort" },
    { metric: "1", label: "platform for QA + compliance" },
    { metric: "100%", label: "controls with live evidence" },
  ],
  closingTitle: "Audit prep was never supposed to be this hard",
  closingBody:
    "Auditee replaces the spreadsheet-Confluence-DOORS sprawl with one platform that QA, security and compliance teams share — evidence stays current as code ships, not three weeks before the auditor walks in.",
};

export const ROLES = [FOR_CPO, FOR_CTO, FOR_BA, FOR_QA];
