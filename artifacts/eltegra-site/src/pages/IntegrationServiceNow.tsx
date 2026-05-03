import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Workflow, CheckCircle2, ArrowLeftRight } from "lucide-react";
import { SEO } from "@/components/SEO";

const CAPS = [
  "GRC / IRM module sync — Auditee controls, risks and policies sync into ServiceNow GRC tables (sn_compliance_control, sn_risk_risk, sn_policy_policy)",
  "ITSM linkage — Auditee incidents and CAPAs map to ServiceNow incident, problem and change records",
  "CMDB-aware — Auditee assets pull from ServiceNow CMDB; lifecycle changes propagate to risk & control mapping",
  "Approval workflows — Use ServiceNow Workflow Studio steps to approve Auditee baseline changes, with the signed approval record landing back in Auditee",
  "Service Catalog items — \"Request a new requirement set\" and \"Onboard a new sub-processor\" forms launch Auditee processes",
  "ServiceNow Now Platform certified scripted REST + flow actions; works on Washington DC, Xanadu and Yokohama releases",
  "OAuth via ServiceNow OAuth 2.0 application registry, or basic auth + MFA-protected service account",
  "Customer-pinned region; IL-isolated mid-server option for restricted networks",
];

const STEPS = [
  { n: 1, t: "Install the Auditee scoped app from the ServiceNow Store (or import the update set we provide for closed instances)" },
  { n: 2, t: "In ServiceNow, register the OAuth application — Auditee provides the redirect URLs and scopes" },
  { n: 3, t: "In Auditee, paste your instance URL and authorise via OAuth" },
  { n: 4, t: "Map Auditee → ServiceNow tables with the drag-and-drop matcher (controls → sn_compliance_control, etc.)" },
  { n: 5, t: "Run a dry-run, then activate. Records flow within minutes; flow actions become available in Workflow Studio" },
];

export default function IntegrationServiceNow() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Auditee + ServiceNow — GRC / IRM, ITSM, CMDB & Workflow Studio Integration"
        description="Sync Auditee controls, risks, policies, incidents and CAPAs with ServiceNow GRC/IRM, ITSM and CMDB. Workflow Studio approvals, scripted REST + flow actions, OAuth, mid-server option. Washington DC, Xanadu, Yokohama supported."
        path="/integrations/servicenow"
        keywords={["Auditee ServiceNow integration", "ServiceNow GRC integration", "ServiceNow IRM", "ServiceNow CMDB", "Workflow Studio", "scoped app", "ServiceNow Store"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/integrations" className="text-sm text-slate-700 hover:text-primary">All integrations</Link>
            <Link href="/developers" className="text-sm text-slate-700 hover:text-primary">API docs</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Workflow className="h-10 w-10 mx-auto text-primary mb-4" />
          <span className="inline-block text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1 mb-3">Integration · ServiceNow Now Platform</span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Auditee + ServiceNow — one source of truth, two surfaces</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            Controls, risks, policies, incidents and CAPAs sync between Auditee and ServiceNow GRC/IRM, ITSM and CMDB. Workflow Studio approvals with signed audit trail. Washington DC / Xanadu / Yokohama.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/contact?topic=servicenow-integration"><Button size="lg" className="rounded-full">Talk to integrations<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link href="/developers"><Button size="lg" variant="outline" className="rounded-full">See the API</Button></Link>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">What you get</h2>
          <ul className="space-y-3">
            {CAPS.map((c) => (
              <li key={c} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                <span className="text-sm text-slate-800">{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6 flex items-center gap-2"><ArrowLeftRight className="h-6 w-6 text-primary" />Five-step setup</h2>
          <ol className="space-y-3">
            {STEPS.map((s) => (
              <li key={s.n} className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-semibold shrink-0">{s.n}</span>
                <div className="text-sm text-slate-800 mt-1">{s.t}</div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-6 prose prose-slate prose-headings:font-display prose-headings:text-slate-950">
          <h2>Why pair Auditee with ServiceNow GRC?</h2>
          <p>ServiceNow GRC/IRM is exceptional at <em>workflow orchestration</em> across an enterprise — but it's not where your domain experts (BAs, QA leads, compliance managers, safety engineers) actually <em>do</em> their work. Auditee gives them a domain-native surface (requirements, traceability, standards mapping, evidence capture), then keeps the GRC/IRM record-of-record current via the integration. Your CISO and CRO see one number; your domain experts use the right tool.</p>

          <h2>CMDB-aware risk &amp; control mapping</h2>
          <p>When your CMDB tags an asset as critical-business-service, Auditee re-evaluates the controls and risks attached to it (DORA criticality, SOC 2 boundary, GDPR processing-activity scope). When you decommission an asset in CMDB, Auditee retires the linked controls — no orphaned controls cluttering your GRC dashboards.</p>

          <h2>Security &amp; compliance</h2>
          <ul>
            <li>OAuth 2.0 via ServiceNow's OAuth registry; basic auth + MFA service-account fallback for closed instances.</li>
            <li>Scoped-app permissions — only the tables you authorised are touched.</li>
            <li>Customer-pinned region (ap-south-1 / eu-central-1).</li>
            <li>Field-level audit log of every sync action streamed to your SIEM and visible in ServiceNow's own audit log.</li>
          </ul>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Want a live walkthrough?</h2>
          <p className="text-slate-300 mb-6">30-min demo against a ServiceNow PDI (Personal Developer Instance) — or your own dev instance, your choice.</p>
          <Link href="/contact?topic=servicenow-walkthrough"><Button size="lg" className="rounded-full" data-testid="servicenow-cta">Book a ServiceNow walkthrough<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </section>
    </div>
  );
}
