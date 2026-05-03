import { Link } from "wouter";
import {
  ArrowRight, Plug, Code2, Database, MessagesSquare, Bot, ShieldCheck,
  Workflow, Network, GitBranch, FileText,
} from "lucide-react";
import { SEO, breadcrumbsLd } from "@/components/SEO";
import { Navigation, SiteFooter } from "@/components/site/Chrome";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const GROUPS: {
  title: string;
  Icon: typeof Plug;
  desc: string;
  items: { name: string; status: "GA" | "Beta" | "Roadmap"; desc: string }[];
}[] = [
  {
    title: "Requirements management",
    Icon: Network,
    desc: "Two-way sync with the major RM tools so you don't rip and replace.",
    items: [
      { name: "IBM DOORS Classic", status: "GA", desc: "ReqIF import + push, modules and links preserved." },
      { name: "IBM DOORS Next", status: "GA", desc: "OSLC-RM bidirectional connector with version baselining." },
      { name: "Jama Connect", status: "GA", desc: "Native API connector — items, relationships, attachments." },
      { name: "Siemens Polarion", status: "GA", desc: "Polarion REST connector with work-item bidirectional sync." },
      { name: "PTC / Intland codeBeamer", status: "GA", desc: "REST connector with full attribute and trace mapping." },
      { name: "Perforce Helix RM", status: "GA", desc: "REST + ReqIF, supports nested folders and baselines." },
      { name: "Visure Requirements", status: "GA", desc: "ReqIF + REST, with custom-attribute mapping." },
      { name: "Generic ReqIF (OMG)", status: "GA", desc: "Universal fallback for any tool that exports ReqIF." },
    ],
  },
  {
    title: "Source code & DevOps",
    Icon: Code2,
    desc: "Reverse-engineer code, generate tests, and trace requirement → function → commit.",
    items: [
      { name: "GitHub", status: "GA", desc: "Code indexing, PR webhooks, OAuth for private repos." },
      { name: "GitLab", status: "GA", desc: "Self-managed and SaaS. Merge-request webhooks supported." },
      { name: "Azure DevOps Repos", status: "GA", desc: "Code indexing + Boards two-way sync." },
      { name: "Bitbucket Cloud", status: "Beta", desc: "Repository indexing and PR webhooks." },
    ],
  },
  {
    title: "Issue tracking & ALM",
    Icon: Workflow,
    desc: "Push generated test cases and traceability back into the tools your engineers live in.",
    items: [
      { name: "Atlassian Jira", status: "GA", desc: "Issue and Xray sync. Webhooks + REST + JQL search." },
      { name: "Azure DevOps Boards", status: "GA", desc: "Work-item bidirectional with field mapping." },
      { name: "Linear", status: "Beta", desc: "Issue sync over the GraphQL API." },
      { name: "Asana", status: "Roadmap", desc: "On request — vote in /contact." },
    ],
  },
  {
    title: "Notifications & collaboration",
    Icon: MessagesSquare,
    desc: "Surface gap-detection findings, audit-job results and CAPA actions where teams already work.",
    items: [
      { name: "Slack", status: "GA", desc: "Per-channel routing, slash commands and approvals." },
      { name: "Microsoft Teams", status: "GA", desc: "Adaptive cards, deep links to requirements." },
      { name: "Email", status: "GA", desc: "Daily / weekly digests and per-event triggers." },
      { name: "Webhooks", status: "GA", desc: "JSON POSTs for any custom integration." },
    ],
  },
  {
    title: "Identity & SSO",
    Icon: ShieldCheck,
    desc: "Enterprise-grade authentication for regulated environments.",
    items: [
      { name: "Okta (SAML / OIDC)", status: "GA", desc: "JIT provisioning, group-to-role mapping." },
      { name: "Microsoft Entra ID", status: "GA", desc: "Azure AD SAML & OIDC, conditional access." },
      { name: "Google Workspace", status: "GA", desc: "OIDC SSO with domain restriction." },
      { name: "OneLogin", status: "GA", desc: "SAML 2.0 with attribute-based access." },
      { name: "JumpCloud", status: "GA", desc: "SAML 2.0, group sync." },
      { name: "SCIM 2.0", status: "Beta", desc: "Cross-IdP user provisioning and de-provisioning." },
    ],
  },
  {
    title: "Documents & content",
    Icon: FileText,
    desc: "Bring existing knowledge into Auditee — and push polished outputs back out.",
    items: [
      { name: "Confluence Cloud", status: "GA", desc: "Bulk import; per-space scoping." },
      { name: "Google Drive", status: "GA", desc: "Read-only ingest of Docs, Sheets and PDFs." },
      { name: "SharePoint", status: "Beta", desc: "Site- and library-scoped ingest." },
      { name: "Notion", status: "Roadmap", desc: "On request." },
    ],
  },
  {
    title: "AI providers (BYO model)",
    Icon: Bot,
    desc: "Provider-agnostic. Default routing through Auditee with zero data retention; Enterprise can BYO key.",
    items: [
      { name: "OpenAI / Azure OpenAI", status: "GA", desc: "GPT-4o, o1, o3-mini. ZDR by default." },
      { name: "Anthropic", status: "GA", desc: "Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus." },
      { name: "Google Gemini / Vertex AI", status: "GA", desc: "Gemini 2.0 Flash, Gemini 1.5 Pro." },
      { name: "AWS Bedrock", status: "GA", desc: "Claude, Llama, Mistral via your tenancy." },
      { name: "Open-source (vLLM / Ollama)", status: "Beta", desc: "Bring your own dedicated VPC deployment." },
    ],
  },
  {
    title: "Data warehouses (export)",
    Icon: Database,
    desc: "Pump requirement, trace and audit-event data into your analytics stack.",
    items: [
      { name: "Snowflake", status: "GA", desc: "Native Snowflake connector with incremental sync." },
      { name: "Databricks", status: "GA", desc: "Delta Lake target, CDC-friendly." },
      { name: "BigQuery", status: "GA", desc: "Streaming + scheduled batch." },
      { name: "Postgres / S3", status: "GA", desc: "JDBC / Parquet drop." },
    ],
  },
];

