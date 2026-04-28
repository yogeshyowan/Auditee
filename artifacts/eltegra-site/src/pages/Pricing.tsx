import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, ArrowRight, Zap } from "lucide-react";
import { SEO, faqLd } from "@/components/SEO";

const TIERS = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever, no card required",
    blurb: "Try the full PDLC platform with 10 free AI credits — top up any time.",
    cta: "Start free",
    ctaHref: "/sign-up",
    highlight: false,
    seatLine: "1 user",
    creditLine: "10 AI credits included",
    features: [
      "10 AI credits to start (1 credit = 1 generation)",
      "Top-up: $5 prepaid → 10 extra credits, no expiry",
      "1 project, up to 200 requirements",
      "GitHub + ZIP source connectors",
      "BRDs, PRDs and exec briefings",
      "Community support",
    ],
  },
  {
    name: "Standard",
    price: "$25",
    cadence: "per month",
    blurb: "Solo builders shipping production-grade requirements and audits.",
    cta: "Activate Standard",
    ctaHref: "/sign-up?plan=standard",
    highlight: false,
    seatLine: "1 user",
    creditLine: "50 AI credits / month",
    features: [
      "50 AI credits per month",
      "1 user seat",
      "Up to 3 projects",
      "All RM connectors — DOORS, Jama, Polarion, codeBeamer, Helix RM, Visure, Azure Boards, Jira, ReqIF",
      "Compliance autopilot for SOC 2, ISO 27001, HIPAA",
      "DOCX / PDF / HTML export",
      "Email support",
    ],
  },
  {
    name: "Professional",
    price: "$100",
    cadence: "per month",
    blurb: "For product, engineering and compliance teams shipping continuously.",
    cta: "Activate Professional",
    ctaHref: "/sign-up?plan=professional",
    highlight: true,
    seatLine: "Up to 4 users",
    creditLine: "200 AI credits / month",
    features: [
      "200 AI credits per month",
      "Up to 4 user seats",
      "Up to 10 projects",
      "All RM + defect-tool connectors — DOORS, Jama, Polarion, Jira, Azure DevOps, Linear, GitHub Issues, ServiceNow, ALM Octane",
      "Compliance autopilot for SOC 2, ISO 27001, HIPAA, FDA 21 CFR Part 11",
      "Workflow engine + recurring audits",
      "DOCX / PDF / HTML export",
      "Email + chat support",
    ],
  },
  {
    name: "Enterprise",
    price: "$500",
    cadence: "per month",
    blurb: "For regulated, multi-business-unit organisations with complex audit obligations.",
    cta: "Activate Enterprise",
    ctaHref: "/sign-up?plan=enterprise",
    highlight: false,
    seatLine: "Up to 20 users",
    creditLine: "1,000 AI credits / month",
    features: [
      "1,000 AI credits per month",
      "Up to 20 user seats",
      "Unlimited projects and requirements",
      "All connectors + custom OSLC / REST adapters",
      "Self-hosted, dedicated cloud, or VPC-isolated SaaS",
      "SSO (SAML / OIDC), SCIM provisioning, audit log export",
      "Custom compliance frameworks and control packs",
      "Dedicated solutions architect + 24/7 support",
    ],
  },
];

const FAQS = [
  {
    q: "What exactly is an AI credit?",
    a: "One credit = one AI generation — whether that's a BRD, a PRD, a test-case suite, a compliance gap analysis, or a traceability audit. Credits are consumed only when an AI run completes successfully; failures are automatically refunded.",
  },
  {
    q: "Do unused credits roll over?",
    a: "Free top-up credits never expire. Monthly plan credits (Standard / Professional / Enterprise) reset at the start of each billing cycle and do not roll over.",
  },
  {
    q: "How does the $5 top-up work on the Free plan?",
    a: "Free accounts start with 10 credits. When you run out, a $5 prepaid top-up grants you 10 additional credits that never expire. You can top up as many times as you like and stay on the Free plan indefinitely.",
  },
  {
    q: "How does Auditee count requirements?",
    a: "Every distinct row in your knowledge graph counts once — whether it was AI-generated from a brief, imported from DOORS / Jama / Polarion, or written by hand. Drafts and approved requirements are counted equally.",
  },
  {
    q: "Can I bring my own LLM keys?",
    a: "Yes, on Professional and Enterprise. By default we run on managed providers; you can swap in your own OpenAI, Azure OpenAI, Anthropic or self-hosted endpoint without code changes.",
  },
  {
    q: "Is there a non-profit / academic discount?",
    a: "Yes. We offer 50% off Standard and Professional for accredited universities, registered non-profits, and open-source maintainers. Contact us for details.",
  },
  {
    q: "What happens to my data if I cancel?",
    a: "You keep full export rights. Ask any time and we'll deliver your project graph as a single ReqIF + JSON archive within 5 business days. Data is purged 30 days after cancellation.",
  },
];

