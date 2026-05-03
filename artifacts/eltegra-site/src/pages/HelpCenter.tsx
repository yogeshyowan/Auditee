import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, LifeBuoy, BookOpen, MessageSquare, Zap, Settings, Shield, CreditCard, Users } from "lucide-react";
import { SEO } from "@/components/SEO";

const TOPICS = [
  { icon: Zap, title: "Getting started", desc: "Create your workspace, invite teammates, ingest your first DOORS / Jama / ReqIF source.", href: "/developers" },
  { icon: BookOpen, title: "Requirements & traceability", desc: "Authoring, splitting, linking, and the requirement quality scorer.", href: "/requirements-management" },
  { icon: Shield, title: "Compliance & evidence", desc: "Standards mapping (ASPICE, IEC 62304, ISO 26262, FDA QMSR), evidence packs, audit trails.", href: "/automated-compliance" },
  { icon: Settings, title: "Workspaces, projects & SSO", desc: "Members, roles, project membership, SAML SSO and SCIM provisioning.", href: "/security" },
  { icon: CreditCard, title: "Billing & plans", desc: "Plan changes, invoices, taxes, INR / USD pricing, refund policy.", href: "/pricing" },
  { icon: Users, title: "Integrations", desc: "Jira, Azure DevOps, GitHub, Polarion, Slack, ServiceNow, ReqIF round-trip.", href: "/integrations" },
];

const FAQS = [
  { q: "How do I import from DOORS or Jama?", a: "Use the Sources tab in the app — we accept ReqIF 1.x, .csv, .xlsx, native DOORS DXL exports and Jama JSON. Most teams ingest 50K requirements in under an hour." },
  { q: "Where is my data stored?", a: "By default, ap-south-1 (Mumbai) for India customers and eu-central-1 (Frankfurt) for EU customers. Enterprise can pin a region or run single-tenant / on-prem." },
  { q: "Can I disable AI features?", a: "Yes. Workspace owners can disable AI generation per-feature, and Enterprise customers can route to their own LLM endpoint (Azure OpenAI, Bedrock, on-prem)." },
  { q: "How do I cancel or downgrade?", a: "Monthly subscriptions: cancel anytime in Billing — access continues until the end of the cycle. Annual orders run for the full 12 months and lapse automatically." },
  { q: "Where do I report a security vulnerability?", a: "Email security@auditee.site or see our coordinated-disclosure programme on the Security page." },
];

export default function HelpCenter() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Help Center — Auditee Support, Docs & Answers"
        description="Find answers, walkthroughs and contact options for Auditee. Getting started, requirements, compliance, billing, integrations and security — all in one place."
        path="/help"
        keywords={["Auditee help", "Auditee support", "Auditee FAQ", "Auditee documentation", "compliance SaaS support"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/developers" className="text-sm text-slate-700 hover:text-primary">Docs</Link>
            <Link href="/status" className="text-sm text-slate-700 hover:text-primary">Status</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <LifeBuoy className="h-10 w-10 mx-auto text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">How can we help?</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            Browse by topic, scan the FAQ, or reach a human. Standard support replies in one business day; Enterprise plans get a 30-minute SLA.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">Browse by topic</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {TOPICS.map((t) => (
              <Link key={t.title} href={t.href} className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-primary transition-colors block">
                <t.icon className="h-7 w-7 text-primary mb-3" />
                <div className="font-semibold text-slate-900">{t.title}</div>
                <div className="text-sm text-slate-600 mt-1.5">{t.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">Most asked</h2>
          <div className="space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="bg-white border border-slate-200 rounded-xl p-4 group">
                <summary className="font-semibold text-slate-900 cursor-pointer list-none flex items-start justify-between gap-3">
                  <span>{f.q}</span>
                  <span className="text-primary text-xl leading-none transition-transform group-open:rotate-45">+</span>
                </summary>
                <div className="text-sm text-slate-700 mt-3">{f.a}</div>
              </details>
            ))}
          </div>
          <div className="text-sm text-slate-600 mt-6">
            Looking for the full FAQ? See <Link href="/faqs" className="text-primary underline">/faqs</Link>.
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white">
        <div className="max-w-4xl mx-auto px-6 grid md:grid-cols-3 gap-6 text-center">
          <div>
            <MessageSquare className="h-7 w-7 text-primary mx-auto mb-2" />
            <div className="font-semibold">In-app chat</div>
            <div className="text-sm text-slate-300 mt-1">Open the help bubble inside any /app page.</div>
          </div>
          <div>
            <LifeBuoy className="h-7 w-7 text-primary mx-auto mb-2" />
            <div className="font-semibold">Email</div>
            <a href="mailto:support@auditee.site" className="text-sm text-primary mt-1 underline block">support@auditee.site</a>
          </div>
          <div>
            <Users className="h-7 w-7 text-primary mx-auto mb-2" />
            <div className="font-semibold">Talk to sales</div>
            <Link href="/contact" className="text-sm text-primary mt-1 underline block">Book a 30-min call</Link>
          </div>
        </div>
        <div className="mt-10 text-center">
          <Link href="/contact">
            <Button size="lg" className="rounded-full" data-testid="help-contact-cta">Contact us<ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
