import { Link } from "wouter";
import {
  ArrowRight, FileSearch, FileStack, GitBranch, Microscope, ScrollText,
  ShieldCheck, Sparkles, Bot, BookText, Workflow, Layers, Search,
  type LucideIcon,
} from "lucide-react";
import { SEO, breadcrumbsLd } from "@/components/SEO";
import { Navigation, SiteFooter } from "@/components/site/Chrome";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface UseCase {
  slug: string;
  Icon: LucideIcon;
  title: string;
  pains: string[];
  outcome: string;
  primaryRoles: string[];
  related: { label: string; href: string }[];
}

const USE_CASES: UseCase[] = [
  {
    slug: "draft-brd-from-a-prompt",
    Icon: Sparkles,
    title: "Draft a BRD from a one-line prompt",
    pains: [
      "First-draft writing eats 1–2 weeks per program",
      "Stakeholders see nothing until the PM is 'ready'",
      "Inconsistent voice and rigour across BRDs",
    ],
    outcome:
      "Smart Interview asks clarifying questions, then produces a BRD/PRD/FRD draft in minutes — fully traceable, with quality scores per requirement and a coverage map against your standards.",
    primaryRoles: ["CPO", "Business Analyst", "Product Manager"],
    related: [
      { label: "BRD generation", href: "/brd-generation" },
      { label: "AI requirements management", href: "/ai-requirements-management" },
    ],
  },
  {
    slug: "reverse-engineer-legacy-code",
    Icon: GitBranch,
    title: "Reverse-engineer legacy code into requirements",
    pains: [
      "Original architects retired; one PDF spec from 2003",
      "Cannot respond to RFIs without weeks of code archaeology",
      "Strangler-pattern modernization stalls at requirement-discovery",
    ],
    outcome:
      "Auditee indexes COBOL, Java, .NET, Python or Node services and derives the de-facto requirements set with bidirectional traceability to functions, classes and commits.",
    primaryRoles: ["CTO", "Principal Engineer", "Modernization Lead"],
    related: [
      { label: "Intelligent document analysis", href: "/intelligent-document-analysis" },
      { label: "Legacy COBOL modernization", href: "/blog/legacy-cobol-modernization-with-ai" },
    ],
  },
  {
    slug: "audit-evidence-on-autopilot",
    Icon: ShieldCheck,
    title: "Audit evidence on autopilot",
    pains: [
      "Manual screenshot collection every quarter",
      "Multiple overlapping frameworks (SOC 2 + ISO 27001 + PCI + RBI)",
      "Auditor findings repeat year after year",
    ],
    outcome:
      "Recurring audit jobs sweep your sources continuously and surface evidence gaps as they appear, not the week before the audit. CAPA workflow tracks findings to closure.",
    primaryRoles: ["GRC Lead", "QA & Compliance", "CISO"],
    related: [
      { label: "Automated compliance", href: "/automated-compliance" },
      { label: "Enterprise PDLC audit checklist", href: "/blog/enterprise-pdlc-audit-checklist" },
    ],
  },
  {
    slug: "missing-requirements-detection",
    Icon: FileSearch,
    title: "Find what's missing — before the auditor does",
    pains: [
      "Reviewers can't articulate why a spec 'feels thin'",
      "NFRs (security, accessibility, observability) get forgotten",
      "Edge cases discovered only in UAT or production",
    ],
    outcome:
      "Gap detection reasons over the entire requirement graph, surfaces missing NFRs against your standards, and proposes the missing requirements with rationale.",
    primaryRoles: ["Business Analyst", "QA Lead", "Architect"],
    related: [
      { label: "Missing requirements analysis", href: "/missing-requirements-analysis" },
    ],
  },
  {
    slug: "test-cases-from-requirements",
    Icon: FileStack,
    title: "Generate test cases that actually trace",
    pains: [
      "Test plans written separately from requirements",
      "Coverage gaps invisible until release",
      "ASPICE / IEC 62304 traceability built by hand at audit time",
    ],
    outcome:
      "One click generates positive, negative and edge-case test cases per requirement, in Gherkin or your team's format, with two-way traceability and push-back to Jira / Xray / ADO.",
    primaryRoles: ["QA Lead", "Test Engineer", "Compliance"],
    related: [
      { label: "Test case generation", href: "/test-case-generation" },
      { label: "Requirements-linked test cases", href: "/requirements-linked-test-cases" },
    ],
  },
  {
    slug: "regulated-program-acceleration",
    Icon: Microscope,
    title: "Accelerate regulated program approval",
    pains: [
      "DHF / ASPICE / DO-178 work products are ~40% of the engineering effort",
      "Standards interpretation varies across reviewers",
      "Re-certifications re-do work that could be reused",
    ],
    outcome:
      "Pre-mapped frameworks (IEC 62304, ISO 26262, DO-178C, ISO 13485, HIPAA) generate the right work products from your requirement graph; the trace is the audit report.",
    primaryRoles: ["Regulatory Affairs", "Safety Engineer", "Quality Manager"],
    related: [
      { label: "AI for healthcare", href: "/ai-for-healthcare" },
      { label: "AI for automotive", href: "/ai-for-automotive" },
      { label: "IEC 62304 guide", href: "/blog/iec-62304-medical-device-software-lifecycle-guide" },
    ],
  },
  {
    slug: "rm-tool-replacement",
    Icon: Workflow,
    title: "Replace (or coexist with) a legacy RM tool",
    pains: [
      "DOORS Classic / Polarion onboarding takes weeks per analyst",
      "Per-seat cost prices read-only stakeholders out",
      "Modern engineers refuse to use 1990s UX",
    ],
    outcome:
      "Mirror DOORS / Jama / Polarion bidirectionally over OSLC and ReqIF, then migrate program-by-program at natural lifecycle moments. Free read-only collaborators on Pro+.",
    primaryRoles: ["Engineering Director", "PMO", "Tools Lead"],
    related: [
      { label: "Compare: vs DOORS", href: "/compare/doors" },
      { label: "Compare: vs Jama", href: "/compare/jama" },
      { label: "Compare: vs Polarion", href: "/compare/polarion" },
    ],
  },
  {
    slug: "rfp-rfq-response",
    Icon: ScrollText,
    title: "Respond to RFPs and RFIs in days, not weeks",
    pains: [
      "Sales / pre-sales team rebuilds the same answers each RFP",
      "Different teams ship different versions of the truth",
      "Compliance answers cannot be backed by evidence on demand",
    ],
    outcome:
      "Natural-language Q&A over your living knowledge graph drafts responses with citations into your own controls, requirements and architecture decisions.",
    primaryRoles: ["Pre-sales", "Solution Architect", "Compliance"],
    related: [
      { label: "Intelligent document analysis", href: "/intelligent-document-analysis" },
    ],
  },
  {
    slug: "discovery-and-bd",
    Icon: BookText,
    title: "Discovery without slowing engineers down",
    pains: [
      "PMs interrupt engineers for context they could find in code or wiki",
      "New hires take months to ramp on a domain",
      "Decisions get re-litigated because the rationale is lost",
    ],
    outcome:
      "Auditee ingests Confluence, Drive, SharePoint, Jira, GitHub and the codebase into a graph; ask anything in natural language and get cited answers.",
    primaryRoles: ["Product Manager", "Tech Lead", "Engineering Manager"],
    related: [
      { label: "AI requirements management", href: "/ai-requirements-management" },
    ],
  },
  {
    slug: "agent-tooling",
    Icon: Bot,
    title: "Give your AI agents trustworthy context",
    pains: [
      "Agents hallucinate without grounded enterprise context",
      "Spreading PII / PHI to AI providers is a non-starter",
      "Different teams build the same retrieval layer twice",
    ],
    outcome:
      "Auditee is the system-of-record for product knowledge with role-aware retrieval, BYO-model routing and zero-data-retention defaults — your agents talk to it, not to raw documents.",
    primaryRoles: ["AI Platform", "CTO", "Security"],
    related: [
      { label: "Security & trust", href: "/security" },
      { label: "Integrations", href: "/integrations" },
    ],
  },
  {
    slug: "design-decision-traceability",
    Icon: Layers,
    title: "Link decisions to requirements to code to evidence",
    pains: [
      "Architecture decision records (ADRs) live separately from requirements",
      "Code review can't see why a constraint exists",
      "Evidence collection is detective work after release",
    ],
    outcome:
      "ADRs, requirements, code, tests and evidence live as nodes in one graph. PRs can be auto-rejected when they break a traced compliance constraint.",
    primaryRoles: ["Staff Engineer", "Tech Lead", "QA"],
    related: [
      { label: "Features", href: "/features" },
    ],
  },
  {
    slug: "search-the-org",
    Icon: Search,
    title: "Make the org searchable in plain English",
    pains: [
      "Knowledge silos across products, regions and acquisitions",
      "Confluence / SharePoint search is unusable",
      "New initiatives duplicate work because nobody knew it existed",
    ],
    outcome:
      "Auditee Q&A spans every connected source with role-aware permissions and inline citations, so any employee can ask 'has anyone built X for Y region?' and get a real answer.",
    primaryRoles: ["Knowledge Manager", "PMO", "All employees (Pro+)"],
    related: [
      { label: "Integrations", href: "/integrations" },
    ],
  },
];

