import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, ArrowRight } from "lucide-react";

const TIERS = [
  {
    name: "Starter",
    price: "$0",
    cadence: "for 14 days, then $0/mo",
    blurb: "Try the full PDLC platform on a single project. No card required.",
    cta: "Start free",
    ctaHref: "/app",
    highlight: false,
    features: [
      "1 project",
      "Up to 200 requirements",
      "GitHub + ZIP source connectors",
      "AI generation from briefs and code",
      "BRDs, PRDs and exec briefings",
      "Community support",
    ],
  },
  {
    name: "Growth",
    price: "$1,200",
    cadence: "per month, billed annually",
    blurb: "For product, engineering and compliance teams shipping continuously.",
    cta: "Book a demo",
    ctaHref: "/#cta",
    highlight: true,
    features: [
      "Up to 10 projects",
      "Unlimited requirements",
      "All RM connectors — DOORS, Jama, Polarion, codeBeamer, Helix RM, Visure, Azure Boards, Jira, ReqIF",
      "All defect-tool connectors — Jira, Azure DevOps Bugs, Bugzilla, ServiceNow, ALM Octane, Linear, GitHub Issues",
      "Compliance autopilot for SOC 2, ISO 27001, HIPAA, FDA 21 CFR Part 11",
      "Workflow engine + recurring audits",
      "DOCX / PDF / HTML export",
      "Email + chat support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "tailored to your estate",
    blurb: "For regulated, multi-business-unit organisations with complex audit obligations.",
    cta: "Talk to sales",
    ctaHref: "/#cta",
    highlight: false,
    features: [
      "Unlimited projects, requirements and seats",
      "All connectors + custom OSLC / REST adapters",
      "Self-hosted, dedicated cloud, or VPC-isolated SaaS",
      "SSO (SAML / OIDC), SCIM provisioning, audit log export",
      "Custom compliance frameworks and control packs",
      "Dedicated solutions architect + 24/7 support",
      "Procurement, security review and DPA assistance",
    ],
  },
];

const FAQS = [
  {
    q: "How does Auditee count requirements?",
    a: "Every distinct row in your knowledge graph counts once — whether it was AI-generated from a brief, imported from DOORS / Jama / Polarion, or written by hand. Drafts and approved requirements are counted equally.",
  },
  {
    q: "Can I bring my own LLM keys?",
    a: "Yes, on Growth and Enterprise. By default we run on managed providers; you can swap in your own OpenAI, Azure OpenAI, Anthropic or self-hosted endpoint without code changes.",
  },
  {
    q: "Is there a non-profit / academic discount?",
    a: "Yes. We offer 50% off Growth for accredited universities, registered non-profits, and open-source maintainers. Contact us for details.",
  },
  {
    q: "What happens to my data if I cancel?",
    a: "You keep full export rights. Ask any time and we'll deliver your project graph as a single ReqIF + JSON archive within 5 business days. Data is purged 30 days after cancellation.",
  },
];

export default function Pricing() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
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
              <Sparkles className="h-4 w-4" /> Simple, transparent pricing
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-slate-950 tracking-tight mb-5">
              One platform. Three plans. <span className="text-primary">Zero per-seat surprises.</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Start free, scale as your knowledge graph grows. No setup fees, no charges per AI call, no surprise bills when audit season hits.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid md:grid-cols-3 gap-6">
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
              <div className="text-xs text-slate-500 mb-4">{tier.cadence}</div>
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
