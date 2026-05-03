import { Link } from "wouter";
import {
  Code2, ArrowRight, Webhook, KeyRound, Bot, Database, Cpu,
  ShieldCheck, type LucideIcon,
} from "lucide-react";
import { SEO, breadcrumbsLd } from "@/components/SEO";
import { Navigation, SiteFooter } from "@/components/site/Chrome";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ENDPOINTS: { method: string; path: string; desc: string }[] = [
  { method: "POST", path: "/v1/projects", desc: "Create a project (workspace-scoped)" },
  { method: "POST", path: "/v1/requirements", desc: "Create / bulk-import requirements (with source attribution)" },
  { method: "GET",  path: "/v1/requirements/:id", desc: "Fetch a requirement with traces, attributes, history" },
  { method: "POST", path: "/v1/requirements:generate", desc: "AI-generate requirements from a brief or document" },
  { method: "POST", path: "/v1/requirements:gap-detect", desc: "Run gap detection across a project or set" },
  { method: "POST", path: "/v1/test-cases:generate", desc: "Generate test cases per requirement (Gherkin or custom)" },
  { method: "POST", path: "/v1/documents:generate", desc: "Generate BRD / PRD / FRD / SRS in DOCX, PDF, MD or HTML" },
  { method: "POST", path: "/v1/audits:run", desc: "Run a one-off audit job against a framework" },
  { method: "POST", path: "/v1/audits/schedules", desc: "Create a recurring audit schedule" },
  { method: "POST", path: "/v1/sources/connect", desc: "Connect a source (GitHub, Jira, DOORS, Confluence, …)" },
  { method: "POST", path: "/v1/queries", desc: "Natural-language Q&A over the project graph (cited)" },
  { method: "POST", path: "/v1/embeddings", desc: "Embed text against the active model; returns vectors + metadata" },
  { method: "GET",  path: "/v1/events", desc: "Stream audit + workspace events (SSE or webhooks)" },
];

const WEBHOOKS: { event: string; desc: string }[] = [
  { event: "requirement.created", desc: "Fired on every new requirement (manual or AI-generated)" },
  { event: "requirement.updated", desc: "Field-level diff in payload; respects field allowlist" },
  { event: "gap.detected", desc: "New gap surfaced by AI gap detection" },
  { event: "audit.finding.opened", desc: "Recurring audit job opened a finding" },
  { event: "audit.finding.closed", desc: "Finding moved to closed via CAPA workflow" },
  { event: "test_case.generated", desc: "AI generated a test case linked to a requirement" },
  { event: "document.generated", desc: "BRD / PRD / FRD / SRS produced; payload contains signed URL" },
  { event: "subscription.activated", desc: "Razorpay subscription activated for the workspace" },
  { event: "payment.captured", desc: "One-off or recurring payment captured" },
];

const MODELS: { provider: string; model: string; use: string; latency: string; ctx: string }[] = [
  { provider: "OpenAI",     model: "gpt-4o",            use: "Default authoring + reasoning",     latency: "~1.6s p50", ctx: "128k" },
  { provider: "OpenAI",     model: "o3-mini",           use: "Long-context analysis + planning",  latency: "~3.2s p50", ctx: "200k" },
  { provider: "Anthropic",  model: "claude-3.5-sonnet", use: "Document generation + drafting",    latency: "~1.8s p50", ctx: "200k" },
  { provider: "Anthropic",  model: "claude-3.5-haiku",  use: "Fast classification + tagging",     latency: "~0.7s p50", ctx: "200k" },
  { provider: "Google",     model: "gemini-2.0-flash",  use: "Cheap bulk classification",         latency: "~0.6s p50", ctx: "1M" },
  { provider: "Google",     model: "gemini-1.5-pro",    use: "Cross-doc reasoning",               latency: "~2.4s p50", ctx: "2M" },
  { provider: "AWS Bedrock", model: "claude-3.5-sonnet", use: "BYO-tenancy regulated workloads",  latency: "~2.0s p50", ctx: "200k" },
  { provider: "Self-host",  model: "vLLM (Llama 3.3 70B)", use: "Air-gapped Enterprise",         latency: "Customer-managed", ctx: "128k" },
];

