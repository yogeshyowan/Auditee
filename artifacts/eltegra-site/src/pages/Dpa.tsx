import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, FileText, Globe2 } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function Dpa() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Data Processing Addendum (DPA) — Auditee"
        description="Auditee's Data Processing Addendum (DPA) covering GDPR, UK GDPR and India DPDP Act 2023. Includes Standard Contractual Clauses for international transfers, sub-processor list, security measures and breach notification commitments."
        path="/dpa"
        keywords={["Auditee DPA", "Data Processing Addendum", "GDPR DPA", "DPDP Act DPA", "Standard Contractual Clauses", "SCCs"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/sub-processors" className="text-sm text-slate-700 hover:text-primary">Sub-processors</Link>
            <Link href="/trust" className="text-sm text-slate-700 hover:text-primary">Trust</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6">
          <ShieldCheck className="h-10 w-10 text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Data Processing Addendum</h1>
          <p className="text-slate-700">Version 2026.05 · Effective 03 May 2026</p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-6 prose prose-slate prose-headings:font-display prose-headings:text-slate-950">
          <p>
            This Data Processing Addendum (the "<strong>DPA</strong>") forms part of the agreement between Qwikstuffs Pvt. Ltd. ("<strong>Auditee</strong>", "we") and the customer ("<strong>Customer</strong>", "you") for the use of the Auditee platform (the "<strong>Service</strong>"). It governs Auditee's processing of personal data on behalf of the Customer.
          </p>

          <h2>1. Roles &amp; scope</h2>
          <p>
            The Customer is the <em>Controller</em> of personal data submitted to the Service. Auditee acts as the <em>Processor</em>. Where the Customer is itself a Processor for an upstream Controller, Auditee acts as a Sub-processor on the same terms.
          </p>

          <h2>2. Subject matter, duration, nature &amp; purpose</h2>
          <p>
            Auditee processes personal data only to provide, maintain, secure and improve the Service per the agreement. Processing continues for the duration of the customer's subscription plus a 30-day grace period for data export, after which we delete or return all personal data per Section 7.
          </p>

          <h2>3. Categories of data subjects &amp; data</h2>
          <ul>
            <li><strong>Data subjects:</strong> Customer's authorised users, end-customers referenced in requirements documents, employees named in audit evidence.</li>
            <li><strong>Personal data categories:</strong> name, email, employer, role, IP address, browser fingerprint, in-app actions, content uploaded by users.</li>
            <li><strong>Special categories:</strong> only where uploaded by the Customer (e.g. medical-device clinical evaluation reports). The Customer is responsible for lawfulness.</li>
          </ul>

          <h2>4. Customer instructions</h2>
          <p>Auditee processes personal data only on the documented instructions of the Customer, including with regard to international transfers, unless required to do so by law. We notify the Customer if we believe an instruction infringes data-protection law.</p>

          <h2>5. Confidentiality</h2>
          <p>All Auditee personnel authorised to process personal data are under written confidentiality obligations and receive privacy &amp; security training annually.</p>

          <h2>6. Security measures (Article 32 GDPR)</h2>
          <ul>
            <li>Encryption in transit (TLS 1.3) and at rest (AES-256, customer-managed keys on Enterprise).</li>
            <li>Single-tenant deployment option for Enterprise; otherwise logical isolation with row-level security and per-workspace encryption keys.</li>
            <li>Least-privilege role-based access; mandatory MFA on all production access.</li>
            <li>Continuous vulnerability scanning, annual penetration testing, SOC 2 Type II controls.</li>
            <li>72-hour personal-data breach notification to the Customer per Article 33.</li>
            <li>Full security overview at <Link href="/security" className="text-primary underline">/security</Link> and <Link href="/trust" className="text-primary underline">/trust</Link>.</li>
          </ul>

          <h2>7. Sub-processors</h2>
          <p>
            Auditee uses a small set of vetted Sub-processors, each bound by written terms equivalent to this DPA. The current list is published at{" "}
            <Link href="/sub-processors" className="text-primary underline">/sub-processors</Link>. We provide 30 days' notice via the in-app notification centre and an email to workspace owners before adding or replacing any Sub-processor; the Customer may object in writing during the notice period.
          </p>

          <h2>8. International transfers</h2>
          <p>
            Where personal data is transferred from the EEA, UK or Switzerland to a country without an adequacy decision, the EU Standard Contractual Clauses (Module 2 or 3, as applicable) and the UK International Data Transfer Addendum apply and are incorporated into this DPA by reference. For DPDP Act 2023 transfers from India, transfers occur only to jurisdictions not restricted by the Indian government.
          </p>

          <h2>9. Data subject requests</h2>
          <p>
            Auditee provides self-service tooling for the Customer to access, rectify, erase, restrict and export personal data. Where the Customer needs Auditee's assistance to fulfil a data-subject request, we respond within 5 business days at no additional cost.
          </p>

          <h2>10. Audit rights</h2>
          <p>
            On reasonable written notice and no more than once per year (except after a personal-data breach), the Customer may request — and Auditee will provide — copies of the latest SOC 2 Type II report and ISO 27001 certificate (if applicable). On-site audits are available for Enterprise customers under NDA.
          </p>

          <h2>11. Return &amp; deletion</h2>
          <p>
            On termination, Auditee deletes or returns all personal data within 30 days. Encrypted backups are retained no longer than 90 days, after which they are cryptographically erased.
          </p>

          <h2>12. Governing law &amp; signatures</h2>
          <p>
            This DPA is governed by the laws of India for India-domiciled customers, and by the laws of England &amp; Wales for all other customers. To execute this DPA, download a counter-signed PDF from{" "}
            <Link href="/contact?topic=dpa" className="text-primary underline">/contact?topic=dpa</Link>{" "}
            or email <a href="mailto:dpo@auditee.site" className="text-primary underline">dpo@auditee.site</a>.
          </p>
        </div>
      </section>

      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-3xl mx-auto px-6 grid sm:grid-cols-2 gap-4">
          <Link href="/sub-processors" className="bg-white border border-slate-200 rounded-xl p-5 hover:border-primary transition-colors">
            <Globe2 className="h-6 w-6 text-primary mb-2" />
            <div className="font-semibold text-slate-900">Sub-processor list</div>
            <div className="text-sm text-slate-600 mt-1">Current list of vetted sub-processors with location and purpose.</div>
          </Link>
          <Link href="/trust" className="bg-white border border-slate-200 rounded-xl p-5 hover:border-primary transition-colors">
            <FileText className="h-6 w-6 text-primary mb-2" />
            <div className="font-semibold text-slate-900">Trust Center</div>
            <div className="text-sm text-slate-600 mt-1">Compliance reports (SOC 2 Type II, ISO 27001), security whitepapers and audit history.</div>
          </Link>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Need a counter-signed DPA?</h2>
          <p className="text-slate-300 mb-6">We pre-sign and counter-sign within 1 business day. No legal review required for the standard text — only changes need negotiation.</p>
          <Link href="/contact?topic=dpa">
            <Button size="lg" className="rounded-full" data-testid="dpa-contact-cta">
              Request signed DPA<ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
