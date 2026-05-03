import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Stethoscope, CheckCircle2 } from "lucide-react";
import { SEO } from "@/components/SEO";

const RULES = [
  { c: "Privacy Rule", d: "Uses & disclosures of PHI (45 CFR §164.500–534): minimum necessary, NPP, patient rights of access/amendment/accounting, marketing & fundraising rules, de-identification (Safe Harbor & Expert Determination)." },
  { c: "Security Rule", d: "Administrative, physical, and technical safeguards for ePHI (45 CFR §164.302–318) — risk analysis, workforce training, access control, audit controls, transmission security, contingency plan." },
  { c: "Breach Notification Rule", d: "Reportable-breach decision tree (45 CFR §164.400–414), individual + HHS + media (≥500 individuals) notification timelines, business-associate flow-down." },
  { c: "Enforcement Rule", d: "OCR investigation procedures, civil monetary penalties (currently up to $2.0M per violation type per year), self-audit triggers." },
  { c: "Omnibus Rule (2013)", d: "Business-associate direct liability, BAA flow-down, subcontractor reach, marketing/fundraising/sale-of-PHI tightening." },
  { c: "HITECH meaningful-use carryover", d: "EHR audit log, patient access workflows, certified-EHR alignment for providers." },
];

export default function Hipaa() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="HIPAA Compliance Software — Privacy, Security & Breach Notification | Auditee"
        description="HIPAA Privacy, Security, Breach Notification, Enforcement and Omnibus rules pre-configured: BAA register, risk analysis (§164.308), 60-day breach notification timer, NPP & patient rights workflow, ePHI access logging."
        path="/hipaa"
        keywords={["HIPAA", "HIPAA compliance", "HIPAA Security Rule", "HIPAA Privacy Rule", "BAA", "ePHI", "breach notification", "OCR audit", "HITECH"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/standards" className="text-sm text-slate-700 hover:text-primary">Standards</Link>
            <Link href="/ai-for-healthcare" className="text-sm text-slate-700 hover:text-primary">Healthcare</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Stethoscope className="h-10 w-10 mx-auto text-primary mb-4" />
          <span className="inline-block text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-full px-2.5 py-1 mb-3">HIPAA · 45 CFR Parts 160, 162, 164 · HHS OCR</span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">HIPAA — covered entity & business associate, audit-ready</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            Privacy, Security, Breach Notification, Enforcement and Omnibus rules pre-configured. BAA register, risk analysis, 60-day breach timer, ePHI access logging — for both covered entities and BAs.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/contact?topic=hipaa-readiness"><Button size="lg" className="rounded-full">Book a HIPAA readiness call<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link href="/templates"><Button size="lg" variant="outline" className="rounded-full">Free HIPAA risk-analysis template</Button></Link>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">Rules pre-configured</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {RULES.map((p) => (
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
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">Evidence pack — what an OCR investigator wants</h2>
          <ul className="grid md:grid-cols-2 gap-2">
            {[
              "Risk analysis (§164.308(a)(1)(ii)(A)) with annual refresh",
              "Risk management plan with prioritised remediation",
              "Sanction policy & evidence of enforcement",
              "Workforce-clearance & termination procedures with records",
              "Information-access management with role-based rules",
              "Workforce training & periodic security reminders log",
              "Audit controls (§164.312(b)) — ePHI access logging",
              "Person-or-entity authentication (§164.312(d)) records",
              "Transmission security (§164.312(e)) — encryption attestations",
              "Contingency plan (data backup, DR, emergency-mode operation, testing)",
              "BAA register with current signed agreements + sub-BA flow-down",
              "Breach incident log with 60-day individual + HHS + media notification timer",
              "Notice of Privacy Practices (NPP) — versioned with effective dates",
              "Patient rights workflow: access, amendment, accounting of disclosures, restriction, confidential comms",
            ].map((d) => (
              <li key={d} className="flex items-start gap-2 text-sm text-slate-800"><CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />{d}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-6 prose prose-slate prose-headings:font-display prose-headings:text-slate-950">
          <h2>BA vs Covered Entity — Auditee runs both</h2>
          <p>If you sell software that touches ePHI you're a Business Associate; if you're a hospital, payer, or clearinghouse you're a Covered Entity. The obligations overlap but diverge — patient-rights workflows matter for CEs; BAA-flowdown and sub-BA monitoring matter most for BAs. Auditee detects your role on workspace setup and shows the right surface.</p>

          <h2>The 60-day breach clock starts when?</h2>
          <p>Most enforcement actions stem from late notification. The clock starts on <em>discovery</em> — defined as the day a workforce member knew or should have known. Auditee's incident workflow stamps the discovery moment, runs the four-factor risk-of-compromise assessment, and routes the notification with countdown timers per stakeholder (individual, HHS, media if ≥500).</p>

          <h2>Pre-mapped neighbour standards</h2>
          <ul>
            <li><strong>HITRUST CSF</strong> — control mapping for the prescriptive overlay many BAs need.</li>
            <li><strong>SOC 2</strong> — administrative/technical safeguards reuse SOC 2 CC6/CC7 evidence.</li>
            <li><strong>NIST 800-66r2</strong> — official HHS implementation guidance for the Security Rule.</li>
            <li><strong>FDA QMSR + IEC 62304</strong> — for SaMD that also touches ePHI.</li>
          </ul>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">OCR-defensible in 60 days</h2>
          <p className="text-slate-300 mb-6">From kick-off to a defensible HIPAA programme in 8 weeks for BAs; 12–16 weeks for multi-site Covered Entities.</p>
          <Link href="/contact?topic=hipaa-roadmap"><Button size="lg" className="rounded-full" data-testid="hipaa-cta">Plan your HIPAA roadmap<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </section>
    </div>
  );
}
