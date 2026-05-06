import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import {
  ShieldCheck,
  CalendarClock,
  AlertTriangle,
  FileText,
  ArrowRight,
  CheckCircle2,
  ScrollText,
  Bug,
  Stethoscope,
  Banknote,
  Plane,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const FRAMEWORKS = [
  "SOC 2", "HIPAA", "ISO 27001", "ISO 13485", "ISO 9001",
  "NIST 800-53", "NIST CSF", "PCI DSS 4.0",
  "FDA 21 CFR Part 11", "FDA QSR", "GDPR", "CCPA",
  "GxP", "GAMP 5", "DO-178C", "DO-254",
  "EU AI Act", "NIS2", "DORA", "SOX", "FedRAMP", "CMMC", "EN 50128",
];

const CAPABILITIES = [
  {
    icon: ShieldCheck,
    title: "Continuous AI audits",
    desc: "Run a full control-by-control audit against any framework in one click. Auditee returns verdicts, evidence excerpts and recommended fixes — re-runnable on every release.",
    href: "/app/compliance",
    cta: "Open Compliance",
  },
  {
    icon: AlertTriangle,
    title: "CAPA Actions",
    desc: "Every audit failure becomes a tracked Corrective and Preventive Action — assigned, prioritised, and traceable back to the control it satisfies.",
    href: "/app/capa",
    cta: "Open CAPA",
  },
  {
    icon: CalendarClock,
    title: "Recurring audits",
    desc: "Schedule audits to re-run weekly, monthly or per-release. Drift, regression and new findings are surfaced before your next cert.",
    href: "/app/recurring-audits",
    cta: "Schedule audits",
  },
  {
    icon: AlertTriangle,
    title: "Compliance gap detection",
    desc: "AI scans your requirements set against a chosen framework and flags every missing control, conflicting requirement, or weak coverage area.",
    href: "/app/gaps",
    cta: "Run Requirements Gap Detection",
    badge: "AI",
  },
  {
    icon: Bug,
    title: "Defect-aware verdicts",
    desc: "Connected defect trackers feed live ticket data into every audit — known defects on a control automatically downgrade its verdict and cite ticket keys as evidence.",
    href: "/app/defects",
    cta: "Open Defects",
  },
  {
    icon: FileText,
    title: "Audit-ready exports",
    desc: "Every audit and CAPA exports to DOCX or PDF with structured sections, citations and verdicts — ready to hand to an external auditor without rework.",
    href: "/app/reports",
    cta: "Open Reports",
  },
];

const HOW = [
  {
    step: "1",
    title: "Connect your project sources",
    desc: "Repos, RM tools, defect trackers, uploaded BRDs — Auditee builds one knowledge graph across all of it. No more hunting for evidence.",
  },
  {
    step: "2",
    title: "Pick a framework, run an audit",
    desc: "Select SOC 2, HIPAA, ISO 27001 — any of 23+ supported frameworks — and Auditee evaluates every control against your live project state.",
  },
  {
    step: "3",
    title: "AI cites the evidence",
    desc: "Each verdict includes the requirement codes, code citations and defect ticket keys that justify it. No black-box judgements.",
  },
  {
    step: "4",
    title: "CAPA closes the loop",
    desc: "Failed controls become tracked CAPA actions with owners and due dates. Re-running the audit shows your trend line.",
  },
  {
    step: "5",
    title: "Stay audit-ready continuously",
    desc: "Recurring audit schedules catch drift between releases. You walk into your next external audit with the evidence already collected.",
  },
];

const OUTCOMES = [
  { metric: "23+", label: "frameworks supported out of the box" },
  { metric: "80%", label: "less time spent collecting evidence" },
  { metric: "Hours", label: "to a draft audit, not weeks" },
  { metric: "0", label: "spreadsheets to maintain" },
];

const INDUSTRIES = [
  { icon: Stethoscope, name: "Healthcare & Medical Devices", frameworks: "HIPAA · FDA 21 CFR Part 11 · ISO 13485" },
  { icon: Banknote, name: "Financial Services", frameworks: "SOX · PCI DSS 4.0 · DORA · NIST 800-53" },
  { icon: Plane, name: "Aerospace & Avionics", frameworks: "DO-178C · DO-254 · ISO 9001" },
  { icon: Building2, name: "Enterprise SaaS", frameworks: "SOC 2 · ISO 27001 · GDPR · EU AI Act" },
];

export default function AutomatedCompliancePage() {
  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Automated Compliance — 23+ Frameworks (SOC 2, HIPAA, IEC 62304, ASPICE, FDA) | Auditee"
        description="Auditee automates continuous compliance evidence collection across 23+ frameworks: SOC 2, ISO 27001, HIPAA, IEC 62304, ISO 13485, ISO 26262, ASPICE, CMMI, DO-178C, FDA 21 CFR Part 11, FDA QMSR, GDPR, PCI DSS, NIST, EU AI Act, NIS2, DORA, FedRAMP, CMMC."
        path="/automated-compliance"
        keywords={["automated compliance", "SOC 2 automation", "HIPAA automation", "IEC 62304", "ASPICE automation", "ISO 26262", "FDA QMSR", "compliance evidence"]}
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
          <ShieldCheck className="w-3.5 h-3.5" /> Automated Compliance
        </Badge>
        <h1 className="mt-6 text-4xl md:text-6xl font-display font-bold text-slate-950 tracking-tight">
          Always-fresh evidence,
          <span className="block text-primary mt-2">across every framework you care about</span>
        </h1>
        <p className="mt-6 text-lg text-slate-600 max-w-3xl mx-auto">
          Auditee runs continuous control-by-control audits against your live product state.
          Every verdict is backed by citations from your specs, your code and your tickets —
          no spreadsheets, no screenshots, no end-of-quarter scrambles.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <Link href="/app/compliance">
            <Button size="lg" className="gap-2" data-testid="hero-cta-compliance">
              Run an audit <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/contact">
            <Button size="lg" variant="outline">Talk to compliance team</Button>
          </Link>
        </div>
      </section>

      {/* Pain → Promise */}
      <section className="px-6 pb-20 max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
        <Card className="p-7 bg-rose-50/40 border-rose-200">
          <div className="text-xs font-semibold uppercase tracking-wide text-rose-700">Today, without Auditee</div>
          <h3 className="mt-2 text-xl font-display font-bold text-slate-950">Audit prep is a quarterly fire drill</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-700">
            <li className="flex gap-2"><span className="text-rose-500 shrink-0 mt-0.5">●</span> Engineers stop shipping for two weeks to collect screenshots</li>
            <li className="flex gap-2"><span className="text-rose-500 shrink-0 mt-0.5">●</span> Evidence lives in stale spreadsheets nobody owns</li>
            <li className="flex gap-2"><span className="text-rose-500 shrink-0 mt-0.5">●</span> External auditors find gaps you missed — costing the cert</li>
            <li className="flex gap-2"><span className="text-rose-500 shrink-0 mt-0.5">●</span> Adding a new framework means starting from zero</li>
          </ul>
        </Card>
        <Card className="p-7 bg-emerald-50/40 border-emerald-200">
          <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">With Auditee</div>
          <h3 className="mt-2 text-xl font-display font-bold text-slate-950">Audit-ready, every day, automatically</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-700">
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> Every control evaluated against live requirements + code + defects</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> Verdicts cite specific requirements, code paths and ticket keys</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> Recurring audits surface drift between releases</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> Add a new framework — full audit in minutes, not months</li>
          </ul>
        </Card>
      </section>

      {/* Capabilities grid */}
      <section className="bg-slate-50 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="bg-white">Capabilities</Badge>
            <h2 className="mt-4 text-3xl md:text-4xl font-display font-bold text-slate-950">
              The full compliance loop in one place
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {CAPABILITIES.map((c) => {
              const Icon = c.icon;
              return (
                <Card key={c.title} className="p-6 bg-white hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    {c.badge && (
                      <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700 text-xs">
                        {c.badge}
                      </Badge>
                    )}
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
        </div>
      </section>

      {/* Frameworks marquee */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-950">
            23+ frameworks. One platform.
          </h2>
          <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
            From SOC 2 to DO-178C — Auditee speaks your auditor's language and cites evidence
            in your framework's native vocabulary.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
          {FRAMEWORKS.map((f) => (
            <Badge
              key={f}
              variant="outline"
              className="bg-white border-slate-300 text-slate-700 px-3.5 py-1.5 text-sm"
              data-testid={`framework-${f.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
            >
              {f}
            </Badge>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-950">
              How automated compliance works
            </h2>
          </div>
          <div className="space-y-4">
            {HOW.map((h) => (
              <Card key={h.step} className="p-6 bg-white">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0">
                    {h.step}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-display font-bold text-slate-950">{h.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{h.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-950">
            What changes once it's automated
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

      {/* Industries */}
      <section className="bg-slate-50 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-950">
              Built for regulated industries
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {INDUSTRIES.map((ind) => {
              const Icon = ind.icon;
              return (
                <Card key={ind.name} className="p-6 bg-white">
                  <Icon className="w-8 h-8 text-primary" />
                  <h3 className="mt-4 font-display font-bold text-slate-950">{ind.name}</h3>
                  <p className="mt-2 text-xs text-slate-500">{ind.frameworks}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollText className="w-10 h-10 mx-auto text-primary mb-4" />
          <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-950">
            Walk into your next audit prepared
          </h2>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
            Bring us a framework you're certifying against — we'll run a full audit on your
            live project in the demo and show you exactly what an auditor will see.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Link href="/contact">
              <Button size="lg" className="gap-2">Book a compliance demo <ArrowRight className="w-4 h-4" /></Button>
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
