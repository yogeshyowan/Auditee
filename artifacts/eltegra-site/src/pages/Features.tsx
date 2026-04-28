import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import {
  Sparkles,
  ShieldCheck,
  Network,
  FileText,
  TestTube2,
  Database,
  AlertTriangle,
  Workflow,
  Bug,
  BookOpen,
  ListChecks,
  GitBranch,
  Brain,
  ArrowRight,
  CheckCircle2,
  Calculator,
  MessagesSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Feature = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  blurb: string;
  bullets: string[];
  href: string;
  badge?: string;
};

const FEATURES: Feature[] = [
  {
    icon: Sparkles,
    title: "AI-Driven Requirements Generation",
    blurb:
      "Turn a one-paragraph brief — or an uploaded BRD — into a complete, traceable requirements set in seconds.",
    bullets: [
      "Generate from a brief, source code, or uploaded specs",
      "Auto-classifies BRD / PRD / FRD / NFR with priority + tags",
      "Links to compliance frameworks where relevant",
    ],
    href: "/app/requirements",
  },
  {
    icon: AlertTriangle,
    title: "Automated Gap Detection",
    blurb:
      "AI analyses your project against industry best practices and flags missing requirements before they hit production.",
    bullets: [
      "Surfaces missing security, compliance and accessibility reqs",
      "Detects duplicates and contradictory requirements",
      "One click to promote a finding into a real, tracked requirement",
    ],
    href: "/app/gaps",
    badge: "New",
  },
  {
    icon: FileText,
    title: "Auto-Generate BRDs, PRDs, FRDs",
    blurb:
      "Draft the full document set from your requirements graph — with validation, traceability and DOCX/PDF/HTML export.",
    bullets: [
      "BRD, PRD, FRD and Test Cases — all from one click",
      "Sections backed by canonical industry templates",
      "Exports to DOCX, PDF and HTML — ready to share",
    ],
    href: "/app/reports",
  },
  {
    icon: TestTube2,
    title: "Requirements-Linked Test Cases",
    blurb:
      "Generate complete test suites with preconditions, steps and expected results — every case linked back to its requirement.",
    bullets: [
      "Preconditions / steps / expected-results format",
      "Bidirectional traceability requirement ↔ test case",
      "Coverage gaps surfaced automatically",
    ],
    href: "/app/reports",
  },
  {
    icon: Network,
    title: "Bidirectional Traceability",
    blurb:
      "See exactly which line of code implements each requirement, and which requirements would break if you change a function.",
    bullets: [
      'Query your codebase: "Where is payment processing implemented?"',
      "Live impact analysis when requirements change",
      "Confidence-scored matches with rationale",
    ],
    href: "/app/traceability",
  },
  {
    icon: ShieldCheck,
    title: "Continuous Compliance Scoring",
    blurb:
      "Always-fresh evidence across SOC 2, HIPAA, ISO 27001, FDA and 20+ more frameworks. Audit-ready in days, not months.",
    bullets: [
      "23+ frameworks with full control catalogues",
      "Per-control coverage scoring with rationale",
      "Recurring audits + CAPA workflow built-in",
    ],
    href: "/app/compliance",
  },
  {
    icon: Database,
    title: "Legacy Code Modernization",
    blurb:
      "Reverse-engineer legacy estates — Angular, C#, C++, COBOL, SQL — into current, modernization-ready requirements.",
    bullets: [
      "Extracts requirements from existing source code",
      "Maps dependencies across the legacy estate",
      "Plans the modernization path with risk scoring",
    ],
    href: "/app/legacy",
  },
  {
    icon: Bug,
    title: "Defect Tracking + RCA",
    blurb:
      "Capture defects, link them back to the requirement they violate, and AI-summarise root cause for the post-mortem.",
    bullets: [
      "Per-project defect register with severity + status",
      "Auto-links to the broken requirement and CAPA action",
      "Trends and SLA tracking across projects",
    ],
    href: "/app/defects",
  },
  {
    icon: Workflow,
    title: "PDLC Pipeline + Workflows",
    blurb:
      "Track every product through Ideation → Design → Development → Testing → Launch → Governance with stage gates.",
    bullets: [
      "Visual pipeline across all six PDLC stages",
      "Per-stage gates with reviewer assignment",
      "Recurring audits trigger as products move",
    ],
    href: "/app/pdlc",
  },
  {
    icon: GitBranch,
    title: "Multi-Source Ingestion",
    blurb:
      "Connect everything: 10+ requirements management tools, GitHub, Jira, document uploads, and meeting transcripts.",
    bullets: [
      "RM tools: DOORS, DOORS Next, Jama, Polarion, codeBeamer, Helix RM, Visure",
      "Azure DevOps Boards, Jira, GitHub repos",
      "Documents up to 2,000 pages + ReqIF + meeting transcripts",
    ],
    href: "/app/sources",
  },
  {
    icon: Brain,
    title: "Virtual Business Analyst",
    blurb:
      "A 24/7 AI product expert that knows every requirement, decision and code change across your portfolio.",
    bullets: [
      "Conversational Q&A across all project context",
      "Persistent history per project",
      "Surfaces decisions when team members leave",
    ],
    href: "/app/ask",
  },
  {
    icon: BookOpen,
    title: "Recurring Audits",
    blurb:
      "Schedule audits to re-run on cadence — daily, weekly, quarterly — and route findings into CAPA automatically.",
    bullets: [
      "Cron-style scheduling per framework + project",
      "Auto-generates CAPA actions on new findings",
      "Drift alerts when compliance scores degrade",
    ],
    href: "/app/recurring-audits",
  },
];

