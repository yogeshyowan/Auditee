import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageSquare, CheckCircle2, ArrowLeftRight } from "lucide-react";
import { SEO } from "@/components/SEO";

const CAPS = [
  "Channel-routed notifications — pick which Auditee event types go to which Slack channel (e.g. #compliance-review for baseline-changes, #qa for test-failures)",
  "Slash commands — `/auditee req REQ-123` returns the requirement card with attributes, status, and links right inside Slack",
  "Approval workflows — reviewers can approve/reject baseline changes from Slack with one click; signed audit log captures the action",
  "Threaded discussion sync — replies under an Auditee notification thread sync into the requirement's discussion log",
  "Daily/weekly digests — configurable per channel: \"5 requirements changed yesterday\", \"3 audit findings open >7 days\"",
  "Incident routing — when a problem report hits Auditee with severity ≥ High, it pages the configured Slack channel + on-call user",
  "Workflow Builder steps — drop \"Create Auditee requirement\" or \"Update baseline\" steps into your existing Slack workflows",
  "Granular OAuth scopes (chat:write, commands, channels:read) — review them in your Slack Admin Apps page",
];

const STEPS = [
  { n: 1, t: "Click \"Add to Slack\" — install the Auditee Slack app to your workspace (workspace owner approval may be required)" },
  { n: 2, t: "In Auditee, link the Slack workspace. Map event types to Slack channels with the drag-and-drop matcher." },
  { n: 3, t: "Optionally enable slash commands (`/auditee`) and Workflow Builder steps" },
  { n: 4, t: "Test from Slack — `/auditee help` should return the command list" },
  { n: 5, t: "Hit \"Activate notifications\". First digest arrives the next morning at your chosen time" },
];

export default function IntegrationSlack() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Auditee + Slack — Notifications, Slash Commands & Approval Workflows"
        description="Channel-routed Auditee notifications, `/auditee` slash commands, one-click approval workflows from Slack, threaded discussion sync, daily/weekly digests, and Workflow Builder steps. Granular OAuth scopes."
        path="/integrations/slack"
        keywords={["Auditee Slack integration", "Slack approval workflow", "Slack slash command requirements", "Slack compliance notifications", "Slack workflow builder"]}
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
          <MessageSquare className="h-10 w-10 mx-auto text-primary mb-4" />
          <span className="inline-block text-xs font-semibold text-pink-700 bg-pink-50 border border-pink-200 rounded-full px-2.5 py-1 mb-3">Integration · Slack</span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Auditee + Slack — notifications, approvals, and `/auditee` slash commands</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            Channel-routed events, one-click approvals, daily/weekly digests, and Workflow Builder steps — all with a signed audit log. The work happens where your team already lives.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/contact?topic=slack-integration"><Button size="lg" className="rounded-full">Talk to integrations<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
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
          <h2>Approval workflows that survive an audit</h2>
          <p>Slack approvals look casual but the audit trail is anything but. Every approve/reject from Slack is captured with the approving user's verified Slack identity, an immutable timestamp, and a signed link back to the source-of-truth approval record in Auditee. Auditors get the same evidence they would from an in-product approval — your reviewers get to do the work without context-switching.</p>

          <h2>Privacy &amp; data minimisation</h2>
          <p>The Auditee Slack app posts only the metadata needed for the notification (requirement ID, title, change summary). Sensitive payloads stay in Auditee behind your tenant boundary. Workspace admins can configure per-channel redaction rules (e.g. exclude attachments from #general).</p>

          <h2>Security &amp; compliance</h2>
          <ul>
            <li>Granular OAuth scopes; reviewable in Slack Admin → Apps.</li>
            <li>Slack request-signing-secret HMAC-verified on every interaction.</li>
            <li>Customer-pinned region (ap-south-1 / eu-central-1).</li>
            <li>Field-level audit log of every Slack-originated action streamed to your SIEM.</li>
          </ul>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Wire up Slack in 10 minutes</h2>
          <p className="text-slate-300 mb-6">Most teams have channel-routed notifications and `/auditee` working before the next stand-up.</p>
          <Link href="/contact?topic=slack-walkthrough"><Button size="lg" className="rounded-full" data-testid="slack-cta">Book a Slack walkthrough<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </section>
    </div>
  );
}
