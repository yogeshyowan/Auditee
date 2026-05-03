import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Download, ClipboardList, FileText, ArrowRight } from "lucide-react";
import { SEO } from "@/components/SEO";

type Q = { id: string; cat: string; q: string; a: string };

const QUESTIONS: Q[] = [
  { id: "GOV-01", cat: "Governance", q: "Do you have a formally documented information security programme?", a: "Yes. ISMS aligned to ISO/IEC 27001:2022 with an annual review by the CISO and approval by the board. Policies are reviewed at least annually and after material changes." },
  { id: "GOV-02", cat: "Governance", q: "Who is your CISO / equivalent?", a: "A named CISO reports directly to the CEO. Contact via security@auditee.site." },
  { id: "GOV-03", cat: "Governance", q: "Do you carry cyber insurance?", a: "Yes. $5M aggregate cyber-liability and tech E&O. Certificate available under NDA." },
  { id: "RISK-01", cat: "Risk management", q: "How often do you perform a formal risk assessment?", a: "Annually, plus event-driven assessments after significant changes, incidents, or new sub-processors." },
  { id: "RISK-02", cat: "Risk management", q: "Third-party / sub-processor risk management?", a: "Every sub-processor is reviewed on onboarding and annually thereafter. Public list at /sub-processors. 30-day customer notice before adding a new one." },
  { id: "ACC-01", cat: "Access control", q: "Do you support SSO and MFA?", a: "SAML 2.0 (signed assertions verified) and OIDC (Authorization Code + PKCE S256). MFA can be enforced workspace-wide. SCIM 2.0 for provisioning / de-provisioning." },
  { id: "ACC-02", cat: "Access control", q: "Role-based access control granularity?", a: "Workspace > Project > Resource RBAC enforced server-side. Custom roles supported on Enterprise. Every privileged action is audit-logged." },
  { id: "ACC-03", cat: "Access control", q: "Privileged production access controls?", a: "Just-in-time, short-lived sessions via AWS SSM. No SSH. All sessions are recorded. Access requires MFA + manager approval." },
  { id: "CRY-01", cat: "Cryptography", q: "Encryption in transit?", a: "TLS 1.3 only, HSTS preload, OCSP stapling, HTTP/2-only listeners. Internal service-to-service traffic is mTLS." },
  { id: "CRY-02", cat: "Cryptography", q: "Encryption at rest?", a: "AES-256-GCM with per-tenant DEKs wrapped by an envelope KEK in AWS KMS. Customer-managed keys (CMK) on Enterprise." },
  { id: "CRY-03", cat: "Cryptography", q: "Key rotation cadence?", a: "Automatic annual rotation for KMS KEKs. DEKs rotate on tenant key-rotation event. CMK rotation is non-disruptive and customer-controlled." },
  { id: "OPS-01", cat: "Operations", q: "Vulnerability management?", a: "Continuous SAST (Semgrep), SCA (Dependabot, Trivy), secret scanning (TruffleHog), and weekly DAST. Critical vulns patched within 24h, high within 7d." },
  { id: "OPS-02", cat: "Operations", q: "Penetration testing cadence?", a: "Quarterly third-party tests (current rotation: Cure53, NCC Group, Cobalt.io). Executive summaries at /pentest." },
  { id: "OPS-03", cat: "Operations", q: "Logging & monitoring retention?", a: "Append-only audit log with chained SHA-256 integrity. 1-year hot retention, 7-year cold retention available. Real-time SIEM streaming (Splunk HEC, Datadog, Elastic ECS, generic webhook)." },
  { id: "INC-01", cat: "Incident response", q: "Documented incident response plan?", a: "Yes. 24×7 on-call. Tabletop exercises twice a year. P1 first response within 1 hour. Personal-data breach notification within 72h (GDPR / DPDP) or 30d (HIPAA)." },
  { id: "BCP-01", cat: "Business continuity", q: "RPO / RTO?", a: "RPO ≤ 15 minutes (PITR over 35-day window). RTO ≤ 2 hours for full-region failure (warm standby in secondary AZ). Restore drills run monthly." },
  { id: "PHY-01", cat: "Physical security", q: "Where is data physically stored?", a: "AWS data centres only. Default region ap-south-1 (Mumbai). EU on eu-west-1, US on us-east-1. AWS holds SOC 1/2/3, ISO 27001/17/18, PCI DSS L1, HIPAA-eligible." },
  { id: "PRI-01", cat: "Privacy", q: "GDPR / DPDP compliance posture?", a: "Compliant. EU SCCs in DPA, UK addendum. India DPDP-compliant defaults to ap-south-1. Self-service DSAR + Article-17 erasure with audit-log PII scrubbing." },
  { id: "PRI-02", cat: "Privacy", q: "HIPAA?", a: "BAA available on Enterprise. Field-level encryption for PHI; audit logging; PHI segregation. See /baa." },
  { id: "DEV-01", cat: "Secure development", q: "SDLC controls?", a: "All changes pass code review + automated SAST/SCA/secret/container scanning. Signed commits. CI runs in ephemeral environments with OIDC federation to AWS — no long-lived AWS keys in CI." },
  { id: "DEV-02", cat: "Secure development", q: "Training for engineers?", a: "OWASP-aligned secure-coding training on hire and annually thereafter. Phishing simulations quarterly." },
  { id: "DAT-01", cat: "Data handling", q: "Data segregation between tenants?", a: "Per-workspace encryption keys, row-level security policies enforced in PostgreSQL, separate object-storage prefixes. Single-tenant deployment available on Enterprise." },
  { id: "DAT-02", cat: "Data handling", q: "Data return / deletion on termination?", a: "30-day export window after termination. All Customer Data deleted within 30 days; encrypted backups cryptographically erased within 90 days." },
  { id: "AI-01", cat: "AI governance", q: "Do you train models on customer data?", a: "No. Default OpenAI Enterprise tier with Zero Data Retention; Anthropic enterprise contract also ZDR. BYO-LLM available so customers can route inference to their own OpenAI / Azure / Anthropic / Bedrock / VPC endpoint." },
  { id: "AI-02", cat: "AI governance", q: "Prompt / response logging?", a: "Audit-logged with redaction policies that mask emails, names, IDs and free-text PII before write. Retention configurable per workspace; default 90 days." },
];

