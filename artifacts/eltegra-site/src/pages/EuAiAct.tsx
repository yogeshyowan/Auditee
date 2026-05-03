import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, CheckCircle2 } from "lucide-react";
import { SEO } from "@/components/SEO";

const TIMELINE = [
  { d: "1 Aug 2024", t: "Entry into force (Regulation (EU) 2024/1689)." },
  { d: "2 Feb 2025", t: "Prohibitions on unacceptable-risk AI practices apply (Art. 5). AI literacy obligation (Art. 4) starts." },
  { d: "2 Aug 2025", t: "GPAI model obligations (Art. 51–55) apply. Notifying authority + governance provisions in force. Penalties applicable." },
  { d: "2 Aug 2026", t: "High-risk-AI-system requirements broadly applicable (most of Title III)." },
  { d: "2 Aug 2027", t: "High-risk Annex I products (existing CE-marked sectors) full applicability." },
];

const RISK_TIERS = [
  { t: "Unacceptable risk (banned)", d: "Social scoring by public authorities, real-time remote biometric ID in public spaces (with narrow law-enforcement exceptions), emotion recognition in workplaces & schools, untargeted scraping of facial images, manipulative or exploitative systems." },
  { t: "High-risk", d: "Annex III categories (biometrics, critical infrastructure, education, employment, essential services, law enforcement, migration, justice & democratic processes) + Annex I product-safety AI. Conformity assessment, risk management, data governance, technical documentation, logging, transparency, human oversight, accuracy/robustness/cybersecurity, post-market monitoring." },
  { t: "Limited risk (transparency)", d: "Chatbots, deepfakes, AI-generated content — disclosure obligations under Art. 50." },
  { t: "Minimal/no risk", d: "Most AI systems — no obligations beyond voluntary codes of conduct." },
  { t: "GPAI (general-purpose AI models)", d: "Tiered obligations: all GPAI providers (technical documentation, copyright policy, training-data summary). Systemic-risk GPAI (≥10²⁵ FLOPs training): model evaluations, systemic-risk assessment, incident reporting, cybersecurity." },
];

export default function EuAiAct() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="EU AI Act Compliance Software — Risk Tiers, GPAI, Annex III & High-Risk Conformity | Auditee"
        description="EU AI Act (Regulation (EU) 2024/1689) pre-configured: risk-tier classification, Annex III high-risk obligations, GPAI tier (incl. systemic risk), conformity assessment, technical documentation pack and post-market monitoring."
        path="/eu-ai-act"
        keywords={["EU AI Act", "Regulation 2024/1689", "AI Act", "GPAI", "high-risk AI", "Annex III", "conformity assessment AI", "AI Office", "AI literacy"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/gdpr" className="text-sm text-slate-700 hover:text-primary">GDPR</Link>
            <Link href="/standards" className="text-sm text-slate-700 hover:text-primary">Standards</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Brain className="h-10 w-10 mx-auto text-primary mb-4" />
          <span className="inline-block text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 rounded-full px-2.5 py-1 mb-3">Regulation (EU) 2024/1689 · AI Office · Phased in force 2025–2027</span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">EU AI Act — risk-tiered, conformity-ready</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            Risk-tier classification, Annex III high-risk obligations, GPAI tier (incl. systemic risk), conformity assessment, technical documentation pack and post-market monitoring — pre-configured to the phased applicability calendar.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/contact?topic=ai-act-readiness"><Button size="lg" className="rounded-full">Book an AI Act readiness call<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link href="/templates"><Button size="lg" variant="outline" className="rounded-full">Free AI Act gap template</Button></Link>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">Phased applicability</h2>
          <div className="space-y-3">
            {TIMELINE.map((p) => (
              <div key={p.d} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-4">
                <span className="font-display font-bold text-slate-950 w-32 shrink-0">{p.d}</span>
                <span className="text-sm text-slate-800">{p.t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">Risk tiers — what applies to you</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {RISK_TIERS.map((p) => (
              <div key={p.t} className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="font-display font-bold text-slate-950 mb-1">{p.t}</div>
                <div className="text-sm text-slate-700 mt-1">{p.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">High-risk evidence pack (Title III, Chapter 2)</h2>
          <ul className="grid md:grid-cols-2 gap-2">
            {[
              "Risk-management system spanning the whole AI lifecycle (Art. 9)",
              "Data governance — training, validation, test data quality criteria (Art. 10)",
              "Technical documentation per Annex IV (Art. 11)",
              "Automatic event logging (Art. 12) for traceability",
              "Transparency & user information (Art. 13)",
              "Human oversight measures (Art. 14)",
              "Accuracy, robustness & cybersecurity (Art. 15)",
              "Quality management system for the provider (Art. 17)",
              "Conformity assessment per Annex VI (internal control) or Annex VII (notified body)",
              "EU declaration of conformity + CE marking",
              "Registration in the EU database (Art. 49 / 71)",
              "Post-market monitoring plan (Art. 72) + serious-incident reporting (Art. 73)",
            ].map((d) => (
              <li key={d} className="flex items-start gap-2 text-sm text-slate-800"><CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />{d}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-3xl mx-auto px-6 prose prose-slate prose-headings:font-display prose-headings:text-slate-950">
          <h2>Provider, deployer, importer or distributor?</h2>
          <p>The same AI system can implicate different actors: the firm that <em>builds &amp; places it on the market</em> (provider), the firm that <em>uses it under its authority</em> (deployer), the firm that <em>imports it from outside the EU</em> (importer), and the firm that <em>makes it available</em> (distributor). Each role has distinct obligations. Auditee asks one question on workspace setup and surfaces only the obligations that apply to your role per system.</p>

          <h2>GDPR + AI Act — one programme, two regulators</h2>
          <p>Most high-risk AI systems also process personal data — meaning GDPR &amp; AI Act apply to the same processing. Auditee surfaces both lenses on the same processing record so your DPIA (GDPR Art. 35) and FRIA (AI Act Art. 27) for high-risk deployments share evidence and reviewer comments.</p>

          <h2>Penalties</h2>
          <ul>
            <li>Up to €35 million or 7% of global annual turnover for prohibited-practice violations.</li>
            <li>Up to €15 million or 3% for most high-risk obligation breaches.</li>
            <li>Up to €7.5 million or 1.5% for incorrect, incomplete or misleading information to authorities.</li>
          </ul>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Get ahead of the August 2026 cliff</h2>
          <p className="text-slate-300 mb-6">Most high-risk providers underestimate the conformity-assessment timeline. We've helped programmes start 9 months out and still go down to the wire — start now.</p>
          <Link href="/contact?topic=ai-act-roadmap"><Button size="lg" className="rounded-full" data-testid="ai-act-cta">Plan your AI Act roadmap<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </section>
    </div>
  );
}