export default function Pricing() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Pricing — Auditee AI Requirements & Compliance Platform"
        description="Transparent pricing for Auditee. Free tier with 10 AI credits + $5 top-ups, Standard $25/mo (50 credits, 1 user), Professional $100/mo (200 credits, 4 users), Enterprise $500/mo (1,000 credits, 20 users). Single-tenant deployments, SOC 2 Type II, on-prem and air-gapped options available."
        path="/pricing"
        keywords={["Auditee pricing", "AI requirements pricing", "compliance platform pricing", "DOORS alternative pricing", "AI credit top-up"]}
        jsonLd={[
          faqLd([
            { q: "What exactly is an AI credit?", a: "One credit equals one AI generation — BRD, PRD, test-case suite, compliance gap analysis, or traceability audit. Credits are consumed only on successful runs; failures are auto-refunded." },
            { q: "Is there a free tier?", a: "Yes. Free accounts get 10 AI credits up front, plus $5 prepaid top-ups that grant 10 additional credits each, with no expiry." },
            { q: "How many users does each paid plan support?", a: "Standard ($25/mo) is single-user. Professional ($100/mo) includes up to 4 user seats. Enterprise ($500/mo) includes up to 20 user seats. Owners can invite or remove members at any time from the in-app Billing & Team page." },
            { q: "How many AI credits do I get on each plan?", a: "Free: 10 credits + $5 top-ups for 10 more. Standard: 50 credits/month. Professional: 200 credits/month. Enterprise: 1,000 credits/month. Monthly credits reset each billing cycle." },
            { q: "Can I deploy Auditee on-premises or air-gapped?", a: "Yes. Enterprise plans support single-tenant cloud (your VPC), on-premises Kubernetes, and air-gapped installs for regulated industries (defence, medical, automotive)." },
            { q: "Do you train on customer data?", a: "No. Auditee never trains foundation models on customer source code, requirements or audit content. Customer data stays inside the customer's tenant." },
            { q: "Which compliance frameworks are included?", a: "All paid tiers include the full 23-framework library: SOC 2, ISO 27001, HIPAA, IEC 62304, ISO 13485, ISO 26262, ASPICE, CMMI, DO-178C, FDA 21 CFR Part 11, FDA QMSR, GDPR, PCI DSS 4.0, NIST CSF, NIST 800-53, EU AI Act, NIS2, DORA, and more." },
          ]),
        ]}
      />
      {/* Slim nav */}
      <header className="border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">
            Auditee
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-slate-700 hover:text-primary">Home</Link>
            <Link href="/roi-calculator" className="text-sm text-slate-700 hover:text-primary">ROI calculator</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-20 bg-gradient-to-b from-secondary/30 to-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
              <Sparkles className="h-4 w-4" /> Simple, credit-based pricing
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-slate-950 tracking-tight mb-5">
              One credit. One generation. <span className="text-primary">Zero surprises.</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Start with 10 free credits — no card required. Top up $5 for 10 more, or scale up to a monthly plan when you're ready. No setup fees, no per-seat overages, no surprise audit-season bills.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              data-testid={`pricing-tier-${tier.name.toLowerCase()}`}
              className={`rounded-3xl border p-8 flex flex-col ${
                tier.highlight
                  ? "border-primary/40 bg-gradient-to-b from-primary/5 to-white shadow-xl shadow-primary/10 relative"
                  : "border-slate-200 bg-white"
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-white text-xs font-semibold uppercase tracking-wide">
                  Most popular
                </div>
              )}
              <h3 className="text-xl font-display font-bold text-slate-900">{tier.name}</h3>
              <div className="mt-4 mb-1 flex items-baseline gap-1">
                <span className="text-4xl font-display font-bold text-slate-950">{tier.price}</span>
              </div>
              <div className="text-xs text-slate-500 mb-1">{tier.cadence}</div>
              <div className="text-xs font-semibold text-primary mb-1 uppercase tracking-wide">{tier.seatLine}</div>
              <div className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 mb-4">
                <Zap className="h-3 w-3 text-primary" /> {tier.creditLine}
              </div>
              <p className="text-sm text-slate-600 mb-6">{tier.blurb}</p>
              <ul className="space-y-2.5 mb-8 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href={tier.ctaHref}>
                <Button
                  className={`w-full rounded-full ${tier.highlight ? "" : "bg-slate-900 hover:bg-slate-800 text-white"}`}
                  data-testid={`pricing-cta-${tier.name.toLowerCase()}`}
                >
                  {tier.cta}
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* Top-up callout */}
        <div className="max-w-7xl mx-auto px-6 md:px-12 mt-10">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 flex-shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="font-display text-lg font-bold text-amber-900">
                Stay on Free as long as you like — top up when you need more.
              </div>
              <p className="text-sm text-amber-800 mt-1">
                <strong>$5 prepaid = 10 additional AI credits</strong>, no expiry, no recurring charge. Perfect for solo founders, evaluators, and weekend builders. Top-ups stack on top of your monthly plan credits too.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50 border-y border-slate-200">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-950 mb-8 text-center">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="rounded-xl border border-slate-200 bg-white px-5 py-4 group"
              >
                <summary className="cursor-pointer font-semibold text-slate-900 flex items-center justify-between">
                  {f.q}
                  <span className="text-primary text-xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-slate-600 text-sm mt-3 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold text-slate-950 mb-4">
            Still on the fence?
          </h2>
          <p className="text-slate-600 mb-6">
            Run our 60-second ROI calculator to see what audit chaos is actually costing your org.
          </p>
          <Link href="/roi-calculator">
            <Button size="lg" className="rounded-full" data-testid="pricing-roi-cta">
              Open the ROI calculator
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
