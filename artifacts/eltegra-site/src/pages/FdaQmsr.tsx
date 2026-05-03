import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { SEO } from "@/components/SEO";

const DELTAS = [
  { topic: "Records — UDI, MDR, complaint files", iso: "Implicit", qmsr: "Explicit (21 CFR 803, 806, 820.198)" },
  { topic: "CAPA scope", iso: "ISO 13485 §8.5", qmsr: "21 CFR 820.100 — broader, with specific record requirements" },
  { topic: "Management responsibility", iso: "Generic ISO clauses", qmsr: "Named individuals with documented authority" },
  { topic: "Design transfer documentation", iso: "ISO 13485 §7.3.8", qmsr: "21 CFR 820.30(h) — explicit production-readiness records" },
  { topic: "Servicing records", iso: "ISO 13485 §7.5.4", qmsr: "21 CFR 820.200 — distinct service-records requirement" },
  { topic: "Labelling & packaging control", iso: "ISO 13485 §7.5.11", qmsr: "21 CFR 820.120 / 820.130 — distinct procedures" },
];

export default function FdaQmsr() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="FDA QMSR Compliance Software — 21 CFR Part 820 (Post-Feb 2026) | Auditee"
        description="The FDA QMSR (final rule Feb 2024, in force 2 Feb 2026) incorporates ISO 13485:2016 by reference plus US-specific deltas (UDI, MDR, complaint files, servicing). Auditee maps both — pass FDA inspections without rebuilding your QMS."
        path="/fda-qmsr"
        keywords={["FDA QMSR", "21 CFR Part 820", "QMSR compliance", "FDA inspection", "FDA QSR transition", "ISO 13485 to QMSR", "MedTech FDA"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/iec-62304" className="text-sm text-slate-700 hover:text-primary">IEC 62304</Link>
            <Link href="/standards" className="text-sm text-slate-700 hover:text-primary">Standards</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <ShieldCheck className="h-10 w-10 mx-auto text-primary mb-4" />
          <span className="inline-block text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1 mb-3">FDA QMSR · 21 CFR Part 820 (post-Feb 2026)</span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">FDA QMSR — your ISO 13485 evidence, FDA-ready</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            The QMSR (in force 2 Feb 2026) incorporates ISO 13485:2016 plus the FDA-specific deltas. Auditee maps both, surfaces only the gaps, and assembles inspection-ready evidence in days.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/contact?topic=qmsr-readiness"><Button size="lg" className="rounded-full">Book a QMSR readiness call<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link href="/templates"><Button size="lg" variant="outline" className="rounded-full">Free QMSR transition workbook</Button></Link>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">QMSR vs ISO 13485 — the deltas that matter</h2>
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <table className="min-w-full text-sm border border-slate-200 bg-white">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Topic</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">ISO 13485:2016</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">FDA QMSR</th>
                </tr>
              </thead>
              <tbody>
                {DELTAS.map((d) => (
                  <tr key={d.topic} className="border-t border-slate-200 align-top">
                    <td className="px-4 py-3 font-semibold text-slate-900">{d.topic}</td>
                    <td className="px-4 py-3 text-slate-700">{d.iso}</td>
                    <td className="px-4 py-3 text-slate-700">{d.qmsr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">Inspection-ready evidence pack</h2>
          <ul className="grid md:grid-cols-2 gap-2">
            {[
              "Quality manual with 21 CFR 820 cross-reference",
              "Management responsibility records with named owners",
              "Design history file (DHF) per device family",
              "Device master record (DMR)",
              "Device history record (DHR) — production batch traceability",
              "CAPA log with effectiveness verification",
              "Complaint files (21 CFR 820.198) + MDR decision tree",
              "UDI / GUDID submission records",
              "Servicing records (21 CFR 820.200)",
              "Supplier qualification + monitoring evidence",
              "Internal audit & management-review records",
              "Training records with competency mapping",
            ].map((d) => (
              <li key={d} className="flex items-start gap-2 text-sm text-slate-800"><CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />{d}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-6 prose prose-slate prose-headings:font-display prose-headings:text-slate-950">
          <h2>What changes on 2 Feb 2026?</h2>
          <p>The QSR (21 CFR Part 820 as written before 2024) is replaced by the QMSR (21 CFR Part 820 as amended). The big mechanical change is that ISO 13485:2016 is <em>incorporated by reference</em> — an FDA inspector can cite an ISO clause as if it were a regulation. The big practical change is that firms operating a single ISO-13485 QMS for global markets no longer need to maintain a parallel "FDA-only" QMS. Auditee was built for this — your evidence is captured once and surfaced through the lens the auditor needs.</p>

          <h2>Who needs to act?</h2>
          <ul>
            <li>Existing FDA-registered firms with QSR-only QMS — full transition needed.</li>
            <li>Firms running ISO 13485:2016 globally — ~80% of work is already done; close the QMSR-specific gaps.</li>
            <li>Pre-submission firms — start on QMSR directly.</li>
            <li>Combination products — coordinate QMSR + 21 CFR 4.</li>
          </ul>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">QMSR-ready in 30 days from ISO 13485</h2>
          <p className="text-slate-300 mb-6">Most ISO 13485-certified firms close the QMSR delta in a single sprint with our transition workbook + Auditee.</p>
          <Link href="/contact?topic=qmsr-roadmap"><Button size="lg" className="rounded-full" data-testid="qmsr-cta">Plan your QMSR transition<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </section>
    </div>
  );
}
