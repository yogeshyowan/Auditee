import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Receipt } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function RefundPolicy() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Refund Policy — Auditee"
        description="Auditee's refund policy: 14-day money-back guarantee on first purchases, pro-rated refunds on annual plans, refund timelines and Razorpay-specific procedure for Indian customers."
        path="/refund-policy"
        keywords={["Auditee refund policy", "SaaS refund", "Razorpay refund", "money-back guarantee"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/cancellation-policy" className="text-sm text-slate-700 hover:text-primary">Cancellation</Link>
            <Link href="/terms-of-service" className="text-sm text-slate-700 hover:text-primary">Terms</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Receipt className="h-10 w-10 mx-auto text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Refund policy</h1>
          <p className="text-lg text-slate-700">Last updated: 1 May 2026 · Operated by Qwikstuffs Pvt. Ltd., Chennai 600077, India</p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-6 prose prose-slate prose-headings:font-display prose-headings:text-slate-950">
          <h2>1. Free plan</h2>
          <p>The Free plan is — as the name suggests — free. There is nothing to refund.</p>

          <h2>2. Monthly subscriptions (Standard ₹1,999 / Professional ₹7,999)</h2>
          <ul>
            <li><strong>14-day money-back guarantee on your first paid month.</strong> Email <a href="mailto:billing@auditee.site">billing@auditee.site</a> from the workspace owner's address within 14 days of your first charge and we'll refund 100% — no questions asked.</li>
            <li>After the first month, monthly charges are non-refundable, but you can cancel any time and you won't be charged for the next cycle.</li>
            <li>If we materially break the service or your data is lost due to our error, we will refund the affected period regardless of timing.</li>
          </ul>

          <h2>3. Annual plans (Standard ₹19,990 / Professional ₹79,990)</h2>
          <ul>
            <li><strong>30-day full refund.</strong> Cancel within 30 days of your annual order for a 100% refund.</li>
            <li><strong>Pro-rata refund 31–180 days.</strong> Refund of the unused months minus a 15% restocking fee.</li>
            <li>After 180 days, annual plans are non-refundable but continue running for the full 12-month period.</li>
          </ul>

          <h2>4. Enterprise contracts</h2>
          <p>Enterprise plans follow the refund/exit terms in your signed Order Form and Master Services Agreement. Where the MSA is silent, the annual-plan terms above apply.</p>

          <h2>5. Refund timelines</h2>
          <ul>
            <li>We approve or deny a refund request within 3 business days.</li>
            <li>Approved refunds are initiated to your original payment method (card / UPI / netbanking) within 1 business day.</li>
            <li>Razorpay typically credits the refund within <strong>5–7 business days</strong> for cards, <strong>2–4 business days</strong> for UPI, and <strong>3–5 business days</strong> for netbanking. Bank-side delays are outside our control.</li>
          </ul>

          <h2>6. How to request a refund</h2>
          <p>Email <a href="mailto:billing@auditee.site">billing@auditee.site</a> from the workspace owner's address with: workspace ID, Razorpay order/subscription ID, and the reason. We respond to every refund email a human writes.</p>

          <h2>7. Chargebacks</h2>
          <p>If you believe a charge is fraudulent or unauthorised, please contact us first — we resolve almost all disputes faster than your bank can. Chargebacks filed without contacting us first may result in suspension of the affected workspace until the dispute is resolved.</p>

          <h2>8. Contact</h2>
          <p>Qwikstuffs Pvt. Ltd. · Chennai 600077, Tamil Nadu, India · <a href="mailto:billing@auditee.site">billing@auditee.site</a> · +91-83100-42593</p>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Need to talk to billing?</h2>
          <p className="text-slate-300 mb-6">A human reads every billing email. Same-day response on business days.</p>
          <a href="mailto:billing@auditee.site">
            <Button size="lg" className="rounded-full" data-testid="refund-contact-cta">Email billing@auditee.site<ArrowRight className="ml-2 h-4 w-4" /></Button>
          </a>
        </div>
      </section>
    </div>
  );
}
