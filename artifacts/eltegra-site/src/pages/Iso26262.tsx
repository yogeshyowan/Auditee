import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldAlert, CheckCircle2 } from "lucide-react";
import { SEO } from "@/components/SEO";

const PARTS = [
  { p: "Part 3", n: "Concept phase", d: "Item definition, hazard analysis & risk assessment (HARA), ASIL determination (A, B, C, D), functional safety concept." },
  { p: "Part 4", n: "Product development at the system level", d: "Technical safety requirements, system architectural design, integration & verification, safety validation." },
  { p: "Part 5", n: "Hardware development", d: "Hardware safety requirements, hardware design, hardware integration & verification, evaluation of hardware architectural metrics (SPFM, LFM, PMHF)." },
  { p: "Part 6", n: "Software development", d: "Software safety requirements, architectural design, unit design & implementation, unit verification, integration & verification, verification of software safety requirements." },
  { p: "Part 7", n: "Production, operation, service & decommissioning", d: "Production planning, operation/service/decommissioning planning, field-monitoring." },
  { p: "Part 8", n: "Supporting processes", d: "Interfaces within distributed developments (DIA), specification & management of safety requirements, configuration management, change management, verification, documentation, qualification of software tools." },
];

const ARTEFACTS = [
  "Item definition + scope diagram",
  "HARA worksheet with controllability/severity/exposure scoring",
  "ASIL allocation rationale per safety goal",
  "Functional & technical safety concept documents",
  "Safety case skeleton (GSN-compatible)",
  "Tool qualification reports (TCL/TD per ISO 26262-8 §11)",
  "Software safety requirements with ASIL inheritance traceability",
  "Verification plan & results per ASIL decomposition",
  "Distributed development agreement (DIA) with Tier-N suppliers",
  "Confirmation reviews + functional safety audit & assessment evidence",
];

export default function Iso26262() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="ISO 26262 Compliance Software — Functional Safety for Road Vehicles | Auditee"
        description="ISO 26262:2018 (parts 3–8) pre-configured. HARA, ASIL allocation, safety case (GSN), tool qualification (TCL/TD), DIA — plus pre-mapping to ASPICE 4.0 and ISO 21434. Audit-ready functional safety, in days."
        path="/iso-26262"
        keywords={["ISO 26262", "ISO 26262 compliance", "functional safety", "ASIL", "HARA", "safety case", "GSN", "automotive safety", "tool qualification"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/aspice" className="text-sm text-slate-700 hover:text-primary">ASPICE</Link>
            <Link href="/iso-21434" className="text-sm text-slate-700 hover:text-primary">ISO 21434</Link>
            <Link href="/standards" className="text-sm text-slate-700 hover:text-primary">Standards</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <ShieldAlert className="h-10 w-10 mx-auto text-primary mb-4" />
          <span className="inline-block text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 mb-3">ISO 26262:2018 · Functional safety · Road vehicles</span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">ISO 26262 — functional safety, audit-ready</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            HARA, ASIL allocation, safety case in GSN, tool qualification per Part 8 §11 and the supplier DIA — pre-configured and pre-mapped to ASPICE 4.0 and ISO 21434.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/contact?topic=iso26262-demo"><Button size="lg" className="rounded-full">Book an ISO 26262 demo<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link href="/templates"><Button size="lg" variant="outline" className="rounded-full">Free HARA template</Button></Link>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">Parts pre-configured</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {PARTS.map((p) => (
              <div key={p.p} className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <span className="font-display font-bold text-slate-950">{p.p}</span>
                  <span className="text-xs text-slate-500">{p.n}</span>
                </div>
                <div className="text-sm text-slate-700 mt-1">{p.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">Safety-case artefacts you'll get</h2>
          <ul className="grid md:grid-cols-2 gap-2">
            {ARTEFACTS.map((d) => (
              <li key={d} className="flex items-start gap-2 text-sm text-slate-800"><CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />{d}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-6 prose prose-slate prose-headings:font-display prose-headings:text-slate-950">
          <h2>ASIL inheritance &amp; decomposition — tracked automatically</h2>
          <p>The most failure-prone part of an ISO 26262 programme is keeping ASIL allocations consistent as requirements evolve, decompose, and migrate across system / hardware / software boundaries. Auditee tracks the safety goal → functional safety requirement → technical safety requirement → element-level requirement chain with explicit ASIL annotations and decomposition rules from Part 9. When you change one, downstream impacts surface in your safety-case dashboard the same minute.</p>

          <h2>Pre-mapped neighbour standards</h2>
          <ul>
            <li><strong>ASPICE 4.0</strong> — process evidence pulled from the same artefacts; assessor sees both lenses without duplicate effort.</li>
            <li><strong>ISO 21434</strong> — TARA &amp; cybersecurity goals cross-referenced to safety goals where they interact (e.g. brake-by-wire).</li>
            <li><strong>SOTIF (ISO 21448)</strong> — performance-limitation triggers, validation targets and field-monitoring records dovetail with the ISO 26262 safety case.</li>
            <li><strong>ISO 26262-8 §11 tool qualification</strong> — Auditee itself ships with TCL/TD evidence so it can be qualified for use in your project.</li>
          </ul>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Plan your functional-safety roadmap</h2>
          <p className="text-slate-300 mb-6">From kick-off to a credible safety case in 16 weeks for greenfield programmes, 8 weeks for retrofits.</p>
          <Link href="/contact?topic=iso26262-roadmap"><Button size="lg" className="rounded-full" data-testid="iso26262-cta">Plan your ISO 26262 roadmap<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </section>
    </div>
  );
}
