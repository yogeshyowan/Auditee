import { useEffect } from "react";
import { Navigation, SiteFooter } from "@/components/site/Chrome";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  ShieldCheck,
  Lock,
  KeyRound,
  FileText,
  Database,
  Globe2,
  Cpu,
  AlertTriangle,
  Mail,
  CheckCircle2,
} from "lucide-react";

const FRAMEWORKS = [
  {
    name: "SOC 2 Type II",
    status: "In progress — audit window opens Q3 2026",
    blurb:
      "Controls aligned with the AICPA Trust Services Criteria for Security, Availability, and Confidentiality. Audit underway with a Big-Four firm.",
  },
  {
    name: "ISO/IEC 27001:2022",
    status: "Designed for — gap assessment complete",
    blurb:
      "Information Security Management System (ISMS) documented and operating against Annex A controls. Stage 1 audit scheduled.",
  },
  {
    name: "GDPR",
    status: "Ready",
    blurb:
      "EU + UK data residency available. Standard Contractual Clauses (SCCs) and Data Processing Addendum (DPA) executable on Enterprise. Auditee acts as a data processor.",
  },
  {
    name: "HIPAA",
    status: "Aligned — BAA available on Enterprise",
    blurb:
      "Technical, administrative, and physical safeguards mapped. Business Associate Agreement (BAA) signed for healthcare customers.",
  },
];

const SUBPROCESSORS = [
  { name: "Amazon Web Services", purpose: "Compute, storage, networking", region: "us-east, eu-west" },
  { name: "Neon (Postgres)", purpose: "Primary application database (AES-256 at rest)", region: "us-east, eu-central" },
  { name: "Clerk", purpose: "Authentication, SSO, MFA", region: "Global" },
  { name: "OpenAI", purpose: "LLM inference for AI features (zero data retention contract)", region: "US" },
  { name: "Stripe", purpose: "Subscription billing", region: "Global" },
  { name: "Resend", purpose: "Transactional email", region: "US" },
];

