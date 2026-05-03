import { MarketingPage } from "@/components/marketing/MarketingPage";
import type { MarketingPageData } from "@/components/marketing/MarketingPage";
import { ScanText, FileText, Search, Network, AlertTriangle, ListChecks, BookOpen, FileCode2, Database, Bot } from "lucide-react";

const DATA: MarketingPageData = {
  path: "/intelligent-document-analysis",
  eyebrow: "Intelligent Document Analysis",
  EyebrowIcon: ScanText,
  title: "Turn legacy docs into a",
  highlight: "queryable, traceable knowledge graph",
  description:
    "Auditee ingests your existing BRDs, PRDs, RFPs, contracts, regulations and design notes — extracts requirements, classifies them, surfaces gaps and contradictions, and links them to your code, tests and controls.",
  seoTitle: "Intelligent Document Analysis — Extract Requirements from Any Doc | Auditee",
  seoDescription:
    "AI-powered document analysis: ingest BRDs, PRDs, RFPs, regulations and design docs (DOCX, PDF, Confluence, Markdown). Extract, classify, gap-detect and trace requirements automatically.",
  keywords: ["intelligent document analysis", "AI document extraction", "BRD parser", "RFP analysis", "regulation extraction"],
  primaryCta: { label: "Upload a document", href: "/app/sources" },
  secondaryCta: { label: "Book a walkthrough", href: "/contact" },
  capabilities: [
    { icon: ScanText, title: "Multi-format ingest", desc: "DOCX, PDF, HTML, Markdown, Confluence export, plain text, ReqIF — and OCR for scanned PDFs of legacy specs." },
    { icon: ListChecks, title: "AI requirement extraction", desc: "Auditee surfaces every implicit and explicit requirement, classifies BRD/PRD/FRD/NFR and tags severity, type and status." },
    { icon: AlertTriangle, title: "Gap & contradiction detection", desc: "Spots missing safety, security, accessibility and regulatory requirements — and flags contradictions across documents." },
    { icon: Search, title: "Ask Auditee — virtual BA", desc: "Conversational interface over your entire document corpus: 'Which docs reference patient consent?' returns linked, cited answers." },
    { icon: Network, title: "Traceability on import", desc: "Imported requirements keep their origin (file + page + section + URL) so every one is auditable end-to-end." },
    { icon: Database, title: "Source attribution + dedup", desc: "Re-import the same doc later — Auditee dedups by `(project, source, externalId)` and updates only what's changed." },
  ],
  pillars: [
    { title: "What it ingests", bullets: ["BRDs / PRDs / FRDs in DOCX or PDF", "Customer / vendor RFPs", "Regulations (HIPAA, GDPR, FDA, ISO, IEC)", "Contracts and SLAs", "Confluence pages, Markdown wikis"] },
    { title: "What it extracts", bullets: ["Functional and non-functional requirements", "Hazards, risks, threats", "Acceptance criteria", "Glossary terms and personas", "Cross-references to standards"] },
    { title: "What it produces", bullets: ["Living requirements graph", "Gap and contradiction report", "Linked compliance controls", "Searchable Q&A interface", "DOCX / PDF / ReqIF re-export"] },
  ],
  outcomes: [
    { metric: "10×", label: "faster doc-to-graph" },
    { metric: "100%", label: "imports keep lineage" },
    { metric: "23+", label: "regulations natively understood" },
    { metric: "0", label: "spreadsheet RTMs" },
  ],
  closingTitle: "Stop reading 400-page RFPs by hand",
  closingBody:
    "Auditee reads, classifies and gap-checks the documents your team would otherwise spend days on — and turns them into a living asset everyone can query.",
};

export default function IntelligentDocumentAnalysis() { return <MarketingPage data={DATA} />; }
