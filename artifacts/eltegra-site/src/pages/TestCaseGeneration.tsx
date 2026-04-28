import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import {
  TestTube2,
  CheckCircle2,
  ArrowRight,
  Network,
  FileText,
  ListChecks,
  ShieldCheck,
  Layers,
  Workflow,
  Zap,
  Bug,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TC_FORMAT = [
  { label: "ID", value: "TC-PRJ-0042", note: "Auto-numbered, traceable" },
  { label: "Linked Requirement", value: "REQ-PRJ-0017", note: "Bidirectional link to source req" },
  { label: "Preconditions", value: "User authenticated, cart has 1+ item", note: "What must be true before steps" },
  { label: "Steps", value: "1. Click checkout  2. Enter card details  3. Submit", note: "Numbered, executable, plain English" },
  { label: "Expected Result", value: "Order confirmation page renders, email sent", note: "Single, verifiable outcome" },
  { label: "Test Type", value: "Functional / Regression / Negative", note: "Auto-classified" },
];

const CAPABILITIES = [
  {
    icon: Network,
    title: "Bidirectional traceability",
    desc: "Every test case is linked to the requirement it covers. Click any req to see its tests; click any test to find its req. Coverage holes light up automatically.",
  },
  {
    icon: ListChecks,
    title: "Structured TC format",
    desc: "Preconditions / steps / expected results — the format your QA team already uses. Importable into TestRail, Xray, qTest or Azure Test Plans.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance-aware",
    desc: "Generate test cases that explicitly verify compliance controls — IEC 62304, ISO 13485, FDA Part 11 — with the framework citation embedded in the case.",
  },
  {
    icon: Bug,
    title: "Negative + edge case coverage",
    desc: "Auditee generates not just happy-path cases but boundary, error, and security-failure cases — the ones manual writers usually skip.",
  },
  {
    icon: RefreshCw,
    title: "Re-generate as reqs change",
    desc: "When a requirement's acceptance criteria change, regenerate just that requirement's tests — others stay untouched, traceability preserved.",
  },
  {
    icon: FileText,
    title: "Multi-format export",
    desc: "Export the full TC suite as DOCX, PDF or HTML — ready for QA review, audit submission, or import into any test management tool.",
  },
];

const STEPS = [
  { step: "1", title: "Open the Requirements page", desc: "Pick the project — Auditee already has all your requirements indexed." },
  { step: "2", title: "Click 'Generate AI document → Generate Test Cases'", desc: "Auditee composes a complete TC suite covering every functional and non-functional requirement." },
  { step: "3", title: "Review in the Reports library", desc: "Each case has its requirement link, preconditions, steps, expected results, and a test-type label." },
  { step: "4", title: "Export and import", desc: "DOCX/PDF/HTML for review, or push the structured data into your test management tool of choice." },
];

const OUTCOMES = [
  { metric: "100%", label: "of requirements get a test case" },
  { metric: "5×", label: "more negative + edge cases than manual" },
  { metric: "Hours", label: "to a complete TC suite, not weeks" },
  { metric: "0", label: "broken traceability links" },
];

export default function TestCaseGenerationPage() {
  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="AI Test Case Generation — Auto-Generated from Requirements | Auditee"
        description="Auditee auto-generates structured, executable test suites from every requirement. Each test case includes preconditions, numbered steps, expected results, and bidirectional traceability to source requirements."
        path="/test-case-generation"
        keywords={["AI test case generation", "automated test generation", "requirements-based testing", "test traceability", "AI testing"]}
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
          <TestTube2 className="w-3.5 h-3.5" /> Test Case Generation
        </Badge>
        <h1 className="mt-6 text-4xl md:text-6xl font-display font-bold text-slate-950 tracking-tight">
          Auto-generate structured test suites
          <span className="block text-primary mt-2">from every requirement</span>
        </h1>
        <p className="mt-6 text-lg text-slate-600 max-w-3xl mx-auto">
          Type one click. Get a complete test case suite covering every functional and
          non-functional requirement — preconditions, steps, expected results, all
          bidirectionally linked, all audit-ready. No more hand-writing TC-0001.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <Link href="/app/requirements">
            <Button size="lg" className="gap-2" data-testid="hero-cta-tests">
              Generate test cases <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/contact">
            <Button size="lg" variant="outline">Book a demo</Button>
          </Link>
        </div>
      </section>

      {/* TC anatomy */}
      <section className="px-6 pb-20 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <Badge variant="outline" className="bg-slate-50">Anatomy of a generated test case</Badge>
          <h2 className="mt-4 text-3xl md:text-4xl font-display font-bold text-slate-950">
            Every case has the same six fields
          </h2>
        </div>
        <Card className="overflow-hidden">
          <div className="divide-y divide-slate-200">
            {TC_FORMAT.map((row) => (
              <div key={row.label} className="grid grid-cols-1 md:grid-cols-12 gap-3 px-6 py-4 items-start">
                <div className="md:col-span-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {row.label}
                </div>
                <div className="md:col-span-5 font-mono text-sm text-slate-900">
                  {row.value}
                </div>
                <div className="md:col-span-4 text-xs text-slate-500 italic">
                  {row.note}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Capabilities */}
      <section className="bg-slate-50 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-950">
              Why generated tests beat hand-written ones
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {CAPABILITIES.map((c) => {
              const Icon = c.icon;
              return (
                <Card key={c.title} className="p-6 bg-white hover:shadow-md transition-shadow">
                  <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-display font-bold text-slate-950">{c.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{c.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-950">From requirement to test suite</h2>
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
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-950">What QA teams ship after</h2>
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
            Hand-writing test cases is over
          </h2>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
            We'll generate the suite for one of your real requirement sets in the demo —
            you'll see the structured output and the traceability graph in under five minutes.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Link href="/contact"><Button size="lg" className="gap-2">Book a demo <ArrowRight className="w-4 h-4" /></Button></Link>
            <Link href="/app/requirements"><Button size="lg" variant="outline">Try it now</Button></Link>
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
