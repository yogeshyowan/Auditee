import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Activity, AlertTriangle, Clock } from "lucide-react";
import { SEO } from "@/components/SEO";

const TIERS = [
  { plan: "Free", uptime: "Best effort", responseP1: "—", responseP2: "—", credits: "None" },
  { plan: "Standard", uptime: "99.5%", responseP1: "8 business hrs", responseP2: "1 business day", credits: "10% of monthly fee per 0.1% miss" },
  { plan: "Professional", uptime: "99.9%", responseP1: "4 business hrs", responseP2: "8 business hrs", credits: "15% of monthly fee per 0.1% miss" },
  { plan: "Enterprise", uptime: "99.95% (single-tenant) · 99.99% (HA option)", responseP1: "30 minutes 24×7", responseP2: "2 hrs 24×7", credits: "25% of monthly fee, capped at 100%" },
];

const SEVERITY = [
  { sev: "P1 — Critical", desc: "Production unavailable for all users, data loss, or active security incident." },
  { sev: "P2 — High", desc: "Major feature unavailable or severely degraded. A workaround may exist." },
  { sev: "P3 — Medium", desc: "A non-critical feature is impaired but the workaround is acceptable." },
  { sev: "P4 — Low", desc: "Cosmetic, documentation, or feature requests. No functional impact." },
];

export default function Sla() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Service Level Agreement (SLA) — Auditee"
        description="Auditee's Service Level Agreement covering uptime commitments, support response times, severity definitions, service credits, and exclusions for Standard, Professional and Enterprise plans."
        path="/sla"
        keywords={["Auditee SLA", "uptime guarantee", "enterprise SaaS SLA", "support response times", "service credits"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/status" className="text-sm text-slate-700 hover:text-primary">Status</Link>
            <Link href="/trust" className="text-sm text-slate-700 hover:text-primary">Trust</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <ShieldCheck className="h-10 w-10 mx-auto text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Service Level Agreement</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            Auditee's contractual uptime, support response and service-credit commitments per plan. Effective for all customers from 03 May 2026.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <div className="flex items-center gap-2 mb-4 text-slate-700">
            <Activity className="h-5 w-5" /><h2 className="font-display font-bold text-2xl text-slate-950">Uptime &amp; response by plan</h2>
          </div>
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <table className="min-w-full text-sm border border-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Plan</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Uptime</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">P1 response</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">P2 response</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Service credits</th>
                </tr>
              </thead>
              <tbody>
                {TIERS.map((t) => (
                  <tr key={t.plan} className="border-t border-slate-200 align-top">
                    <td className="px-4 py-3 font-semibold text-slate-900">{t.plan}</td>
                    <td className="px-4 py-3 text-slate-700">{t.uptime}</td>
                    <td className="px-4 py-3 text-slate-700">{t.responseP1}</td>
                    <td className="px-4 py-3 text-slate-700">{t.responseP2}</td>
                    <td className="px-4 py-3 text-slate-700">{t.credits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 mt-3">Uptime is measured against the live status page (status.auditee.site) on a calendar-month basis. Scheduled maintenance windows announced ≥7 days in advance are excluded.</p>
        </div>
      </section>

      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <div className="flex items-center gap-2 mb-4 text-slate-700">
            <AlertTriangle className="h-5 w-5" /><h2 className="font-display font-bold text-2xl text-slate-950">Severity definitions</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {SEVERITY.map((s) => (
              <div key={s.sev} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="font-semibold text-slate-900">{s.sev}</div>
                <div className="text-sm text-slate-600 mt-1">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-6 prose prose-slate prose-headings:font-display prose-headings:text-slate-950">
          <div className="flex items-center gap-2 not-prose mb-2 text-slate-700"><Clock className="h-5 w-5" /><h2 className="m-0">Exclusions</h2></div>
          <p>The uptime commitment does not apply to:</p>
          <ul>
            <li>Force majeure events including natural disasters, regional power or backbone outages, and government action.</li>
            <li>Failures of customer-controlled components — VPN, SSO IdP, on-prem ingestion agents, customer-managed LLM endpoints.</li>
            <li>Beta and labs features marked as such in the UI or release notes.</li>
            <li>Periods during which the customer account is suspended for non-payment, abuse or breach of the AUP.</li>
            <li>Scheduled maintenance announced at least 7 days in advance, capped at 4 hours per calendar month.</li>
          </ul>

          <h2>How to claim a service credit</h2>
          <p>
            Email <a href="mailto:sla@auditee.site" className="text-primary underline">sla@auditee.site</a> within 30 days of the calendar month in which the miss occurred, including the affected workspace and the specific status-page incident IDs. Credits are applied to the next invoice and cannot be exchanged for cash.
          </p>

          <h2>Single-tenant &amp; on-prem customers</h2>
          <p>
            Enterprise customers running single-tenant or on-prem deployments receive a customised SLA addendum that reflects the agreed deployment topology, recovery objectives (RPO/RTO) and dedicated support hours.
          </p>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Need a custom SLA?</h2>
          <p className="text-slate-300 mb-6">Talk to our enterprise team about higher uptime commitments, dedicated support, and on-prem deployment options.</p>
          <Link href="/contact?topic=enterprise-sla">
            <Button size="lg" className="rounded-full" data-testid="sla-contact-cta">
              Contact enterprise sales
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
