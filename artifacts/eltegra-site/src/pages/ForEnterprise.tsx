import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, ShieldCheck, Server, KeyRound, FileSignature, Headphones } from "lucide-react";
import { SEO } from "@/components/SEO";

const PILLARS = [
  { icon: Server, title: "Single-tenant or on-prem", desc: "Dedicated VPC, customer-pinned region, or fully air-gapped deployment with our Helm chart and bundled offline LLM (Llama 3 70B / Mistral)." },
  { icon: KeyRound, title: "BYO-LLM, BYO-keys", desc: "Route AI features to Anthropic, Azure OpenAI, Bedrock or your on-prem inference. Customer-managed encryption keys with AWS KMS or HashiCorp Vault." },
  { icon: ShieldCheck, title: "SOC 2 Type II + ISO 27001 path", desc: "Current SOC 2 Type II report; ISO 27001 in audit. SAML SSO + SCIM. Field-level audit logs streamed to your SIEM (Splunk, Datadog, Elastic)." },
  { icon: FileSignature, title: "Procurement-friendly contracting", desc: "Pre-signed MSA + DPA + BAA (HIPAA) + SCCs. Custom redlines welcome. Multi-year, multi-currency (USD / EUR / GBP / INR / AED)." },
  { icon: Headphones, title: "Named CSM + 24×7 P1", desc: "Named Customer Success Manager, named Solutions Architect, 30-min P1 response 24×7, quarterly business reviews and a named exec sponsor." },
  { icon: Building2, title: "Programme onboarding, not just product", desc: "We help your auditors, suppliers and contract manufacturers ingest and operate Auditee — not just your direct engineers." },
];

const READY = [
  "Tier-1 automotive OEMs (ASPICE 4.0 + ISO 26262)",
  "Listed MedTech (FDA QMSR + ISO 13485 + IEC 62304)",
  "European MedDevices (MDR 2017/745 + IVDR 2017/746)",
  "Banks &amp; NBFCs (RBI master directions + DPDP Act 2023)",
  "Defence-tech (controlled-export-friendly air-gapped install)",
];

export default function ForEnterprise() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Auditee for Enterprise — Single-Tenant, On-Prem, BYO-LLM, SOC 2"
        description="Single-tenant or air-gapped on-prem Auditee deployments with BYO-LLM, customer-managed keys, SAML SSO + SCIM, named CSM, 24×7 P1 support and pre-signed MSA + DPA + BAA + SCCs."
        path="/for-enterprise"
        keywords={["enterprise compliance SaaS", "single-tenant ALM", "on-prem requirements management", "air-gapped compliance", "BYO-LLM enterprise", "BAA HIPAA SaaS"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/for-startups" className="text-sm text-slate-700 hover:text-primary">For startups</Link>
            <Link href="/security" className="text-sm text-slate-700 hover:text-primary">Security</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-20 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Building2 className="h-10 w-10 mx-auto text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Auditee for the enterprise</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            Single-tenant, on-prem or air-gapped deployments with BYO-LLM, customer-managed keys, named support, and a pre-signed contracting stack your procurement team will actually approve.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-5">
            {PILLARS.map((p) => (
              <div key={p.title} className="bg-white border border-slate-200 rounded-2xl p-6">
                <p.icon className="h-8 w-8 text-primary mb-3" />
                <div className="font-display font-bold text-lg text-slate-950">{p.title}</div>
                <div className="text-sm text-slate-700 mt-2">{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">Audit-ready for</h2>
          <ul className="grid md:grid-cols-2 gap-3">
            {READY.map((r) => (
              <li key={r} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                <span className="text-sm text-slate-800" dangerouslySetInnerHTML={{ __html: r }} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-6 prose prose-slate prose-headings:font-display prose-headings:text-slate-950">
          <h2>Pricing &amp; commercials</h2>
          <p>Enterprise pricing is set after a 30-min scoping call (deployment topology, projected user count, data-residency, AI configuration). We commit to a written quote within 5 business days. Multi-year and multi-currency billing supported.</p>
          <h2>Procurement &amp; legal</h2>
          <ul>
            <li>Pre-signed MSA, DPA (<Link href="/dpa" className="text-primary underline">/dpa</Link>), BAA (HIPAA) and EU SCCs.</li>
            <li>Sub-processor list and 30-day notice policy at <Link href="/sub-processors" className="text-primary underline">/sub-processors</Link>.</li>
            <li>Custom SLA addendum supported (see <Link href="/sla" className="text-primary underline">/sla</Link>).</li>
            <li>Vendor security questionnaires (CAIQ, SIG, SIG-Lite) returned within 5 business days.</li>
          </ul>
          <h2>Migration</h2>
          <p>Fixed-fee migration from DOORS, Jama, Polarion, codeBeamer, Helix RM, Confluence/Jira and Word/Excel. Typical 2–6 weeks with a written reconciliation report. See <Link href="/migrations" className="text-primary underline">/migrations</Link>.</p>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Talk to enterprise sales</h2>
          <p className="text-slate-300 mb-6">30-minute scoping call. Written quote and security questionnaire within 5 business days.</p>
          <Link href="/contact?topic=enterprise">
            <Button size="lg" className="rounded-full" data-testid="for-enterprise-contact-cta">Book a scoping call<ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