const CAPABILITIES = [
  {
    title: "Product Management in the Age of Agentic AI",
    body:
      "Capture product intent, generate structured artifacts, and maintain a living knowledge graph that keeps teams aligned.",
    metric: "75%",
    metricLabel: "faster requirements gathering",
  },
  {
    title: "Modernizing Your Enterprise",
    body:
      "Extract semantic business logic, architecture and dependencies from legacy systems — modernize 50% faster with 80% less risk.",
    metric: "50%",
    metricLabel: "faster modernization",
  },
  {
    title: "DeRisk Compliance Autonomously",
    body:
      "Map regulations to code, generate audit-ready evidence, and monitor compliance drift in real time across 23+ frameworks.",
    metric: "80%",
    metricLabel: "less audit prep time",
  },
  {
    title: "One Source of Truth",
    body:
      "A unified, semantic, continuously-updated knowledge graph that gives both humans and AI agents one authoritative source.",
    metric: "70%",
    metricLabel: "faster onboarding & decisions",
  },
];

const ROLES = [
  {
    role: "Product Owner",
    metrics: ["40% faster time-to-market", "35% improvement in prioritisation", "20% boost in portfolio ROI"],
    track: "Roadmap adherence & feature velocity",
  },
  {
    role: "Business Analyst",
    metrics: ["75% faster requirements gathering", "90% increase in requirements reuse", "70% less audit prep"],
    track: "Specification quality & traceability compliance",
  },
  {
    role: "QA & Compliance",
    metrics: ["30% reduction in test creation cost", "25% lower technical debt", "30% fewer support tickets"],
    track: "Coverage, defect leakage & compliance score",
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-[100dvh] bg-white">
      <SEO
        title="Features — AI Requirements, Compliance, Traceability & Test Generation | Auditee"
        description="Explore Auditee's complete feature set: AI requirements generation, missing requirements detection, automated test case generation, end-to-end traceability, knowledge graph, and 23+ compliance frameworks (HIPAA, IEC 62304, ASPICE, ISO 26262, SOC 2, ISO 27001, FDA QMSR)."
        path="/features"
        keywords={["AI requirements features", "compliance automation features", "traceability matrix", "AI test generation", "knowledge graph", "audit automation"]}
      />
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl tracking-tight text-slate-950">
            <span className="text-primary">Auditee</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/features" className="text-slate-900 font-medium">Features</Link>
            <Link href="/pricing" className="text-slate-600 hover:text-slate-900">Pricing</Link>
            <Link href="/roi-calculator" className="text-slate-600 hover:text-slate-900">ROI Calculator</Link>
            <Link href="/about" className="text-slate-600 hover:text-slate-900">About</Link>
            <Link href="/contact" className="text-slate-600 hover:text-slate-900">Contact</Link>
          </nav>
          <Link href="/app">
            <Button size="sm">Open app</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-white to-white pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-6 py-20 text-center">
          <Badge variant="outline" className="mb-6 bg-white">Platform overview</Badge>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-slate-950 tracking-tight">
            Every Feature You Need to Run a Modern PDLC
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-3xl mx-auto">
            Auditee brings the entire Product Development Lifecycle into one platform — from
            capturing intent and generating requirements, through implementation, testing,
            launch and continuous compliance.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/contact">
              <Button size="lg" className="gap-2">Book a demo <ArrowRight className="w-4 h-4" /></Button>
            </Link>
            <Link href="/roi-calculator">
              <Button size="lg" variant="outline" className="gap-2">
                <Calculator className="w-4 h-4" />
                Calculate ROI
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Capability strip */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-display font-bold text-slate-950 text-center mb-3">
            Four AI-Native Capabilities
          </h2>
          <p className="text-center text-slate-600 max-w-2xl mx-auto mb-12">
            These four capabilities power the Living Knowledge Graph that keeps every
            artifact, decision and line of code in sync.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CAPABILITIES.map((c) => (
              <Card key={c.title} className="p-6 bg-white border-slate-200 flex flex-col">
                <div className="text-3xl font-bold text-primary">{c.metric}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">{c.metricLabel}</div>
                <h3 className="font-display font-semibold text-slate-900 mt-4 leading-tight">
                  {c.title}
                </h3>
                <p className="text-sm text-slate-600 mt-2 flex-1">{c.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-950">
              The Complete Feature Set
            </h2>
            <p className="text-slate-600 mt-3 max-w-2xl mx-auto">
              {FEATURES.length} interlocking capabilities. Click any card to jump straight into the app.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <Link key={f.title} href={f.href}>
                  <Card className="p-6 h-full hover:border-primary/40 hover:shadow-md transition-all cursor-pointer flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      {f.badge && (
                        <Badge className="bg-primary text-primary-foreground">{f.badge}</Badge>
                      )}
                    </div>
                    <h3 className="font-display font-semibold text-slate-900 mt-4 text-lg">
                      {f.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-2">{f.blurb}</p>
                    <ul className="mt-4 space-y-1.5 flex-1">
                      {f.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-2 text-sm text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 text-sm text-primary font-medium flex items-center gap-1">
                      Open <ArrowRight className="w-4 h-4" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Role-based outcomes */}
      <section className="py-20 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-950">
              One Platform, Every Stakeholder
            </h2>
            <p className="text-slate-600 mt-3 max-w-2xl mx-auto">
              Role-specific dashboards surface what matters to each function — measurable
              outcomes, not vanity metrics.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {ROLES.map((r) => (
              <Card key={r.role} className="p-6 bg-white">
                <h3 className="font-display font-semibold text-slate-900 text-xl">{r.role}</h3>
                <ul className="mt-4 space-y-2">
                  {r.metrics.map((m) => (
                    <li key={m} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="text-xs text-slate-500 uppercase tracking-wide">Tracks</div>
                  <div className="text-sm font-medium text-slate-900 mt-1">{r.track}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-4xl mx-auto text-center">
          <MessagesSquare className="w-10 h-10 mx-auto text-primary mb-4" />
          <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-950">
            Ready to End Requirements Chaos?
          </h2>
          <p className="text-slate-600 mt-4 max-w-2xl mx-auto">
            Book a 30-minute walkthrough — we'll connect to your real Jira, GitHub or DOORS
            project and show you exactly how Auditee changes how your team ships.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Link href="/contact">
              <Button size="lg" className="gap-2">Book a demo <ArrowRight className="w-4 h-4" /></Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline">See pricing</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
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