const CATEGORIES = Array.from(new Set(QUESTIONS.map((q) => q.cat)));

function escapeCsv(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadCsv() {
  const header = ["ID", "Category", "Question", "Answer"];
  const rows = [header.join(","), ...QUESTIONS.map((q) => [q.id, q.cat, q.q, q.a].map(escapeCsv).join(","))];
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `auditee-security-questionnaire-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function SecurityQuestionnaire() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return QUESTIONS.filter((x) => {
      if (cat && x.cat !== cat) return false;
      if (!q) return true;
      return x.q.toLowerCase().includes(q) || x.a.toLowerCase().includes(q) || x.id.toLowerCase().includes(q);
    });
  }, [query, cat]);

  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Security Questionnaire (CAIQ / SIG Lite) — Auditee"
        description="Pre-answered security questionnaire for procurement and vendor reviews — covering governance, access control, cryptography, operations, IR, BCP, privacy, AI governance and more. Searchable. CSV export."
        path="/security-questionnaire"
        keywords={["Auditee security questionnaire", "CAIQ", "SIG Lite", "vendor security review", "procurement"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/trust" className="text-sm text-slate-700 hover:text-primary">Trust</Link>
            <Link href="/security-whitepaper" className="text-sm text-slate-700 hover:text-primary">Whitepaper</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6">
          <ClipboardList className="h-10 w-10 text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Security questionnaire</h1>
          <p className="text-slate-700 mb-6">
            {QUESTIONS.length} pre-answered questions across {CATEGORIES.length} categories — built to short-circuit your CAIQ / SIG Lite vendor review. Search, filter, and export to CSV.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search questions or answers…"
                className="pl-9"
                data-testid="questionnaire-search"
              />
            </div>
            <Button onClick={downloadCsv} className="gap-2" data-testid="questionnaire-csv">
              <Download className="w-4 h-4" /> Download CSV
            </Button>
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-4">
            <button
              onClick={() => setCat(null)}
              className={`text-xs px-3 py-1.5 rounded-full border ${cat === null ? "bg-primary text-white border-primary" : "bg-white text-slate-700 border-slate-200 hover:border-primary"}`}
              data-testid="filter-all"
            >All ({QUESTIONS.length})</button>
            {CATEGORIES.map((c) => {
              const n = QUESTIONS.filter((x) => x.cat === c).length;
              return (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`text-xs px-3 py-1.5 rounded-full border ${cat === c ? "bg-primary text-white border-primary" : "bg-white text-slate-700 border-slate-200 hover:border-primary"}`}
                  data-testid={`filter-${c.toLowerCase().replace(/\s+/g, "-")}`}
                >{c} ({n})</button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-4xl mx-auto px-6 space-y-3">
          {filtered.length === 0 && (
            <Card className="p-8 text-center text-slate-600">
              No questions match. Email <a className="text-primary underline" href="mailto:security@auditee.site">security@auditee.site</a> with your custom item; we usually answer within one business day.
            </Card>
          )}
          {filtered.map((q) => (
            <Card key={q.id} className="p-5">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="font-mono text-xs shrink-0">{q.id}</Badge>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h3 className="font-semibold text-slate-900">{q.q}</h3>
                    <Badge variant="secondary" className="text-xs">{q.cat}</Badge>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{q.a}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Need a custom format?</h2>
          <p className="text-slate-300 mb-6">We respond to CAIQ v4, SIG Core / Lite, HECVAT, and bespoke spreadsheets within 1–2 business days.</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/contact?topic=questionnaire">
              <Button size="lg" className="rounded-full" data-testid="questionnaire-contact-cta">
                Submit questionnaire<ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/security-whitepaper">
              <Button size="lg" variant="outline" className="rounded-full text-white border-white/40 hover:bg-white hover:text-slate-950">
                <FileText className="mr-2 h-4 w-4" /> Security whitepaper
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
