import { useState } from "react";
import { Link } from "wouter";
import { ChevronDown, HelpCircle, ArrowRight } from "lucide-react";
import { SEO, SITE_URL, breadcrumbsLd } from "@/components/SEO";
import { Navigation, SiteFooter } from "@/components/site/Chrome";
import { Button } from "@/components/ui/button";

const FAQS = [
  {
    section: "Platform & product",
    items: [
      {
        q: "What is Auditee?",
        a: "Auditee is an AI-native control plane for the Product Development Lifecycle (PDLC). It unifies requirements management, AI-driven generation and gap detection, traceability, automated test generation, compliance evidence collection across 23+ frameworks, and recurring audits — in one workspace.",
      },
      {
        q: "Who is Auditee for?",
        a: "Product Officers (CPOs), CTOs and VPs of Engineering, Senior Business Analysts, QA leaders and compliance / regulatory teams in regulated industries — healthcare, fintech, automotive, telecom, aerospace and SaaS — who ship software where requirements quality and audit-readiness matter.",
      },
      {
        q: "How is Auditee different from DOORS, Jama, Polarion or Jira?",
        a: "Auditee doesn't replace your incumbent tool by default — it connects to it. Pull requirements from DOORS Classic / Next, Jama, Polarion, codeBeamer, Helix RM, Visure, Azure DevOps and Jira; we dedup, classify, AI-enrich and trace. Most customers run alongside their incumbent for 6–12 months and migrate gradually.",
      },
      {
        q: "Is there a free tier?",
        a: "Yes. The Free tier includes one workspace, AI requirements generation, basic gap detection and a single project. See /pricing for the full breakdown.",
      },
    ],
  },
  {
    section: "AI, models & data",
    items: [
      {
        q: "Which AI models does Auditee use?",
        a: "Auditee is provider-agnostic. Out of the box we use OpenAI (GPT-4o, o1), Anthropic (Claude 3.5 Sonnet) and Google Gemini under zero-data-retention contracts. Enterprise customers can route to their own Azure OpenAI / AWS Bedrock / Vertex AI tenancy or run open-source models in a dedicated VPC.",
      },
      {
        q: "Do you train on my data?",
        a: "No. We never train on customer data. AI providers are configured for zero data retention. Your requirements, code and documents are used only to serve your workspace.",
      },
      {
        q: "How does retrieval work?",
        a: "Each workspace has a dedicated vector index (per-project namespacing) populated from your requirements, documents, source code and integrations. Retrieval is hybrid (BM25 + dense) with re-ranking. The Ask Auditee virtual BA cites every answer.",
      },
      {
        q: "Can I bring my own model?",
        a: "Yes — Enterprise plans support BYOK (bring your own key) for any OpenAI-compatible provider, plus dedicated routing to Azure OpenAI, AWS Bedrock and Vertex AI.",
      },
    ],
  },
  {
    section: "Integrations & sources",
    items: [
      {
        q: "Which RM tools do you integrate with?",
        a: "IBM DOORS Classic (ReqIF), DOORS Next (OSLC-RM), Jama Connect, Siemens Polarion, PTC/Intland codeBeamer, Perforce Helix RM, Visure Requirements, Atlassian Jira and Azure DevOps. Plus a generic ReqIF importer for everything else.",
      },
      {
        q: "Which dev / ALM tools do you connect to?",
        a: "GitHub, GitLab, Azure DevOps Boards & Repos, Jira, Slack, Microsoft Teams. Push and pull both directions. Webhook-driven for real-time updates.",
      },
      {
        q: "Can I import existing BRDs and PRDs?",
        a: "Yes. DOCX, PDF (with OCR), HTML, Markdown, Confluence exports, plain text and ReqIF. Auditee extracts requirements, classifies them and links them back to source.",
      },
    ],
  },
  {
    section: "Compliance & frameworks",
    items: [
      {
        q: "Which compliance frameworks does Auditee support?",
        a: "23+ frameworks including SOC 2 Type II, ISO/IEC 27001:2022, ISO/IEC 27701, NIST SP 800-53, NIST 800-171, HIPAA Security & Privacy Rules, FDA 21 CFR Part 11 / 820, FDA QMSR, IEC 62304, ISO 13485, ISO 14971, ISO 26262, ISO/SAE 21434, Automotive SPICE, DO-178C, AS9100, GDPR, DPDP, PCI DSS v4 and DORA. Custom Standards lets you add your own.",
      },
      {
        q: "Is Auditee SOC 2 / ISO 27001 certified?",
        a: "We follow SOC 2 Type II controls and our infrastructure runs on SOC 2 / ISO 27001 certified providers (AWS, Neon). Our own SOC 2 Type II audit is in progress; trust-pack and security overview are at /security.",
      },
      {
        q: "Where is data stored? What about residency?",
        a: "Data is stored encrypted at rest (AES-256, AWS KMS) in your chosen region: US (us-east-1) by default, EU (eu-west-1) on request. Enterprise plans support dedicated VPC and BYO-KMS keys.",
      },
    ],
  },
  {
    section: "Security",
    items: [
      {
        q: "What encryption is in place?",
        a: "TLS 1.3 in transit, AES-256 at rest with AWS KMS-managed keys. Database column-level encryption for PII / PHI. All API tokens and secrets use envelope encryption.",
      },
      {
        q: "Do you support SSO?",
        a: "Yes — SAML 2.0 and OIDC. Tested with Okta, Microsoft Entra ID (Azure AD), Google Workspace, OneLogin and JumpCloud. Configure under /app/sso (Enterprise plan).",
      },
      {
        q: "Do you have audit logs?",
        a: "Yes — append-only, exportable audit logs for every meaningful action. Meets HIPAA § 164.312, SOC 2 CC7 and PCI DSS Req 10. Visible at /app/audit-logs.",
      },
      {
        q: "Is there an idle-timeout?",
        a: "Yes — 30 minute platform-wide idle timeout with a 2-minute warning toast. Enforced at the client and server. Required for HIPAA § 164.312(a)(2)(iii) and PCI DSS Req 8.2.8.",
      },
    ],
  },
  {
    section: "Outputs & exports",
    items: [
      {
        q: "What document formats can I export?",
        a: "DOCX, PDF, HTML, Markdown for documents. CSV, XLSX, JSON for data. ReqIF for cross-RM-tool exchange. JUnit XML / pytest / NUnit / Postman for test cases.",
      },
      {
        q: "Can I export an audit evidence pack?",
        a: "Yes. One-click evidence pack for any framework or sub-set of controls — generates a ZIP with PDF control narratives, supporting documents, screenshots and linked artefacts.",
      },
    ],
  },
  {
    section: "Pricing & billing",
    items: [
      {
        q: "How does pricing work?",
        a: "Free tier (1 workspace, 1 project), Standard (₹1,999/mo or ₹19,990/yr), Professional (₹7,999/mo or ₹79,990/yr) and Enterprise (custom). Billing through Razorpay; annual saves ~17%.",
      },
      {
        q: "Can I cancel any time?",
        a: "Monthly subscriptions cancel at the end of the current billing cycle. Annual one-time orders run for 12 months and then expire — no auto-renew.",
      },
      {
        q: "Do you offer non-profit / academic pricing?",
        a: "Yes — contact us at sales@auditee.site for non-profit, academic and early-stage startup pricing.",
      },
    ],
  },
];

