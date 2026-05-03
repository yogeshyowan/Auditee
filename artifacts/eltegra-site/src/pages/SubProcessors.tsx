import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Globe2, Bell } from "lucide-react";
import { SEO } from "@/components/SEO";

const PROCESSORS = [
  { name: "Amazon Web Services (AWS)", purpose: "Primary cloud hosting (compute, storage, networking)", location: "ap-south-1 (Mumbai), eu-central-1 (Frankfurt) — customer-selectable", entity: "Amazon Web Services, Inc., USA" },
  { name: "Cloudflare", purpose: "CDN, DDoS protection, WAF, DNS", location: "Global edge", entity: "Cloudflare, Inc., USA" },
  { name: "Neon (PostgreSQL)", purpose: "Managed Postgres for application metadata", location: "ap-south-1 / eu-central-1 mirrors AWS region", entity: "Neon, Inc., USA" },
  { name: "Clerk", purpose: "Authentication, session management, MFA", location: "USA + EU edge", entity: "Clerk Inc., USA" },
  { name: "Razorpay", purpose: "Payments, subscriptions, billing for INR customers", location: "India", entity: "Razorpay Software Pvt. Ltd., India" },
  { name: "Stripe", purpose: "Payments for non-INR customers (where enabled)", location: "USA + Ireland", entity: "Stripe, Inc., USA / Stripe Payments Europe Ltd., Ireland" },
  { name: "OpenAI", purpose: "LLM inference for AI features (configurable; Enterprise can disable)", location: "USA", entity: "OpenAI, L.L.C., USA" },
  { name: "Anthropic", purpose: "Alternate LLM provider (opt-in workspace-level)", location: "USA", entity: "Anthropic PBC, USA" },
  { name: "Google Workspace", purpose: "Internal email, docs, calendars (no customer data routed here)", location: "Global", entity: "Google LLC, USA" },
  { name: "Linear", purpose: "Internal product engineering issue tracking (no customer PII)", location: "USA", entity: "Linear Orbit, Inc., USA" },
  { name: "Sentry", purpose: "Error tracking; PII scrubbed at the SDK level", location: "USA + EU", entity: "Functional Software, Inc. (Sentry), USA" },
  { name: "PostHog (self-hosted)", purpose: "Product analytics — self-hosted on our own AWS account; no third-party data export", location: "Same AWS region as application", entity: "Auditee-managed (no third-party processor)" },
  { name: "Resend", purpose: "Transactional email delivery (sign-up, billing, audit reminders)", location: "USA", entity: "Resend Inc., USA" },
];

export default function SubProcessors() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Sub-processor List — Auditee"
        description="Current list of Auditee sub-processors, including entity, purpose and processing location. Auditee gives 30 days' notice before adding or replacing any sub-processor."
        path="/sub-processors"
        keywords={["Auditee sub-processors", "sub-processor list", "GDPR sub-processors", "Article 28 sub-processor", "vendor list"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/dpa" className="text-sm text-slate-700 hover:text-primary">DPA</Link>
            <Link href="/trust" className="text-sm text-slate-700 hover:text-primary">Trust</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6">
          <Globe2 className="h-10 w-10 text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Sub-processors</h1>
          <p className="text-slate-700 max-w-2xl">
            The third-party services that may process customer personal data on our behalf as part of running Auditee. Updated whenever this list changes — version 2026.05, effective 03 May 2026.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <table className="min-w-full text-sm border border-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Sub-processor</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Purpose</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Processing location</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Legal entity</th>
                </tr>
              </thead>
              <tbody>
                {PROCESSORS.map((p) => (
                  <tr key={p.name} className="border-t border-slate-200 align-top">
                    <td className="px-4 py-3 font-semibold text-slate-900">{p.name}</td>
                    <td className="px-4 py-3 text-slate-700">{p.purpose}</td>
                    <td className="px-4 py-3 text-slate-700">{p.location}</td>
                    <td className="px-4 py-3 text-slate-700">{p.entity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Total: {PROCESSORS.length} active sub-processors. The DPA at <Link href="/dpa" className="text-primary underline">/dpa</Link> applies in full to each.
          </p>
        </div>
      </section>

      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center gap-2 mb-3 text-slate-700"><Bell className="h-5 w-5" /><h2 className="font-display font-bold text-2xl text-slate-950">Get notified of changes</h2></div>
          <p className="text-slate-700 mb-4">
            Workspace owners receive an email <strong>30 days</strong> before any sub-processor is added or replaced. To subscribe a security or privacy mailbox in addition to the workspace owner, email{" "}
            <a href="mailto:dpo@auditee.site" className="text-primary underline">dpo@auditee.site</a>.
          </p>
          <p className="text-sm text-slate-600">
            You may also subscribe to the machine-readable feed at <code className="text-xs bg-white border border-slate-200 px-1.5 py-0.5 rounded">/sub-processors.json</code> (RSS/JSON, planned Q3 2026 — see the <Link href="/roadmap" className="text-primary underline">roadmap</Link>).
          </p>
        </div>
      </section>
    </div>
  );
}
