import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, ShieldCheck, Stethoscope } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function Baa() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="HIPAA Business Associate Agreement (BAA) — Auditee"
        description="Auditee's Business Associate Agreement (BAA) for HIPAA-covered customers. Defines permitted uses of PHI, safeguards, breach notification, sub-contractor flow-down and termination obligations."
        path="/baa"
        keywords={["Auditee BAA", "HIPAA BAA", "Business Associate Agreement", "PHI processor", "HIPAA SaaS"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/dpa" className="text-sm text-slate-700 hover:text-primary">DPA</Link>
            <Link href="/msa" className="text-sm text-slate-700 hover:text-primary">MSA</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6">
          <Stethoscope className="h-10 w-10 text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">HIPAA Business Associate Agreement</h1>
          <p className="text-slate-700">Version 2026.05 · Effective 03 May 2026 · Available on Enterprise</p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-6 prose prose-slate prose-headings:font-display prose-headings:text-slate-950">
          <p>
            This Business Associate Agreement (the "<strong>BAA</strong>") supplements the <Link href="/msa" className="text-primary underline">MSA</Link> and <Link href="/dpa" className="text-primary underline">DPA</Link> between Qwikstuffs Pvt. Ltd. ("<strong>Auditee</strong>", "<strong>Business Associate</strong>") and the customer ("<strong>Covered Entity</strong>") who is subject to the Health Insurance Portability and Accountability Act of 1996 ("<strong>HIPAA</strong>") and its implementing regulations at 45 CFR Parts 160 and 164 (the "<strong>Privacy Rule</strong>", "<strong>Security Rule</strong>" and "<strong>Breach Notification Rule</strong>").
          </p>

          <h2>1. Definitions</h2>
          <p>Capitalised terms not defined here have the meanings given in HIPAA and the HITECH Act of 2009. "<strong>PHI</strong>" means Protected Health Information that Auditee creates, receives, maintains or transmits on behalf of Covered Entity.</p>

          <h2>2. Permitted uses &amp; disclosures</h2>
          <p>Auditee will use and disclose PHI only as necessary to perform the Service, as Required By Law, or as expressly permitted by Covered Entity. Auditee will not use or disclose PHI for marketing, sale, or other purposes prohibited by HIPAA.</p>

          <h2>3. Safeguards</h2>
          <ul>
            <li>Administrative, physical and technical safeguards consistent with the Security Rule.</li>
            <li>Encryption of PHI in transit (TLS 1.3) and at rest (AES-256, customer-managed keys on Enterprise).</li>
            <li>Access controls, MFA, audit logging and tamper-evident integrity hashing.</li>
            <li>Workforce training, background checks and confidentiality agreements.</li>
          </ul>

          <h2>4. Sub-contractors</h2>
          <p>Auditee will obtain written agreements with any sub-contractors that create, receive, maintain or transmit PHI, requiring at least the same restrictions and conditions that apply to Auditee under this BAA. The current sub-processor list is at <Link href="/sub-processors" className="text-primary underline">/sub-processors</Link>.</p>

          <h2>5. Breach notification</h2>
          <p>Auditee will report any Breach of Unsecured PHI to Covered Entity without unreasonable delay and no later than 30 calendar days after Discovery, including the information required by 45 CFR § 164.410. Auditee will cooperate with Covered Entity's investigation and notification obligations.</p>

          <h2>6. Individual rights assistance</h2>
          <ul>
            <li><strong>Access (§ 164.524):</strong> Auditee will provide PHI in a Designated Record Set within 15 days of request.</li>
            <li><strong>Amendment (§ 164.526):</strong> Auditee will incorporate amendments directed by Covered Entity within 15 days.</li>
            <li><strong>Accounting (§ 164.528):</strong> Auditee will provide an accounting of disclosures within 30 days of request.</li>
          </ul>

          <h2>7. Books &amp; records</h2>
          <p>Auditee will make its internal practices, books and records relating to the use and disclosure of PHI available to the Secretary of the U.S. Department of Health and Human Services (HHS) for purposes of determining Covered Entity's compliance with HIPAA.</p>

          <h2>8. Term &amp; termination</h2>
          <p>This BAA is effective on execution and continues for the term of the MSA. On termination, Auditee will return or destroy all PHI in its possession or, if return / destruction is infeasible, extend the protections of this BAA to the PHI for as long as it is retained.</p>

          <h2>9. Indemnification &amp; liability</h2>
          <p>Liability for breaches of this BAA is governed by the MSA's limitation of liability, except that monetary penalties imposed by HHS or state regulators arising from Auditee's documented gross negligence or willful misconduct are excluded from the cap.</p>

          <h2>10. Execution</h2>
          <p>To execute, request a counter-signed PDF at <Link href="/contact?topic=baa" className="text-primary underline">/contact?topic=baa</Link> or email <a href="mailto:privacy@auditee.site" className="text-primary underline">privacy@auditee.site</a>.</p>
        </div>
      </section>

      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-3xl mx-auto px-6 grid sm:grid-cols-2 gap-4">
          <Link href="/msa" className="bg-white border border-slate-200 rounded-xl p-5 hover:border-primary transition-colors">
            <FileText className="h-6 w-6 text-primary mb-2" />
            <div className="font-semibold text-slate-900">MSA</div>
            <div className="text-sm text-slate-600 mt-1">Master Services Agreement (Enterprise).</div>
          </Link>
          <Link href="/security" className="bg-white border border-slate-200 rounded-xl p-5 hover:border-primary transition-colors">
            <ShieldCheck className="h-6 w-6 text-primary mb-2" />
            <div className="font-semibold text-slate-900">Security overview</div>
            <div className="text-sm text-slate-600 mt-1">Encryption, access, monitoring.</div>
          </Link>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Need a signed BAA?</h2>
          <p className="text-slate-300 mb-6">Available on Enterprise. Mutually executable within 1 business day; no legal review needed for the standard text.</p>
          <Link href="/contact?topic=baa">
            <Button size="lg" className="rounded-full" data-testid="baa-contact-cta">
              Request signed BAA<ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
