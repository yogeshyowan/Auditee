import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, PackageCheck } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function ShippingPolicy() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Shipping & Delivery Policy — Auditee"
        description="Auditee is a digital, internet-delivered SaaS — there are no physical goods to ship. This page describes service activation timelines, GST invoice delivery and access provisioning."
        path="/shipping-policy"
        keywords={["Auditee shipping policy", "SaaS delivery policy", "Razorpay shipping policy", "digital goods delivery"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/refund-policy" className="text-sm text-slate-700 hover:text-primary">Refunds</Link>
            <Link href="/cancellation-policy" className="text-sm text-slate-700 hover:text-primary">Cancellation</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <PackageCheck className="h-10 w-10 mx-auto text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Shipping &amp; delivery policy</h1>
          <p className="text-lg text-slate-700">Last updated: 1 May 2026 · Operated by Qwikstuffs Pvt. Ltd., Chennai 600077, India</p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-6 prose prose-slate prose-headings:font-display prose-headings:text-slate-950">
          <h2>1. We don't ship physical goods</h2>
          <p>Auditee is a software-as-a-service product delivered entirely over the internet. There are no physical items, no shipping carriers, and no shipping addresses to capture at checkout.</p>

          <h2>2. Service activation timeline</h2>
          <ul>
            <li><strong>Free plan</strong> — instant access on email verification.</li>
            <li><strong>Monthly &amp; annual plans (self-serve)</strong> — your workspace is upgraded within 60 seconds of a successful Razorpay payment. If activation hasn't completed in 5 minutes, email <a href="mailto:billing@auditee.site">billing@auditee.site</a>.</li>
            <li><strong>Enterprise (single-tenant / on-prem)</strong> — provisioning timeline is set in your Order Form. Single-tenant cloud is typically <strong>3 business days</strong>; on-prem deployments depend on your environment readiness.</li>
          </ul>

          <h2>3. GST invoice delivery</h2>
          <ul>
            <li>A GST-compliant invoice is emailed to the billing-contact address within 24 hours of every successful payment.</li>
            <li>Invoices are also available for download from <Link href="/app/billing">/app/billing</Link> indefinitely.</li>
            <li>To update GSTIN, billing address or registered name, edit them in <Link href="/app/billing">/app/billing</Link> before your next payment, or email <a href="mailto:billing@auditee.site">billing@auditee.site</a>.</li>
          </ul>

          <h2>4. Access provisioning</h2>
          <p>Workspace owners can invite teammates from <Link href="/app">/app</Link>. Invitees receive an email and gain access on first sign-in. Seat-counting is enforced per the active plan; over-limit invites are rejected at the seat boundary, never silently billed.</p>

          <h2>5. Service interruptions &amp; SLA</h2>
          <p>Standard plans target 99.9% monthly uptime; Enterprise plans target 99.95% with credits per the <Link href="/sla">SLA</Link>. Live status is at <Link href="/status">/status</Link>.</p>

          <h2>6. International customers</h2>
          <ul>
            <li>Auditee is available globally. Pricing is shown in INR for India-billed customers and USD for international customers (a region-aware default that you can override at checkout).</li>
            <li>Customers in the EU, US, UK and AED zones can request a local-currency invoice for accounting purposes — email <a href="mailto:billing@auditee.site">billing@auditee.site</a>.</li>
            <li>No customs, duties or shipping fees apply.</li>
          </ul>

          <h2>7. Contact</h2>
          <p>Qwikstuffs Pvt. Ltd. · Chennai 600077, Tamil Nadu, India · <a href="mailto:billing@auditee.site">billing@auditee.site</a> · +91-83100-42593</p>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Trouble accessing your workspace?</h2>
          <p className="text-slate-300 mb-6">If a payment succeeded but the workspace hasn't upgraded, email us — we fix this within an hour during business hours.</p>
          <a href="mailto:billing@auditee.site">
            <Button size="lg" className="rounded-full" data-testid="shipping-contact-cta">Email billing@auditee.site<ArrowRight className="ml-2 h-4 w-4" /></Button>
          </a>
        </div>
      </section>
    </div>
  );
}
