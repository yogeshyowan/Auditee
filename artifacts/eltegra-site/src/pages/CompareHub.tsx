import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Scale, CheckCircle2, XCircle } from "lucide-react";
import { SEO } from "@/components/SEO";

const COMPARES = [
  { tool: "IBM DOORS / DOORS Next", href: "/compare/doors", strengths: "Decades-deep modules, deep DXL automation, baselining.", weaknesses: "Per-seat licensing, slow UI, weak modern API, painful Word/Excel round-trip, no AI." },
  { tool: "Jama Connect", href: "/compare/jama", strengths: "Cleaner UI than DOORS, native reviews, decent REST API.", weaknesses: "Manual traceability work, expensive at scale, limited evidence-pack automation, no AI-native quality scoring." },
  { tool: "Polarion ALM", href: "/compare/polarion", strengths: "Tight Siemens / Capital integration, configurable workflows, good ASPICE templates.", weaknesses: "Slow on large datasets, complex admin, weak modern collaboration, AI is bolted on." },
];

const MATRIX = [
  { feature: "AI-native requirement quality scoring", auditee: true, doors: false, jama: false, polarion: false },
  { feature: "Auto-generated traceability from natural language", auditee: true, doors: false, jama: false, polarion: false },
  { feature: "One-click ASPICE / IEC 62304 / FDA QMSR evidence packs", auditee: true, doors: false, jama: false, polarion: "Partial" },
  { feature: "ReqIF 1.x round-trip with attribute preservation", auditee: true, doors: true, jama: true, polarion: true },
  { feature: "Native DOORS / Jama / Polarion ingestion", auditee: true, doors: false, jama: false, polarion: false },
  { feature: "Single-tenant or on-prem with BYO-LLM", auditee: true, doors: false, jama: false, polarion: true },
  { feature: "INR-native billing + GST invoices", auditee: true, doors: false, jama: false, polarion: false },
  { feature: "Modern REST + GraphQL API + webhooks", auditee: true, doors: false, jama: "REST only", polarion: "REST only" },
  { feature: "Per-seat pricing", auditee: false, doors: true, jama: true, polarion: true },
];

function Cell({ v }: { v: boolean | string }) {
  if (v === true) return <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto" />;
  if (v === false) return <XCircle className="h-5 w-5 text-slate-300 mx-auto" />;
  return <span className="text-xs text-slate-600">{v}</span>;
}

export default function CompareHub() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Compare Auditee vs DOORS, Jama, Polarion — AI-Native PDLC"
        description="Side-by-side comparison of Auditee against IBM DOORS / DOORS Next, Jama Connect and Polarion ALM. AI-native requirement quality scoring, automated traceability and evidence packs vs legacy seat-based ALM."
        path="/compare"
        keywords={["Auditee vs DOORS", "Auditee vs Jama", "Auditee vs Polarion", "DOORS alternative", "Jama alternative", "Polarion alternative", "ALM comparison"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/migrations" className="text-sm text-slate-700 hover:text-primary">Migrations</Link>
            <Link href="/pricing" className="text-sm text-slate-700 hover:text-primary">Pricing</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Scale className="h-10 w-10 mx-auto text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Auditee vs the legacy ALM stack</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            Honest, side-by-side comparisons. We tell you where the legacy tools are still strong — and where Auditee replaces them outright.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">Pick a comparison</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {COMPARES.map((c) => (
              <Link key={c.tool} href={c.href} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-primary transition-colors block">
                <div className="font-display font-bold text-lg text-slate-950 mb-2">Auditee vs {c.tool}</div>
                <div className="text-xs uppercase tracking-wide text-emerald-700 font-semibold mt-3">Where it's strong</div>
                <div className="text-sm text-slate-700 mt-1">{c.strengths}</div>
                <div className="text-xs uppercase tracking-wide text-rose-700 font-semibold mt-3">Where it falls short</div>
                <div className="text-sm text-slate-700 mt-1">{c.weaknesses}</div>
                <div className="mt-4 text-sm text-primary font-medium inline-flex items-center gap-1">Read the full comparison <ArrowRight className="h-4 w-4" /></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">Feature matrix</h2>
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <table className="min-w-full text-sm border border-slate-200 bg-white">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Capability</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-950">Auditee</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-700">DOORS</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-700">Jama</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-700">Polarion</th>
                </tr>
              </thead>
              <tbody>
                {MATRIX.map((m) => (
                  <tr key={m.feature} className="border-t border-slate-200">
                    <td className="px-4 py-3 text-slate-800">{m.feature}</td>
                    <td className="px-4 py-3 text-center"><Cell v={m.auditee} /></td>
                    <td className="px-4 py-3 text-center"><Cell v={m.doors} /></td>
                    <td className="px-4 py-3 text-center"><Cell v={m.jama} /></td>
                    <td className="px-4 py-3 text-center"><Cell v={m.polarion} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 mt-3">Comparison reflects each vendor's publicly-documented features as of May 2026. Trademarks belong to their respective owners.</p>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Considering a switch?</h2>
          <p className="text-slate-300 mb-6">Most teams move in 2–6 weeks with zero data loss. See the migration playbooks per source tool.</p>
          <Link href="/migrations">
            <Button size="lg" className="rounded-full" data-testid="compare-hub-migrations-cta">See migration guides<ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
