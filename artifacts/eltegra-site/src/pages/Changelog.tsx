import { Link } from "wouter";
import { Sparkles, ArrowRight } from "lucide-react";
import { SEO, breadcrumbsLd } from "@/components/SEO";
import { Navigation, SiteFooter } from "@/components/site/Chrome";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Tag = "New" | "Improved" | "Fixed" | "Security" | "Compliance" | "Integration";

interface Entry {
  date: string;
  version: string;
  highlights: string;
  items: { tag: Tag; text: string }[];
}

const TAG_CLASS: Record<Tag, string> = {
  New: "bg-emerald-100 text-emerald-800",
  Improved: "bg-sky-100 text-sky-800",
  Fixed: "bg-amber-100 text-amber-800",
  Security: "bg-rose-100 text-rose-800",
  Compliance: "bg-violet-100 text-violet-800",
  Integration: "bg-slate-200 text-slate-800",
};

const ENTRIES: Entry[] = [
  {
    date: "2026-05-03",
    version: "v0.42",
    highlights: "Comparison pages, integrations directory, glossary, case studies.",
    items: [
      { tag: "New", text: "Public comparison pages: Auditee vs IBM DOORS, Jama Connect, Siemens Polarion." },
      { tag: "New", text: "Integrations directory at /integrations — 8 categories, 40+ connectors." },
      { tag: "New", text: "Glossary at /glossary — 45+ PDLC and compliance terms with structured-data markup." },
      { tag: "New", text: "Case studies at /case-studies — composite engagements across healthcare, fintech, automotive and telecom." },
      { tag: "Improved", text: "Sitemap regenerated to cover all marketing routes and blog posts." },
    ],
  },
  {
    date: "2026-04-30",
    version: "v0.41",
    highlights: "Industry, role and product pages; FAQs and demo videos.",
    items: [
      { tag: "New", text: "Industry pages: Healthcare, Finance, Automotive, Telecom." },
      { tag: "New", text: "Role pages: CPO, CTO, Business Analyst, QA & Compliance." },
      { tag: "New", text: "Product pages: BRD generation, intelligent document analysis, requirements-linked test cases, requirements management." },
      { tag: "New", text: "FAQs page with FAQPage JSON-LD across seven categories." },
      { tag: "New", text: "Demo videos page with 17 narrated module tutorials." },
      { tag: "Improved", text: "Top-nav mega-menu now includes Industries and For-your-role groups." },
      { tag: "Fixed", text: "Accessibility fix: replaced nested Button-in-Link CTAs with Button asChild + Link / anchor pattern." },
    ],
  },
  {
    date: "2026-04-22",
    version: "v0.40",
    highlights: "Razorpay billing — Live mode.",
    items: [
      { tag: "New", text: "Monthly Standard (₹1,999) and Professional (₹7,999) plans on real Razorpay Subscriptions." },
      { tag: "New", text: "Annual Standard (₹19,990) and Professional (₹79,990) plans on one-time Razorpay Orders with 12-month plan expiry." },
      { tag: "New", text: "Webhook handler verifies HMAC and emits server-side payment_completed events." },
      { tag: "New", text: "/app/billing surfaces current subscription, next renewal and cancel-at-period-end." },
      { tag: "Security", text: "Webhook route mounted before express.json() so signature verification gets raw bytes." },
    ],
  },
  {
    date: "2026-04-15",
    version: "v0.39",
    highlights: "Custom Standards builder + 5 new pre-mapped frameworks.",
    items: [
      { tag: "Compliance", text: "Custom Standards builder — model your internal control frameworks with the same engine that powers SOC 2 / ISO 27001." },
      { tag: "Compliance", text: "Pre-mapped: PCI DSS v4, NIST 800-171, ISO/SAE 21434 (vehicle cybersecurity), DPDP Act 2023, EU AI Act (high-risk)." },
      { tag: "Improved", text: "Recurring audit jobs now support per-control owner notifications via Slack and email." },
    ],
  },
  {
    date: "2026-04-08",
    version: "v0.38",
    highlights: "AI gap detection 2.0 + duplicate clustering.",
    items: [
      { tag: "New", text: "Gap detection now reasons over the requirement graph rather than per-document." },
      { tag: "New", text: "Duplicate clustering with one-click merge / supersede." },
      { tag: "Improved", text: "Quality scoring rubric exposes per-criterion sub-scores." },
    ],
  },
  {
    date: "2026-04-01",
    version: "v0.37",
    highlights: "Connectors expansion.",
    items: [
      { tag: "Integration", text: "Native Polarion bidirectional connector (work items, attributes, links, attachments)." },
      { tag: "Integration", text: "GitLab self-managed and SaaS code indexing + MR webhooks." },
      { tag: "Integration", text: "Microsoft Teams adaptive cards with deep links to requirements." },
      { tag: "Improved", text: "Jira connector now supports Xray Test Manager bidirectional sync." },
    ],
  },
  {
    date: "2026-03-25",
    version: "v0.36",
    highlights: "Document generation upgrades.",
    items: [
      { tag: "Improved", text: "BRD / PRD / FRD / SRS templates re-tuned for ISO 29148 alignment." },
      { tag: "New", text: "Markdown export with linked frontmatter for Confluence and Notion mirror." },
      { tag: "Fixed", text: "DOCX export now preserves heading-level numbering across regenerations." },
    ],
  },
  {
    date: "2026-03-18",
    version: "v0.35",
    highlights: "Identity & sovereignty.",
    items: [
      { tag: "Security", text: "SCIM 2.0 user provisioning across Okta, Entra ID, Google, OneLogin and JumpCloud." },
      { tag: "Security", text: "EU and US data residency on Pro+ workspaces." },
      { tag: "Improved", text: "Audit log retention extended from 90 days to 365 days for all paid plans." },
    ],
  },
];

