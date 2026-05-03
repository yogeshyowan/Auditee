import { ComparisonPage, type ComparisonPageData } from "@/components/marketing/ComparisonPage";
import { GitCompare } from "lucide-react";

const DATA: ComparisonPageData = {
  path: "/compare/jama",
  competitorName: "Jama Connect",
  competitorTagline: "Modern RM with strong UX",
  EyebrowIcon: GitCompare,
  hero: {
    headline: "Auditee vs Jama Connect — AI-native vs RM-modernized",
    sub: "Jama Connect cleaned up the RM-tool UX problem. Auditee tackles the deeper one — making requirements creation, gap detection and document production an AI-driven workflow rather than a structured-data-entry exercise.",
  },
  seoTitle: "Auditee vs Jama Connect — AI-Native Requirements Alternative | Auditee",
  seoDescription:
    "Detailed comparison of Auditee vs Jama Connect across AI authoring, traceability, integrations, compliance frameworks and total cost. Native Jama connector for migration or coexistence.",
  keywords: ["Jama Connect alternative", "Auditee vs Jama", "AI requirements management", "Jama migration"],
  positioning:
    "Jama is what DOORS users move to when they want a modern UX. Auditee is what Jama users move to when they want AI-native authoring, gap detection and document generation — without losing Jama's connector ecosystem.",
  whenAuditeeWins: [
    "Need to draft 60+ requirements per hour, not per day",
    "AI gap detection and quality scoring out of the box",
    "One-click BRD/PRD/FRD generation in DOCX/PDF/Markdown",
    "Legacy code reverse-engineering into requirements",
    "23+ compliance frameworks mapped natively",
    "Lower per-seat pricing, especially for read-only stakeholders",
  ],
  whenCompetitorWins: [
    "Long-running Jama Test Center investment with hundreds of test plans",
    "Proven Live Trace dashboards customers won't give up",
    "Existing Jama Architect templates audited by your QMS",
  ],
  sections: [
    {
      title: "Authoring & AI",
      rows: [
        { capability: "AI requirement generation from prose / brief", auditee: "yes", competitor: "partial", note: "AI Assist add-on" },
        { capability: "Smart Interview discovery", auditee: "yes", competitor: "no" },
        { capability: "AI gap and conflict detection", auditee: "yes", competitor: "partial" },
        { capability: "AI test case generation per requirement", auditee: "yes", competitor: "partial", note: "Test Center addon" },
        { capability: "Natural-language Q&A over the project", auditee: "yes", competitor: "no" },
      ],
    },
    {
      title: "Traceability & coverage",
      rows: [
        { capability: "Bidirectional traceability to source code", auditee: "yes", competitor: "partial" },
        { capability: "Live coverage explorer", auditee: "yes", competitor: "yes" },
        { capability: "Source-attributed import preserved", auditee: "yes", competitor: "yes" },
      ],
    },
    {
      title: "Connectivity",
      rows: [
        { capability: "Native Jama bidirectional connector", auditee: "yes", competitor: "—" },
        { capability: "DOORS / Polarion / codeBeamer in/out", auditee: "yes", competitor: "partial" },
        { capability: "GitHub / GitLab / ADO Repos", auditee: "yes", competitor: "partial" },
        { capability: "Slack / Teams notifications", auditee: "yes", competitor: "yes" },
      ],
    },
    {
      title: "Compliance",
      rows: [
        { capability: "Pre-mapped frameworks", auditee: "23+", competitor: "ISO 26262, ASPICE, IEC 62304 (templates)" },
        { capability: "Recurring audit jobs", auditee: "yes", competitor: "no" },
        { capability: "CAPA workflow", auditee: "yes", competitor: "partial" },
        { capability: "Custom Standards builder", auditee: "yes", competitor: "yes" },
      ],
    },
    {
      title: "Cost",
      rows: [
        { capability: "Read-only collaborator seats", auditee: "Free / unlimited on Pro+", competitor: "Paid" },
        { capability: "Editor seat (typical list)", auditee: "₹1,999–7,999 / mo", competitor: "$1,000–2,500 / yr" },
        { capability: "AI features included", auditee: "yes", competitor: "Add-on" },
      ],
    },
  ],
  migrationNote:
    "Auditee's native Jama connector pulls items, attributes, relationships and attachments. You can mirror Jama for read-only or fully migrate per project. Most teams keep Jama for one major program while running new programs in Auditee from day one.",
};

export default function CompareJama() { return <ComparisonPage data={DATA} />; }
