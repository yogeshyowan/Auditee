import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Wrench, Telescope, CheckCircle2 } from "lucide-react";
import { SEO } from "@/components/SEO";

const SHIPPED = [
  { q: "Q1 2026", title: "Razorpay Live billing — INR monthly + annual plans" },
  { q: "Q1 2026", title: "Recurring audits with calendar + email reminders" },
  { q: "Q4 2025", title: "Polarion, codeBeamer & Helix RM ingestion" },
  { q: "Q4 2025", title: "SOC 2 Type II attestation" },
  { q: "Q3 2025", title: "AI requirements deduplication across DOORS / Jama imports" },
];

const NOW = [
  { title: "ASPICE 4.0 evidence pack auto-generator", desc: "One-click export of work products, traceability matrix and review records mapped to ASPICE 4.0 BPs." },
  { title: "FDA QMSR (21 CFR 820 → ISO 13485) crosswalk", desc: "Automated re-mapping of existing QMS evidence as the FDA QMSR transition deadline approaches in Feb 2026." },
  { title: "On-prem / air-gapped deployment installer", desc: "Helm chart + offline LLM (Llama 3 70B / Mistral) for customers with data-residency or classified-network constraints." },
];

const NEXT = [
  { title: "ServiceNow ITSM bi-directional sync", desc: "CAPA tickets, defect escalation and audit findings flow both ways." },
  { title: "Public REST + GraphQL API (Developer plan)", desc: "Same surface our own UI uses, with per-workspace API keys and rate limits." },
  { title: "ReqIF 1.3 round-trip with attribute preservation", desc: "Loss-less import/export for federated supplier programs." },
  { title: "Native Jira Cloud + Azure DevOps work-item mirroring", desc: "Two-way sync with field-level conflict detection." },
];

const LATER = [
  { title: "Multi-region (EU / UAE / SG) data residency", desc: "Customer-selectable home region with regional encryption keys." },
  { title: "BYO-LLM (Anthropic, Google, Azure OpenAI, Bedrock, on-prem)", desc: "Pluggable model layer with per-workspace routing." },
  { title: "Digital-twin simulation for safety-critical requirements", desc: "Run requirement sets against a behavioural model and flag contradictions before code." },
  { title: "Marketplace for compliance content packs", desc: "Industry-vetted control libraries (HITRUST, PCI-DSS 4.0, NIS2, DORA)." },
];

export default function Roadmap() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Auditee Public Roadmap — What We're Building Next"
        description="Auditee's public product roadmap. See what's shipped, what's in active development now, what's planned next quarter, and what we're researching for later. Updated monthly."
        path="/roadmap"
        keywords={["Auditee roadmap", "PDLC roadmap", "AI compliance roadmap", "ASPICE roadmap", "FDA QMSR transition"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/changelog" className="text-sm text-slate-700 hover:text-primary">Changelog</Link>
            <Link href="/pricing" className="text-sm text-slate-700 hover:text-primary">Pricing</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-4">Public roadmap</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            We build in the open. Here's what we've shipped, what we're working on right now, what's queued next, and what's on our research horizon. Updated on the first Monday of every month.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-2 mb-4 text-emerald-600">
                <Sparkles className="h-5 w-5" />
                <h2 className="font-display font-bold text-xl text-slate-950">Now</h2>
              </div>
              <p className="text-sm text-slate-600 mb-5">Active development this quarter.</p>
              <ul className="space-y-4">
                {NOW.map((it) => (
                  <li key={it.title}>
                    <div className="font-semibold text-slate-900">{it.title}</div>
                    <div className="text-sm text-slate-600 mt-1">{it.desc}</div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-2 mb-4 text-blue-600">
                <Wrench className="h-5 w-5" />
                <h2 className="font-display font-bold text-xl text-slate-950">Next</h2>
              </div>
              <p className="text-sm text-slate-600 mb-5">Queued for the following 1–2 quarters.</p>
              <ul className="space-y-4">
                {NEXT.map((it) => (
                  <li key={it.title}>
                    <div className="font-semibold text-slate-900">{it.title}</div>
                    <div className="text-sm text-slate-600 mt-1">{it.desc}</div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-2 mb-4 text-violet-600">
                <Telescope className="h-5 w-5" />
                <h2 className="font-display font-bold text-xl text-slate-950">Later</h2>
              </div>
              <p className="text-sm text-slate-600 mb-5">Researching, not yet committed.</p>
              <ul className="space-y-4">
                {LATER.map((it) => (
                  <li key={it.title}>
                    <div className="font-semibold text-slate-900">{it.title}</div>
                    <div className="text-sm text-slate-600 mt-1">{it.desc}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50 border-y border-slate-200">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-2 mb-6 text-slate-700">
            <CheckCircle2 className="h-5 w-5" />
            <h2 className="font-display font-bold text-2xl text-slate-950">Recently shipped</h2>
          </div>
          <ul className="space-y-3">
            {SHIPPED.map((it) => (
              <li key={it.title} className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-4">
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1 whitespace-nowrap">{it.q}</span>
                <span className="text-slate-800">{it.title}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 text-sm text-slate-600">
            For the full release log see the <Link href="/changelog" className="text-primary underline">changelog</Link>.
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Want to influence what's next?</h2>
          <p className="text-slate-300 mb-6">
            Every customer gets a quarterly roadmap review with a product manager. We weight requests by use-case impact, not size of the logo.
          </p>
          <Link href="/contact?topic=roadmap">
            <Button size="lg" className="rounded-full" data-testid="roadmap-contact-cta">
              Submit a roadmap request
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