export default function SecurityPage() {
  useEffect(() => {
    document.title = "Security & Trust — Auditee";
  }, []);

  return (
    <>
      <Navigation />
      <main>
        <section className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-24 text-white">
          <div className="mx-auto max-w-5xl px-6 text-center">
            <Badge variant="secondary" className="mx-auto mb-6 bg-white/10 text-white">
              Trust & Security Center
            </Badge>
            <h1 className="font-display text-5xl font-bold leading-tight tracking-tight md:text-6xl">
              Built for regulated industries.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
              Auditee handles the same compliance evidence our customers ship to auditors. We hold ourselves to
              the same bar — encryption everywhere, RBAC, audit trails, and a security posture aligned with SOC
              2, ISO 27001, and GDPR.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/contact">
                <Button data-testid="button-request-soc2">Request SOC 2 / ISO docs</Button>
              </Link>
              <a href="mailto:security@auditee.com">
                <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
                  Report a vulnerability
                </Button>
              </a>
            </div>
          </div>
        </section>

        <section className="bg-white py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="font-display text-3xl font-bold text-slate-900">Compliance posture</h2>
            <p className="mt-2 max-w-2xl text-slate-500">
              We use precise language about each framework — what we are <em>certified</em> for, <em>aligned with</em>,
              and <em>ready</em> to support contractually.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {FRAMEWORKS.map((f) => (
                <Card key={f.name} data-testid={`card-framework-${f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-primary" /> {f.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary" className="mb-3">
                      {f.status}
                    </Badge>
                    <p className="text-sm text-slate-600">{f.blurb}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="mt-6 text-xs text-slate-400">
              Status reflects current state as of {new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" })}.
              Customers under NDA may request the latest evidence package via{" "}
              <a href="mailto:trust@auditee.com" className="underline">trust@auditee.com</a>.
            </p>
          </div>
        </section>

        <section className="bg-slate-50 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="font-display text-3xl font-bold text-slate-900">How your data is protected</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Lock,
                  title: "Encryption in transit — TLS 1.3",
                  body: "All API and web traffic terminates at our edge using TLS 1.3 with modern cipher suites. HSTS preload, automatic certificate rotation.",
                },
                {
                  icon: Database,
                  title: "Encryption at rest — AES-256",
                  body: "Postgres data, file storage, and backups are encrypted at rest with AES-256 using AWS KMS-managed keys. Encryption keys rotate annually.",
                },
                {
                  icon: KeyRound,
                  title: "SSO — SAML 2.0 / OIDC",
                  body: "Enterprise customers connect any SAML or OIDC IdP (Okta, Entra ID, Google Workspace, JumpCloud). Domain auto-routing enforces SSO for your team.",
                },
                {
                  icon: ShieldCheck,
                  title: "Role-based access control",
                  body: "Four built-in roles: owner, admin, editor, viewer. Permission matrix is enforced server-side and audited on every change.",
                },
                {
                  icon: FileText,
                  title: "Append-only audit log",
                  body: "Every member invite, role change, plan switch, and SSO update is recorded with timestamp, actor, IP, and metadata. Exportable as CSV.",
                },
                {
                  icon: Globe2,
                  title: "Data residency",
                  body: "Choose US (us-east-1) or EU (eu-central-1) primary region on Enterprise. Backups stay in-region. No cross-region replication without consent.",
                },
                {
                  icon: Cpu,
                  title: "AI data handling",
                  body: "LLM providers operate under zero-retention contracts. Your prompts and generations are never used to train third-party models.",
                },
                {
                  icon: AlertTriangle,
                  title: "Vulnerability management",
                  body: "Continuous SCA + SAST in CI. Quarterly third-party penetration tests on Enterprise. Critical patches within 24 hours.",
                },
                {
                  icon: Mail,
                  title: "Incident response",
                  body: "24/7 on-call rotation. Customer notification within 24 hours of confirmed breach affecting your data, with a written RCA.",
                },
              ].map((item) => (
                <Card key={item.title}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <item.icon className="h-5 w-5 text-primary" /> {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-slate-600">{item.body}</CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="font-display text-3xl font-bold text-slate-900">Sub-processors</h2>
            <p className="mt-2 max-w-2xl text-slate-500">
              Vendors who process Auditee customer data on our behalf. We update this list at least 30 days before
              adding a new sub-processor.
            </p>
            <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="p-3">Vendor</th>
                    <th className="p-3">Purpose</th>
                    <th className="p-3">Region</th>
                  </tr>
                </thead>
                <tbody>
                  {SUBPROCESSORS.map((s) => (
                    <tr key={s.name} className="border-t border-slate-100" data-testid={`row-subprocessor-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                      <td className="p-3 font-medium text-slate-900">{s.name}</td>
                      <td className="p-3 text-slate-600">{s.purpose}</td>
                      <td className="p-3 text-slate-500">{s.region}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-20">
          <div className="mx-auto max-w-6xl px-6 grid gap-12 md:grid-cols-2">
            <Card data-testid="card-vuln-disclosure">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" /> Vulnerability disclosure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <p>
                  Found a security issue? Please email{" "}
                  <a href="mailto:security@auditee.com" className="font-semibold text-primary">
                    security@auditee.com
                  </a>{" "}
                  with reproduction steps. We acknowledge within 24 hours and triage within 3 business days.
                </p>
                <p>We do not pursue legal action against good-faith research that respects user privacy and avoids service disruption.</p>
                <ul className="space-y-1">
                  {["Acknowledge within 24h", "Initial triage within 3 business days", "Public credit on request"].map((s) => (
                    <li key={s} className="flex items-center gap-2 text-slate-700">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card data-testid="card-trust-contact">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" /> Trust & compliance contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <p>
                  For SOC 2 reports, ISO statements, DPAs, BAAs, security questionnaires, or sub-processor
                  notifications, reach out to{" "}
                  <a href="mailto:trust@auditee.com" className="font-semibold text-primary">
                    trust@auditee.com
                  </a>
                  .
                </p>
                <p>Enterprise customers receive a dedicated compliance contact and quarterly trust reviews.</p>
                <Link href="/contact">
                  <Button variant="outline" data-testid="button-contact-trust">Contact our trust team</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
