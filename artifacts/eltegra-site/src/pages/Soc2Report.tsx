import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, ShieldCheck, CheckCircle2, Clock, Lock } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TSCs = [
  { code: "CC", name: "Common Criteria (Security)", controls: 33, status: "In scope" },
  { code: "A", name: "Availability", controls: 6, status: "In scope" },
  { code: "C", name: "Confidentiality", controls: 7, status: "In scope" },
  { code: "PI", name: "Processing Integrity", controls: 9, status: "In scope" },
  { code: "P", name: "Privacy", controls: 9, status: "Out of scope (covered by GDPR / DPDP / DPA)" },
];

const TIMELINE = [
  { phase: "Drata onboarding", status: "done", note: "All controls instrumented; continuous monitoring live." },
  { phase: "Pre-audit readiness review", status: "done", note: "Independent advisor; 0 critical, 3 medium gaps remediated." },
  { phase: "Type I observation period", status: "done", note: "Point-in-time audit complete; report issued internally." },
  { phase: "Type II observation period (6 months)", status: "in-progress", note: "Started Q1 2026; ends Q2 2026." },
  { phase: "Auditor fieldwork", status: "planned", note: "Q3 2026; firm engaged (named under NDA)." },
  { phase: "SOC 2 Type II report issued", status: "planned", note: "Target Q3 2026. Available to customers under NDA." },
];

function StatusBadge({ s }: { s: string }) {
  if (s === "done") return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1" />Done</Badge>;
  if (s === "in-progress") return <Badge className="bg-sky-100 text-sky-800 border-sky-200"><Clock className="w-3 h-3 mr-1" />In progress</Badge>;
  return <Badge variant="outline">Planned</Badge>;
}

export default function Soc2Report() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="SOC 2 Type II — Status & Report Request | Auditee"
        description="Auditee's SOC 2 Type II programme status, scope (Security, Availability, Confidentiality, Processing Integrity), control count, observation window and timeline. Report issued under NDA."
        path="/soc2"
        keywords={["Auditee SOC 2", "SOC 2 Type II", "SOC 2 report", "trust services criteria"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/trust" className="text-sm text-slate-700 hover:text-primary">Trust</Link>
            <Link href="/security" className="text-sm text-slate-700 hover:text-primary">Security</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6">
          <ShieldCheck className="h-10 w-10 text-primary mb-4" />
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950">SOC 2 Type II</h1>
            <Badge className="bg-sky-100 text-sky-800 border-sky-200">In progress</Badge>
          </div>
          <p className="text-slate-700">Independent attestation of design and operating effectiveness over a 6-month observation window. Target issue date Q3 2026.</p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-4xl mx-auto px-6 grid md:grid-cols-3 gap-4 mb-10">
          <Card className="p-5">
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Auditor</div>
            <div className="text-lg font-semibold text-slate-900">Big-4 firm</div>
            <div className="text-xs text-slate-500 mt-1">Name disclosed under NDA</div>
          </Card>
          <Card className="p-5">
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Observation window</div>
            <div className="text-lg font-semibold text-slate-900">6 months</div>
            <div className="text-xs text-slate-500 mt-1">Q1 2026 → Q2 2026</div>
          </Card>
          <Card className="p-5">
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Continuous monitoring</div>
            <div className="text-lg font-semibold text-slate-900">Drata</div>
            <div className="text-xs text-slate-500 mt-1">100% of controls auto-evidenced</div>
          </Card>
        </div>

        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-display text-2xl font-bold text-slate-950 mb-4">Trust Services Criteria in scope</h2>
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white mb-12">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold w-16">Code</th>
                  <th className="text-left px-4 py-3 font-semibold">Criterion</th>
                  <th className="text-left px-4 py-3 font-semibold w-24">Controls</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {TSCs.map((t) => (
                  <tr key={t.code}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-900">{t.code}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{t.name}</td>
                    <td className="px-4 py-3 text-slate-700">{t.controls}</td>
                    <td className="px-4 py-3 text-slate-700">{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="font-display text-2xl font-bold text-slate-950 mb-4">Programme timeline</h2>
          <div className="space-y-3">
            {TIMELINE.map((step, i) => (
              <Card key={step.phase} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="font-mono text-xs text-slate-400 w-6 pt-0.5">{String(i + 1).padStart(2, "0")}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-semibold text-slate-900">{step.phase}</span>
                      <StatusBadge s={step.status} />
                    </div>
                    <p className="text-sm text-slate-600">{step.note}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 mt-12">
          <Card className="p-6 bg-slate-50 border-slate-200">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-slate-700 mt-0.5 shrink-0" />
              <div className="text-sm text-slate-700">
                <strong className="text-slate-900">Why isn't the report public?</strong> SOC 2 Type II reports contain detailed control descriptions, sample sizes, and identified exceptions whose disclosure could reduce protection for customers. We follow industry practice and release the report under mutual NDA. We can typically counter-sign and share within 1 business day.
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Need the SOC 2 report or bridge letter?</h2>
          <p className="text-slate-300 mb-6">Once issued (target Q3 2026), available under NDA. In the interim, request a bridge letter or our pre-audit readiness summary.</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/contact?topic=soc2">
              <Button size="lg" className="rounded-full" data-testid="soc2-contact-cta">
                Request report / bridge letter<ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/security-questionnaire">
              <Button size="lg" variant="outline" className="rounded-full text-white border-white/40 hover:bg-white hover:text-slate-950">
                <FileText className="mr-2 h-4 w-4" /> Security questionnaire
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
