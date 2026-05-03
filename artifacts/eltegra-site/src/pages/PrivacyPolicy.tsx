import { SEO, breadcrumbsLd } from "@/components/SEO";
import { Navigation, SiteFooter } from "@/components/site/Chrome";

export default function PrivacyPolicy() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Privacy Policy — Auditee"
        description="Auditee privacy policy: what we collect, how we use it, sub-processors, data residency, your rights under GDPR and DPDP."
        path="/privacy-policy"
        jsonLd={breadcrumbsLd([{ name: "Home", path: "/" }, { name: "Privacy Policy", path: "/privacy-policy" }])}
      />
      <Navigation />
      <main className="pt-28 pb-24">
        <article className="max-w-3xl mx-auto px-6 prose prose-slate prose-headings:font-display prose-headings:text-slate-950 prose-h2:mt-12 prose-h2:mb-4 prose-h2:text-2xl prose-h3:text-lg">
          <p className="text-sm text-slate-500 not-prose mb-2">Last updated: 1 May 2026</p>
          <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p>
            This Privacy Policy explains how <strong>Qwikstuffs Pvt. Ltd.</strong> ("Auditee", "we", "us")
            collects, uses, discloses and protects information when you use the Auditee platform at
            auditee.site, eltegra.ai and any related sub-domains (collectively the "Service").
          </p>

          <h2>1. Information we collect</h2>
          <h3>Account information</h3>
          <p>Name, email, organization, password hash, profile photo, role and authentication tokens.</p>
          <h3>Workspace content</h3>
          <p>
            Requirements, documents, BRDs/PRDs/FRDs, source-code metadata, test cases, defect records,
            comments, audit evidence and any data you upload or connect from third-party tools.
          </p>
          <h3>Usage data</h3>
          <p>
            Pages visited, features used, browser, IP address, device type and timestamps. Used for
            security, debugging, analytics and product improvement.
          </p>
          <h3>Billing data</h3>
          <p>
            We use Razorpay to process payments. Auditee does not store full card numbers — Razorpay
            tokenises them. We retain order ID, last four digits, billing name and address for accounting.
          </p>

          <h2>2. How we use information</h2>
          <ul>
            <li>To provide, maintain and improve the Service.</li>
            <li>To deliver AI-driven features (requirement generation, gap detection, document analysis).</li>
            <li>To send service notifications, security alerts and (with consent) product updates.</li>
            <li>To enforce our Terms, prevent abuse and meet legal obligations.</li>
            <li>To produce de-identified, aggregated analytics about platform usage.</li>
          </ul>

          <h2>3. AI processing & training</h2>
          <p>
            We do <strong>not</strong> train AI models on customer content. AI provider integrations
            (OpenAI, Anthropic, Google) are configured for zero data retention. Your requirements,
            documents and code are used solely to serve your workspace.
          </p>

          <h2>4. Sharing & sub-processors</h2>
          <p>We share data with the following sub-processors, all under data processing agreements:</p>
          <ul>
            <li><strong>Amazon Web Services (AWS)</strong> — hosting, KMS encryption, object storage (US / EU regions).</li>
            <li><strong>Neon</strong> — managed Postgres database.</li>
            <li><strong>Clerk</strong> — authentication and identity management.</li>
            <li><strong>Razorpay</strong> — payments and subscription billing.</li>
            <li><strong>OpenAI, Anthropic, Google Cloud (Vertex AI)</strong> — AI inference (zero data retention).</li>
            <li><strong>Slack</strong> — optional notification integration (configured per workspace).</li>
          </ul>
          <p>
            We do not sell personal data. We do not share data with advertisers or data brokers.
          </p>

          <h2>5. Data residency</h2>
          <p>
            Default region: AWS <code>us-east-1</code>. EU customers may opt into <code>eu-west-1</code>.
            Enterprise plans support dedicated VPCs and BYO-KMS keys for full residency control.
          </p>

          <h2>6. Security</h2>
          <p>
            TLS 1.3 in transit, AES-256 at rest with AWS KMS-managed keys. Append-only audit logs.
            SAML / OIDC SSO. 30-minute idle session timeout. Annual penetration testing. Full security
            posture at <a href="/security">/security</a>.
          </p>

          <h2>7. Retention</h2>
          <p>
            Workspace content is retained while your account is active. On account closure, content
            is deleted within 30 days; backups age out within 90 days. Audit logs are retained for
            7 years to meet HIPAA / SOC 2 / PCI requirements.
          </p>

          <h2>8. Your rights</h2>
          <p>
            Under GDPR (EU/UK), DPDP (India), CCPA (California) and other privacy laws you may have
            the right to access, correct, delete, port or restrict processing of your personal data,
            and to object or withdraw consent. Submit requests to{" "}
            <a href="mailto:privacy@auditee.site">privacy@auditee.site</a>; we will respond within
            30 days.
          </p>

          <h2>9. Cookies</h2>
          <p>
            We use essential cookies for authentication and security. Optional analytics cookies
            (e.g. PostHog) are loaded only with consent. You can manage preferences via the cookie
            banner or your browser settings.
          </p>

          <h2>10. Children's privacy</h2>
          <p>
            The Service is not directed to children under 16. We do not knowingly collect personal
            data from children.
          </p>

          <h2>11. Changes to this policy</h2>
          <p>
            We may update this policy from time to time. Material changes will be notified by email
            or in-app banner at least 30 days before they take effect.
          </p>

          <h2>12. Contact</h2>
          <p>
            <strong>Qwikstuffs Pvt. Ltd.</strong><br />
            E2, Devi Building, Metu Street, Iyyapanthangal, Chennai 600 077, Tamil Nadu, India.<br />
            Email: <a href="mailto:privacy@auditee.site">privacy@auditee.site</a>.
          </p>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
