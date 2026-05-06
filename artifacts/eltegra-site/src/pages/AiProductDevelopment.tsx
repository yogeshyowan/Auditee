import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import {
  Sparkles,
  MessagesSquare,
  FileText,
  Network,
  TestTube2,
  Clock,
  AlertTriangle,
  Workflow,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Layers,
  Rocket,
  Users,
  GitBranch,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STAGES = [
  {
    icon: Lightbulb,
    stage: "Ideation",
    title: "Smart Interview",
    desc: "Auditee runs a structured discovery — you describe the product, it asks the right 5-10 follow-up questions covering users, scope, integrations, non-functionals and success criteria.",
    href: "/app/interview",
    cta: "Try Smart Interview",
  },
  {
    icon: Sparkles,
    stage: "Capture",
    title: "Generate from brief or code",
    desc: "One paragraph of context becomes a complete, classified, prioritised requirements set. Or point at an existing repo and Auditee reverse-engineers the implicit requirements.",
    href: "/app/requirements",
    cta: "Open Requirements",
  },
  {
    icon: AlertTriangle,
    stage: "Validate",
    title: "Requirements Gap Detection",
    desc: "AI scans your requirements against industry best practices and your selected compliance framework, flagging missing security, accessibility, observability and data-handling reqs before they become incidents.",
    href: "/app/gaps",
    cta: "Run Requirements Gap Detection",
    badge: "AI",
  },
  {
    icon: FileText,
    stage: "Spec",
    title: "BRDs, PRDs, FRDs in one click",
    desc: "Draft the entire document set from the same requirements graph. Canonical sections, validated traceability, signature-ready exports to DOCX, PDF and HTML.",
    href: "/app/reports",
    cta: "Open Reports",
  },
  {
    icon: TestTube2,
    stage: "Test",
    title: "Auto test cases",
    desc: "Every requirement gets a structured test suite — preconditions, steps, expected results — bidirectionally linked to its parent. Coverage gaps surface automatically.",
    href: "/app/requirements",
    cta: "Generate test cases",
  },
  {
    icon: Network,
    stage: "Trace",
    title: "Bidirectional traceability",
    desc: "Click any requirement and see the function that implements it, the test that verifies it, and the audit control it satisfies. Click any commit and find the requirement it ships.",
    href: "/app/traceability",
    cta: "Open Traceability Graph",
  },
];

const CAPABILITIES = [
  {
    icon: Brain,
    title: "Multi-source ingestion",
    desc: "Pull existing requirements from Jira, DOORS, DOORS Next, Jama, Polarion, codeBeamer, Helix RM, Visure, Azure DevOps, ReqIF — or upload BRDs, transcripts and meeting notes.",
  },
  {
    icon: GitBranch,
    title: "Code-aware drafting",
    desc: "Connect a GitHub repo and Auditee classifies every function as implementing / testing / violating each requirement, then writes the missing reqs the code already enforces.",
  },
  {
    icon: Clock,
    title: "Effort estimation",
    desc: "AI sizes every requirement in man-hours with complexity classification and risks — total project hours and weeks-at-1-FTE roll up in one click.",
  },
  {
    icon: Workflow,
    title: "Living knowledge graph",
    desc: "Specs, code, tests, audits and tickets in one semantic graph. Update one node, downstream impact propagates everywhere.",
  },
];

const OUTCOMES = [
  { metric: "10×", label: "faster from idea to PRD" },
  { metric: "60%", label: "less rework on missing requirements" },
  { metric: "100%", label: "of reqs have a verified test case" },
  { metric: "2 weeks", label: "to onboard a 5-year legacy estate" },
];

export default function AiProductDevelopmentPage() {
  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="AI Product Development — From Idea to Shipped Feature | Auditee"
        description="Auditee's AI Product Development takes you from idea to shipped feature with Smart Interview, BRD/PRD generation, traceability matrices, automated test cases, and compliance evidence — all in one knowledge graph."
        path="/ai-product-development"
        keywords={["AI product development", "AI PRD generation", "AI BRD", "AI product manager", "Smart Interview", "AI requirements"]}
      />
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-display font-bold text-primary" data-testid="link-home">
            Auditee
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/features" className="text-slate-600 hover:text-slate-900">Features</Link>
            <Link href="/pricing" className="text-slate-600 hover:text-slate-900">Pricing</Link>
            <Link href="/about" className="text-slate-600 hover:text-slate-900">About</Link>
            <Link href="/contact" className="text-slate-600 hover:text-slate-900">Contact</Link>
          </nav>
          <Link href="/app">
            <Button size="sm">Launch Platform</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-20 max-w-6xl mx-auto text-center">
        <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-800 gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> AI-native PDLC platform
        </Badge>
        <h1 className="mt-6 text-4xl md:text-6xl font-display font-bold text-slate-950 tracking-tight">
          AI Product Development
          <span className="block text-primary mt-2">from idea to shipped feature</span>
        </h1>
        <p className="mt-6 text-lg text-slate-600 max-w-3xl mx-auto">
          Auditee turns the Product Development Lifecycle into one continuous, AI-augmented
          flow. Capture intent in plain English, generate complete spec sets, validate against
          best practice, and trace every line of shipped code back to the requirement that
          asked for it.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <Link href="/app/interview">
            <Button size="lg" className="gap-2" data-testid="hero-cta-interview">
              Start a Smart Interview <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/contact">
            <Button size="lg" variant="outline">Book a demo</Button>
          </Link>
        </div>
      </section>

      {/* PDLC stages */}
      <section className="px-6 pb-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="outline" className="bg-slate-50">The full PDLC, in one platform</Badge>
          <h2 className="mt-4 text-3xl md:text-4xl font-display font-bold text-slate-950">
            Six stages. One graph. Zero handoff cost.
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {STAGES.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.title} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  {s.badge && (
                    <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700 text-xs">
                      {s.badge}
                    </Badge>
                  )}
                </div>
                <div className="mt-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{s.stage}</div>
                  <h3 className="mt-1 text-lg font-display font-bold text-slate-950">{s.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{s.desc}</p>
                </div>
                <Link href={s.href}>
                  <Button variant="ghost" size="sm" className="mt-4 -ml-2 gap-1.5 text-primary hover:text-primary/80">
                    {s.cta} <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Capabilities deeper */}
      <section className="bg-slate-50 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-950">
              The AI capabilities that power every stage
            </h2>
            <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
              Auditee is built around an LLM that understands your product context — your
              specs, your code, your audit trail — and writes, classifies and links across
              all of it.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {CAPABILITIES.map((c) => {
              const Icon = c.icon;
              return (
                <Card key={c.title} className="p-6 bg-white">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-slate-950 text-lg">{c.title}</h3>
                      <p className="mt-1.5 text-sm text-slate-600">{c.desc}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-950">
            What teams ship after switching
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {OUTCOMES.map((o) => (
            <Card key={o.label} className="p-6 text-center">
              <div className="text-4xl font-display font-bold text-primary">{o.metric}</div>
              <div className="mt-2 text-sm text-slate-600">{o.label}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* Who it's for */}
      <section className="bg-slate-50 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-950">
              Built for the whole product team
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 bg-white">
              <Users className="w-8 h-8 text-primary" />
              <h3 className="mt-4 font-display font-bold text-slate-950">Product Owners</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> Get to PRD in minutes, not weeks</li>
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> Smart Interview captures every detail you'd forget</li>
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> See effort estimates the moment scope changes</li>
              </ul>
            </Card>
            <Card className="p-6 bg-white">
              <Layers className="w-8 h-8 text-primary" />
              <h3 className="mt-4 font-display font-bold text-slate-950">Business Analysts</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> Stop hand-writing BRDs and FRDs</li>
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> Ingest from any RM tool — DOORS, Jama, Jira</li>
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> Validate completeness with one Requirements Gap Detection run</li>
              </ul>
            </Card>
            <Card className="p-6 bg-white">
              <Rocket className="w-8 h-8 text-primary" />
              <h3 className="mt-4 font-display font-bold text-slate-950">Engineering Leads</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> Trace every commit to the requirement it ships</li>
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> Code-aware impact analysis on every PR</li>
                <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> Auto-generated test suites, not just stubs</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <MessagesSquare className="w-10 h-10 mx-auto text-primary mb-4" />
          <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-950">
            See it on your own product
          </h2>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
            Bring a brief, a Jira board, or a 5-year-old codebase — we'll show you the
            requirements graph, the documents and the traceability you'd have today if you
            were already on Auditee.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Link href="/contact">
              <Button size="lg" className="gap-2">Book a demo <ArrowRight className="w-4 h-4" /></Button>
            </Link>
            <Link href="/features">
              <Button size="lg" variant="outline">See all features</Button>
            </Link>
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
