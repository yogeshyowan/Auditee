import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowRightLeft, CheckCircle2, Clock, FileSearch } from "lucide-react";
import { SEO } from "@/components/SEO";

const SOURCES = [
  { from: "IBM DOORS / DOORS Next", time: "2–6 weeks", note: "ReqIF 1.x or DXL exports. Modules, attributes, links and baselines preserved.", href: "/compare/doors" },
  { from: "Jama Connect", time: "2–4 weeks", note: "Native Jama JSON or ReqIF. Item types, relationships, reviews and verifications retained.", href: "/compare/jama" },
  { from: "Polarion ALM", time: "3–6 weeks", note: "Polarion XML / ReqIF round-trip. Work items, links, traceability matrices.", href: "/compare/polarion" },
  { from: "codeBeamer", time: "2–4 weeks", note: "ReqIF + REST extraction. Trackers, configurations, baselines.", href: "/integrations" },
  { from: "Helix RM (PTC)", time: "2–4 weeks", note: "ReqIF + Helix REST. Documents, requirements, links, attribute history.", href: "/integrations" },
  { from: "Confluence + Jira", time: "1–3 weeks", note: "Confluence XML export + Jira REST. Pages, requirements pages, issue links.", href: "/integrations" },
  { from: "Word / Excel-based RM", time: "1–2 weeks", note: ".docx + .xlsx + .csv ingestion with AI-assisted requirement extraction and ID assignment.", href: "/intelligent-document-analysis" },
  { from: "ReqIF (any tool)", time: "Self-serve, hours", note: "Drag-and-drop ReqIF 1.0 / 1.1 / 1.2 / 1.3 import with attribute preservation.", href: "/integrations" },
];

const PHASES = [
  { phase: "Discovery", time: "Week 1", desc: "We map your existing schema (modules, item types, attributes, link types) onto Auditee's flexible requirement graph. No data moves yet." },
  { phase: "Pilot import", time: "Week 1–2", desc: "Single project / module is imported, validated, and reviewed by your team. We resolve schema gaps before the bulk run." },
  { phase: "Bulk migration", time: "Week 2–4", desc: "Full corpus migration, automated diff against source-of-truth, and a written reconciliation report." },
  { phase: "Cutover", time: "Week 4–6", desc: "Read-only window on the legacy tool, final delta sync, sign-off. Optional 90-day parallel-run on legacy for rollback insurance." },
  { phase: "Decommission", time: "Week 6+", desc: "Legacy licence cancellation playbook with the dates and people you need." },
];

export default function Migrations() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Migration Guides — DOORS, Jama, Polarion, codeBeamer to Auditee"
        description="Step-by-step migration playbooks from IBM DOORS, Jama Connect, Polarion, codeBeamer, Helix RM, Confluence/Jira and Word/Excel to Auditee. Typical timeline 2–6 weeks with a written reconciliation report."
        path="/migrations"
        keywords={["DOORS migration", "Jama migration", "Polarion migration", "ReqIF migration", "ALM migration", "Auditee migration"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/integrations" className="text-sm text-slate-700 hover:text-primary">Integrations</Link>
            <Link href="/case-studies" className="text-sm text-slate-700 hover:text-primary">Case studies</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <ArrowRightLeft className="h-10 w-10 mx-auto text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Migration guides</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            Concrete playbooks for moving from legacy ALM / RM tools to Auditee. We've migrated programmes with 200K+ requirements and 30-year audit histories — without losing a single linked artefact.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">Migrate from</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {SOURCES.map((s) => (
              <Link key={s.from} href={s.href} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-primary transition-colors block">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="font-semibold text-slate-900">{s.from}</div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1 whitespace-nowrap inline-flex items-center gap-1"><Clock className="h-3 w-3" />{s.time}</span>
                </div>
                <div className="text-sm text-slate-600">{s.note}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">How a migration works</h2>
          <ol className="space-y-3">
            {PHASES.map((p, i) => (
              <li key={p.phase} className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-semibold shrink-0">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <div className="font-semibold text-slate-900">{p.phase}</div>
                    <div className="text-xs text-slate-500">{p.time}</div>
                  </div>
                  <div className="text-sm text-slate-700 mt-1">{p.desc}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">What we guarantee</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { t: "Zero data loss", d: "Every requirement, link, attribute and history record reconciled against source-of-truth, with a written diff report." },
              { t: "Fixed-fee scope", d: "We quote a fixed fee per source tool and per requirement-count band. No hourly surprises mid-migration." },
              { t: "Rollback insurance", d: "Optional 90-day parallel-run on the legacy tool. Cancel anytime in the first 60 days for a full migration-fee refund." },
            ].map((g) => (
              <div key={g.t} className="bg-white border border-slate-200 rounded-2xl p-5">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 mb-2" />
                <div className="font-semibold text-slate-900">{g.t}</div>
                <div className="text-sm text-slate-600 mt-1.5">{g.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <FileSearch className="h-10 w-10 mx-auto text-primary mb-4" />
          <h2 className="text-3xl font-display font-bold mb-4">Get a migration assessment</h2>
          <p className="text-slate-300 mb-6">Share an export (or just a screenshot of your schema) and we'll come back within 3 business days with a fixed-fee scope and timeline.</p>
          <Link href="/contact?topic=migration-assessment">
            <Button size="lg" className="rounded-full" data-testid="migrations-cta">Request a free assessment<ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
