import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { SEO } from "@/components/SEO";

const TSC = [
  { c: "Security (Common Criteria)", d: "Logical & physical access, change management, risk management, vendor management, monitoring. Mandatory for every SOC 2 report." },
  { c: "Availability", d: "Capacity planning, performance monitoring, backup & recovery, BCP/DR testing — pick if your customers care about uptime SLAs." },
  { c: "Confidentiality", d: "Data classification, encryption, secure disposal — pick if you process customer-confidential data (NDA-bound, source code, business strategy)." },
  { c: "Processing Integrity", d: "Input validation, processing accuracy, output completeness — pick if you process transactions on behalf of customers (payments, calculations, ML inference)." },
  { c: "Privacy", d: "Notice, choice & consent, collection, use/retention/disposal, access, disclosure, monitoring — pick if you process PII for individual end-users." },
];

const COC = [
  "CC1 — Control Environment (governance, board oversight, COSO alignment)",
  "CC2 — Communication & Information",
  "CC3 — Risk Assessment",
  "CC4 — Monitoring Activities",
  "CC5 — Control Activities",
  "CC6 — Logical & Physical Access Controls",
  "CC7 — System Operations",
  "CC8 — Change Management",
  "CC9 — Risk Mitigation",
];

export default function Soc2() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="SOC 2 Compliance Software — Type I & Type II for SaaS | Auditee"
        description="Audit-ready SOC 2 (AICPA TSP 2017, with 2022 points-of-focus): all 5 Trust Services Criteria, CC1–CC9 control mapping, evidence collection on autopilot, auditor-ready PBC list. Type I in 30 days, Type II observation period from day one."
        path="/soc-2"
        keywords={["SOC 2", "SOC 2 Type II", "SOC 2 Type I", "AICPA TSP", "Trust Services Criteria", "SaaS compliance", "SOC 2 readiness"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/iso-27001" className="text-sm text-slate-700 hover:text-primary">ISO 27001</Link>
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
          <span className="inline-block text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1 mb-3">SOC 2 · AICPA TSP 2017 (with 2022 points-of-focus)</span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">SOC 2 — the report your enterprise customers ask for</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            All 5 Trust Services Criteria pre-configured. CC1–CC9 control mapping, evidence collection on autopilot, auditor-ready PBC list. Type I in 30 days; Type II observation period starts the moment your controls are operating.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/contact?topic=soc2-readiness"><Button size="lg" className="rounded-full">Book a SOC 2 readiness call<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link href="/templates"><Button size="lg" variant="outline" className="rounded-full">Free SOC 2 readiness checklist</Button></Link>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">Trust Services Criteria — pick your scope</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {TSC.map((p) => (
              <div key={p.c} className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="font-display font-bold text-slate-950 mb-1">{p.c}</div>
                <div className="text-sm text-slate-700 mt-1">{p.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">Common Criteria (CC1–CC9) — the security backbone</h2>
          <ul className="grid md:grid-cols-2 gap-2">
            {COC.map((d) => (
              <li key={d} className="flex items-start gap-2 text-sm text-slate-800"><CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />{d}</li>
            ))}
          </ul>
          <p className="text-sm text-slate-600 mt-6">Auditee maps each common criterion to specific control activities, evidence sources (config exports from AWS/GCP/Azure, GitHub branch-protection states, Okta access reviews, MDM device-compliance logs), and the responsible owner — your auditor sees a single, auditor-friendly view.</p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-6 prose prose-slate prose-headings:font-display prose-headings:text-slate-950">
          <h2>Type I vs Type II — what's actually different?</h2>
          <ul>
            <li><strong>Type I</strong> = controls are <em>designed</em> appropriately as of a single date. Useful for closing your first big deal but quickly outgrown.</li>
            <li><strong>Type II</strong> = controls are designed AND <em>operating effectively</em> over a period (typically 6–12 months). This is what enterprise procurement actually wants on a renewal.</li>
            <li>Auditee starts collecting Type II evidence the moment your controls go live. By the time your audit window closes, the PBC list is largely already filled.</li>
          </ul>

          <h2>Evidence on autopilot</h2>
          <p>The single most painful part of a SOC 2 audit is the "please send us a screenshot of X every month" PBC list. Auditee replaces those screenshots with continuous integrations — your AWS account is read by a least-privilege role, your Okta is queried via SCIM, your GitHub via App permissions — and the evidence is stamped, dated and stored automatically. When the auditor asks, you point them at the read-only auditor view.</p>

          <h2>Pre-mapped neighbour standards</h2>
          <ul>
            <li><strong>ISO 27001</strong> — ~85% control overlap; one set of controls, two reports.</li>
            <li><strong>HIPAA Security Rule</strong> — administrative/physical/technical safeguards mapped to CC6/CC7.</li>
            <li><strong>PCI-DSS 4.0</strong> — cardholder-environment controls cross-referenced where applicable.</li>
            <li><strong>FedRAMP Moderate</strong> — early baseline if you're heading toward US-Federal customers.</li>
          </ul>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Type I in 30 days, Type II window starts immediately</h2>
          <p className="text-slate-300 mb-6">We'll connect you with a partner CPA firm if you don't already have one — a few of our customers have closed enterprise deals before the formal report was even issued, on the strength of the Auditee live evidence view alone.</p>
          <Link href="/contact?topic=soc2-roadmap"><Button size="lg" className="rounded-full" data-testid="soc2-cta">Plan your SOC 2 roadmap<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </section>
    </div>
  );
}
