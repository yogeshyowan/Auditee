import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import {
  ListChecks,
  Sparkles,
  MessagesSquare,
  Network,
  FileText,
  Database,
  ArrowRight,
  CheckCircle2,
  GitBranch,
  Plug,
  History,
  ClipboardList,
  Tag,
  Filter,
  Code2,
  BookOpen,
  Building2,
  Box,
  Boxes,
  Bug,
  Workflow,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const RM_CONNECTORS = [
  { icon: BookOpen, name: "IBM DOORS Next", desc: "OSLC-RM connector for DOORS Next Generation (DNG 7.x)" },
  { icon: BookOpen, name: "IBM DOORS Classic", desc: "Upload your ReqIF export from DOORS 9.x" },
  { icon: ListChecks, name: "Jama Connect", desc: "REST API ingestion of Jama project items" },
  { icon: Box, name: "Polarion ALM", desc: "Siemens Polarion REST — pulls work items" },
  { icon: ListChecks, name: "codeBeamer", desc: "PTC/Intland codeBeamer REST — pulls tracker items" },
  { icon: Building2, name: "Helix RM", desc: "Perforce Helix ALM REST — pulls requirements" },
  { icon: ListChecks, name: "Visure Requirements", desc: "REST integration with Visure ALM" },
  { icon: Workflow, name: "Azure DevOps", desc: "Pull work items via WIQL queries" },
  { icon: Boxes, name: "Atlassian Jira", desc: "Pull requirements / stories / epics from any Jira project" },
  { icon: FileText, name: "ReqIF (any RM tool)", desc: "Generic OMG-standard XML import" },
];

const CAPABILITIES = [
  {
    icon: Sparkles,
    title: "AI-driven generation",
    desc: "From a brief, source code, or uploaded BRDs — Auditee drafts complete, classified, prioritised requirements in seconds. Auto-tagged BRD/PRD/FRD/NFR with framework links.",
    href: "/app/requirements",
    cta: "Open Requirements",
  },
  {
    icon: MessagesSquare,
    title: "Smart Interview discovery",
    desc: "Structured AI interview turns a one-paragraph idea into a full requirements set — the AI asks the right 5-10 follow-ups, you answer in plain English.",
    href: "/app/interview",
    cta: "Try Smart Interview",
  },
  {
    icon: Plug,
    title: "10 RM tool connectors",
    desc: "Pull existing requirements from DOORS, DOORS Next, Jama, Polarion, codeBeamer, Helix RM, Visure, Azure DevOps, Jira — or import any tool's ReqIF export.",
    href: "/app/sources",
    cta: "Connect a source",
  },
  {
    icon: Tag,
    title: "Source attribution + de-dup",
    desc: "Every imported req keeps its origin (system + external ID + URL). Auditee auto-deduplicates by `(project, source, externalId)` so re-syncs never multiply your data.",
    href: "/app/requirements",
    cta: "See requirements",
  },
  {
    icon: Filter,
    title: "Source-aware filtering",
    desc: "Filter the requirements list by source system — manual, DOORS, Jama, Jira — to compare or audit each origin separately.",
    href: "/app/requirements",
    cta: "Open filters",
  },
  {
    icon: ClipboardList,
    title: "Status workflow + comments",
    desc: "Draft → Review → Approved status flow with per-requirement comment threads. Discuss in-context, not in Slack.",
    href: "/app/requirements",
    cta: "View workflow",
  },
  {
    icon: Network,
    title: "Bidirectional traceability",
    desc: "Every requirement is linked to the code that ships it, the test that verifies it, and the audit control it satisfies — and back the other way.",
    href: "/app/traceability",
    cta: "Open Graph",
  },
  {
    icon: FileText,
    title: "BRD / PRD / FRD generation",
    desc: "One-click generation of full Business / Product / Functional requirement documents from your live req graph. DOCX/PDF/HTML export.",
    href: "/app/reports",
    cta: "Generate document",
  },
  {
    icon: Code2,
    title: "Generate from code",
    desc: "Point Auditee at a GitHub repo and it reverse-engineers the implicit requirements your codebase already enforces.",
    href: "/app/requirements",
    cta: "Generate from code",
  },
];

const STEPS = [
  { step: "1", title: "Connect or create a project", desc: "Plug in your existing RM tool, upload BRDs, or start from a brief — Auditee builds the requirements knowledge graph either way." },
  { step: "2", title: "Generate, ingest, or interview", desc: "Three on-ramps: AI generation from a brief, ingestion from your existing tool, or a Smart Interview discovery flow." },
  { step: "3", title: "Validate with Requirements Gap Detection", desc: "AI scans for missing, duplicate, conflicting and weak requirements — categorised and severity-ranked." },
  { step: "4", title: "Generate downstream artefacts", desc: "BRDs, PRDs, FRDs, test cases, compliance audits and effort estimates — all from the same requirements graph." },
  { step: "5", title: "Trace, ship, audit", desc: "Bidirectional traceability links every requirement to code, tests and controls. Ship with confidence; audit without panic." },
];

const OUTCOMES = [
  { metric: "10×", label: "faster requirements drafting" },
  { metric: "10", label: "RM tools natively supported" },
  { metric: "0", label: "spreadsheets to maintain" },
  { metric: "100%", label: "requirements with traceability" },
];

export default function AiRequirementsManagementPage() {
  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="AI Requirements Management — Unify DOORS, Jama, Polarion, Jira | Auditee"
        description="Auditee's AI Requirements Management unifies IBM DOORS, DOORS Next, Jama, Polarion, codeBeamer, Helix RM, Visure, Azure DevOps, and Jira into one knowledge graph with AI generation, gap detection, and end-to-end traceability."
        path="/ai-requirements-management"
        keywords={["AI requirements management", "DOORS alternative", "Jama alternative", "Polarion alternative", "requirements traceability", "OSLC", "ReqIF"]}
      />
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-display font-bold text-primary">Auditee</Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/features" className="text-slate-600 hover:text-slate-900">Features</Link>
            <Link href="/pricing" className="text-slate-600 hover:text-slate-900">Pricing</Link>
            <Link href="/about" className="text-slate-600 hover:text-slate-900">About</Link>
            <Link href="/contact" className="text-slate-600 hover:text-slate-900">Contact</Link>
          </nav>
          <Link href="/app"><Button size="sm">Launch Platform</Button></Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-20 max-w-6xl mx-auto text-center">
        <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-800 gap-1.5">
          <ListChecks className="w-3.5 h-3.5" /> AI Requirements Management
        </Badge>
        <h1 className="mt-6 text-4xl md:text-6xl font-display font-bold text-slate-950 tracking-tight">
          AI-native requirements,
          <span className="block text-primary mt-2">from any tool, fully traceable</span>
        </h1>
        <p className="mt-6 text-lg text-slate-600 max-w-3xl mx-auto">
          Stop juggling DOORS, Jira and Confluence. Auditee unifies every requirement —
          AI-generated, interview-captured, or imported from your existing RM tool — into
          one knowledge graph with bidirectional traceability to code, tests and audit
          controls.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <Link href="/app/requirements">
            <Button size="lg" className="gap-2" data-testid="hero-cta-rm">
              Open Requirements <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/contact">
            <Button size="lg" variant="outline">Book a demo</Button>
          </Link>
        </div>
      </section>

      {/* Capabilities grid */}
      <section className="px-6 pb-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="outline" className="bg-slate-50">Nine capabilities, one platform</Badge>
          <h2 className="mt-4 text-3xl md:text-4xl font-display font-bold text-slate-950">
            Everything your RM workflow needs
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CAPABILITIES.map((c) => {
            const Icon = c.icon;
            return (
              <Card key={c.title} className="p-6 hover:shadow-md transition-shadow">
                <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="mt-4 text-lg font-display font-bold text-slate-950">{c.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{c.desc}</p>
                <Link href={c.href}>
                  <Button variant="ghost" size="sm" className="mt-4 -ml-2 gap-1.5 text-primary hover:text-primary/80">
                    {c.cta} <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </Card>
            );
          })}
        </div>
      </section>

      {/* RM connectors */}
      <section className="bg-slate-50 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="bg-white">RM Connectors</Badge>
            <h2 className="mt-4 text-3xl md:text-4xl font-display font-bold text-slate-950">
              Bring your existing requirements
            </h2>
            <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
              Native connectors to every major RM tool — plus a generic ReqIF importer for
              everything else. Auto-dedup keeps re-syncs clean.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {RM_CONNECTORS.map((tool) => {
              const Icon = tool.icon;
              return (
                <Card key={tool.name} className="p-5 bg-white">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-display font-bold text-slate-950">{tool.name}</div>
                      <div className="mt-1 text-xs text-slate-500">{tool.desc}</div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-950">From zero to traceable in 5 steps</h2>
        </div>
        <div className="space-y-4">
          {STEPS.map((s) => (
            <Card key={s.step} className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0">
                  {s.step}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-display font-bold text-slate-950">{s.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{s.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Outcomes */}
      <section className="bg-slate-50 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-950">What teams ship after switching</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {OUTCOMES.map((o) => (
              <Card key={o.label} className="p-6 text-center bg-white">
                <div className="text-4xl font-display font-bold text-primary">{o.metric}</div>
                <div className="mt-2 text-sm text-slate-600">{o.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <Zap className="w-10 h-10 mx-auto text-primary mb-4" />
          <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-950">
            Bring DOORS, Jama or Jira — see them unified in one demo
          </h2>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
            We'll connect to your existing RM tool live and show you the AI-generated
            traceability, gap analysis and document set in under 30 minutes.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Link href="/contact"><Button size="lg" className="gap-2">Book a demo <ArrowRight className="w-4 h-4" /></Button></Link>
            <Link href="/app/sources"><Button size="lg" variant="outline">Connect a source</Button></Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div>© {new Date().getFullYear()} Auditee. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <Link href="/features" className="hover:text-slate-900">Features</Link>
            <Link href="/pricing" className="hover:text-slate-900">Pricing</Link>
            <Link href="/about" className="hover:text-slate-900">About</Link>
            <Link href="/contact" className="hover:text-slate-900">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
