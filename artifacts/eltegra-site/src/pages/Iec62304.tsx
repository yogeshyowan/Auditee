import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, HeartPulse, CheckCircle2 } from "lucide-react";
import { SEO } from "@/components/SEO";

const CLAUSES = [
  { c: "Clause 4", n: "General requirements", d: "Quality management system, risk management, software safety classification (Class A / B / C), software development plan." },
  { c: "Clause 5", n: "Software development process", d: "Planning, requirements analysis, architectural design, detailed design, unit implementation & verification, integration & verification, system testing, release." },
  { c: "Clause 6", n: "Software maintenance process", d: "Maintenance plan, problem & modification analysis, modification implementation, verification, communication." },
  { c: "Clause 7", n: "Software risk management process", d: "Hazardous-situation analysis, risk control, software changes triggering risk re-evaluation." },
  { c: "Clause 8", n: "Software configuration management", d: "Configuration identification, change control, status accounting, baseline release." },
  { c: "Clause 9", n: "Software problem resolution", d: "Problem reports, investigation, change requests, advisory notices, trend analysis." },
];

const ARTEFACTS = [
  "Software safety classification rationale (Class A/B/C per item)",
  "Software development plan",
  "Software requirements specification (with safety-classification per requirement)",
  "Software architecture document with SOUP register",
  "Software unit verification & integration test results",
  "System-level test results & traceability matrix",
  "Anomaly list at release",
  "SOUP (software-of-unknown-provenance) register & monitoring records",
  "Problem reports, change requests & resolution evidence",
  "Configuration baselines + release notes",
];

export default function Iec62304() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="IEC 62304 Compliance Software — Medical Device Software Lifecycle | Auditee"
        description="IEC 62304:2006+A1:2015 fully pre-configured. Software safety classification (Class A/B/C), SOUP register, problem-resolution log, traceability matrix and audit-ready release packages. Pre-mapped to ISO 13485 and FDA QMSR."
        path="/iec-62304"
        keywords={["IEC 62304", "IEC 62304 compliance", "medical device software", "MDSAP", "software safety classification", "SOUP register", "Class A B C software"]}
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
          <HeartPulse className="h-10 w-10 mx-auto text-primary mb-4" />
          <span className="inline-block text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-full px-2.5 py-1 mb-3">IEC 62304:2006+A1:2015 · IEC</span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">IEC 62304 — medical device software, audit-ready</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            Software safety classification, SOUP register, problem-resolution log and a release-ready evidence pack — pre-mapped to ISO 13485, ISO 14971, FDA QMSR and EU MDR.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/contact?topic=iec62304-demo"><Button size="lg" className="rounded-full">Book an IEC 62304 demo<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link href="/templates"><Button size="lg" variant="outline" className="rounded-full">Free IEC 62304 template</Button></Link>
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
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">Release-pack artefacts</h2>
          <ul className="grid md:grid-cols-2 gap-2">
            {ARTEFACTS.map((d) => (
              <li key={d} className="flex items-start gap-2 text-sm text-slate-800"><CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />{d}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-6 prose prose-slate prose-headings:font-display prose-headings:text-slate-950">
          <h2>Why software safety classification is the hinge</h2>
          <p>IEC 62304 derives every other obligation from the software safety class (A: no injury possible, B: non-serious injury possible, C: death/serious injury possible). Misclassify and you either over-engineer (Class C work for Class A software) or under-engineer (and fail your notified-body audit). Auditee captures the classification rationale per software item, links it to the ISO 14971 risk file, and re-evaluates automatically when a hazard or control changes.</p>

          <h2>Pre-mapped neighbour standards</h2>
          <ul>
            <li><strong>ISO 13485</strong> — DHF tabs auto-link to IEC 62304 work products.</li>
            <li><strong>ISO 14971</strong> — risk-control measures referenced from software requirements; changes propagate.</li>
            <li><strong>FDA QMSR (post-Feb 2026)</strong> — IEC 62304 is incorporated by reference; we expose both the ISO clause and the 21 CFR 820 equivalent.</li>
            <li><strong>EU MDR Annex II</strong> — IEC 62304 evidence assembled into the technical-documentation skeleton.</li>
            <li><strong>FDA Cybersecurity (2023 final guidance)</strong> — SBOM and SOUP register reused as the bill-of-materials.</li>
          </ul>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Submit-ready in a quarter</h2>
          <p className="text-slate-300 mb-6">From kick-off to a notified-body-ready release in 12 weeks for new device software, 6 weeks for legacy retrofits.</p>
          <Link href="/contact?topic=iec62304-roadmap"><Button size="lg" className="rounded-full" data-testid="iec62304-cta">Plan your IEC 62304 roadmap<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </section>
    </div>
  );
}
