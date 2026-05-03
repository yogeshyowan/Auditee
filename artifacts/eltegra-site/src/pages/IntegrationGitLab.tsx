import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, GitBranch, CheckCircle2, ArrowLeftRight } from "lucide-react";
import { SEO } from "@/components/SEO";

const CAPS = [
  "GitLab.com (SaaS) and self-managed GitLab 16.0+ — same feature set, on-prem or cloud",
  "Issues ↔ requirements two-way sync with epic, milestone, label and iteration mapping",
  "Merge requests linked to requirements — status, approvals, threads visible on the requirement traceability matrix",
  "Commit traceability via `Auditee-Req: REQ-123` git trailer",
  "GitLab CI/CD integration — pipeline status, test reports (JUnit), code-coverage reports surface on linked requirements",
  "Releases & tags — when you cut a GitLab Release, Auditee snapshots the linked requirement set as a baseline",
  "Group-level install — pick a GitLab group; subgroups & projects auto-discover",
  "OAuth (recommended), Project Access Tokens or Personal Access Tokens — fine-grained scopes only (api, read_repository)",
];

const STEPS = [
  { n: 1, t: "In Auditee, click \"Add GitLab\". Pick GitLab.com or your self-managed URL." },
  { n: 2, t: "Authorise via OAuth — or paste a Project/Personal Access Token with `api` + `read_repository` scopes" },
  { n: 3, t: "Pick the GitLab group, subgroups and projects to govern. Map fields with the drag-and-drop matcher." },
  { n: 4, t: "Run a dry-run preview — exactly which issues/MRs would sync, no data moves yet" },
  { n: 5, t: "Hit \"Activate sync\". System hooks register automatically; first full sync completes in minutes" },
];

export default function IntegrationGitLab() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Auditee + GitLab — Issues, MRs, CI/CD & Releases Sync"
        description="Two-way sync between Auditee requirements and GitLab Issues, Merge Requests, CI/CD pipelines and Releases. GitLab.com SaaS + self-managed 16.0+. OAuth or fine-grained tokens. Audit-grade traceability."
        path="/integrations/gitlab"
        keywords={["Auditee GitLab integration", "GitLab requirements management", "GitLab Issues sync", "GitLab CI traceability", "self-managed GitLab integration", "GitLab Premium Ultimate"]}
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
          <GitBranch className="h-10 w-10 mx-auto text-orange-600 mb-4" />
          <span className="inline-block text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-2.5 py-1 mb-3">Integration · GitLab</span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Auditee + GitLab — full DevSecOps traceability</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            Issues, MRs, CI/CD pipelines, JUnit reports, coverage reports and Releases — all linked to the requirement they implement. SaaS or self-managed.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/contact?topic=gitlab-integration"><Button size="lg" className="rounded-full">Talk to integrations<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
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
          <h2>Self-managed GitLab — no data leaves your network</h2>
          <p>For self-managed GitLab installations on segregated networks, Auditee can run a customer-hosted relay agent that talks outbound-only to your GitLab and outbound-only to your Auditee tenant — no inbound firewall holes, no public webhooks. The agent is signed-binary, runs on Linux/Windows, and ships full audit logs.</p>

          <h2>JUnit + coverage on the traceability matrix</h2>
          <p>Every GitLab CI pipeline that produces a JUnit XML report or a coverage report contributes to the linked requirement's verification evidence. Auditors can sample a requirement and see "REQ-117 is verified by 3 unit tests + 2 integration tests, last passing run #4521 against commit a3f7b2".</p>

          <h2>Security &amp; compliance</h2>
          <ul>
            <li>OAuth via GitLab application; PAT/PrAT supported with fine-grained scopes only.</li>
            <li>Auditee never stores plaintext tokens; encrypted at rest with AES-256.</li>
            <li>Customer-pinned region (ap-south-1 / eu-central-1).</li>
            <li>Field-level audit log of every sync action streamed to your SIEM.</li>
          </ul>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Want a live walkthrough?</h2>
          <p className="text-slate-300 mb-6">30-min demo against a sandbox GitLab — SaaS or your self-managed instance, your choice.</p>
          <Link href="/contact?topic=gitlab-walkthrough"><Button size="lg" className="rounded-full" data-testid="gitlab-cta">Book a GitLab walkthrough<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </section>
    </div>
  );
}
