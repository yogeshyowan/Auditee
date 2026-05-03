import { ComparisonPage, type ComparisonPageData } from "@/components/marketing/ComparisonPage";
import { GitCompare } from "lucide-react";

const DATA: ComparisonPageData = {
  path: "/compare/doors",
  competitorName: "IBM DOORS",
  competitorTagline: "Industrial-strength legacy RM tool",
  EyebrowIcon: GitCompare,
  hero: {
    headline: "Auditee vs IBM DOORS — connect first, replace at your own pace",
    sub: "DOORS is the most battle-tested requirements tool in regulated industry. It's also a 1990s data model that fights modern engineering velocity. Auditee gives you DOORS rigour with AI-native speed — and connects to your existing DOORS install on day one.",
  },
  seoTitle: "Auditee vs IBM DOORS — AI-Native Alternative & Connector | Auditee",
  seoDescription:
    "Detailed comparison of Auditee and IBM DOORS / DOORS Next: AI requirement generation, traceability, OSLC connector, ReqIF, ASPICE / IEC 62304 / FDA support, total cost of ownership and migration approach.",
  keywords: ["IBM DOORS alternative", "DOORS Next alternative", "Auditee vs DOORS", "OSLC requirements", "ReqIF migration"],
  positioning:
    "We don't ask you to rip and replace DOORS. Auditee connects via OSLC-RM (DOORS Next) or ReqIF (DOORS Classic), pulls your modules into a living knowledge graph, AI-enriches them with classification, gap detection and traceability, and lets you decide module-by-module what to migrate, what to mirror and what to leave in DOORS.",
  whenAuditeeWins: [
    "AI requirement generation and gap detection (no native equivalent)",
    "Document generation in DOCX/PDF/Markdown with one click",
    "Onboarding measured in days, not months",
    "Modern web UX accessible to PMs, BAs and clinical/business SMEs without training",
    "Per-seat cost typically 60–80% lower",
    "Connects to GitHub/GitLab/Jira/ADO without a custom integration project",
    "23+ compliance frameworks mapped out of the box",
  ],
  whenCompetitorWins: [
    "30+ years of DXL scripting investment you cannot abandon",
    "Specific defence / aerospace contracts that mandate DOORS by name",
    "Air-gapped on-premise deployments with no internet egress at all",
    "Existing certified validation packages tied to DOORS that would need re-certification",
  ],
  sections: [
    {
      title: "Authoring & AI",
      rows: [
        { capability: "AI requirement generation from prose / brief", auditee: "yes", competitor: "no" },
        { capability: "Smart Interview discovery (AI follow-ups)", auditee: "yes", competitor: "no" },
        { capability: "AI gap, conflict and duplicate detection", auditee: "yes", competitor: "no" },
        { capability: "AI test case generation per requirement", auditee: "yes", competitor: "no" },
        { capability: "Natural-language Q&A over your req graph", auditee: "yes", competitor: "no" },
        { capability: "Per-requirement quality scoring", auditee: "yes", competitor: "partial", note: "Manual rule packs only" },
      ],
    },
    {
      title: "Traceability & data model",
      rows: [
        { capability: "Bidirectional traceability to source code", auditee: "yes", competitor: "partial", note: "Via custom DXL/ALM bridge" },
        { capability: "Bidirectional traceability to test cases", auditee: "yes", competitor: "yes" },
        { capability: "Traceability to compliance controls", auditee: "yes", competitor: "partial", note: "Custom attributes only" },
        { capability: "Source-attributed import (system + external ID + URL)", auditee: "yes", competitor: "partial" },
        { capability: "Append-only audit log out of the box", auditee: "yes", competitor: "yes" },
      ],
    },
    {
      title: "Connectivity & migration",
      rows: [
        { capability: "Native DOORS Classic ReqIF import", auditee: "yes", competitor: "yes" },
        { capability: "Native DOORS Next OSLC connector", auditee: "yes", competitor: "yes" },
        { capability: "Native Jira / Azure DevOps two-way sync", auditee: "yes", competitor: "partial" },
        { capability: "Native GitHub / GitLab integration", auditee: "yes", competitor: "no" },
        { capability: "Custom REST connector framework", auditee: "yes", competitor: "partial" },
      ],
    },
    {
      title: "Compliance",
      rows: [
        { capability: "Pre-mapped frameworks", auditee: "23+ (SOC 2, ISO 27001, HIPAA, FDA, IEC 62304, ASPICE, ISO 26262, ISO 21434, PCI DSS, NIST 800-53…)", competitor: "Custom rule packs (sold separately)" },
        { capability: "Recurring audit jobs", auditee: "yes", competitor: "no" },
        { capability: "CAPA workflow built-in", auditee: "yes", competitor: "no" },
        { capability: "Custom Standards builder", auditee: "yes", competitor: "partial" },
      ],
    },
    {
      title: "Deployment & cost",
      rows: [
        { capability: "Cloud-native SaaS", auditee: "yes", competitor: "partial", note: "Mostly on-prem; cloud is bolted-on" },
        { capability: "Time to first value", auditee: "Hours", competitor: "Weeks – months" },
        { capability: "Per-seat list price (typical)", auditee: "₹1,999–7,999 / mo", competitor: "$1,500–4,000 / yr" },
        { capability: "Specialist consultants required", auditee: "no", competitor: "yes" },
      ],
    },
  ],
  migrationNote:
    "Most of our customers run Auditee alongside DOORS for 6–12 months. We pull modules over OSLC/ReqIF, build the AI-enriched graph in parallel, and you migrate workstreams as natural lifecycle moments arrive (new product, major release, audit cycle).",
};

export default function CompareDoors() { return <ComparisonPage data={DATA} />; }
