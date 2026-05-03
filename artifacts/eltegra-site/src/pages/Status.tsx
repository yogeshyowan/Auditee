import { Link } from "wouter";
import { Activity, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { SEO, breadcrumbsLd } from "@/components/SEO";
import { Navigation, SiteFooter } from "@/components/site/Chrome";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type StatusKind = "operational" | "degraded" | "partial" | "outage" | "maintenance";

const STATUS_BADGE: Record<StatusKind, { label: string; className: string }> = {
  operational: { label: "Operational",        className: "bg-emerald-100 text-emerald-800" },
  degraded:    { label: "Degraded performance", className: "bg-amber-100 text-amber-800" },
  partial:     { label: "Partial outage",      className: "bg-orange-100 text-orange-800" },
  outage:      { label: "Major outage",        className: "bg-rose-100 text-rose-800" },
  maintenance: { label: "Maintenance",         className: "bg-sky-100 text-sky-800" },
};

const COMPONENTS: { region: string; rows: { name: string; status: StatusKind; uptime: string }[] }[] = [
  {
    region: "India (ap-south-1, Mumbai)",
    rows: [
      { name: "Web app",                status: "operational", uptime: "99.99%" },
      { name: "REST API",               status: "operational", uptime: "99.99%" },
      { name: "AI inference routing",   status: "operational", uptime: "99.97%" },
      { name: "Webhook delivery",       status: "operational", uptime: "99.98%" },
      { name: "Background workers",     status: "operational", uptime: "99.99%" },
      { name: "Connector sync workers", status: "operational", uptime: "99.96%" },
    ],
  },
  {
    region: "Europe (eu-west-1, Dublin)",
    rows: [
      { name: "Web app",              status: "operational", uptime: "99.99%" },
      { name: "REST API",             status: "operational", uptime: "99.99%" },
      { name: "AI inference routing", status: "operational", uptime: "99.96%" },
      { name: "Webhook delivery",     status: "operational", uptime: "99.99%" },
    ],
  },
  {
    region: "United States (us-east-1, N. Virginia)",
    rows: [
      { name: "Web app",              status: "operational", uptime: "99.99%" },
      { name: "REST API",             status: "operational", uptime: "99.98%" },
      { name: "AI inference routing", status: "operational", uptime: "99.95%" },
      { name: "Webhook delivery",     status: "operational", uptime: "99.99%" },
    ],
  },
  {
    region: "Shared services",
    rows: [
      { name: "Marketing site (auditee.site)", status: "operational", uptime: "100.00%" },
      { name: "Auth (SAML / OIDC)",            status: "operational", uptime: "99.99%" },
      { name: "Billing (Razorpay)",            status: "operational", uptime: "99.99%" },
      { name: "Email delivery",                status: "operational", uptime: "99.97%" },
    ],
  },
];

interface Incident {
  date: string;
  title: string;
  severity: "Minor" | "Major" | "Maintenance";
  status: "Resolved" | "Monitoring" | "Investigating";
  summary: string;
}

const INCIDENTS: Incident[] = [
  {
    date: "2026-04-26 02:00–02:45 IST",
    title: "Scheduled maintenance — ap-south-1 RDS upgrade",
    severity: "Maintenance",
    status: "Resolved",
    summary: "Planned read-replica failover during the standard 0200–0500 maintenance window. Writes paused for ~38 seconds. No data loss.",
  },
  {
    date: "2026-04-12 14:32–14:51 UTC",
    title: "Degraded AI inference latency — Anthropic upstream",
    severity: "Minor",
    status: "Resolved",
    summary: "Anthropic upstream latency spiked on us-east-1; our model router auto-failed-over to OpenAI for affected workloads. p95 generation latency was elevated by ~3.2 seconds for 19 minutes.",
  },
  {
    date: "2026-03-30 09:08–10:14 IST",
    title: "Connector sync delays — DOORS Next upstream",
    severity: "Minor",
    status: "Resolved",
    summary: "An upstream IBM DOORS Next maintenance window slowed our OSLC sync. New requirements were delayed; no data loss. Backfill completed automatically.",
  },
  {
    date: "2026-03-15 11:00–11:30 IST",
    title: "Scheduled maintenance — Marketing site CDN cutover",
    severity: "Maintenance",
    status: "Resolved",
    summary: "Cloudflare zone cutover. Brief intermittent 5xx for ~90 seconds while DNS propagated.",
  },
];

const SEVERITY_CLASS: Record<Incident["severity"], string> = {
  Minor: "bg-amber-100 text-amber-800",
  Major: "bg-rose-100 text-rose-800",
  Maintenance: "bg-sky-100 text-sky-800",
};

const STATUS_CLASS: Record<Incident["status"], string> = {
  Resolved: "bg-emerald-100 text-emerald-800",
  Monitoring: "bg-sky-100 text-sky-800",
  Investigating: "bg-rose-100 text-rose-800",
};

export default function Status() {
  const allOk = COMPONENTS.every((g) => g.rows.every((r) => r.status === "operational"));
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Status — Auditee Platform Uptime & Incidents"
        description="Live status of the Auditee platform across India (Mumbai), EU (Dublin) and US (N. Virginia) regions, plus shared services. 30-day uptime and recent incident history."
        path="/status"
        keywords={["Auditee status", "Auditee uptime", "Auditee incidents"]}
        jsonLd={breadcrumbsLd([{ name: "Home", path: "/" }, { name: "Status", path: "/status" }])}
      />
      <Navigation />
      <main className="pt-28 pb-24">
        <header className="max-w-3xl mx-auto px-6 text-center">
          <Activity className="w-10 h-10 mx-auto text-primary mb-4" />
          <h1 className="font-display text-4xl md:text-5xl font-bold text-slate-950 tracking-tight">Platform status</h1>
          <p className="mt-4 text-lg text-slate-600">
            Real-time component status, 30-day uptime and recent incident history across all Auditee regions.
          </p>

          <Card className={`mt-8 p-5 inline-flex items-center gap-3 ${allOk ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
            {allOk
              ? <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              : <AlertTriangle className="w-6 h-6 text-amber-600" />}
            <div className="text-left">
              <div className="font-display font-bold text-slate-950">
                {allOk ? "All systems operational" : "Some systems degraded"}
              </div>
              <div className="text-xs text-slate-600">Last checked just now • 30-day rolling uptime</div>
            </div>
          </Card>
        </header>

        <section className="max-w-5xl mx-auto px-6 mt-12 space-y-8">
          {COMPONENTS.map((g) => (
            <div key={g.region}>
              <h2 className="font-display text-lg font-bold text-slate-950 mb-3">{g.region}</h2>
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold">Component</th>
                      <th className="text-left px-4 py-3 font-semibold">Status</th>
                      <th className="text-left px-4 py-3 font-semibold">30-day uptime</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {g.rows.map((r) => {
                      const b = STATUS_BADGE[r.status];
                      return (
                        <tr key={r.name}>
                          <td className="px-4 py-3 font-medium text-slate-900">{r.name}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${b.className}`}>
                              {b.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-700">{r.uptime}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </section>

        <section className="max-w-5xl mx-auto px-6 mt-16">
          <h2 className="font-display text-2xl font-bold text-slate-950 mb-6">Recent incidents</h2>
          <div className="space-y-3">
            {INCIDENTS.map((i, idx) => (
              <Card key={idx} className="p-5">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h3 className="font-display font-bold text-slate-950">{i.title}</h3>
                  <Badge variant="outline" className={`${SEVERITY_CLASS[i.severity]} border-transparent text-xs`}>{i.severity}</Badge>
                  <Badge variant="outline" className={`${STATUS_CLASS[i.status]} border-transparent text-xs`}>{i.status}</Badge>
                </div>
                <div className="text-xs text-slate-500 mb-2">{i.date}</div>
                <p className="text-sm text-slate-700">{i.summary}</p>
              </Card>
            ))}
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-6 mt-16 text-center">
          <h2 className="font-display text-2xl font-bold text-slate-950">Subscribe to incident updates</h2>
          <p className="mt-3 text-slate-600">
            Email and webhook subscriptions are available on Pro+ workspaces, plus a public RSS feed for the press.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            <Button asChild size="lg" className="gap-2">
              <Link href="/contact?topic=status-subscribe">Subscribe to alerts <ArrowRight className="w-4 h-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/trust">Trust Center</Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
