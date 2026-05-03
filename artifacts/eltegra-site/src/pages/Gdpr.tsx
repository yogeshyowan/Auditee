import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Globe, CheckCircle2 } from "lucide-react";
import { SEO } from "@/components/SEO";

const ARTICLES = [
  { a: "Art. 5", n: "Principles", d: "Lawfulness, fairness, transparency, purpose limitation, data minimisation, accuracy, storage limitation, integrity & confidentiality, accountability." },
  { a: "Art. 6", n: "Lawfulness of processing", d: "Six bases: consent, contract, legal obligation, vital interests, public task, legitimate interests — captured per processing activity." },
  { a: "Art. 9", n: "Special-category data", d: "Health, biometrics, ethnicity, etc. — explicit additional safeguards and lawful-basis logic." },
  { a: "Art. 12–22", n: "Data-subject rights", d: "Information, access, rectification, erasure (right to be forgotten), restriction, portability, objection, automated-decision rights." },
  { a: "Art. 25", n: "Privacy by design & default", d: "DPIA-driven design controls, data-minimisation defaults, pseudonymisation patterns." },
  { a: "Art. 28", n: "Processor obligations", d: "Sub-processor register, contracts, audit rights, sub-processor change-notice with objection window." },
  { a: "Art. 30", n: "Records of processing (RoPA)", d: "Maintained per controller AND per processor; export-ready for DPA inspection." },
  { a: "Art. 32", n: "Security of processing", d: "Pseudonymisation, encryption, integrity, availability, resilience, regular testing, evaluation of effectiveness." },
  { a: "Art. 33–34", n: "Breach notification", d: "72-hour DPA-notification timer + data-subject communication decision tree, with audit-grade evidence trail." },
  { a: "Art. 35", n: "Data Protection Impact Assessment", d: "Triggers, methodology (Annex), residual-risk approval, periodic re-assessment." },
  { a: "Art. 37–39", n: "Data Protection Officer", d: "DPO appointment, contact disclosure, independence safeguards, training records." },
  { a: "Chap. V", n: "International transfers", d: "Adequacy decisions, SCCs (2021 modules), TIA (transfer impact assessment), BCRs, derogations — log + monitor." },
];

export default function Gdpr() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="GDPR Compliance Software — EU 2016/679 & UK GDPR | Auditee"
        description="EU GDPR (2016/679) and UK GDPR fully pre-configured: RoPA, lawful-basis matrix, DSR ticketing (12-22), DPIA workflow, 72-hour breach timer, SCC + TIA register and sub-processor change-notice with objection window."
        path="/gdpr"
        keywords={["GDPR", "GDPR compliance", "EU 2016/679", "UK GDPR", "RoPA", "DPIA", "data subject request", "DSR", "SCC", "TIA", "Article 28", "DPO"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/dpdp-act" className="text-sm text-slate-700 hover:text-primary">DPDP Act</Link>
            <Link href="/standards" className="text-sm text-slate-700 hover:text-primary">Standards</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Globe className="h-10 w-10 mx-auto text-primary mb-4" />
          <span className="inline-block text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1 mb-3">EU 2016/679 · UK GDPR · EDPB</span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">GDPR — privacy programme on autopilot</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            RoPA, lawful-basis matrix, DSR ticketing, 72-hour breach timer, DPIA workflow, SCC + TIA register, sub-processor change-notice with objection window — pre-configured for EU and UK GDPR.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/contact?topic=gdpr-readiness"><Button size="lg" className="rounded-full">Book a GDPR readiness call<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link href="/templates"><Button size="lg" variant="outline" className="rounded-full">Free GDPR DPIA template</Button></Link>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">Article-by-article coverage</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {ARTICLES.map((p) => (
              <div key={p.a} className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <span className="font-display font-bold text-slate-950">{p.a}</span>
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
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">Evidence pack — what your DPA wants</h2>
          <ul className="grid md:grid-cols-2 gap-2">
            {[
              "Privacy notices (controller + processor variants) per language",
              "Records of processing activity (RoPA) per controller / per processor",
              "Lawful-basis matrix per processing activity",
              "Consent register with timestamp, scope, withdrawal & re-prompt logs",
              "DSR ticketing (info, access, rectification, erasure, restriction, portability, objection, ADM)",
              "DPIA register with residual-risk approvals",
              "Breach incident log with 72-hour DPA-notification timer + data-subject comms decision tree",
              "Sub-processor register (Art. 28) with change-notice & customer objection window",
              "International-transfer log: SCC modules, TIA, BCR, adequacy or derogation cited",
              "DPO appointment letter, training records, independence statement",
              "Data retention schedule with auto-purge attestation",
              "Vendor risk-assessment evidence + DPA contracts library",
            ].map((d) => (
              <li key={d} className="flex items-start gap-2 text-sm text-slate-800"><CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />{d}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-6 prose prose-slate prose-headings:font-display prose-headings:text-slate-950">
          <h2>Schrems II didn't go away — Auditee makes TIA painless</h2>
          <p>Every transfer to a non-adequate country still needs a Transfer Impact Assessment under the 2021 SCCs. Auditee ships a TIA workflow that captures the destination country's surveillance laws, the safeguards in place (encryption, pseudonymisation, contractual), and the residual-risk decision — exportable as a single PDF for your DPA dossier. Updates to country-risk assessments (e.g. EU-US Data Privacy Framework status) propagate to all transfers automatically.</p>

          <h2>One DSR ticket, all rights</h2>
          <p>Articles 12–22 are usually fragmented across multiple tools (CRM, support desk, HR, marketing). Auditee provides a single DSR queue with auto-routing to the data systems involved, an SLA timer (1 month default, with 2-month extension flag), and a signed evidence record of completion. The data subject gets a download link or attestation; the regulator gets the audit trail.</p>

          <h2>UK GDPR, two years on</h2>
          <p>The UK GDPR diverges in narrow ways (DPDI Bill amendments, ICO certification scheme, UK-IDTA instead of EU SCCs). Auditee tracks both lenses on the same processing activity so cross-border firms aren't running two parallel programmes.</p>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">DPA-defensible in 60 days</h2>
          <p className="text-slate-300 mb-6">From kick-off to a defensible privacy programme in 8 weeks for mid-market firms; 12–16 weeks for multi-controller groups.</p>
          <Link href="/contact?topic=gdpr-roadmap"><Button size="lg" className="rounded-full" data-testid="gdpr-cta">Plan your GDPR roadmap<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </section>
    </div>
  );
}