const VECTOR_STORES: { name: string; mode: "Managed" | "BYO"; note: string }[] = [
  { name: "pgvector (Postgres)",    mode: "Managed", note: "Default for all workspaces; HNSW index" },
  { name: "Pinecone",               mode: "BYO",     note: "Bring your own index; we write + read with your key" },
  { name: "Weaviate",               mode: "BYO",     note: "Self-hosted or Weaviate Cloud" },
  { name: "Qdrant",                 mode: "BYO",     note: "Self-hosted; payload filtering supported" },
  { name: "Elasticsearch / OpenSearch", mode: "BYO", note: "Hybrid lexical + dense for existing ES customers" },
];

const PILLARS: { title: string; Icon: LucideIcon; desc: string }[] = [
  { title: "REST API",        Icon: Code2,       desc: "Resource-oriented, JSON, OpenAPI-described, Bearer auth, idempotency keys on writes." },
  { title: "Webhooks",        Icon: Webhook,     desc: "Signed with HMAC-SHA256, retried with exponential back-off, replay-safe." },
  { title: "API keys & OAuth",Icon: KeyRound,    desc: "Workspace-scoped tokens with fine-grained scopes; OAuth 2.0 for partner apps." },
  { title: "Model routing",   Icon: Bot,         desc: "Per-tenant default + per-call override across 8 providers; ZDR by default." },
  { title: "Vector layer",    Icon: Database,    desc: "Managed pgvector or BYO Pinecone / Weaviate / Qdrant / OpenSearch." },
  { title: "SDKs",            Icon: Cpu,         desc: "TypeScript and Python SDKs auto-generated from OpenAPI; CLI for power users." },
];

const code = `// TypeScript SDK
import Auditee from "@auditee/sdk";

const auditee = new Auditee({ apiKey: process.env.AUDITEE_API_KEY });

const draft = await auditee.requirements.generate({
  projectId: "prj_abc123",
  brief: "A clinician-facing telehealth scheduler that books, cancels, " +
         "and reschedules video visits with ICS calendar invites.",
  framework: "iec-62304-class-b",
  outputs: ["requirements", "test_cases", "brd"],
});

console.log(draft.requirements.length); // 47
console.log(draft.qualityScore.median); // 0.86`;

