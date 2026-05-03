import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Github, CheckCircle2, ArrowLeftRight } from "lucide-react";
import { SEO } from "@/components/SEO";

const CAPS = [
  "GitHub App install — fine-grained permissions, no PAT sprawl, per-org or per-repo scoping",
  "Issues ↔ requirements — two-way sync with field mapping (labels → priority, milestones → baseline, projects v2 fields → custom attributes)",
  "Pull requests linked to requirements — every PR appears on the requirement's traceability matrix with merge state and review status",
  "Commit traceability — git-trailer convention (`Auditee-Req: REQ-123`) recognised; commits surface on the requirement audit log",
  "GitHub Actions integration — workflow run results (test coverage, SAST, lint) reflect onto linked requirements automatically",
  "Releases & tags — when you cut a GitHub Release, Auditee snapshots the linked requirement set as a baseline with the tag",
  "Code-owner suggestions — Auditee proposes reviewers from CODEOWNERS when a requirement change touches their area",
  "GitHub Enterprise Cloud, Enterprise Server 3.10+, and github.com supported",
];

const STEPS = [
  { n: 1, t: "Install the Auditee GitHub App from the GitHub Marketplace and grant access to the org or selected repos" },
  { n: 2, t: "In Auditee, link your GitHub org. Repos auto-discover; pick which ones to govern" },
  { n: 3, t: "Map labels, milestones and Projects v2 fields to requirement attributes with the drag-and-drop matcher" },
  { n: 4, t: "Run a dry-run preview — exactly which issues/PRs would sync, no data moves yet" },
  { n: 5, t: "Hit \"Activate sync\". Webhooks light up; first full sync completes in minutes" },
];

export default function IntegrationGitHub() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Auditee + GitHub — Issues, PRs, Actions & Releases Sync"
        description="Two-way sync between Auditee requirements and GitHub Issues, PRs, Projects v2, Actions and Releases. GitHub App with fine-grained permissions. Cloud, Enterprise Server 3.10+, github.com — full audit-grade traceability."
        path="/integrations/github"
        keywords={["Auditee GitHub integration", "GitHub requirements management", "GitHub Issues sync", "GitHub Actions traceability", "GitHub Marketplace", "GitHub Enterprise integration"]}
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
          <Github className="h-10 w-10 mx-auto text-slate-900 mb-4" />
          <span className="inline-block text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-full px-2.5 py-1 mb-3">Integration · GitHub</span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Auditee + GitHub — full traceability from requirement to release tag</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            Issues, PRs, Projects v2, Actions and Releases — linked to the requirement they implement. Audit-grade evidence that survives the next merge.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/contact?topic=github-integration"><Button size="lg" className="rounded-full">Talk to integrations<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
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
          <h2>Why a GitHub App, not a PAT?</h2>
          <p>Personal access tokens are a security and operational headache: they belong to a human, expire when that human leaves, can be over-scoped, and don't show up on org-wide audit logs the way installed GitHub Apps do. Auditee's GitHub App requests <em>fine-grained</em> permissions per repo (Issues: read/write, Pull requests: read, Contents: read, Actions: read), is reviewable in your GitHub org's Installed Apps page, and rotates its own credentials.</p>

          <h2>Commit-trailer traceability</h2>
          <p>If your engineering culture leans on conventional commits, add an <code>Auditee-Req: REQ-123</code> trailer to your commit message. Auditee parses every commit on every default-branch push, links it to the referenced requirement, and surfaces it on the audit log along with the author, signoff, and CI verdict. No more "where's the evidence this was actually built?".</p>

          <h2>Security &amp; compliance</h2>
          <ul>
            <li>GitHub App with fine-grained permissions; full credential rotation on Auditee's side.</li>
            <li>Customer-pinned region (ap-south-1 / eu-central-1).</li>
            <li>Field-level audit log of every sync action streamed to your SIEM.</li>
            <li>Webhook payloads HMAC-verified against your installation's secret.</li>
          </ul>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Want a live walkthrough?</h2>
          <p className="text-slate-300 mb-6">30-min demo against a sandbox GitHub org — Cloud or your Enterprise Server, your choice.</p>
          <Link href="/contact?topic=github-walkthrough"><Button size="lg" className="rounded-full" data-testid="github-cta">Book a GitHub walkthrough<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </section>
    </div>
  );
}
