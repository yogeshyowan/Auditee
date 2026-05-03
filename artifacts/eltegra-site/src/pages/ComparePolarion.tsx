import { ComparisonPage, type ComparisonPageData } from "@/components/marketing/ComparisonPage";
import { GitCompare } from "lucide-react";

const DATA: ComparisonPageData = {
  path: "/compare/polarion",
  competitorName: "Siemens Polarion",
  competitorTagline: "Polarion ALM (Siemens Digital Industries)",
  EyebrowIcon: GitCompare,
  hero: {
    headline: "Auditee vs Siemens Polarion — AI-native PDLC vs heavyweight ALM",
    sub: "Polarion gives you a configurable ALM with strong ISO 26262 / IEC 62304 templates. Auditee gives you the same compliance posture as a managed AI-native platform — without the implementation services bill.",
  },
  seoTitle: "Auditee vs Siemens Polarion — AI-Native PDLC Alternative | Auditee",
  seoDescription:
    "Compare Auditee with Siemens Polarion across AI authoring, automotive (ASPICE / ISO 26262 / 21434) and medical (IEC 62304 / FDA) compliance, integrations and total cost.",
  keywords: ["Polarion alternative", "Auditee vs Polarion", "AI ALM", "ASPICE ALM", "IEC 62304 platform"],
  positioning:
    "Polarion is configurable to anything; that flexibility is also why deployments take 6–18 months. Auditee ships with 23+ compliance frameworks, AI-native authoring, gap detection and document generation built-in — most customers are productive on day one and audit-ready in week one.",
  whenAuditeeWins: [
    "AI requirement generation, gap detection and BRD generation",
    "Time to first audit-ready evidence pack measured in days",
    "Modern web-native UX without config-pack purchases",
    "23+ compliance frameworks mapped without consultants",
    "Bidirectional connectors to GitHub/GitLab/ADO/Jira",
    "Predictable monthly subscription cost",
  ],
  whenCompetitorWins: [
    "Already standardised on Siemens Xcelerator / Teamcenter ecosystem",
    "Need MS-Word round-trip authoring at scale",
    "Existing 200+ custom workflows from a multi-year Polarion implementation",
  ],
  sections: [
    {
      title: "Authoring & AI",
      rows: [
        { capability: "AI requirement generation from prose / brief", auditee: "yes", competitor: "no" },
        { capability: "Smart Interview discovery", auditee: "yes", competitor: "no" },
        { capability: "AI gap and conflict detection", auditee: "yes", competitor: "no" },
        { capability: "AI test case generation per requirement", auditee: "yes", competitor: "partial" },
        { capability: "Natural-language Q&A over the project", auditee: "yes", competitor: "no" },
      ],
    },
    {
      title: "Compliance & frameworks",
      rows: [
        { capability: "Pre-mapped frameworks (out of the box)", auditee: "23+", competitor: "ASPICE, ISO 26262, IEC 62304, FDA (config packs)" },
        { capability: "Recurring audit jobs", auditee: "yes", competitor: "partial" },
        { capability: "CAPA workflow", auditee: "yes", competitor: "yes" },
        { capability: "Custom Standards builder", auditee: "yes", competitor: "yes" },
      ],
    },
    {
      title: "Connectivity",
      rows: [
        { capability: "Native Polarion bidirectional connector", auditee: "yes", competitor: "—" },
        { capability: "DOORS / Jama / codeBeamer", auditee: "yes", competitor: "partial" },
        { capability: "GitHub / GitLab / ADO", auditee: "yes", competitor: "partial" },
        { capability: "Slack / Teams notifications", auditee: "yes", competitor: "yes" },
      ],
    },
    {
      title: "Deployment & cost",
      rows: [
        { capability: "Time to first value", auditee: "Hours", competitor: "Months" },
        { capability: "Cloud-native SaaS", auditee: "yes", competitor: "partial" },
        { capability: "Specialist implementation services", auditee: "no", competitor: "yes" },
        { capability: "Per-seat list (typical)", auditee: "₹1,999–7,999 / mo", competitor: "$1,500–3,500 / yr" },
      ],
    },
  ],
  migrationNote:
    "Auditee's Polarion connector pulls work items, attributes, traceability links and attachments. Most teams either mirror Polarion for read-only stakeholders or run new programs natively in Auditee while keeping legacy programs in Polarion until the next major release.",
};

export default function ComparePolarion() { return <ComparisonPage data={DATA} />; }