export default function Developers() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Developers — REST API, Webhooks, SDKs, Models & Vectors | Auditee"
        description="Auditee for developers: REST API, signed webhooks, TypeScript & Python SDKs, OAuth 2.0, fine-grained API keys, multi-provider model routing (OpenAI, Anthropic, Google, Bedrock, vLLM), and managed pgvector or BYO Pinecone / Weaviate / Qdrant / OpenSearch."
        path="/developers"
        keywords={["Auditee API", "Auditee webhooks", "Auditee SDK", "Auditee model routing", "BYO vector store", "pgvector", "Pinecone integration", "OAuth 2.0"]}
        jsonLd={breadcrumbsLd([{ name: "Home", path: "/" }, { name: "Developers", path: "/developers" }])}
      />
      <Navigation />
      <main className="pt-28 pb-24">
        <header className="max-w-3xl mx-auto px-6 text-center">
          <Code2 className="w-10 h-10 mx-auto text-primary mb-4" />
          <h1 className="font-display text-4xl md:text-5xl font-bold text-slate-950 tracking-tight">Developers</h1>
          <p className="mt-4 text-lg text-slate-600">
            Auditee is API-first. Everything you can do in the UI you can automate over a clean,
            OpenAPI-described REST surface — including model routing and vector-store selection.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            <Button asChild size="lg" className="gap-2">
              <Link href="/contact?topic=api-access">Request API access <ArrowRight className="w-4 h-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#endpoints">Browse endpoints</a>
            </Button>
          </div>
        </header>

        <section className="max-w-5xl mx-auto px-6 mt-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PILLARS.map((p) => {
              const Icon = p.Icon;
              return (
                <Card key={p.title} className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-display font-bold text-slate-950">{p.title}</h3>
                  </div>
                  <p className="text-sm text-slate-700">{p.desc}</p>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 mt-16">
          <h2 className="font-display text-2xl font-bold text-slate-950 mb-4">Quick example</h2>
          <Card className="p-0 overflow-hidden">
            <pre className="bg-slate-950 text-slate-100 text-sm p-5 overflow-x-auto"><code>{code}</code></pre>
          </Card>
        </section>

        <section id="endpoints" className="max-w-5xl mx-auto px-6 mt-16">
          <h2 className="font-display text-2xl font-bold text-slate-950 mb-6">Selected REST endpoints</h2>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold w-20">Method</th>
                  <th className="text-left px-4 py-3 font-semibold">Path</th>
                  <th className="text-left px-4 py-3 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {ENDPOINTS.map((e) => (
                  <tr key={`${e.method}-${e.path}`}>
                    <td className="px-4 py-3"><Badge variant="outline" className="font-mono text-xs">{e.method}</Badge></td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-900">{e.path}</td>
                    <td className="px-4 py-3 text-slate-700">{e.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 mt-16">
          <h2 className="font-display text-2xl font-bold text-slate-950 mb-6">Webhook events</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {WEBHOOKS.map((w) => (
              <Card key={w.event} className="p-4">
                <code className="text-xs font-mono text-primary">{w.event}</code>
                <p className="text-sm text-slate-700 mt-1">{w.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 mt-16">
          <h2 className="font-display text-2xl font-bold text-slate-950 mb-6">Models & routing</h2>
          <p className="text-sm text-slate-600 mb-5">
            Auditee routes every AI call across providers based on workload, cost and residency policy.
            Default tenancy uses Auditee-managed providers with Zero Data Retention; Enterprise can BYO key.
          </p>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Provider</th>
                  <th className="text-left px-4 py-3 font-semibold">Model</th>
                  <th className="text-left px-4 py-3 font-semibold">Primary use</th>
                  <th className="text-left px-4 py-3 font-semibold">Latency</th>
                  <th className="text-left px-4 py-3 font-semibold">Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {MODELS.map((m) => (
                  <tr key={`${m.provider}-${m.model}`}>
                    <td className="px-4 py-3 text-slate-900">{m.provider}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-900">{m.model}</td>
                    <td className="px-4 py-3 text-slate-700">{m.use}</td>
                    <td className="px-4 py-3 text-slate-700">{m.latency}</td>
                    <td className="px-4 py-3 text-slate-700">{m.ctx}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 mt-16">
          <h2 className="font-display text-2xl font-bold text-slate-950 mb-6">Vector stores</h2>
          <p className="text-sm text-slate-600 mb-5">
            Embeddings power semantic search, gap detection and Q&A. We default to managed pgvector;
            Enterprise customers can pin their own vector infrastructure.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {VECTOR_STORES.map((v) => (
              <Card key={v.name} className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-slate-900">{v.name}</h3>
                  <Badge variant={v.mode === "Managed" ? "default" : "outline"} className="text-xs">{v.mode}</Badge>
                </div>
                <p className="text-sm text-slate-700">{v.note}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 mt-16">
          <Card className="p-6 md:p-8 bg-slate-50 border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl font-bold text-slate-950">Security defaults</h2>
            </div>
            <ul className="text-sm text-slate-700 space-y-1.5">
              <li>• TLS 1.3 only; HTTP/2; HSTS preload.</li>
              <li>• API tokens are workspace-scoped with fine-grained scopes (read, write, admin).</li>
              <li>• Idempotency keys honoured on every POST that mutates state.</li>
              <li>• HMAC-SHA256 signatures on every webhook (header <code className="text-xs">X-Auditee-Signature</code>).</li>
              <li>• Per-tenant rate limits, observable via response headers <code className="text-xs">X-RateLimit-*</code>.</li>
              <li>• 100% audit trail — every API call written to the workspace audit log.</li>
            </ul>
          </Card>
        </section>

        <div className="max-w-3xl mx-auto px-6 mt-16 text-center">
          <h2 className="font-display text-2xl font-bold text-slate-950">Building on Auditee?</h2>
          <p className="mt-3 text-slate-600">
            We're working with a small group of design partners on the v1 SDK. Tell us what you're building.
          </p>
          <div className="mt-6">
            <Button asChild size="lg" className="gap-2">
              <Link href="/contact?topic=design-partner">Apply as a design partner <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
