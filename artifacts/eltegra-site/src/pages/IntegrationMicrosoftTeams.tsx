import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, CheckCircle2, ArrowLeftRight } from "lucide-react";
import { SEO } from "@/components/SEO";

const CAPS = [
  "Channel-routed notifications — pick which Auditee event types go to which Teams channel (e.g. compliance-review channel for baseline-changes)",
  "Adaptive-card approvals — reviewers approve/reject baseline changes from the Teams card; signed audit log captures the action and the approver's verified Entra ID",
  "Bot @auditee — `@auditee req REQ-123` returns the requirement card; `@auditee findings open` lists current audit findings",
  "Personal app — Auditee in the left rail of every reviewer's Teams client, no extra browser tab",
  "Meetings extension — pull a requirement or traceability matrix into a Teams meeting tab live, share it on screen with one click",
  "Activity-feed notifications respect each user's quiet-hours and DND",
  "Granular Microsoft Graph permissions — review them in your Entra ID admin centre",
  "Government Cloud (GCC, GCC High) supported with isolated tenants",
];

const STEPS = [
  { n: 1, t: "Approve the Auditee app from the Microsoft Teams admin centre (or sideload via app catalog for evaluation)" },
  { n: 2, t: "In Auditee, paste your Microsoft 365 tenant ID and authorise via OAuth (Microsoft Entra ID)" },
  { n: 3, t: "Pin the Auditee bot in the channels that should receive notifications" },
  { n: 4, t: "Map Auditee event types to Teams channels with the drag-and-drop matcher" },
  { n: 5, t: "Test from Teams — `@auditee help` should return the command list" },
];

export default function IntegrationMicrosoftTeams() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Auditee + Microsoft Teams — Adaptive-Card Approvals, @auditee Bot & Meetings Extension"
        description="Channel-routed Auditee notifications, adaptive-card approval workflows with signed Entra ID audit trail, `@auditee` bot, personal-app left-rail, meetings extension. Microsoft Graph fine-grained permissions; GCC / GCC High supported."
        path="/integrations/microsoft-teams"
        keywords={["Auditee Microsoft Teams integration", "Teams adaptive card approval", "Teams bot requirements", "Microsoft Entra ID", "GCC High", "Teams meeting extension"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/integrations" className="text-sm text-slate-700 hover:text-primary">All integrations</Link>
            <Link href="/integrations/slack" className="text-sm text-slate-700 hover:text-primary">Slack</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Users className="h-10 w-10 mx-auto text-blue-600 mb-4" />
          <span className="inline-block text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1 mb-3">Integration · Microsoft Teams · Microsoft 365</span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Auditee + Microsoft Teams — approvals where your reviewers already are</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            Adaptive-card approvals with signed Entra ID audit trail, `@auditee` bot, personal-app left-rail, meetings extension. GCC and GCC High supported.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/contact?topic=teams-integration"><Button size="lg" className="rounded-full">Talk to integrations<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
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
          <h2>Adaptive cards that survive an audit</h2>
          <p>An adaptive-card approval looks casual but the audit trail is rigorous: the approval action is signed by the reviewer's verified Entra ID, captured with an immutable timestamp, and linked back to the source-of-truth approval record in Auditee. Your auditor sees the same evidence they would from an in-product approval.</p>

          <h2>GCC + GCC High</h2>
          <p>For US Federal customers and FedRAMP-aligned contractors, Auditee runs in Microsoft's Government Community Cloud (GCC) and the impact-level-5 GCC High tenant boundary. The integration uses GCC-specific Graph endpoints and stays within the GCC compliance envelope.</p>

          <h2>Privacy &amp; data minimisation</h2>
          <p>The Auditee bot posts only the metadata needed for the notification (requirement ID, title, change summary). Sensitive payloads stay in Auditee behind your tenant boundary. Workspace admins can configure per-channel redaction rules to exclude attachments or sensitive fields from broadly-shared channels.</p>

          <h2>Security &amp; compliance</h2>
          <ul>
            <li>OAuth via Microsoft Entra ID; granular Microsoft Graph scopes reviewable in Entra ID admin centre.</li>
            <li>Bot Framework HMAC-verified on every interaction.</li>
            <li>Customer-pinned region (ap-south-1 / eu-central-1 / GCC / GCC High).</li>
            <li>Field-level audit log of every Teams-originated action streamed to your SIEM.</li>
          </ul>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Wire up Teams in 15 minutes</h2>
          <p className="text-slate-300 mb-6">Most teams have channel notifications and the `@auditee` bot working before the next stand-up.</p>
          <Link href="/contact?topic=teams-walkthrough"><Button size="lg" className="rounded-full" data-testid="teams-cta">Book a Teams walkthrough<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </section>
    </div>
  );
}
