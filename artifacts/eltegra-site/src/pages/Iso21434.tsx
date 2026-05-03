import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, CheckCircle2 } from "lucide-react";
import { SEO } from "@/components/SEO";

const CLAUSES = [
  { c: "Clause 5", n: "Organisational cybersecurity management", d: "Cybersecurity governance, culture, competence, continual improvement, tool management." },
  { c: "Clause 6", n: "Project-dependent cybersecurity management", d: "Cybersecurity planning, tailoring, reuse, off-the-shelf component, OEM/supplier interface (DIA-CS)." },
  { c: "Clause 7", n: "Distributed cybersecurity activities", d: "Supplier capability evaluation, cybersecurity interface agreements, joint cybersecurity work products." },
  { c: "Clause 8", n: "Continual cybersecurity activities", d: "Vulnerability management, monitoring, triage, response & recovery — through end-of-cybersecurity-support." },
  { c: "Clause 9", n: "Concept", d: "Item definition, cybersecurity goals, TARA (asset → damage scenarios → threat scenarios → impact rating → attack-feasibility → CAL/risk)." },
  { c: "Clause 10", n: "Product development", d: "Cybersecurity requirements, design, integration & verification, validation against the cybersecurity concept." },
  { c: "Clause 11", n: "Cybersecurity validation", d: "Validation against the cybersecurity goals and assumptions; final assessment." },
  { c: "Clauses 12–14", n: "Production, operations & decommissioning", d: "Production cybersecurity, post-development incident response, decommissioning." },
];

export default function Iso21434() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="ISO/SAE 21434 Compliance Software — Automotive Cybersecurity | Auditee"
        description="ISO/SAE 21434:2021 fully pre-configured: TARA workflow with CAL ratings, asset → damage scenarios → threat scenarios pipeline, supplier DIA-CS, vulnerability management & UN R155 type-approval evidence pack."
        path="/iso-21434"
        keywords={["ISO 21434", "ISO/SAE 21434", "automotive cybersecurity", "TARA", "CAL", "UN R155", "type approval", "CSMS", "vehicle cybersecurity"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/iso-26262" className="text-sm text-slate-700 hover:text-primary">ISO 26262</Link>
            <Link href="/aspice" className="text-sm text-slate-700 hover:text-primary">ASPICE</Link>
            <Link href="/standards" className="text-sm text-slate-700 hover:text-primary">Standards</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Lock className="h-10 w-10 mx-auto text-primary mb-4" />
          <span className="inline-block text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-full px-2.5 py-1 mb-3">ISO/SAE 21434:2021 · Automotive cybersecurity</span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">ISO 21434 — automotive cybersecurity, type-approval-ready</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            TARA, CAL ratings, supplier DIA-CS, vulnerability management and a CSMS evidence pack that satisfies UN R155 type-approval. Pre-mapped to ISO 26262 and ASPICE 4.0.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/contact?topic=iso21434-demo"><Button size="lg" className="rounded-full">Book an ISO 21434 demo<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link href="/templates"><Button size="lg" variant="outline" className="rounded-full">Free TARA template</Button></Link>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">Clause-by-clause coverage</h2>
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
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">CSMS evidence pack — what UN R155 wants to see</h2>
          <ul className="grid md:grid-cols-2 gap-2">
            {[
              "Cybersecurity policy with named accountable executive",
              "Item definition + asset register + damage-scenario catalogue",
              "TARA worksheets with CAL allocation and rationale",
              "Cybersecurity concept + cybersecurity goals",
              "Cybersecurity requirements with bidirectional traceability",
              "Supplier DIA-CS (distributed cybersecurity activities)",
              "SBOM (CycloneDX / SPDX) + vulnerability monitoring records",
              "Penetration-test reports & retest evidence",
              "Incident-response playbook + tabletop-exercise records",
              "Cybersecurity case + final cybersecurity assessment",
              "Production cybersecurity controls (key provisioning, secure boot, anti-tamper)",
              "Post-development monitoring & response records (continual)",
            ].map((d) => (
              <li key={d} className="flex items-start gap-2 text-sm text-slate-800"><CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />{d}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-6 prose prose-slate prose-headings:font-display prose-headings:text-slate-950">
          <h2>UN R155 type-approval — the regulatory consequence</h2>
          <p>Since July 2024, every new vehicle type sold in UNECE-WP.29 contracting parties must hold a CSMS certificate plus a per-type cybersecurity certificate. ISO/SAE 21434 is the de-facto evidence framework national approval authorities accept. Auditee's evidence pack has been used in successful UN R155 audits with KBA (Germany), VCA (UK) and RDW (Netherlands).</p>

          <h2>TARA without the spreadsheet hell</h2>
          <p>The threat-analysis-and-risk-assessment workflow is where most teams burn weeks. Auditee implements the Annex G method out of the box (asset identification → damage scenarios → impact rating → threat scenarios → attack-feasibility → risk → CAL), with reusable libraries for typical automotive items (telematics, gateway, ADAS ECU, infotainment, OTA endpoint).</p>

          <h2>Pre-mapped neighbour standards</h2>
          <ul>
            <li><strong>ISO 26262</strong> — safety/security interactions surfaced (e.g. brake-by-wire); shared item definition.</li>
            <li><strong>ASPICE 4.0</strong> — SEC.1–SEC.4 process evidence reused.</li>
            <li><strong>SAE J3061</strong> — legacy-mapped for OEMs not yet fully on 21434.</li>
            <li><strong>UN R156 (software updates)</strong> — SUMS evidence assembled in parallel.</li>
          </ul>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Type-approval-ready in a quarter</h2>
          <p className="text-slate-300 mb-6">From kick-off to a credible cybersecurity case in 14 weeks — including TARA, supplier DIA-CS and pen-test evidence.</p>
          <Link href="/contact?topic=iso21434-roadmap"><Button size="lg" className="rounded-full" data-testid="iso21434-cta">Plan your ISO 21434 roadmap<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </section>
    </div>
  );
}
