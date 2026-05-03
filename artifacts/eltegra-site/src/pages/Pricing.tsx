import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth, useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, ArrowRight, Zap } from "lucide-react";
import { SEO, faqLd } from "@/components/SEO";
import { WaitlistButton } from "@/components/site/WaitlistButton";
import {
  useCreateBillingSubscribe,
  useCreateBillingVerify,
} from "@workspace/api-client-react";
import { openRazorpayCheckout } from "@/lib/razorpayCheckout";
import { useToast } from "@/hooks/use-toast";

type Cadence = "monthly" | "annual";

interface Tier {
  name: string;
  /** Razorpay-billed plan key. Free and Enterprise are not sold via Razorpay. */
  planKey: "free" | "standard" | "professional" | "enterprise";
  monthlyInr: number;
  annualInr: number;
  blurb: string;
  ctaCopy: string;
  highlight: boolean;
  seatLine: string;
  creditLine: string;
  features: string[];
  /** Free tier and Enterprise tier route to non-Razorpay flows. */
  externalCtaHref?: string;
}

const TIERS: Tier[] = [
  {
    name: "Free",
    planKey: "free",
    monthlyInr: 0,
    annualInr: 0,
    blurb:
      "Try the full PDLC platform with 10 free AI credits — top up any time.",
    ctaCopy: "Start free",
    externalCtaHref: "/sign-up",
    highlight: false,
    seatLine: "1 user",
    creditLine: "10 AI credits included",
    features: [
      "10 AI credits to start (1 credit = 1 generation)",
      "Top-up: ₹420 prepaid → 10 extra credits, no expiry",
      "1 project, up to 200 requirements",
      "GitHub + ZIP source connectors",
      "BRDs, PRDs and exec briefings",
      "Community support",
    ],
  },
  {
    name: "Standard",
    planKey: "standard",
    monthlyInr: 1999,
    annualInr: 19990,
    blurb:
      "Solo builders shipping production-grade requirements and audits.",
    ctaCopy: "Activate Standard",
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
    planKey: "professional",
    monthlyInr: 7999,
    annualInr: 79990,
    blurb:
      "For product, engineering and compliance teams shipping continuously.",
    ctaCopy: "Activate Professional",
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
    planKey: "enterprise",
    monthlyInr: 0,
    annualInr: 0,
    blurb:
      "For regulated, multi-business-unit organisations with complex audit obligations.",
    ctaCopy: "Contact sales",
    externalCtaHref: "mailto:sales@auditee.site?subject=Enterprise%20plan%20enquiry",
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
    q: "How does the Free top-up work?",
    a: "Free accounts start with 10 credits. When you run out, a ₹420 prepaid top-up grants you 10 additional credits that never expire. You can top up as many times as you like and stay on the Free plan indefinitely.",
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
    q: "How does annual billing work?",
    a: "Annual plans are paid up front for 12 months. They don't auto-renew (RBI rules cap card auto-debit at ₹15,000 per transaction in India), so we'll email you 14 days before the period ends with a one-click renewal link.",
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

function formatInr(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function Pricing() {
  const [cadence, setCadence] = useState<Cadence>("monthly");
  const [busyTier, setBusyTier] = useState<string | null>(null);
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const subscribe = useCreateBillingSubscribe();
  const verify = useCreateBillingVerify();

  async function handleCheckout(tier: Tier) {
    if (!authLoaded) return;
    if (!isSignedIn) {
      // Send them to sign-in with a returnTo so they land back here.
      navigate(`/sign-in?redirect_url=${encodeURIComponent("/pricing")}`);
      return;
    }
    if (tier.planKey === "free" || tier.planKey === "enterprise") return;

    setBusyTier(tier.name);
    try {
      const subResp = await subscribe.mutateAsync({
        data: { plan: tier.planKey, cadence },
      });
      const email = user?.primaryEmailAddress?.emailAddress ?? "";
      const name =
        [user?.firstName ?? "", user?.lastName ?? ""].filter(Boolean).join(" ") ||
        user?.username ||
        email;

      const checkoutResp = await openRazorpayCheckout({
        key: subResp.keyId,
        name: "Auditee",
        description: `${tier.name} (${cadence})`,
        prefill: { email, name },
        theme: { color: "#0ea5e9" },
        ...(subResp.kind === "subscription"
          ? { subscription_id: subResp.subscriptionId! }
          : {
              order_id: subResp.orderId!,
              amount: subResp.amountPaise,
              currency: subResp.currency,
            }),
      });

      const verifyBody =
        subResp.kind === "subscription"
          ? {
              kind: "subscription" as const,
              razorpay_payment_id: checkoutResp.razorpay_payment_id,
              razorpay_subscription_id: checkoutResp.razorpay_subscription_id!,
              razorpay_signature: checkoutResp.razorpay_signature,
            }
          : {
              kind: "order" as const,
              razorpay_payment_id: checkoutResp.razorpay_payment_id,
              razorpay_order_id: checkoutResp.razorpay_order_id!,
              razorpay_signature: checkoutResp.razorpay_signature,
            };
      await verify.mutateAsync({ data: verifyBody });

      toast({
        title: "Payment successful",
        description: `Your ${tier.name} (${cadence}) plan is now active.`,
      });
      navigate("/app/billing");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Checkout failed.";
      if (msg !== "Checkout cancelled") {
        toast({
          title: "Couldn't complete payment",
          description: msg,
          variant: "destructive",
        });
      }
    } finally {
      setBusyTier(null);
    }
  }

  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Pricing — Auditee AI Requirements & Compliance Platform"
        description="Transparent INR pricing for Auditee. Free tier with 10 AI credits + ₹420 top-ups, Standard ₹1,999/mo (50 credits, 1 user), Professional ₹7,999/mo (200 credits, 4 users), Enterprise (contact sales). Single-tenant deployments, SOC 2 Type II, on-prem and air-gapped options available."
        path="/pricing"
        keywords={["Auditee pricing", "AI requirements pricing", "compliance platform pricing", "DOORS alternative pricing", "AI credit top-up"]}
        jsonLd={[
          faqLd(
            FAQS.slice(0, 5).map((f) => ({ q: f.q, a: f.a })),
          ),
          // BreadcrumbList — Google surfaces a breadcrumb trail in the
          // SERP snippet instead of the raw URL when this is present.
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://auditee.site/" },
              { "@type": "ListItem", position: 2, name: "Pricing", item: "https://auditee.site/pricing" },
            ],
          },
          // Product + Offer schema per tier. Google surfaces these in
          // pricing-comparison rich results and AI answer engines (Perplexity,
          // ChatGPT) cite them when answering "how much does Auditee cost".
          // Free tier omits price (Google rejects offers with price=0 in
          // some locales); Enterprise omits price ("contact sales" pattern).
          ...TIERS.filter((t) => t.planKey !== "free" && t.planKey !== "enterprise").map((t) => ({
            "@context": "https://schema.org",
            "@type": "Product",
            name: `Auditee ${t.name}`,
            description: t.blurb,
            brand: { "@type": "Brand", name: "Auditee" },
            category: "BusinessApplication",
            url: "https://auditee.site/pricing",
            image: "https://auditee.site/opengraph.jpg",
            offers: [
              {
                "@type": "Offer",
                name: `${t.name} (Monthly)`,
                price: String(t.monthlyInr),
                priceCurrency: "INR",
                priceSpecification: {
                  "@type": "UnitPriceSpecification",
                  price: t.monthlyInr,
                  priceCurrency: "INR",
                  unitCode: "MON",
                  referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" },
                },
                availability: "https://schema.org/InStock",
                url: "https://auditee.site/pricing",
                priceValidUntil: `${new Date().getFullYear() + 1}-12-31`,
                seller: { "@type": "Organization", name: "Auditee", url: "https://auditee.site/" },
              },
              {
                "@type": "Offer",
                name: `${t.name} (Annual)`,
                price: String(t.annualInr),
                priceCurrency: "INR",
                priceSpecification: {
                  "@type": "UnitPriceSpecification",
                  price: t.annualInr,
                  priceCurrency: "INR",
                  unitCode: "ANN",
                  referenceQuantity: { "@type": "QuantitativeValue", value: 12, unitCode: "MON" },
                },
                availability: "https://schema.org/InStock",
                url: "https://auditee.site/pricing",
                priceValidUntil: `${new Date().getFullYear() + 1}-12-31`,
                seller: { "@type": "Organization", name: "Auditee", url: "https://auditee.site/" },
              },
            ],
          })),
          // Service schema for the AI compliance / requirements offering.
          // Helps AI answer engines categorise Auditee against competitors
          // (DOORS, Jama, Polarion) when answering "best ASPICE tool" etc.
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: "Auditee — AI PDLC, Requirements & Compliance Automation",
            serviceType: "AI-powered Application Lifecycle Management & compliance automation",
            provider: { "@type": "Organization", name: "Auditee", url: "https://auditee.site/" },
            areaServed: ["IN", "AE", "SA", "GB", "DE", "FR", "ES", "IE", "NL", "US", "CA", "AU", "SG", "JP"],
            audience: { "@type": "BusinessAudience", audienceType: "Engineering, QA and Compliance teams" },
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "INR",
              lowPrice: "0",
              highPrice: "79990",
              offerCount: "5",
              url: "https://auditee.site/pricing",
            },
            hasOfferCatalog: {
              "@type": "OfferCatalog",
              name: "Auditee plans",
              itemListElement: TIERS.map((t) => ({
                "@type": "Offer",
                itemOffered: { "@type": "Service", name: `Auditee ${t.name}` },
                price: String(t.monthlyInr),
                priceCurrency: "INR",
              })),
            },
          },
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
              Start with 10 free credits — no card required. Top up ₹420 for 10 more, or upgrade to a monthly plan when you're ready. No setup fees, no per-seat overages, no surprise audit-season bills.
            </p>

            {/* Monthly / annual toggle */}
            <div className="mt-8 inline-flex items-center gap-1 p-1 rounded-full border border-slate-200 bg-white">
              <button
                type="button"
                onClick={() => setCadence("monthly")}
                data-testid="cadence-monthly"
                className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
                  cadence === "monthly"
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setCadence("annual")}
                data-testid="cadence-annual"
                className={`px-5 py-2 rounded-full text-sm font-semibold transition flex items-center gap-2 ${
                  cadence === "annual"
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                Annual
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    cadence === "annual"
                      ? "bg-emerald-400/30 text-emerald-100"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  2 months free
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TIERS.map((tier) => {
            const priceInr =
              cadence === "monthly" ? tier.monthlyInr : tier.annualInr;
            const cadenceLabel =
              tier.planKey === "free"
                ? "forever, no card required"
                : tier.planKey === "enterprise"
                  ? "tailored to your scale"
                  : cadence === "monthly"
                    ? "per month, billed monthly"
                    : "per year, billed up front";
            const showPrice =
              tier.planKey !== "enterprise" && tier.planKey !== "free"
                ? formatInr(priceInr)
                : tier.planKey === "free"
                  ? "₹0"
                  : "Custom";
            return (
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
                  <span className="text-4xl font-display font-bold text-slate-950">{showPrice}</span>
                </div>
                <div className="text-xs text-slate-500 mb-1">{cadenceLabel}</div>
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
                {tier.externalCtaHref ? (
                  tier.externalCtaHref.startsWith("mailto:") ? (
                    <a href={tier.externalCtaHref}>
                      <Button
                        className={`w-full rounded-full ${tier.highlight ? "" : "bg-slate-900 hover:bg-slate-800 text-white"}`}
                        data-testid={`pricing-cta-${tier.name.toLowerCase()}`}
                      >
                        {tier.ctaCopy}
                        <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </a>
                  ) : (
                    <Link href={tier.externalCtaHref}>
                      <Button
                        className={`w-full rounded-full ${tier.highlight ? "" : "bg-slate-900 hover:bg-slate-800 text-white"}`}
                        data-testid={`pricing-cta-${tier.name.toLowerCase()}`}
                      >
                        {tier.ctaCopy}
                        <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </Link>
                  )
                ) : (
                  <Button
                    onClick={() => void handleCheckout(tier)}
                    disabled={busyTier !== null}
                    className={`w-full rounded-full ${tier.highlight ? "" : "bg-slate-900 hover:bg-slate-800 text-white"}`}
                    data-testid={`pricing-cta-${tier.name.toLowerCase()}`}
                  >
                    {busyTier === tier.name ? "Opening checkout…" : tier.ctaCopy}
                    {busyTier !== tier.name && (
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            );
          })}
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
                <strong>₹420 prepaid = 10 additional AI credits</strong>, no expiry, no recurring charge. Perfect for solo founders, evaluators, and weekend builders. Top-ups stack on top of your monthly plan credits too.
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
            Run our 60-second ROI calculator to see what audit chaos is actually costing your org — or join the waitlist and we'll keep you posted as new tiers, integrations and on-prem options ship.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
            <Link href="/roi-calculator">
              <Button size="lg" className="rounded-full" data-testid="pricing-roi-cta">
                Open the ROI calculator
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <WaitlistButton
              size="lg"
              variant="outline"
              className="rounded-full"
              testId="pricing-cta-waitlist"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
