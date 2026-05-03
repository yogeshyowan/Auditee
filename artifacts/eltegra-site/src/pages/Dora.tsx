import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Banknote, CheckCircle2 } from "lucide-react";
import { SEO } from "@/components/SEO";

const PILLARS = [
  { c: "ICT risk management", d: "Articles 5–16. Governance, risk-management framework, ICT systems & tools, identification, protection, detection, response & recovery, learning & evolving." },
  { c: "ICT-related incident management & reporting", d: "Articles 17–23. Classification, major-incident reporting (initial / intermediate / final) to the competent authority within strict windows; ESA-coordinated response." },
  { c: "Digital operational resilience testing", d: "Articles 24–27. Annual basic testing + threat-led penetration testing (TLPT) every 3 years for designated entities, modelled on TIBER-EU." },
  { c: "ICT third-party risk", d: "Articles 28–44. Register of arrangements, pre-contractual due diligence, mandatory contractual provisions, exit strategy, oversight of critical ICT third-party providers (CTPPs) by ESAs directly." },
  { c: "Information & intelligence sharing", d: "Article 45. Threat-intelligence sharing arrangements between financial entities — voluntary but encouraged." },
];

export default function Dora() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="DORA Compliance Software — EU Digital Operational Resilience Act (in force 17 Jan 2025) | Auditee"
        description="DORA (Regulation (EU) 2022/2554) fully pre-configured: ICT risk-management framework, register of contractual arrangements, major-incident reporting timers, TLPT planning and ICT third-party oversight — across all 5 DORA pillars."
        path="/dora"
        keywords={["DORA", "Digital Operational Resilience Act", "EU 2022/2554", "ICT risk management", "TLPT", "TIBER-EU", "critical third-party provider", "CTPP", "financial services compliance"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/standards" className="text-sm text-slate-700 hover:text-primary">Standards</Link>
            <Link href="/ai-for-fintech" className="text-sm text-slate-700 hover:text-primary">Fintech</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Banknote className="h-10 w-10 mx-auto text-primary mb-4" />
          <span className="inline-block text-xs font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-full px-2.5 py-1 mb-3">Regulation (EU) 2022/2554 · In force 17 Jan 2025</span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">DORA — operational resilience for EU financial entities</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            ICT risk-management framework, register of arrangements, major-incident reporting timers, TLPT planning and ICT third-party oversight — across all 5 DORA pillars, ready for ESA scrutiny.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/contact?topic=dora-readiness"><Button size="lg" className="rounded-full">Book a DORA readiness call<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link href="/templates"><Button size="lg" variant="outline" className="rounded-full">Free DORA gap-assessment template</Button></Link>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">The 5 DORA pillars</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {PILLARS.map((p) => (
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
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">DORA evidence pack — what your competent authority wants</h2>
          <ul className="grid md:grid-cols-2 gap-2">
            {[
              "Board-approved ICT risk-management framework with named accountable executive",
              "Asset register (information assets + ICT systems) with criticality classification",
              "ICT business-continuity policy + DR plan with annual test evidence",
              "Major-incident classification matrix + reporting templates (initial/intermediate/final)",
              "Annual digital-operational-resilience testing programme + results",
              "TLPT plan with red-team scoping (designated entities only)",
              "Register of contractual arrangements (RoCA) with all ICT third-parties",
              "Pre-contractual due-diligence records for new ICT third-party providers",
              "Contractual provisions checklist (Art. 30) per arrangement",
              "Exit-strategy documentation per critical ICT third-party",
              "Concentration-risk analysis across CTPPs",
              "Threat-led intelligence sharing arrangements (where applicable)",
            ].map((d) => (
              <li key={d} className="flex items-start gap-2 text-sm text-slate-800"><CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />{d}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-6 prose prose-slate prose-headings:font-display prose-headings:text-slate-950">
          <h2>The major-incident clock</h2>
          <p>DORA introduces strict reporting windows for "major" ICT-related incidents — initial notification within hours of classification, intermediate report within 72 hours, final report within one month. The classification itself uses 7 criteria (clients affected, geographic spread, data losses, criticality of services, duration, etc.). Auditee's incident workflow auto-classifies, starts the clock, drafts the templated submission to your competent authority and routes for sign-off.</p>

          <h2>RoCA — the register that grows on you</h2>
          <p>The Register of Contractual Arrangements (Art. 28) sounds simple until you realise it must capture every ICT third-party arrangement (cloud, SaaS, MSP, security vendor, even data-licensing) with structured fields per arrangement. Auditee imports from your procurement system, auto-classifies criticality, and surfaces gaps (missing exit strategy, missing right-to-audit) before your authority does.</p>

          <h2>Are you in scope?</h2>
          <ul>
            <li>Banks, investment firms, payment institutions, e-money institutions, CSDs, CCPs, trading venues, trade repositories, AIFMs, UCITS managers, IORPs (above thresholds), credit-rating agencies, crypto-asset service providers under MiCA, and more.</li>
            <li>And — critically — their ICT third-party providers, who can be designated as CTPPs and supervised directly by the ESAs.</li>
            <li>Microenterprises get a lighter, proportionate regime under Art. 16.</li>
          </ul>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">DORA-ready in a quarter</h2>
          <p className="text-slate-300 mb-6">From kick-off to a defensible programme in 12 weeks for mid-sized firms; 16–20 weeks for multi-entity groups.</p>
          <Link href="/contact?topic=dora-roadmap"><Button size="lg" className="rounded-full" data-testid="dora-cta">Plan your DORA roadmap<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </section>
    </div>
  );
}
