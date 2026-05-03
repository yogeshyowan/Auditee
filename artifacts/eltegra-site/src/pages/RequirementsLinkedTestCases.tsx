import { MarketingPage } from "@/components/marketing/MarketingPage";
import type { MarketingPageData } from "@/components/marketing/MarketingPage";
import { FlaskConical, Workflow, Bug, Network, ListChecks, GitBranch, AlertTriangle, Download, Bot, ShieldCheck } from "lucide-react";

const DATA: MarketingPageData = {
  path: "/requirements-linked-test-cases",
  eyebrow: "Requirements-Linked Test Cases",
  EyebrowIcon: FlaskConical,
  title: "Every requirement,",
  highlight: "verified by a test case it owns",
  description:
    "Auditee auto-generates positive, negative, boundary and edge-case tests for every requirement — linked back to the requirement, the code that implements it and the audit control it satisfies. Export to JUnit, pytest, NUnit, Postman or your test-management tool.",
  seoTitle: "Requirements-Linked Test Cases — AI Test Generation | Auditee",
  seoDescription:
    "AI generates structured test cases (positive, negative, boundary, edge) for every requirement, linked end-to-end to code, controls and defects. Export to JUnit, pytest, NUnit, Postman, qTest, Xray.",
  keywords: ["requirements linked test cases", "AI test generation", "test case from requirement", "test traceability matrix"],
  primaryCta: { label: "Generate test cases", href: "/app/tests" },
  secondaryCta: { label: "Book a walkthrough", href: "/contact" },
  capabilities: [
    { icon: Bot, title: "AI test-case generation", desc: "Each requirement automatically generates structured tests — positive flow, negative paths, boundaries, edge cases, security and accessibility." },
    { icon: Network, title: "Bidirectional links", desc: "Every test case links to its requirement and its implementing code. Click through in any direction." },
    { icon: Bug, title: "Defect-to-requirement loop", desc: "Bugs get linked to the failing test, the requirement and the code that broke them — root-cause analysis without archaeology." },
    { icon: ListChecks, title: "Coverage gap analysis", desc: "Auditee surfaces requirements with no tests, tests with no requirements and stale tests on changed reqs." },
    { icon: Download, title: "Export to your stack", desc: "JUnit XML, pytest, NUnit, Postman, qTest, Xray, TestRail — adopt without migrating." },
    { icon: ShieldCheck, title: "Compliance evidence", desc: "Test results are first-class evidence for IEC 62304, ISO 26262, FDA Part 11 and SOC 2 — automatically attached to controls." },
  ],
  pillars: [
    { title: "Test types generated", bullets: ["Positive / happy path", "Negative / error path", "Boundary value", "Equivalence partitioning", "Security & accessibility", "Performance & load harness"] },
    { title: "Export targets", bullets: ["JUnit XML", "pytest", "NUnit", "Postman / Newman", "qTest, Xray, TestRail", "CSV / XLSX / JSON"] },
    { title: "Lifecycle integrations", bullets: ["GitHub / GitLab / Azure DevOps", "Jira test management", "Slack notifications", "Recurring audit jobs"] },
  ],
  outcomes: [
    { metric: "10×", label: "faster test creation" },
    { metric: "100%", label: "requirements with tests" },
    { metric: "6+", label: "test-tool exports" },
    { metric: "0", label: "manual RTM in Excel" },
  ],
  closingTitle: "Coverage you can prove, not coverage you hope you have",
  closingBody:
    "Auditee makes 100% requirement-to-test coverage the default state — not a quarterly project. The same graph powers your audit evidence pack.",
};

export default function RequirementsLinkedTestCases() { return <MarketingPage data={DATA} />; }
