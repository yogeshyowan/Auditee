import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, CheckCircle2, ArrowLeftRight } from "lucide-react";
import { SEO } from "@/components/SEO";

const CAPS = [
  "Live requirement embeds — drop an `{auditee:requirement}` macro into any Confluence page; the requirement renders with attributes, status and a click-through link",
  "Live traceability-matrix embeds — embed a filtered traceability view inside a Confluence page (great for design-history and audit-report pages)",
  "Page-to-requirement linkage — link any Confluence page to one or more requirements; the link surfaces on the requirement audit log",
  "Bidirectional comment sync — Confluence comments on a linked page mirror into the requirement discussion, with author identity preserved",
  "Auto-publish — when an Auditee baseline is approved, a snapshot Confluence page can be auto-published in the configured space",
  "Space-scoped install — pick which Confluence space(s) the integration is allowed to read/write",
  "Cloud + Data Center 8.0+ supported; Server end-of-life respected (no new installs)",
  "OAuth via Atlassian Connect (Cloud) or per-user API token (DC) — fine-grained scopes",
];

const STEPS = [
  { n: 1, t: "Install the Auditee app from the Atlassian Marketplace (free) — same listing as the Jira app" },
  { n: 2, t: "In Auditee, paste your Confluence site URL and authorise via OAuth (Cloud) or API token (DC)" },
  { n: 3, t: "Pick the Confluence spaces the integration may read/write" },
  { n: 4, t: "On any Confluence page, type `/auditee` to insert a requirement macro or traceability-matrix macro" },
  { n: 5, t: "Configure auto-publish rules from Auditee → Confluence (optional)" },
];

export default function IntegrationConfluence() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Auditee + Confluence — Live Requirement & Traceability Macros"
        description="Embed live Auditee requirements and traceability matrices in Confluence pages. `/auditee` slash macros, bidirectional comment sync, auto-publish on baseline approval. Cloud and Data Center 8.0+. Atlassian Marketplace listed."
        path="/integrations/confluence"
        keywords={["Auditee Confluence integration", "Confluence requirements macro", "Confluence traceability matrix", "Atlassian Marketplace", "Confluence DHF", "Confluence design history"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/integrations" className="text-sm text-slate-700 hover:text-primary">All integrations</Link>
            <Link href="/integrations/jira" className="text-sm text-slate-700 hover:text-primary">Jira</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <BookOpen className="h-10 w-10 mx-auto text-blue-600 mb-4" />
          <span className="inline-block text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1 mb-3">Integration · Atlassian Confluence</span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Auditee + Confluence — live requirements inside your wiki</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            Embed live Auditee requirements and traceability matrices on any Confluence page. The wiki stays the narrative; the source-of-truth stays in Auditee.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/contact?topic=confluence-integration"><Button size="lg" className="rounded-full">Talk to integrations<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
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
          <h2>Why \"live\" matters</h2>
          <p>Most teams discover too late that their Confluence "design history file" or "audit-report" page contains stale copy-pasted requirement text. When the underlying requirement evolves, the Confluence page silently rots — and that's exactly the kind of mismatch a notified-body or assessor will spot in five minutes. Auditee's macros render the <em>current</em> state of the requirement on every page view, with a clear baseline-tag if you've pinned to a specific version.</p>

          <h2>Auto-publish for baselines</h2>
          <p>For regulated programmes, you often want a frozen "as-released" snapshot in Confluence per baseline. Auditee can auto-publish (or update) a Confluence page when a baseline is approved, with the version, approver, timestamp and a downloadable evidence pack attached.</p>

          <h2>Security &amp; compliance</h2>
          <ul>
            <li>OAuth via Atlassian Connect (Cloud) or per-user API token (DC).</li>
            <li>Space-scoped permissions — the integration cannot read/write spaces you didn't authorise.</li>
            <li>Customer-pinned region (ap-south-1 / eu-central-1).</li>
            <li>Field-level audit log of every macro render and auto-publish event.</li>
          </ul>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Stop copy-pasting requirements into Confluence</h2>
          <p className="text-slate-300 mb-6">Most teams have their first live macro embedded in under 15 minutes.</p>
          <Link href="/contact?topic=confluence-walkthrough"><Button size="lg" className="rounded-full" data-testid="confluence-cta">Book a Confluence walkthrough<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </section>
    </div>
  );
}
