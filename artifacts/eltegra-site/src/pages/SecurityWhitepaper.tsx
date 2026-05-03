import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, KeyRound, Server, Network, Eye, BellRing, GitBranch, FileText } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";

const SECTIONS = [
  {
    Icon: Lock,
    title: "1. Data protection",
    body: [
      "Encryption in transit using TLS 1.3 with HSTS preload, OCSP stapling, and HTTP/2-only listeners. Outbound integrations are TLS-pinned where the upstream supports it.",
      "Encryption at rest on AES-256-GCM with per-tenant data encryption keys (DEKs) wrapped by an envelope key (KEK) in AWS KMS. Enterprise customers may bring their own CMK in a region of their choice; rotation is non-disruptive.",
      "Field-level encryption for PHI and cardholder data using authenticated AEAD (AES-256-GCM with associated data binding the field to its row id).",
      "Backups are encrypted with the same KMS keys, replicated cross-AZ, and tested monthly via automated restore drills.",
    ],
  },
  {
    Icon: KeyRound,
    title: "2. Identity, authentication & authorisation",
    body: [
      "SAML 2.0 (signed assertions verified) and OIDC (Authorization Code + PKCE S256). SCIM 2.0 for automated provisioning / de-provisioning.",
      "MFA can be enforced workspace-wide; IP allowlisting (IPv4/CIDR) with self-lockout protection.",
      "Workspace > Project > Resource RBAC matrix enforced server-side at the request layer; every privileged action is logged.",
      "Session timeout is configurable per workspace; idle and absolute timeouts are independent.",
    ],
  },
  {
    Icon: Server,
    title: "3. Infrastructure & tenancy",
    body: [
      "Multi-AZ deployment on AWS with hardened, ephemeral compute. No SSH; access is via short-lived, audited SSM sessions.",
      "Region-pinned tenancy: India (ap-south-1, default), EU (eu-west-1), US (us-east-1) and AP (ap-southeast-1, on request). No cross-region data movement except customer-initiated exports.",
      "Single-tenant deployment is available on Enterprise; otherwise, logical isolation uses per-workspace encryption keys, row-level security, and separate object-storage prefixes.",
      "Production database has no public endpoint; access is gated by VPC peering and IAM authentication.",
    ],
  },
  {
    Icon: Network,
    title: "4. Network & edge",
    body: [
      "Cloudflare WAF with managed OWASP rule sets, bot management, and rate limiting in front of every endpoint.",
      "DDoS protection at L3-L7. Internal services communicate over a private VPC; egress to third-party APIs is allow-listed.",
      "Customers can require all production traffic to traverse a customer-supplied egress proxy (Enterprise).",
    ],
  },
  {
    Icon: Eye,
    title: "5. Logging, monitoring & SIEM",
    body: [
      "Append-only audit log with row-level integrity hashing (SHA-256 chained per workspace). Tamper-evident; integrity is verifiable by replaying the chain.",
      "1-year hot retention; 7-year cold retention available. CSV export is built-in and respects RBAC.",
      "Real-time SIEM streaming over webhooks with payload templates for Generic JSON, Splunk HEC, Datadog and Elastic ECS.",
      "Anomaly alerts on auth, billing, sensitive operations and rate-limit breaches.",
    ],
  },
  {
    Icon: GitBranch,
    title: "6. Secure development",
    body: [
      "All changes pass code review, SAST (Semgrep), dependency scanning (Dependabot, Trivy), secret scanning (TruffleHog), and container image scanning before merge.",
      "Signed commits; signed releases. CI / CD runs in isolated, ephemeral environments with least-privilege OIDC federation to AWS.",
      "Quarterly third-party penetration testing; executive summary at /pentest, full report under NDA.",
      "Public bug-bounty / responsible-disclosure programme — see /security/disclosure.",
    ],
  },
  {
    Icon: BellRing,
    title: "7. Incident response & business continuity",
    body: [
      "On-call rotation 24×7 for P1 incidents; documented IR runbooks with named roles (incident commander, scribe, comms).",
      "RPO ≤ 15 minutes (point-in-time DB recovery, 35-day window). RTO ≤ 2 hours for full-region failure (warm standby in a secondary AZ).",
      "Tabletop exercises run twice a year; chaos engineering drills run monthly in pre-prod.",
      "Personal-data breach notification within 72 hours per GDPR / DPDP, and 30 days for HIPAA.",
    ],
  },
];

const CONTROLS = [
  { framework: "SOC 2 Type II", controls: 64, mapped: 64 },
  { framework: "ISO/IEC 27001:2022", controls: 93, mapped: 91 },
  { framework: "GDPR (Article 32)", controls: 12, mapped: 12 },
  { framework: "HIPAA Security Rule", controls: 36, mapped: 36 },
  { framework: "DPDP Act 2023 (India)", controls: 18, mapped: 18 },
];

export default function SecurityWhitepaper() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Security Whitepaper — Auditee"
        description="Technical security whitepaper for Auditee: encryption, identity, infrastructure, network, monitoring, secure development, incident response and control mappings to SOC 2, ISO 27001, GDPR, HIPAA and DPDP."
        path="/security-whitepaper"
        keywords={["Auditee security whitepaper", "Auditee architecture", "SaaS security model", "SOC 2 whitepaper"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/security" className="text-sm text-slate-700 hover:text-primary">Security</Link>
            <Link href="/trust" className="text-sm text-slate-700 hover:text-primary">Trust</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6">
          <Lock className="h-10 w-10 text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Security Whitepaper</h1>
          <p className="text-slate-700">Version 2026.05 · 7 sections · Public; full pen-test report under NDA.</p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-4xl mx-auto px-6 space-y-6">
          {SECTIONS.map((s) => {
            const Icon = s.Icon;
            return (
              <Card key={s.title} className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="font-display text-xl font-bold text-slate-950">{s.title}</h2>
                </div>
                <ul className="space-y-2 text-slate-700 text-sm leading-relaxed">
                  {s.body.map((b, i) => <li key={i} className="flex gap-2"><span className="text-primary">•</span><span>{b}</span></li>)}
                </ul>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-display text-2xl font-bold text-slate-950 mb-6">Control mappings</h2>
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Framework</th>
                  <th className="text-left px-4 py-3 font-semibold">Controls in scope</th>
                  <th className="text-left px-4 py-3 font-semibold">Mapped &amp; tested</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {CONTROLS.map((c) => (
                  <tr key={c.framework}>
                    <td className="px-4 py-3 font-medium text-slate-900">{c.framework}</td>
                    <td className="px-4 py-3 text-slate-700">{c.controls}</td>
                    <td className="px-4 py-3 text-slate-700">{c.mapped} / {c.controls}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 mt-3">SOC 2 Type II report (Q3 2026 target) and ISO 27001 certificate are released under NDA. ISO 27001 stage-1 audit scheduled.</p>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Need the full PDF or pen-test report?</h2>
          <p className="text-slate-300 mb-6">Both are available under NDA in 1 business day.</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/contact?topic=security-whitepaper">
              <Button size="lg" className="rounded-full" data-testid="whitepaper-pdf-cta">
                Request PDF<ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pentest">
              <Button size="lg" variant="outline" className="rounded-full text-white border-white/40 hover:bg-white hover:text-slate-950">
                <FileText className="mr-2 h-4 w-4" /> Pen-test summary
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