export default function Faqs() {
  const [open, setOpen] = useState<string | null>(null);

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.flatMap((s) =>
      s.items.map((it) => ({
        "@type": "Question",
        name: it.q,
        acceptedAnswer: { "@type": "Answer", text: it.a },
      })),
    ),
  };

  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="FAQs — Auditee AI-Native PDLC Platform"
        description="Frequently asked questions about Auditee — platform, AI models, integrations, compliance frameworks, security, outputs and pricing."
        path="/faqs"
        keywords={["Auditee FAQ", "AI requirements management FAQ", "compliance platform FAQ"]}
        jsonLd={[faqLd, breadcrumbsLd([{ name: "Home", path: "/" }, { name: "FAQs", path: "/faqs" }])]}
      />
      <Navigation />
      <main className="pt-28 pb-24">
        <header className="max-w-3xl mx-auto px-6 text-center">
          <HelpCircle className="w-10 h-10 mx-auto text-primary mb-4" />
          <h1 className="font-display text-4xl md:text-5xl font-bold text-slate-950 tracking-tight">
            Frequently asked questions
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Everything we get asked about Auditee — the platform, AI models, integrations, compliance, security, outputs and pricing.
          </p>
        </header>

        <div className="max-w-3xl mx-auto px-6 mt-16 space-y-12">
          {FAQS.map((section) => (
            <section key={section.section}>
              <h2 className="font-display text-2xl font-bold text-slate-950 mb-4">{section.section}</h2>
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {section.items.map((it) => {
                  const id = `${section.section}__${it.q}`;
                  const isOpen = open === id;
                  return (
                    <div key={id}>
                      <button
                        onClick={() => setOpen(isOpen ? null : id)}
                        className="w-full px-5 py-4 flex items-start justify-between gap-4 text-left hover:bg-slate-50 transition-colors"
                        data-testid={`faq-q-${id.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                        aria-expanded={isOpen}
                      >
                        <span className="font-medium text-slate-900">{it.q}</span>
                        <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 mt-0.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed">{it.a}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="max-w-3xl mx-auto px-6 mt-20 text-center">
          <h2 className="font-display text-2xl font-bold text-slate-950 mb-3">Still have questions?</h2>
          <p className="text-slate-600 mb-6">Talk to us — we'd rather have a conversation than ship a wrong answer.</p>
          <Button asChild size="lg" className="gap-2">
            <Link href="/contact">Book a call <ArrowRight className="w-4 h-4" /></Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
