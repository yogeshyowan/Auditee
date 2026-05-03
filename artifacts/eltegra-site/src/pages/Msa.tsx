import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Scale, Globe2 } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function Msa() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Master Services Agreement (MSA) — Auditee"
        description="Auditee's Master Services Agreement governing Enterprise subscriptions. Includes order form structure, IP assignment, indemnification, limitation of liability, term, termination and governing law."
        path="/msa"
        keywords={["Auditee MSA", "Master Services Agreement", "Auditee enterprise contract", "SaaS MSA"]}
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
          <Scale className="h-10 w-10 text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Master Services Agreement</h1>
          <p className="text-slate-700">Version 2026.05 · Effective 03 May 2026 · Pre-signed for Enterprise</p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-6 prose prose-slate prose-headings:font-display prose-headings:text-slate-950">
          <p>
            This Master Services Agreement (the "<strong>MSA</strong>") is entered into between Qwikstuffs Pvt. Ltd. ("<strong>Auditee</strong>") and the customer named on an Order Form ("<strong>Customer</strong>"). It governs Customer's access to and use of the Auditee platform and related services (the "<strong>Service</strong>"). The Order Form, this MSA, the <Link href="/dpa" className="text-primary underline">DPA</Link> and the <Link href="/aup" className="text-primary underline">Acceptable Use Policy</Link> together form the "<strong>Agreement</strong>".
          </p>

          <h2>1. Order forms &amp; access</h2>
          <p>
            Each engagement begins with a mutually executed Order Form specifying subscription tier, term, fees, billing cadence, named users / workspaces, and any committed usage. Auditee grants Customer a non-exclusive, non-transferable, worldwide right to access the Service during the subscription term solely for Customer's internal business purposes.
          </p>

          <h2>2. Fees, taxes &amp; payment</h2>
          <ul>
            <li>Fees are billed in the currency stated on the Order Form (USD, EUR, GBP, INR, AUD, SGD or AED).</li>
            <li>Net 30 from invoice date for annual prepayment; 0% late-payment grace, then 1.0% per month interest as permitted by law.</li>
            <li>All fees are exclusive of taxes; Customer is responsible for sales tax, VAT, GST and equivalent indirect taxes.</li>
            <li>Multi-year orders may be discounted and price-locked per the Order Form.</li>
          </ul>

          <h2>3. Customer data &amp; intellectual property</h2>
          <p>
            Customer retains all right, title and interest in Customer Data. Auditee retains all right, title and interest in the Service, the underlying software, and all derivative works, including improvements based on aggregated, anonymised usage telemetry that does not identify Customer or its end users.
          </p>

          <h2>4. Confidentiality</h2>
          <p>
            Each party will protect the other's Confidential Information using the same care it uses to protect its own (and no less than reasonable care). Confidentiality obligations survive termination for 5 years, or perpetually for trade secrets and personal data.
          </p>

          <h2>5. Service levels &amp; support</h2>
          <p>
            Service availability and support response times are governed by the <Link href="/sla" className="text-primary underline">Service Level Agreement</Link>. Service credits are Customer's exclusive remedy for Service unavailability.
          </p>

          <h2>6. Security &amp; privacy</h2>
          <p>
            Auditee maintains administrative, physical and technical safeguards designed to protect Customer Data, as further described in the <Link href="/dpa" className="text-primary underline">DPA</Link>, the <Link href="/security" className="text-primary underline">Security overview</Link> and the <Link href="/security-whitepaper" className="text-primary underline">Security Whitepaper</Link>. The DPA is incorporated into this Agreement by reference and forms part of it.
          </p>

          <h2>7. Warranties &amp; disclaimers</h2>
          <p>
            Auditee warrants that the Service will materially conform to its published documentation. EXCEPT FOR THIS WARRANTY, THE SERVICE IS PROVIDED "AS IS" AND AUDITEE DISCLAIMS ALL OTHER WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT.
          </p>

          <h2>8. Indemnification</h2>
          <ul>
            <li><strong>By Auditee:</strong> We will defend Customer against third-party claims that the Service infringes a valid patent, copyright or trade secret, and pay damages finally awarded.</li>
            <li><strong>By Customer:</strong> Customer will defend Auditee against third-party claims arising from Customer Data or use of the Service in breach of the Agreement.</li>
          </ul>

          <h2>9. Limitation of liability</h2>
          <p>
            Except for liability arising from indemnification, breach of confidentiality, gross negligence, willful misconduct, or amounts owed under an Order Form: (a) neither party will be liable for indirect, incidental, special, consequential or punitive damages; and (b) each party's aggregate liability is capped at the fees paid or payable by Customer in the 12 months preceding the claim.
          </p>

          <h2>10. Term &amp; termination</h2>
          <p>
            Each Order Form runs for the subscription term stated. Either party may terminate for the other's uncured material breach (30 days' written notice) or upon the other's insolvency. On termination, Customer may export Customer Data for 30 days; thereafter Auditee deletes per the DPA.
          </p>

          <h2>11. Governing law &amp; venue</h2>
          <p>
            This Agreement is governed by the laws of England &amp; Wales (or India, where the Customer is India-domiciled), excluding conflict-of-laws rules. Disputes are resolved by the courts of London, UK (or Bengaluru, India), unless the Order Form specifies arbitration under ICC rules.
          </p>

          <h2>12. General</h2>
          <p>
            The Agreement is the entire agreement between the parties, supersedes all prior proposals, and may be amended only by a written instrument signed by both parties. If any provision is held unenforceable, the remainder will continue in force. Notices to Auditee: <a href="mailto:legal@auditee.site" className="text-primary underline">legal@auditee.site</a>.
          </p>
        </div>
      </section>

      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-3xl mx-auto px-6 grid sm:grid-cols-3 gap-4">
          <Link href="/dpa" className="bg-white border border-slate-200 rounded-xl p-5 hover:border-primary transition-colors">
            <Globe2 className="h-6 w-6 text-primary mb-2" />
            <div className="font-semibold text-slate-900">DPA</div>
            <div className="text-sm text-slate-600 mt-1">GDPR / DPDP / SCCs.</div>
          </Link>
          <Link href="/baa" className="bg-white border border-slate-200 rounded-xl p-5 hover:border-primary transition-colors">
            <FileText className="h-6 w-6 text-primary mb-2" />
            <div className="font-semibold text-slate-900">BAA</div>
            <div className="text-sm text-slate-600 mt-1">HIPAA Business Associate Agreement.</div>
          </Link>
          <Link href="/sla" className="bg-white border border-slate-200 rounded-xl p-5 hover:border-primary transition-colors">
            <Scale className="h-6 w-6 text-primary mb-2" />
            <div className="font-semibold text-slate-900">SLA</div>
            <div className="text-sm text-slate-600 mt-1">99.95% uptime &amp; service credits.</div>
          </Link>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Need a counter-signed MSA?</h2>
          <p className="text-slate-300 mb-6">Enterprise customers get a pre-signed MSA + DPA + BAA bundle within 1 business day. No legal review for the standard text — only redlines need negotiation.</p>
          <Link href="/contact?topic=msa">
            <Button size="lg" className="rounded-full" data-testid="msa-contact-cta">
              Request signed MSA<ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
