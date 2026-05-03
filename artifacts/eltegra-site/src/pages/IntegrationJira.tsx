import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Plug, CheckCircle2, ArrowLeftRight } from "lucide-react";
import { SEO } from "@/components/SEO";

const CAPS = [
  "Two-way sync — requirements ↔ Jira issues with conflict resolution and a written audit log",
  "Per-project mapping — pick which Jira project, which issue type, and which fields map to requirement attributes",
  "Smart linking — Jira's link types (blocks, relates, depends-on) preserved; missing-link suggestions surfaced inside Jira",
  "JQL-driven filters — only sync the issues you actually want to govern (e.g. epics + stories, exclude sub-tasks)",
  "Version-locked baselines — when you baseline a requirement set in Auditee, Jira issues are stamped with the baseline label",
  "Comments & attachments — Auditee discussions appear as Jira comments and vice versa",
  "Webhook + REST — change events stream both directions; bulk imports via Jira's REST v3 with rate-limit-aware batching",
  "Cloud, Data Center & Server — supported via app + API token; Jira Server requires a personal access token",
];

const STEPS = [
  { n: 1, t: "Install the Auditee app from the Atlassian Marketplace (free)" },
  { n: 2, t: "In Auditee, paste your Jira site URL and authorise via OAuth (Cloud) or API token (DC/Server)" },
  { n: 3, t: "Pick the Jira project(s) and issue types to sync. Map fields with our drag-and-drop matcher." },
  { n: 4, t: "Run a dry-run preview — see exactly which issues will be created/updated, no data moves yet" },
  { n: 5, t: "Hit \"Activate sync\". Webhooks light up; first full sync completes in minutes for typical projects" },
];

export default function IntegrationJira() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Auditee + Jira — Two-Way Requirements ↔ Issue Sync"
        description="Sync Auditee requirements with Atlassian Jira (Cloud, Data Center & Server). Two-way field mapping, JQL filters, version-locked baselines, comment sync, and a written audit log. Cloud-app + REST webhooks."
        path="/integrations/jira"
        keywords={["Auditee Jira integration", "Jira requirements management", "Jira ALM sync", "Atlassian Marketplace", "Jira ReqIF", "Jira traceability"]}
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
          <span className="inline-block text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1 mb-3">Integration · Atlassian Jira</span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Auditee + Jira — without the spreadsheet in between</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            Bidirectional sync between Auditee requirements and Jira issues. Cloud, Data Center and Server. Real audit log, version-locked baselines, conflict resolution your engineering team will trust.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/contact?topic=jira-integration"><Button size="lg" className="rounded-full">Talk to integrations<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
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
          <p className="text-sm text-slate-600 mt-6">Most teams have their first sync running in under 30 minutes. We've also published a <Link href="/migrations" className="text-primary underline">migration guide</Link> for moving off "Jira-as-RM" toward proper requirement governance.</p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-6 prose prose-slate prose-headings:font-display prose-headings:text-slate-950">
          <h2>Why not just use Jira for requirements?</h2>
          <p>Jira is excellent at tracking work — sprints, kanban, SLAs. It is genuinely poor at <em>requirement governance</em>: there's no native concept of bidirectional traceability, no signed baselines, no requirement quality scoring, no standards mapping (ASPICE, IEC 62304, ISO 26262), and no audit-grade evidence pack. Most regulated teams that try "Jira-as-RM" end up shadow-managing requirements in Word/Excel anyway.</p>
          <p>Auditee + Jira is the both-and: governance and traceability live in Auditee, day-to-day execution lives in Jira, and the sync is real-time and reversible.</p>

          <h2>Security &amp; compliance</h2>
          <ul>
            <li>OAuth 2.0 via Atlassian Connect (Cloud) or per-user API tokens (DC/Server).</li>
            <li>Auditee never stores Jira passwords; tokens are encrypted at rest with AES-256.</li>
            <li>Customer-pinned region (ap-south-1 for India, eu-central-1 for EU).</li>
            <li>Field-level audit log of every sync action streamed to your SIEM.</li>
          </ul>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Ready to wire it up?</h2>
          <p className="text-slate-300 mb-6">30-min walkthrough with a Solutions Architect. We'll bring a sandbox Jira project so you can see the sync live.</p>
          <Link href="/contact?topic=jira-walkthrough"><Button size="lg" className="rounded-full" data-testid="jira-cta">Book a Jira walkthrough<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </section>
    </div>
  );
}
