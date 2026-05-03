import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, ScrollText, CheckCircle2 } from "lucide-react";
import { SEO } from "@/components/SEO";

const OBLIGATIONS = [
  { s: "§4–6", n: "Lawful processing & notice", d: "Process personal data only on consent or legitimate use; serve a clear, plain-language notice in English + the data principal's chosen 8th-Schedule language." },
  { s: "§7", n: "Specified legitimate uses", d: "Employment records, statutory functions, medical emergencies, public-interest research and similar exceptions — each documented." },
  { s: "§8", n: "Data fiduciary obligations", d: "Accuracy, completeness, security safeguards (technical + organisational), breach notification to the Data Protection Board within prescribed time." },
  { s: "§9", n: "Children's data", d: "Verifiable parental consent below 18; no behavioural monitoring or targeted advertising directed at children." },
  { s: "§10", n: "Significant Data Fiduciary (SDF)", d: "Annual DPIA, DPO based in India, periodic audits — applies to high-volume / sensitive processors as notified." },
  { s: "§11–14", n: "Data principal rights", d: "Right to access, correction, completion, updation, erasure, grievance redressal, nominate." },
  { s: "§16", n: "Cross-border transfer", d: "Permitted unless restricted to a specified country; contracts must guarantee equivalent protection." },
  { s: "§33", n: "Penalties", d: "Up to ₹250 crore per instance for breach of security safeguards; ₹50–200 crore for other violations. The DPB enforces." },
];

export default function DpdpAct() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="DPDP Act 2023 Compliance Software — India's Digital Personal Data Protection Act | Auditee"
        description="Audit-ready DPDP Act compliance: consent register, data-principal rights workflow (access / correction / erasure / nominate), breach-notification timer to the Data Protection Board, SDF readiness with DPIA & in-India DPO, and cross-border transfer log."
        path="/dpdp-act"
        keywords={["DPDP Act", "DPDP Act 2023", "Digital Personal Data Protection Act India", "India data protection", "DPB", "Data Protection Board", "Significant Data Fiduciary", "SDF", "DPIA India"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/standards" className="text-sm text-slate-700 hover:text-primary">Standards</Link>
            <Link href="/privacy-policy" className="text-sm text-slate-700 hover:text-primary">Privacy</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <ScrollText className="h-10 w-10 mx-auto text-primary mb-4" />
          <span className="inline-block text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-2.5 py-1 mb-3">DPDP Act, 2023 · MeitY · Data Protection Board of India</span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">DPDP Act — India-ready data protection</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            Consent register, data-principal rights workflow, breach-notification timer to the Data Protection Board, SDF readiness package and a cross-border transfer log — pre-configured for the Digital Personal Data Protection Act, 2023.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/contact?topic=dpdp-readiness"><Button size="lg" className="rounded-full">Book a DPDP readiness call<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link href="/templates"><Button size="lg" variant="outline" className="rounded-full">Free DPDP gap-assessment template</Button></Link>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">Section-by-section coverage</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {OBLIGATIONS.map((p) => (
              <div key={p.s} className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <span className="font-display font-bold text-slate-950">{p.s}</span>
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
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">DPDP evidence pack</h2>
          <ul className="grid md:grid-cols-2 gap-2">
            {[
              "Privacy notice in English + each notified language requested by data principals",
              "Consent register with timestamped, granular, withdrawable consent records",
              "Records of processing activity (RoPA) with lawful basis per activity",
              "DPIA reports for SDF-classified processing",
              "Data-principal rights ticketing (access, correction, erasure, nominate, grievance)",
              "Breach incident log with DPB-notification timer & decision tree",
              "Sub-processor register with DPDP-aligned contracts",
              "Cross-border transfer log with restricted-country watch",
              "Children's-data flag & parental-consent verification log",
              "Data retention schedule with auto-purge attestation",
              "DPO appointment letter (for SDFs) with India-residency proof",
              "Annual independent audit report (for SDFs) ready for DPB submission",
            ].map((d) => (
              <li key={d} className="flex items-start gap-2 text-sm text-slate-800"><CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />{d}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-6 prose prose-slate prose-headings:font-display prose-headings:text-slate-950">
          <h2>Where the DPDP Act differs from GDPR</h2>
          <ul>
            <li><strong>Consent-first.</strong> The DPDP Act leans heavier on consent as the lawful basis; the GDPR's six bases (Art. 6) are narrowed to consent + a small list of "specified legitimate uses".</li>
            <li><strong>Children definition.</strong> "Child" means below 18 (vs GDPR's 16/13/14 by Member State).</li>
            <li><strong>Cross-border default.</strong> Transfers are <em>permitted unless</em> restricted to a specified country — the inverse of GDPR's "restricted unless adequate".</li>
            <li><strong>Right to data portability and right to be forgotten</strong> — narrower than GDPR; erasure exists, portability does not.</li>
            <li><strong>Penalty cap</strong> — up to ₹250 crore per instance, enforced by the Data Protection Board (DPB) under MeitY.</li>
            <li><strong>Significant Data Fiduciary</strong> — a notified-by-government category with extra obligations (DPIA, in-India DPO, audits).</li>
          </ul>

          <h2>Auditee runs both lenses in parallel</h2>
          <p>Indian customers exporting to EU markets typically need DPDP + GDPR coverage on the same processing activity. Auditee surfaces both lenses on the same RoPA entry — one consent record, one data subject, two regulators served.</p>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">DPDP-ready in 30 days</h2>
          <p className="text-slate-300 mb-6">Most non-SDF firms close the DPDP gap in a single sprint. SDF-classified firms take 8–12 weeks including DPO appointment and first audit.</p>
          <Link href="/contact?topic=dpdp-roadmap"><Button size="lg" className="rounded-full" data-testid="dpdp-cta">Plan your DPDP roadmap<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </section>
    </div>
  );
}
