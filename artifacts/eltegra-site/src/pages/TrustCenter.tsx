import { Link } from "wouter";
import {
  Shield, ArrowRight, FileText, Lock, Globe2, Server, BellRing, KeyRound,
} from "lucide-react";
import { SEO, breadcrumbsLd } from "@/components/SEO";
import { Navigation, SiteFooter } from "@/components/site/Chrome";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const SUBPROCESSORS: { name: string; purpose: string; region: string; dpa: string }[] = [
  { name: "Amazon Web Services", purpose: "Primary cloud (compute, storage, RDS, KMS)", region: "ap-south-1 (Mumbai), eu-west-1 (Dublin), us-east-1 (N. Virginia)", dpa: "AWS DPA + SCCs" },
  { name: "Cloudflare", purpose: "Edge proxy, WAF, DDoS, DNS", region: "Global anycast", dpa: "Cloudflare DPA + SCCs" },
  { name: "Stripe / Razorpay", purpose: "Payments processing (region-routed)", region: "US / IN", dpa: "Stripe DPA · Razorpay DPA" },
  { name: "Sentry", purpose: "Error tracking (PII scrubbed)", region: "US (with EU residency on request)", dpa: "Sentry DPA + SCCs" },
  { name: "PostHog Cloud EU", purpose: "Product analytics (cookieless, hashed user ids)", region: "EU (Frankfurt)", dpa: "PostHog DPA" },
  { name: "Resend", purpose: "Transactional email", region: "US", dpa: "Resend DPA + SCCs" },
  { name: "OpenAI (Enterprise)", purpose: "Default AI provider with Zero Data Retention", region: "US (with EU residency on Enterprise)", dpa: "OpenAI ZDR Enterprise DPA" },
  { name: "Anthropic", purpose: "Optional AI provider with ZDR", region: "US", dpa: "Anthropic Enterprise DPA" },
];

const CERTS = [
  { name: "SOC 2 Type II", status: "In progress (target Q3 2026)", note: "Drata-monitored controls; pre-audit complete" },
  { name: "ISO/IEC 27001:2022", status: "Stage-1 audit scheduled", note: "ISMS scope: Auditee SaaS platform" },
  { name: "GDPR (EU/UK)", status: "Compliant", note: "EU SCCs in DPA, UK addendum, EU-hosted residency option" },
  { name: "HIPAA (US)", status: "BAA available on Enterprise", note: "Encryption, audit logging, PHI segregation" },
  { name: "DPDP Act, 2023 (India)", status: "Compliant", note: "Indian-resident data hosted ap-south-1 by default" },
];

const SECURITY_PILLARS: { title: string; Icon: typeof Lock; bullets: string[] }[] = [
  {
    title: "Encryption",
    Icon: Lock,
    bullets: [
      "TLS 1.3 in transit (HSTS preload, HTTP/2 only)",
      "AES-256 at rest, per-tenant data encryption keys",
      "AWS KMS with customer-supplied keys (Enterprise)",
      "Field-level encryption for PHI / cardholder data",
    ],
  },
  {
    title: "Identity & access",
    Icon: KeyRound,
    bullets: [
      "SAML 2.0 + OIDC (Okta, Entra ID, Google, OneLogin)",
      "SCIM 2.0 user provisioning and de-provisioning",
      "Mandatory MFA for all admin roles",
      "Workspace-scoped role hierarchy with audit trail",
    ],
  },
  {
    title: "Infrastructure",
    Icon: Server,
    bullets: [
      "Multi-AZ deployment, automated backups (PITR 35 days)",
      "Region-pinned tenancy: IN / EU / US",
      "Hardened AMIs, ephemeral compute, no SSH",
      "VPC isolation; no public DB endpoints",
    ],
  },
  {
    title: "Residency & sovereignty",
    Icon: Globe2,
    bullets: [
      "Default Indian-resident data hosted ap-south-1 (Mumbai)",
      "EU residency (eu-west-1) on Pro+",
      "US residency (us-east-1) on Pro+",
      "Sovereign / on-prem deployment on Enterprise",
    ],
  },
  {
    title: "Monitoring & response",
    Icon: BellRing,
    bullets: [
      "24×7 log aggregation; 1-year hot retention",
      "WAF + bot-management at the edge",
      "Anomaly alerting on auth, billing and sensitive ops",
      "Documented IR plan with 1-hour first-response SLA",
    ],
  },
  {
    title: "Application security",
    Icon: Shield,
    bullets: [
      "Quarterly third-party pen tests; report on request (NDA)",
      "Continuous SAST + dependency scanning",
      "Code review + signed releases",
      "Bug bounty / responsible disclosure (see below)",
    ],
  },
];

const DOCS = [
  { title: "Data Processing Agreement (DPA)", href: "/dpa", note: "EU SCCs + UK addendum. Read in full or request signed PDF." },
  { title: "Master Services Agreement (MSA)", href: "/msa", note: "Pre-signed Enterprise contract. Read in full or request counter-sign." },
  { title: "Business Associate Agreement (BAA)", href: "/baa", note: "HIPAA. Mutually executable on Enterprise." },
  { title: "Security whitepaper", href: "/security-whitepaper", note: "Architecture, controls, control mappings. Public summary; full PDF under NDA." },
  { title: "SOC 2 Type II", href: "/soc2", note: "Programme status, scope, timeline. Report under NDA once issued." },
  { title: "Penetration test summary", href: "/pentest", note: "Quarterly third-party tests. Full reports under NDA." },
  { title: "Security questionnaire (CAIQ / SIG Lite)", href: "/security-questionnaire", note: "Pre-answered, searchable, CSV export." },
  { title: "Sub-processor list", href: "#subprocessors", note: "Always reflects current state. Section below." },
];