const STATUS_VARIANT: Record<"GA" | "Beta" | "Roadmap", "default" | "secondary" | "outline"> = {
  GA: "default",
  Beta: "secondary",
  Roadmap: "outline",
};

export default function Integrations() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Integrations — Connect Auditee to Your Existing Stack"
        description="40+ integrations across requirements management, DevOps, ALM, identity, documents, AI providers and data warehouses. DOORS, Jama, Polarion, Jira, GitHub, Slack, Okta, OpenAI, Snowflake and more."
        path="/integrations"
        keywords={["Auditee integrations", "DOORS integration", "Jama integration", "Polarion integration", "Jira integration", "Slack integration", "GitHub integration"]}
        jsonLd={breadcrumbsLd([{ name: "Home", path: "/" }, { name: "Integrations", path: "/integrations" }])}
      />
      <Navigation />
      <main className="pt-28 pb-24">
        <header className="max-w-3xl mx-auto px-6 text-center">
          <Plug className="w-10 h-10 mx-auto text-primary mb-4" />
          <h1 className="font-display text-4xl md:text-5xl font-bold text-slate-950 tracking-tight">
            Integrations
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Auditee plugs into your existing stack — RM tools, DevOps, ALM, identity, documents,
            AI providers and data warehouses. 40+ connectors out of the box.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            <Button asChild size="lg" className="gap-2">
              <Link href="/contact">Request an integration <ArrowRight className="w-4 h-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/app/sources">Connect a source</Link>
            </Button>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-6 mt-16 space-y-12">
          {GROUPS.map((g) => {
            const Icon = g.Icon;
            return (
              <section key={g.title}>
                <div className="flex items-start gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold text-slate-950">{g.title}</h2>
                    <p className="text-sm text-slate-600 mt-0.5">{g.desc}</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {g.items.map((it) => (
                    <Card key={it.name} className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-slate-900">{it.name}</h3>
                        <Badge variant={STATUS_VARIANT[it.status]} className="text-xs">{it.status}</Badge>
                      </div>
                      <p className="text-sm text-slate-600">{it.desc}</p>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <div className="max-w-3xl mx-auto px-6 mt-20 text-center">
          <h2 className="font-display text-2xl font-bold text-slate-950">Don't see your tool?</h2>
          <p className="mt-3 text-slate-600">Custom REST connectors are part of every Enterprise rollout. Tell us your stack — we'll scope it on the call.</p>
          <div className="mt-6">
            <Button asChild size="lg" className="gap-2">
              <Link href="/contact">Talk to us <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
