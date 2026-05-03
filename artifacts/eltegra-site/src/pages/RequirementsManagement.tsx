import { MarketingPage } from "@/components/marketing/MarketingPage";
import type { MarketingPageData } from "@/components/marketing/MarketingPage";
import { ListChecks, Plug, Tag, Filter, ClipboardList, Network, FileText, Code2, GitBranch, BookOpen } from "lucide-react";

const DATA: MarketingPageData = {
  path: "/requirements-management",
  eyebrow: "Requirements Management",
  EyebrowIcon: ListChecks,
  title: "One graph for every requirement,",
  highlight: "from every tool you already own",
  description:
    "Auditee replaces the DOORS-Jama-Jira-Confluence sprawl with a single AI-native requirements knowledge graph — connect 10+ RM tools, dedup on import, generate the gaps you missed, and trace every requirement to code, tests and controls.",
  seoTitle: "Requirements Management — DOORS, Jama, Polarion, Jira in One Graph | Auditee",
  seoDescription:
    "AI-native requirements management that unifies IBM DOORS, DOORS Next, Jama, Polarion, codeBeamer, Helix RM, Visure, Azure DevOps and Jira into one knowledge graph with auto-dedup and end-to-end traceability.",
  keywords: ["requirements management", "DOORS alternative", "Jama alternative", "Polarion alternative", "ALM platform", "RM tool"],
  primaryCta: { label: "Connect a source", href: "/app/sources" },
  secondaryCta: { label: "Book a walkthrough", href: "/contact" },
  capabilities: [
    { icon: Plug, title: "10 RM connectors out of the box", desc: "DOORS Classic & Next (OSLC), Jama, Polarion, codeBeamer, Helix RM, Visure, Azure DevOps, Jira — plus generic ReqIF for everything else." },
    { icon: Tag, title: "Source attribution + dedup", desc: "Every imported req keeps its origin (system + external ID + URL). Auto-dedupes on `(project, source, externalId)` so re-syncs never multiply data." },
    { icon: Filter, title: "Source-aware filtering", desc: "Filter by source, owner, framework, status, type, priority — compare each tool's data side-by-side or audit each in isolation." },
    { icon: ClipboardList, title: "Status workflow + comments", desc: "Draft → Review → Approved with per-requirement comment threads and full change history." },
    { icon: Network, title: "Bidirectional traceability", desc: "Each requirement linked to the code that ships it, the test that verifies it and the control it satisfies — and vice versa." },
    { icon: FileText, title: "BRD / PRD / FRD generation", desc: "One-click generation of complete documents from your live req graph. DOCX, PDF, HTML, Markdown export." },
  ],
  pillars: [
    { title: "Migrate or coexist", bullets: ["Push & pull with DOORS / Jama / Polarion", "Generic ReqIF importer (OMG-standard)", "Bidirectional Jira & Azure DevOps sync", "Custom REST connector framework"] },
    { title: "Workflow & governance", bullets: ["Draft → Review → Approved status", "Per-requirement comment threads", "Append-only change log", "Project member RBAC (Owner/Admin/Editor/Viewer)"] },
    { title: "Outputs", bullets: ["DOCX / PDF / HTML / Markdown documents", "CSV / XLSX / JSON / ReqIF data", "Linked test cases & controls", "Custom Standards mapping"] },
  ],
  outcomes: [
    { metric: "10", label: "RM tools natively supported" },
    { metric: "100%", label: "requirements with traceability" },
    { metric: "0", label: "spreadsheets to maintain" },
    { metric: "23+", label: "frameworks mapped" },
  ],
  closingTitle: "DOORS without the DOORS pain. Jama without the Jama lock-in.",
  closingBody:
    "Connect your existing RM stack in 30 minutes, see your requirement graph come alive — then decide if you ever want to rip and replace.",
};

export default function RequirementsManagement() { return <MarketingPage data={DATA} />; }
