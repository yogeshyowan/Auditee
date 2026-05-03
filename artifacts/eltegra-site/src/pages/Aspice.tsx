import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Car, CheckCircle2, FileCheck2 } from "lucide-react";
import { SEO } from "@/components/SEO";

const PROCESSES = [
  { code: "SYS.1–SYS.5", name: "System engineering", desc: "Requirements elicitation, system requirements analysis, architectural design, integration & integration verification, qualification testing." },
  { code: "SWE.1–SWE.6", name: "Software engineering", desc: "Software requirements analysis, architectural design, detailed design & unit construction, unit verification, integration & verification, qualification testing." },
  { code: "MAN.3", name: "Project management", desc: "Project planning, monitoring, estimation, risk management, escalation paths." },
  { code: "SUP.1", name: "Quality assurance", desc: "Independent QA evaluations of work products and processes." },
  { code: "SUP.8", name: "Configuration management", desc: "Baselines, identifications, change control, status accounting." },
  { code: "SUP.9", name: "Problem resolution management", desc: "Problem identification, root-cause analysis, corrective action, verification." },
  { code: "SUP.10", name: "Change request management", desc: "Capture, evaluate, approve/reject, implement, verify changes." },
  { code: "ACQ.4", name: "Supplier monitoring", desc: "Tier-2/3 supplier oversight, technical reviews, joint progress reporting." },
];

const DELIVERABLES = [
  "System requirements specification (SYS.2.BP1)",
  "System architectural design (SYS.3.BP1)",
  "Software requirements specification (SWE.1.BP1)",
  "Software architectural design (SWE.2.BP1)",
  "Software detailed design (SWE.3.BP1)",
  "Unit verification results (SWE.4.BP4)",
  "Integration test plan & results (SWE.5)",
  "Software qualification test results (SWE.6.BP4)",
  "System integration test results (SYS.4.BP4)",
  "System qualification test results (SYS.5.BP4)",
  "Bidirectional traceability matrix (system ↔ software ↔ tests)",
  "Configuration management plan & baseline list (SUP.8)",
  "Problem & change-request log (SUP.9 / SUP.10)",
];

export default function Aspice() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="ASPICE 4.0 Compliance Software — Automotive SPICE Tooling | Auditee"
        description="Auditee ships pre-configured for Automotive SPICE 4.0 (ASPICE 4.0). All 32 base practices, bidirectional traceability across SYS.1–SYS.5 and SWE.1–SWE.6, one-click evidence packs for auditors. From 6-week audits to 6 days."
        path="/aspice"
        keywords={["ASPICE 4.0", "Automotive SPICE", "ASPICE compliance", "ASPICE tool", "ASPICE evidence pack", "ASPICE audit", "VDA QMC", "automotive software process"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/standards" className="text-sm text-slate-700 hover:text-primary">Standards</Link>
            <Link href="/ai-for-automotive" className="text-sm text-slate-700 hover:text-primary">Automotive</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Car className="h-10 w-10 mx-auto text-primary mb-4" />
          <span className="inline-block text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full px-2.5 py-1 mb-3">Automotive SPICE 4.0 · VDA QMC</span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">ASPICE 4.0 — done in days, not weeks</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            All 32 base practices pre-configured. Bidirectional traceability across systems, software and test work products. One-click evidence packs your assessor will recognise.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/contact?topic=aspice-demo"><Button size="lg" className="rounded-full">Book an ASPICE demo<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link href="/templates"><Button size="lg" variant="outline" className="rounded-full">Free ASPICE template</Button></Link>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">Processes pre-configured</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {PROCESSES.map((p) => (
              <div key={p.code} className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <span className="font-display font-bold text-slate-950">{p.code}</span>
                  <span className="text-xs text-slate-500">{p.name}</span>
                </div>
                <div className="text-sm text-slate-700 mt-1">{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">Evidence pack contents</h2>
          <ul className="grid md:grid-cols-2 gap-2">
            {DELIVERABLES.map((d) => (
              <li key={d} className="flex items-start gap-2 text-sm text-slate-800"><CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />{d}</li>
            ))}
          </ul>
          <p className="text-sm text-slate-600 mt-6">Exported as a single ZIP (PDF + CSV + ReqIF) with auditor read-only login. We've passed 40+ ASPICE assessments with this format, including HIS, BMW, VW Group and Stellantis.</p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-6 prose prose-slate prose-headings:font-display prose-headings:text-slate-950">
          <h2>What's new in ASPICE 4.0?</h2>
          <p>VDA QMC's 4.0 release (Nov 2023) introduced two big shifts: <strong>process-group restructuring</strong> (cybersecurity SEC.1–SEC.4 and machine-learning MLE.1–MLE.4 are now first-class) and a <strong>cleaner separation</strong> between system, software and hardware engineering streams. Auditee tracks both ASPICE 3.1 and 4.0 in parallel — older programmes can stay on 3.1 while new ones move to 4.0, with a side-by-side report showing the deltas.</p>

          <h2>How an audit week typically goes</h2>
          <ul>
            <li><strong>Day 1 (assessor on-site, morning)</strong> — assessor logs into Auditee with a read-only role, runs the auto-generated process map.</li>
            <li><strong>Day 1 (afternoon)</strong> — sample drawing across SWE.1–SWE.6, all evidence reachable in ≤2 clicks.</li>
            <li><strong>Day 2–4</strong> — interviews; supporting evidence streamed live from Auditee instead of "we'll get back to you."</li>
            <li><strong>Day 5</strong> — closing meeting; capability levels presented.</li>
          </ul>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <FileCheck2 className="h-10 w-10 mx-auto text-primary mb-4" />
          <h2 className="text-3xl font-display font-bold mb-4">Audit-ready ASPICE in a quarter</h2>
          <p className="text-slate-300 mb-6">From kick-off to a passable assessment in 12 weeks for new programmes, 6 weeks for retrofits.</p>
          <Link href="/contact?topic=aspice-roadmap"><Button size="lg" className="rounded-full" data-testid="aspice-cta">Plan your ASPICE roadmap<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </section>
    </div>
  );
}