export default function TrustCenter() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Trust Center — Security, Compliance & Sub-processors | Auditee"
        description="Auditee Trust Center: encryption, identity, residency, monitoring, sub-processor list, certifications (SOC 2 Type II, ISO 27001, GDPR, HIPAA, DPDP), DPA, security whitepaper and responsible disclosure."
        path="/trust"
        keywords={["Auditee trust center", "Auditee security", "Auditee sub-processors", "Auditee DPA", "Auditee SOC 2", "Auditee responsible disclosure"]}
        jsonLd={breadcrumbsLd([{ name: "Home", path: "/" }, { name: "Trust", path: "/trust" }])}
      />
      <Navigation />
      <main className="pt-28 pb-24">
        <header className="max-w-3xl mx-auto px-6 text-center">
          <Shield className="w-10 h-10 mx-auto text-primary mb-4" />
          <h1 className="font-display text-4xl md:text-5xl font-bold text-slate-950 tracking-tight">Trust Center</h1>
          <p className="mt-4 text-lg text-slate-600">
            Auditee runs the most regulated software on the planet. Here's exactly how we secure it,
            who touches your data, and where you can audit our work.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            <Button asChild size="lg" variant="outline">
              <a href="#subprocessors">Sub-processors</a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#disclosure">Responsible disclosure</a>
            </Button>
            <Button asChild size="lg" className="gap-2">
              <Link href="/contact?topic=security-whitepaper">Request whitepaper <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </header>

        <section className="max-w-5xl mx-auto px-6 mt-16">
          <h2 className="font-display text-2xl font-bold text-slate-950 mb-6">Security pillars</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SECURITY_PILLARS.map((p) => {
              const Icon = p.Icon;
              return (
                <Card key={p.title} className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-display font-bold text-slate-950">{p.title}</h3>
                  </div>
                  <ul className="space-y-1.5 text-sm text-slate-700">
                    {p.bullets.map((b) => <li key={b} className="flex gap-2"><span className="text-primary">•</span><span>{b}</span></li>)}
                  </ul>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 mt-16">
          <h2 className="font-display text-2xl font-bold text-slate-950 mb-6">Certifications & frameworks</h2>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Framework</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {CERTS.map((c) => (
                  <tr key={c.name}>
                    <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                    <td className="px-4 py-3"><Badge variant="outline">{c.status}</Badge></td>
                    <td className="px-4 py-3 text-slate-600">{c.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="subprocessors" className="max-w-5xl mx-auto px-6 mt-16">
          <h2 className="font-display text-2xl font-bold text-slate-950 mb-2">Sub-processors</h2>
          <p className="text-sm text-slate-600 mb-6">
            We give 30 days' notice before adding a new sub-processor (Pro+). To subscribe to change
            notifications, email <a className="text-primary underline" href="mailto:trust@auditee.site">trust@auditee.site</a>.
          </p>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Sub-processor</th>
                  <th className="text-left px-4 py-3 font-semibold">Purpose</th>
                  <th className="text-left px-4 py-3 font-semibold">Region</th>
                  <th className="text-left px-4 py-3 font-semibold">Contract</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {SUBPROCESSORS.map((s) => (
                  <tr key={s.name}>
                    <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                    <td className="px-4 py-3 text-slate-700">{s.purpose}</td>
                    <td className="px-4 py-3 text-slate-700">{s.region}</td>
                    <td className="px-4 py-3 text-slate-700">{s.dpa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 mt-16">
          <h2 className="font-display text-2xl font-bold text-slate-950 mb-6">Documents on request</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {DOCS.map((d) => (
              <Card key={d.title} className="p-5">
                <div className="flex items-center gap-2 mb-1.5">
                  <FileText className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-slate-900">{d.title}</h3>
                </div>
                <p className="text-sm text-slate-600 mb-3">{d.note}</p>
                {d.href.startsWith("#")
                  ? <a href={d.href} className="text-sm text-primary font-medium hover:underline">Jump to section →</a>
                  : <Link href={d.href} className="text-sm text-primary font-medium hover:underline">Request →</Link>}
              </Card>
            ))}
          </div>
        </section>

        <section id="disclosure" className="max-w-3xl mx-auto px-6 mt-16">
          <Card className="p-6 md:p-8 bg-slate-50 border-slate-200">
            <h2 className="font-display text-2xl font-bold text-slate-950 mb-3">Responsible disclosure</h2>
            <p className="text-slate-700 mb-3">
              If you believe you've found a security vulnerability in Auditee, please email{" "}
              <a className="text-primary underline" href="mailto:security@auditee.site">security@auditee.site</a>{" "}
              with steps to reproduce. PGP key available on request.
            </p>
            <ul className="text-sm text-slate-700 space-y-1.5">
              <li>• We acknowledge within 1 business day.</li>
              <li>• We commit to a triage decision within 5 business days.</li>
              <li>• We do not pursue good-faith researchers and will publicly credit you on resolution (opt-in).</li>
              <li>• Out of scope: social engineering of employees, physical attacks, denial-of-service against shared infra.</li>
            </ul>
          </Card>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
