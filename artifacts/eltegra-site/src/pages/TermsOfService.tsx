import { SEO, breadcrumbsLd } from "@/components/SEO";
import { Navigation, SiteFooter } from "@/components/site/Chrome";

export default function TermsOfService() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Terms of Service — Auditee"
        description="Terms governing use of the Auditee platform: account, acceptable use, billing, IP, warranties, liability and termination."
        path="/terms-of-service"
        jsonLd={breadcrumbsLd([{ name: "Home", path: "/" }, { name: "Terms of Service", path: "/terms-of-service" }])}
      />
      <Navigation />
      <main className="pt-28 pb-24">
        <article className="max-w-3xl mx-auto px-6 prose prose-slate prose-headings:font-display prose-headings:text-slate-950 prose-h2:mt-12 prose-h2:mb-4 prose-h2:text-2xl">
          <p className="text-sm text-slate-500 not-prose mb-2">Last updated: 1 May 2026</p>
          <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
          <p>
            These Terms of Service ("Terms") govern your access to and use of the Auditee platform
            ("Service"), operated by <strong>Qwikstuffs Pvt. Ltd.</strong> ("Auditee", "we", "us").
            By creating an account or using the Service you agree to these Terms.
          </p>

          <h2>1. Account</h2>
          <p>
            You must provide accurate registration information and keep it current. You are
            responsible for safeguarding your credentials and for all activity in your account. You
            must be at least 16 years old to use the Service.
          </p>

          <h2>2. Acceptable use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for unlawful, infringing, harmful or fraudulent activity.</li>
            <li>Reverse-engineer, decompile or attempt to derive source code, except as permitted by law.</li>
            <li>Disrupt, overload, scrape or abuse the Service or its infrastructure.</li>
            <li>Upload content you do not have rights to, including PHI without a signed BAA.</li>
            <li>Resell, sublicense or white-label the Service without a written agreement.</li>
          </ul>

          <h2>3. Subscription, billing & cancellation</h2>
          <p>
            Paid plans bill via Razorpay. Monthly subscriptions auto-renew until cancelled at the end
            of the current billing cycle. Annual one-time orders run for 12 months and then expire —
            no auto-renewal. Fees are exclusive of GST or other applicable taxes. Failure to pay may
            result in suspension or termination of access.
          </p>

          <h2>4. Refunds</h2>
          <p>
            Monthly subscriptions are non-refundable for the current month. Annual one-time orders
            are non-refundable after 14 days from purchase, except where required by law. Contact{" "}
            <a href="mailto:billing@auditee.site">billing@auditee.site</a> for refund requests.
          </p>

          <h2>5. Intellectual property</h2>
          <p>
            <strong>Auditee IP.</strong> The Service, including software, design, branding and
            documentation, is owned by Qwikstuffs Pvt. Ltd. and protected by intellectual property
            laws.
          </p>
          <p>
            <strong>Customer content.</strong> You retain all rights to content you upload or
            generate. You grant Auditee a worldwide, non-exclusive licence to host, process and
            display your content solely to operate the Service for you.
          </p>

          <h2>6. AI output</h2>
          <p>
            AI-generated requirements, documents, test cases and analyses are produced from your
            inputs using third-party models. You are responsible for reviewing and validating AI
            outputs before relying on them for production, regulatory or contractual purposes. We
            make no warranty as to the accuracy or completeness of AI output.
          </p>

          <h2>7. Confidentiality</h2>
          <p>
            Each party will protect the other's Confidential Information using at least the same
            degree of care it uses for its own (and no less than reasonable care).
          </p>

          <h2>8. Warranties & disclaimer</h2>
          <p>
            The Service is provided "as is" and "as available" without warranties of any kind, except
            as expressly stated in a separately signed Master Services Agreement. To the maximum
            extent permitted by law, Auditee disclaims all implied warranties, including
            merchantability, fitness for a particular purpose and non-infringement.
          </p>

          <h2>9. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, Auditee's total liability for any claim arising
            out of or related to the Service is limited to the fees paid by you in the 12 months
            preceding the claim. Auditee is not liable for indirect, incidental, consequential,
            special, exemplary or punitive damages, or for lost profits or revenue.
          </p>

          <h2>10. Indemnification</h2>
          <p>
            You agree to indemnify and hold Auditee harmless from claims arising out of your content,
            your use of the Service in breach of these Terms, or your violation of applicable law.
          </p>

          <h2>11. Termination</h2>
          <p>
            Either party may terminate for material breach not cured within 30 days of notice.
            Auditee may suspend access for security threats, non-payment or violations of acceptable
            use. On termination, your access ends and content is deleted per the Privacy Policy.
          </p>

          <h2>12. Governing law & jurisdiction</h2>
          <p>
            These Terms are governed by the laws of India. Disputes will be subject to the exclusive
            jurisdiction of the courts in Chennai, Tamil Nadu, India, except where mandatory consumer
            protection laws of your jurisdiction apply.
          </p>

          <h2>13. Changes</h2>
          <p>
            We may update these Terms by giving at least 30 days' notice for material changes.
            Continued use after the effective date constitutes acceptance.
          </p>

          <h2>14. Contact</h2>
          <p>
            <strong>Qwikstuffs Pvt. Ltd.</strong><br />
            E2, Devi Building, Metu Street, Iyyapanthangal, Chennai 600 077, Tamil Nadu, India.<br />
            Email: <a href="mailto:legal@auditee.site">legal@auditee.site</a>.
          </p>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