export default function UseCases() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Use Cases — What Teams Build with Auditee"
        description="12 concrete jobs Auditee does for product, engineering, QA, compliance and AI platform teams — from drafting BRDs to RM-tool replacement, audit autopilot, agent grounding and org-wide search."
        path="/use-cases"
        keywords={["Auditee use cases", "PDLC use cases", "AI requirements use cases", "BRD generation", "RM tool replacement", "audit automation"]}
        jsonLd={breadcrumbsLd([{ name: "Home", path: "/" }, { name: "Use Cases", path: "/use-cases" }])}
      />
      <Navigation />
      <main className="pt-28 pb-24">
        <header className="max-w-3xl mx-auto px-6 text-center">
          <Sparkles className="w-10 h-10 mx-auto text-primary mb-4" />
          <h1 className="font-display text-4xl md:text-5xl font-bold text-slate-950 tracking-tight">Use cases</h1>
          <p className="mt-4 text-lg text-slate-600">
            12 concrete jobs Auditee does for product, engineering, QA, compliance and AI-platform teams.
            Pick the closest one and we'll show you exactly how it runs in your environment.
          </p>
          <div className="mt-6">
            <Button asChild size="lg" className="gap-2">
              <Link href="/contact">Book a tailored demo <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-6 mt-16 grid md:grid-cols-2 gap-5">
          {USE_CASES.map((uc) => {
            const Icon = uc.Icon;
            return (
              <Card key={uc.slug} className="p-6 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="font-display text-lg font-bold text-slate-950">{uc.title}</h2>
                </div>

                <div className="text-sm">
                  <h3 className="font-semibold text-slate-900 mb-1">Pain</h3>
                  <ul className="space-y-1 text-slate-700 mb-3">
                    {uc.pains.map((p) => <li key={p} className="flex gap-2"><span className="text-slate-400">•</span><span>{p}</span></li>)}
                  </ul>

                  <h3 className="font-semibold text-slate-900 mb-1">Outcome</h3>
                  <p className="text-slate-700 mb-4">{uc.outcome}</p>

                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {uc.primaryRoles.map((r) => <Badge key={r} variant="outline" className="text-xs">{r}</Badge>)}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-auto">
                    {uc.related.map((r) => (
                      <Link
                        key={r.href}
                        href={r.href}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        {r.label} →
                      </Link>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
