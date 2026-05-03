import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calculator, FileCheck2, ListChecks, ShieldCheck, FileText, Wand2 } from "lucide-react";
import { SEO } from "@/components/SEO";

const TOOLS = [
  {
    icon: Calculator,
    title: "ROI calculator",
    desc: "Estimate the audit-prep hours and licence-fee savings from moving off DOORS / Jama / Polarion.",
    href: "/roi-calculator",
    available: true,
  },
  {
    icon: FileCheck2,
    title: "Requirement quality scorer",
    desc: "Paste a requirement, get an INCOSE-style score (testable, atomic, unambiguous) with rewrite suggestions.",
    href: "/contact?topic=req-scorer-beta",
    available: false,
  },
  {
    icon: ListChecks,
    title: "ASPICE 4.0 readiness checklist",
    desc: "Self-assessment against the 32 base practices in ASPICE 4.0. CSV export at the end.",
    href: "/contact?topic=aspice-checklist-beta",
    available: false,
  },
  {
    icon: ShieldCheck,
    title: "FDA QMSR transition checker",
    desc: "Map your existing ISO 13485 evidence onto 21 CFR 820 (QMSR) and see your delta.",
    href: "/contact?topic=qmsr-checker-beta",
    available: false,
  },
  {
    icon: FileText,
    title: "BRD → user-story converter",
    desc: "Drop in a Word BRD, get clean user stories with acceptance criteria you can paste into Jira.",
    href: "/brd-generation",
    available: true,
  },
  {
    icon: Wand2,
    title: "Test-case generator",
    desc: "From a requirement (or a set), generate Gherkin / IEEE 829 test cases in seconds.",
    href: "/test-case-generation",
    available: true,
  },
];

export default function FreeTools() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Free Tools for Requirements & Compliance Teams — Auditee"
        description="Free, no-signup tools from Auditee: ROI calculator, requirement quality scorer, ASPICE 4.0 readiness checklist, FDA QMSR transition checker, BRD-to-user-story converter, test-case generator."
        path="/free-tools"
        keywords={["free compliance tools", "requirement quality scorer", "ASPICE checklist", "FDA QMSR checker", "BRD to user stories", "free ROI calculator"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/glossary" className="text-sm text-slate-700 hover:text-primary">Glossary</Link>
            <Link href="/whitepapers" className="text-sm text-slate-700 hover:text-primary">Whitepapers</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Wand2 className="h-10 w-10 mx-auto text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Free tools</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            Quick, single-purpose utilities for requirement and compliance teams. No sign-up for the public ones. No upsell mid-flow.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOOLS.map((t) => (
              <div key={t.title} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col">
                <t.icon className="h-7 w-7 text-primary mb-3" />
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <div className="font-semibold text-slate-900">{t.title}</div>
                  {!t.available && (
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">Beta — request access</span>
                  )}
                </div>
                <div className="text-sm text-slate-600 mt-1.5 flex-1">{t.desc}</div>
                <Link href={t.href} className="mt-4">
                  <Button variant={t.available ? "default" : "outline"} className="rounded-full w-full">
                    {t.available ? "Open tool" : "Request access"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Want a tool we haven't built?</h2>
          <p className="text-slate-300 mb-6">If it would genuinely help a requirements or compliance team, we usually build it. Tell us what you'd use.</p>
          <Link href="/contact?topic=free-tool-suggestion">
            <Button size="lg" className="rounded-full" data-testid="free-tools-suggest-cta">Suggest a tool<ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
