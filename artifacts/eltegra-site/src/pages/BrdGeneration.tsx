import { MarketingPage } from "@/components/marketing/MarketingPage";
import type { MarketingPageData } from "@/components/marketing/MarketingPage";
import { FileText, Sparkles, Bot, Download, Network, ListChecks, GitBranch, BookOpen, FileSpreadsheet, FileCode2 } from "lucide-react";

const DATA: MarketingPageData = {
  path: "/brd-generation",
  eyebrow: "AI BRD Generation",
  EyebrowIcon: FileText,
  title: "Generate board-ready BRDs",
  highlight: "in minutes, not weeks",
  description:
    "Auditee turns a one-paragraph idea, uploaded brief or imported requirements into a full Business Requirements Document — classified, prioritized, traceable and exportable to DOCX / PDF / HTML / Markdown.",
  seoTitle: "AI BRD Generation — Business Requirements Documents in Minutes | Auditee",
  seoDescription:
    "AI-powered BRD generation from a brief, interview, source code or uploaded document. Classified, prioritized, traceable. Export to DOCX, PDF, HTML, Markdown, ReqIF, CSV.",
  keywords: ["AI BRD generation", "business requirements document", "AI requirements document", "BRD AI", "BRD template"],
  primaryCta: { label: "Generate a BRD", href: "/app/reports" },
  secondaryCta: { label: "Book a walkthrough", href: "/contact" },
  capabilities: [
    { icon: Sparkles, title: "AI-first authoring", desc: "Drop in a brief, an idea, or an interview transcript — Auditee returns a complete BRD draft in under a minute." },
    { icon: Bot, title: "Smart Interview discovery", desc: "Don't have a brief? Smart Interview asks the right 5–10 follow-ups in plain English and turns answers into a structured BRD." },
    { icon: ListChecks, title: "Auto-classification", desc: "Every requirement tagged BRD / PRD / FRD / NFR with priority, type, status and framework links — no manual structuring." },
    { icon: Network, title: "Traceability built-in", desc: "Every requirement is born linked to its source, its tests and the audit controls it satisfies." },
    { icon: Download, title: "Export anywhere", desc: "DOCX, PDF, HTML, Markdown, CSV, JSON, XLSX, ReqIF — board-ready, audit-ready, dev-ready." },
    { icon: GitBranch, title: "Version + collaborate", desc: "Per-requirement comments, status workflow (Draft → Review → Approved) and change history. Source of truth, not stale Word doc." },
  ],
  pillars: [
    { title: "Document set", bullets: ["Business Requirements Document (BRD)", "Product Requirements Document (PRD)", "Functional Requirements Document (FRD)", "Non-functional Requirements (NFRs)"] },
    { title: "Inputs we accept", bullets: ["One-paragraph idea or brief", "Stakeholder interview transcripts", "Existing DOCX / PDF / Confluence", "Source code repos (GitHub/GitLab/ADO)", "DOORS, Jama, Polarion, Jira exports"] },
    { title: "Outputs you ship", bullets: ["DOCX / PDF / HTML / Markdown", "CSV / XLSX / JSON / ReqIF", "Linked test cases", "Linked compliance controls"] },
  ],
  outcomes: [
    { metric: "10×", label: "faster BRD drafting" },
    { metric: "8", label: "export formats supported" },
    { metric: "100%", label: "BRDs born traceable" },
    { metric: "Zero", label: "ChatGPT copy-paste" },
  ],
  closingTitle: "From idea to signed-off BRD before the kickoff meeting",
  closingBody:
    "Stop spending two weeks turning brain-dumps into structured docs. Auditee returns the structured doc in minutes — your time goes back into solving the business problem, not formatting it.",
};

export default function BrdGeneration() { return <MarketingPage data={DATA} />; }
