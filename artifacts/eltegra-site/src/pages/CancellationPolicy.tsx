import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, XCircle } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function CancellationPolicy() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Cancellation Policy — Auditee"
        description="How to cancel your Auditee subscription. Self-serve cancellation in /app/billing for monthly plans, lapse-at-end-of-term for annual plans, and notice periods for Enterprise contracts."
        path="/cancellation-policy"
        keywords={["Auditee cancellation policy", "cancel SaaS subscription", "cancel Razorpay subscription"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/refund-policy" className="text-sm text-slate-700 hover:text-primary">Refunds</Link>
            <Link href="/terms-of-service" className="text-sm text-slate-700 hover:text-primary">Terms</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <XCircle className="h-10 w-10 mx-auto text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Cancellation policy</h1>
          <p className="text-lg text-slate-700">Last updated: 1 May 2026 · Operated by Qwikstuffs Pvt. Ltd., Chennai 600077, India</p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-6 prose prose-slate prose-headings:font-display prose-headings:text-slate-950">
          <h2>1. Monthly subscriptions</h2>
          <ul>
            <li><strong>Self-serve.</strong> Workspace owners can cancel any time from <Link href="/app/billing">/app/billing</Link>.</li>
            <li>Cancellation takes effect at the end of the current billing cycle. You retain full access until then.</li>
            <li>Razorpay's auto-debit mandate is revoked the moment you cancel — no further charges will be attempted.</li>
            <li>On expiry, the workspace automatically downgrades to the Free plan. Your data is preserved.</li>
          </ul>

          <h2>2. Annual plans</h2>
          <ul>
            <li>Annual plans are paid up front as a one-time order — there is no recurring auto-debit (RBI auto-debit cap workaround).</li>
            <li>The plan runs for the full 12 months and lapses automatically. There is no "cancellation" needed.</li>
            <li>If you'd like a refund within the eligible window, see the <Link href="/refund-policy">refund policy</Link>.</li>
            <li>To prevent renewal next year, simply do nothing — we don't auto-renew annual orders.</li>
          </ul>

          <h2>3. Enterprise contracts</h2>
          <ul>
            <li>Cancellation / non-renewal terms follow your signed Order Form and MSA.</li>
            <li>Default notice period is <strong>60 days</strong> before the end of the current term.</li>
            <li>We will export your data in standard formats (ReqIF 1.x, JSON, CSV, PDF) at no extra charge during the notice period.</li>
          </ul>

          <h2>4. Effect of cancellation on data</h2>
          <ul>
            <li>For 30 days after cancellation, your data remains available — log in and re-subscribe to restore full access.</li>
            <li>From day 31, the workspace and its contents are scheduled for deletion. We will hard-delete within 60 days unless legally required to retain (e.g. tax invoices for 8 years per Indian regulations).</li>
            <li>You can export everything from <Link href="/app">/app</Link> before that window closes — see <Link href="/help">Help Center</Link> for export instructions.</li>
          </ul>

          <h2>5. How to cancel</h2>
          <ol>
            <li>Sign in as the workspace owner.</li>
            <li>Go to <Link href="/app/billing">/app/billing</Link>.</li>
            <li>Click "Cancel subscription" — confirm.</li>
            <li>You'll receive an email confirmation within 5 minutes.</li>
          </ol>
          <p>Trouble cancelling? Email <a href="mailto:billing@auditee.site">billing@auditee.site</a> from the workspace owner's address — we'll process it manually within one business day.</p>

          <h2>6. Contact</h2>
          <p>Qwikstuffs Pvt. Ltd. · Chennai 600077, Tamil Nadu, India · <a href="mailto:billing@auditee.site">billing@auditee.site</a> · +91-83100-42593</p>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Need help cancelling?</h2>
          <p className="text-slate-300 mb-6">We process every cancellation request within one business day.</p>
          <a href="mailto:billing@auditee.site">
            <Button size="lg" className="rounded-full" data-testid="cancellation-contact-cta">Email billing@auditee.site<ArrowRight className="ml-2 h-4 w-4" /></Button>
          </a>
        </div>
      </section>
    </div>
  );
}
