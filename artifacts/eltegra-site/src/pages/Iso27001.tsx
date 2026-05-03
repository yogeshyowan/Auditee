import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, KeyRound, CheckCircle2 } from "lucide-react";
import { SEO } from "@/components/SEO";

const CLAUSES = [
  { c: "Clause 4", n: "Context of the organisation", d: "Internal/external issues, interested parties, scope of the ISMS." },
  { c: "Clause 5", n: "Leadership", d: "Top-management commitment, information security policy, roles & responsibilities." },
  { c: "Clause 6", n: "Planning", d: "Risks & opportunities, information-security objectives, planning of changes." },
  { c: "Clause 7", n: "Support", d: "Resources, competence, awareness, communication, documented information." },
  { c: "Clause 8", n: "Operation", d: "Operational planning & control, risk assessment, risk treatment." },
  { c: "Clause 9", n: "Performance evaluation", d: "Monitoring, measurement, internal audit, management review." },
  { c: "Clause 10", n: "Improvement", d: "Nonconformity & corrective action, continual improvement." },
];

const ANNEX_THEMES = [
  { c: "A.5 Organizational (37 controls)", d: "Policies, roles, threat intelligence, supplier security, business-continuity, legal/regulatory." },
  { c: "A.6 People (8 controls)", d: "Screening, terms of employment, awareness, disciplinary process, remote working, NDA." },
  { c: "A.7 Physical (14 controls)", d: "Secure areas, equipment, working in secure areas, clear desk/screen." },
  { c: "A.8 Technological (34 controls)", d: "User endpoints, privileged access, identity, secure development, vulnerability management, logging, network security, cryptography." },
];

export default function Iso27001() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="ISO 27001:2022 Compliance Software — ISMS, Annex A & Statement of Applicability | Auditee"
        description="ISO/IEC 27001:2022 fully pre-configured: clauses 4–10, all 93 Annex A controls (organizational/people/physical/technological), Statement of Applicability auto-generated, internal-audit & management-review records — UKAS-friendly evidence pack."
        path="/iso-27001"
        keywords={["ISO 27001", "ISO 27001:2022", "ISMS", "Annex A", "Statement of Applicability", "SoA", "ISO 27002", "infosec management system", "UKAS certification"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/soc-2" className="text-sm text-slate-700 hover:text-primary">SOC 2</Link>
            <Link href="/standards" className="text-sm text-slate-700 hover:text-primary">Standards</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <KeyRound className="h-10 w-10 mx-auto text-primary mb-4" />
          <span className="inline-block text-xs font-semibold text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-full px-2.5 py-1 mb-3">ISO/IEC 27001:2022 · ISO/IEC 27002:2022</span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">ISO 27001 — global ISMS, certification-ready</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            Clauses 4–10, all 93 Annex A controls (37 organizational + 8 people + 14 physical + 34 technological), auto-generated Statement of Applicability, internal-audit & management-review records.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/contact?topic=iso27001-readiness"><Button size="lg" className="rounded-full">Book an ISO 27001 readiness call<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link href="/templates"><Button size="lg" variant="outline" className="rounded-full">Free SoA template</Button></Link>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">Clauses 4–10 — the management-system spine</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {CLAUSES.map((p) => (
              <div key={p.c} className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <span className="font-display font-bold text-slate-950">{p.c}</span>
                  <span className="text-xs text-slate-500">{p.n}</span>
                </div>
                <div className="text-sm text-slate-700 mt-1">{p.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">Annex A — 93 controls in 4 themes</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {ANNEX_THEMES.map((p) => (
              <div key={p.c} className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="font-display font-bold text-slate-950 mb-1">{p.c}</div>
                <div className="text-sm text-slate-700 mt-1">{p.d}</div>
              </div>
            ))}
          </div>
          <p className="text-sm text-slate-600 mt-6">The 2022 revision condensed 114 controls (2013) into 93 with new attribute tags — control type, infosec property, cybersecurity concept, operational capability, security domain. Auditee filters by attribute so you can build your SoA in minutes, not days.</p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-6 prose prose-slate prose-headings:font-display prose-headings:text-slate-950">
          <h2>Statement of Applicability — auto-generated, defensible</h2>
          <p>The SoA is the single document that drives 90% of your audit conversation. Auditee generates it from your control selections, justification text, implementation status and evidence links — and re-renders it every time anything changes. No more "the SoA in our QMS doesn't match what we actually do" findings.</p>

          <h2>Internal audit, the way certification bodies expect</h2>
          <p>Three-year audit programme covering all clauses & Annex A controls, sampling plan, auditor-independence checks, finding management with CAPA, follow-up verification, management-review input pack — all generated from the same source of truth as your day-to-day ISMS.</p>

          <h2>Pre-mapped neighbour standards</h2>
          <ul>
            <li><strong>SOC 2</strong> — ~85% overlap; one set of controls produces both reports.</li>
            <li><strong>ISO 27017 (cloud)</strong> &amp; <strong>ISO 27018 (PII in cloud)</strong> — extension control sets layered onto the same ISMS.</li>
            <li><strong>NIST CSF 2.0</strong> — function/category/sub-category mapping for US-influenced enterprises.</li>
            <li><strong>UK Cyber Essentials Plus</strong> — auto-derived from a subset of Annex A.8 controls.</li>
          </ul>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Stage 1 audit-ready in a quarter</h2>
          <p className="text-slate-300 mb-6">From kick-off to a credible Stage 1 in 12 weeks for mid-market firms; Stage 2 typically 4–8 weeks after Stage 1 with corrective-action evidence.</p>
          <Link href="/contact?topic=iso27001-roadmap"><Button size="lg" className="rounded-full" data-testid="iso27001-cta">Plan your ISO 27001 roadmap<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </section>
    </div>
  );
}