export default function Changelog() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Changelog — What's New in Auditee"
        description="Monthly release notes for Auditee — new features, integrations, compliance frameworks, security upgrades and fixes."
        path="/changelog"
        keywords={["Auditee changelog", "Auditee release notes", "Auditee what's new"]}
        jsonLd={breadcrumbsLd([{ name: "Home", path: "/" }, { name: "Changelog", path: "/changelog" }])}
      />
      <Navigation />
      <main className="pt-28 pb-24">
        <header className="max-w-3xl mx-auto px-6 text-center">
          <Sparkles className="w-10 h-10 mx-auto text-primary mb-4" />
          <h1 className="font-display text-4xl md:text-5xl font-bold text-slate-950 tracking-tight">Changelog</h1>
          <p className="mt-4 text-lg text-slate-600">
            Monthly release notes — what shipped, what improved, what we fixed.
          </p>
        </header>

        <div className="max-w-3xl mx-auto px-6 mt-12 space-y-6">
          {ENTRIES.map((e) => (
            <Card key={e.version} className="p-6">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
                <h2 className="font-display text-xl font-bold text-slate-950">{e.version}</h2>
                <span className="text-sm text-slate-500">{e.date}</span>
              </div>
              <p className="text-sm text-slate-600 mb-4">{e.highlights}</p>
              <ul className="space-y-2">
                {e.items.map((it, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className={`text-xs font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${TAG_CLASS[it.tag]} shrink-0 mt-0.5`}>
                      {it.tag}
                    </span>
                    <span className="text-sm text-slate-700 leading-relaxed">{it.text}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <div className="max-w-3xl mx-auto px-6 mt-16 text-center">
          <h2 className="font-display text-2xl font-bold text-slate-950">Want the deep-dive?</h2>
          <p className="mt-3 text-slate-600">
            We publish weekly platform write-ups on the blog with the engineering rationale behind each release.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            <Button asChild size="lg" className="gap-2">
              <Link href="/blog">Read the blog <ArrowRight className="w-4 h-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/contact">Request a feature</Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
