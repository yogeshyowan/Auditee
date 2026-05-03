import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Plug, CheckCircle2, ArrowLeftRight } from "lucide-react";
import { SEO } from "@/components/SEO";

const CAPS = [
  "Two-way sync — Auditee requirements ↔ Azure Boards work items (Epic, Feature, User Story, Task, Bug, Test Case)",
  "Process-template aware — Agile, Scrum, CMMI and Basic templates auto-detected; field mapping defaults to that template's conventions",
  "Repos & Pipelines linkage — link requirements to Azure Repos commits and Azure Pipelines runs for end-to-end traceability",
  "Test Plans integration — generated test cases land directly in Azure Test Plans with linked requirement & test-result reflection",
  "Area- and iteration-scoped sync — pick area paths and iterations to keep cross-team work isolated",
  "WIQL-driven filters — only sync the work items you want governed",
  "Personal-access-token (PAT) or OAuth (Microsoft Entra ID) auth, with optional service principal for CI",
  "Azure DevOps Services (cloud) and Azure DevOps Server 2020+ (on-prem) supported",
];

const STEPS = [
  { n: 1, t: "In Azure DevOps, generate a PAT with Work Items (Read/Write/Manage) scope — or wire up an Entra ID OAuth app for SSO" },
  { n: 2, t: "In Auditee, paste your organisation URL + project name + PAT (or sign in with Microsoft)" },
  { n: 3, t: "Pick which area paths, iterations and work-item types to sync. Map fields with the drag-and-drop matcher." },
  { n: 4, t: "Run a dry-run preview — exactly which work items would be created/updated, no data moves yet" },
  { n: 5, t: "Hit \"Activate sync\". Service-hooks register automatically; first full sync completes in minutes" },
];

export default function IntegrationAzureDevOps() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Auditee + Azure DevOps — Boards, Repos, Pipelines & Test Plans Sync"
        description="Two-way sync between Auditee requirements and Azure DevOps Boards (Agile, Scrum, CMMI templates), with linkage to Azure Repos commits, Azure Pipelines runs and Azure Test Plans. Cloud + on-prem Server 2020+."
        path="/integrations/azure-devops"
        keywords={["Auditee Azure DevOps integration", "Azure Boards requirements", "ADO sync", "Azure DevOps ALM", "Azure Test Plans integration", "Microsoft DevOps requirements"]}
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
          <Plug className="h-10 w-10 mx-auto text-primary mb-4" />
          <span className="inline-block text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 rounded-full px-2.5 py-1 mb-3">Integration · Azure DevOps</span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Auditee + Azure DevOps — Boards, Repos, Pipelines, Test Plans</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            Bidirectional sync to Azure Boards with linkage all the way through to commits, pipeline runs and test results. Process-template-aware. Cloud + Server 2020+.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/contact?topic=ado-integration"><Button size="lg" className="rounded-full">Talk to integrations<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
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
          <h2>Why pair Auditee with Azure DevOps?</h2>
          <p>Azure DevOps is one of the most common engineering execution stacks in regulated industries — particularly automotive Tier-1s using the CMMI template and MedTech firms using Agile. The CMMI template ships with strong fields (Effort, Original Estimate, Discipline) but no native concept of <em>standards mapping</em> (ASPICE, IEC 62304, ISO 26262) or audit-grade evidence packs. Auditee fills that gap without forcing your engineers off ADO.</p>

          <h2>Test Plans &amp; Pipelines linkage</h2>
          <p>Auditee's generated test cases land in Azure Test Plans with their parent requirement linked. Pipeline runs that touch a linked commit automatically reflect onto the requirement's traceability matrix — so an audit query like "show me the last passing build that exercised SWE.4 unit tests for SR-117" is one click away.</p>

          <h2>Security &amp; compliance</h2>
          <ul>
            <li>OAuth via Microsoft Entra ID (Azure AD), or per-user PAT, or service principal for CI.</li>
            <li>Auditee never stores plaintext PATs; tokens are encrypted at rest with AES-256.</li>
            <li>Customer-pinned region (ap-south-1 / eu-central-1) including for ADO metadata cache.</li>
            <li>Field-level audit log of every sync action streamed to your SIEM (Splunk, Datadog, Sentinel).</li>
          </ul>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Want a live walkthrough?</h2>
          <p className="text-slate-300 mb-6">30-min demo against a sandbox Azure DevOps project — Agile, Scrum or CMMI template, your choice.</p>
          <Link href="/contact?topic=ado-walkthrough"><Button size="lg" className="rounded-full" data-testid="ado-cta">Book an ADO walkthrough<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </section>
    </div>
  );
}
