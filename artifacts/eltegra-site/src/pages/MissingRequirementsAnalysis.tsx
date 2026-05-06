import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import {
  AlertTriangle,
  ShieldCheck,
  Eye,
  GitMerge,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  ScanSearch,
  Activity,
  Layers,
  Zap,
  Database,
  Accessibility,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const FINDING_TYPES = [
  {
    icon: Eye,
    title: "Missing requirements",
    desc: "AI surfaces what your spec set doesn't say but should — security controls, audit logging, error handling, accessibility, observability, edge cases.",
    color: "bg-rose-50 text-rose-700 border-rose-200",
  },
  {
    icon: GitMerge,
    title: "Duplicate requirements",
    desc: "Two reqs that say the same thing in different words. Auditee groups them and tells you which to keep, which to merge.",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    icon: AlertTriangle,
    title: "Conflicting requirements",
    desc: "Reqs that contradict each other — one says 'cache 24h', another says 'always-fresh'. AI flags the contradiction with severity.",
    color: "bg-orange-50 text-orange-700 border-orange-200",
  },
  {
    icon: Lightbulb,
    title: "Improvement recommendations",
    desc: "Existing reqs that are vague, untestable, or missing acceptance criteria — Auditee suggests sharper rewrites.",
    color: "bg-sky-50 text-sky-700 border-sky-200",
  },
];

const CATEGORIES = [
  { icon: ShieldCheck, label: "Security", desc: "AuthN/AuthZ, encryption, secret handling" },
  { icon: ShieldCheck, label: "Compliance", desc: "Framework-specific control gaps" },
  { icon: Accessibility, label: "Accessibility", desc: "WCAG, screen reader, keyboard nav" },
  { icon: Gauge, label: "Performance", desc: "Latency, throughput, capacity" },
  { icon: AlertTriangle, label: "Error handling", desc: "Failure modes, retries, fallbacks" },
  { icon: Activity, label: "Observability", desc: "Logging, metrics, audit trails" },
  { icon: Database, label: "Data", desc: "Validation, retention, lineage" },
  { icon: Layers, label: "UX", desc: "Empty states, loading, errors" },
];

const STEPS = [
  { step: "1", title: "Pick a project + (optionally) a compliance framework", desc: "Auditee loads every requirement in the project; the framework selection narrows the scan to its specific controls." },
  { step: "2", title: "AI scans the full requirements set", desc: "GPT-5.2 cross-references your reqs against industry best-practice taxonomies and the chosen framework." },
  { step: "3", title: "Findings come back categorised + severity-ranked", desc: "Each missing req has a category and severity; each conflict cites the exact requirement codes that disagree." },
  { step: "4", title: "Promote with one click", desc: "Click 'Add as requirement' on any missing finding — Auditee creates a tracked requirement with source attribution." },
  { step: "5", title: "Re-run on every release", desc: "Schedule the analysis with Recurring Audits so drift never sneaks back in." },
];

const OUTCOMES = [
  { metric: "60%", label: "fewer post-launch hotfixes" },
  { metric: "8", label: "categories scanned per run" },
  { metric: "1 click", label: "to promote a finding to a real requirement" },
  { metric: "0", label: "missed compliance controls at audit" },
];

export default function MissingRequirementsAnalysisPage() {
  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Missing Requirements Analysis — AI Requirements Gap Detection | Auditee"
        description="Auditee's AI Requirements Gap Detection finds the requirements you forgot to write. Catches missing security, accessibility, performance, error-handling, and edge-case requirements before they become production defects or audit findings."
        path="/missing-requirements-analysis"
        keywords={["missing requirements", "requirements gap analysis", "AI gap detection", "requirements coverage", "audit findings prevention"]}
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
          <ScanSearch className="w-3.5 h-3.5" /> Missing Requirements Analysis
        </Badge>
        <h1 className="mt-6 text-4xl md:text-6xl font-display font-bold text-slate-950 tracking-tight">
          Catch the requirements
          <span className="block text-primary mt-2">you forgot to write</span>
        </h1>
        <p className="mt-6 text-lg text-slate-600 max-w-3xl mx-auto">
          The bugs that hit production aren't the requirements you wrote — they're the ones
          you didn't. Auditee's Requirements Gap Detection AI scans every requirement against industry
          best-practice taxonomies and flags what's missing, duplicated, conflicting, or
          weak — before it ships.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <Link href="/app/gaps">
            <Button size="lg" className="gap-2" data-testid="hero-cta-gaps">
              Run Requirements Gap Detection <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/contact">
            <Button size="lg" variant="outline">Book a demo</Button>
          </Link>
        </div>
      </section>

      {/* What it finds */}
      <section className="px-6 pb-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="outline" className="bg-slate-50">Four kinds of finding</Badge>
          <h2 className="mt-4 text-3xl md:text-4xl font-display font-bold text-slate-950">
            What Auditee surfaces in a single scan
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {FINDING_TYPES.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-lg border flex items-center justify-center shrink-0 ${f.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-bold text-slate-950">{f.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{f.desc}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Categories */}
      <section className="bg-slate-50 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-950">
              Eight categories scanned, every run
            </h2>
            <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
              Every missing-requirement finding is labelled with the category it belongs to,
              so you know whether you're looking at a security gap or a UX gap before you open it.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              return (
                <Card key={c.label} className="p-5 bg-white">
                  <Icon className="w-6 h-6 text-primary" />
                  <div className="mt-3 font-display font-bold text-slate-950">{c.label}</div>
                  <div className="mt-1 text-xs text-slate-500">{c.desc}</div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-950">How a scan works</h2>
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
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-950">What teams ship after</h2>
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
            Stop finding bugs in production
          </h2>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
            Bring us your spec set or Jira board — we'll run a Requirements Gap Detection scan in the
            demo and show you the missing reqs hiding in plain sight.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Link href="/contact"><Button size="lg" className="gap-2">Book a demo <ArrowRight className="w-4 h-4" /></Button></Link>
            <Link href="/app/gaps"><Button size="lg" variant="outline">Try it now</Button></Link>
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
