import { Link } from "wouter";
import { ArrowRight, FileText, Download } from "lucide-react";
import { SEO, breadcrumbsLd } from "@/components/SEO";
import { Navigation, SiteFooter } from "@/components/site/Chrome";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Paper {
  slug: string;
  title: string;
  category: "Buyer's Guide" | "Standards Deep-Dive" | "Architecture" | "Industry Brief";
  pages: number;
  summary: string;
  audience: string;
}

const PAPERS: Paper[] = [
  {
    slug: "ai-requirements-management-buyers-guide-2026",
    title: "AI Requirements Management Buyer's Guide (2026)",
    category: "Buyer's Guide",
    pages: 38,
    summary: "How to evaluate AI-native RM platforms across authoring, traceability, integrations, compliance and TCO. Includes a vendor scorecard and an RFP template.",
    audience: "CTO, VP Engineering, GRC Lead",
  },
  {
    slug: "iec-62304-evidence-pack-blueprint",
    title: "IEC 62304 Evidence Pack Blueprint",
    category: "Standards Deep-Dive",
    pages: 44,
    summary: "What an IEC 62304 software safety class B/C evidence pack actually contains, mapped against the standard's clauses, with examples of every work product.",
    audience: "Regulatory Affairs, Safety Engineer, QA Manager",
  },
  {
    slug: "aspice-and-iso-26262-on-the-same-platform",
    title: "Running ASPICE and ISO 26262 on the Same Platform",
    category: "Standards Deep-Dive",
    pages: 32,
    summary: "How automotive Tier-1s can satisfy ASPICE process maturity and ISO 26262 functional safety from a single requirement graph, including UNECE R155 cybersecurity overlap.",
    audience: "ASPICE Assessor, Functional Safety Manager, ECU Software Lead",
  },
  {
    slug: "soc-2-iso-27001-pci-pdpd-overlap",
    title: "Operating SOC 2, ISO 27001, PCI DSS v4 and DPDP from One Control Framework",
    category: "Standards Deep-Dive",
    pages: 28,
    summary: "An overlap matrix and operating model for B2B SaaS providers with multi-jurisdictional customers — single set of evidence, four reports.",
    audience: "CISO, GRC Lead, Compliance Manager",
  },
  {
    slug: "auditee-architecture-whitepaper",
    title: "Auditee Architecture Whitepaper",
    category: "Architecture",
    pages: 26,
    summary: "Reference architecture: tenancy model, encryption, key management, residency, AI provider routing, observability, IR plan and disaster recovery.",
    audience: "Security Architect, CISO, Platform Engineer",
  },
  {
    slug: "ai-providers-zdr-and-byo-key",
    title: "AI Providers, Zero-Data-Retention and BYO-Key in Regulated Industries",
    category: "Architecture",
    pages: 22,
    summary: "How Auditee routes AI calls across OpenAI, Anthropic, Google, AWS Bedrock and self-hosted vLLM with provider-agnostic ZDR and tenant-specific keys.",
    audience: "AI Platform Lead, CISO, Privacy Counsel",
  },
  {
    slug: "modernizing-25-year-old-oss-bss",
    title: "Modernizing a 25-Year-Old OSS / BSS Estate with AI Reverse-Engineering",
    category: "Industry Brief",
    pages: 24,
    summary: "Field notes from a Tier-2 telecom modernization: how to derive a defensible requirement set from COBOL, Java and PL/SQL and ship 23 cloud-native modules under a strangler pattern.",
    audience: "Telecom CTO, OSS Architect, Modernization Lead",
  },
  {
    slug: "fintech-evidence-fatigue",
    title: "Fintech Evidence Fatigue — and How to End It",
    category: "Industry Brief",
    pages: 18,
    summary: "Why payment service providers spend 4 weeks per quarter on screenshots and JIRA exports, and how to convert that to continuous evidence with sub-2-hour audit prep.",
    audience: "Fintech CISO, Compliance Manager, Head of Engineering",
  },
];

const CATEGORY_VARIANT: Record<Paper["category"], "default" | "secondary" | "outline"> = {
  "Buyer's Guide": "default",
  "Standards Deep-Dive": "secondary",
  "Architecture": "outline",
  "Industry Brief": "outline",
};

export default function Whitepapers() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Whitepapers & Resources — Auditee"
        description="In-depth whitepapers on AI requirements management, IEC 62304, ASPICE, ISO 26262, SOC 2 / ISO 27001 / PCI overlap, AI provider zero-data-retention, telecom OSS modernization and fintech evidence automation."
        path="/whitepapers"
        keywords={["Auditee whitepapers", "IEC 62304 whitepaper", "ASPICE whitepaper", "AI requirements buyers guide", "PCI DSS v4 whitepaper"]}
        jsonLd={breadcrumbsLd([{ name: "Home", path: "/" }, { name: "Whitepapers", path: "/whitepapers" }])}
      />
      <Navigation />
      <main className="pt-28 pb-24">
        <header className="max-w-3xl mx-auto px-6 text-center">
          <FileText className="w-10 h-10 mx-auto text-primary mb-4" />
          <h1 className="font-display text-4xl md:text-5xl font-bold text-slate-950 tracking-tight">Whitepapers & resources</h1>
          <p className="mt-4 text-lg text-slate-600">
            Long-form work for buyers, regulators and architects evaluating Auditee. Drop your work
            email and we'll send the PDF to your inbox.
          </p>
        </header>

        <div className="max-w-5xl mx-auto px-6 mt-16 grid md:grid-cols-2 gap-5">
          {PAPERS.map((p) => (
            <Card key={p.slug} className="p-6 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <Badge variant={CATEGORY_VARIANT[p.category]} className="text-xs">{p.category}</Badge>
                <span className="text-xs text-slate-500">{p.pages} pages</span>
              </div>
              <h2 className="font-display text-lg font-bold text-slate-950 mb-2">{p.title}</h2>
              <p className="text-sm text-slate-600 mb-4 flex-1">{p.summary}</p>
              <div className="text-xs text-slate-500 mb-4">For: {p.audience}</div>
              <Button asChild className="w-full gap-2">
                <Link href={`/contact?topic=whitepaper-${p.slug}`}>
                  <Download className="w-4 h-4" /> Request PDF
                </Link>
              </Button>
            </Card>
          ))}
        </div>

        <div className="max-w-3xl mx-auto px-6 mt-20 text-center">
          <h2 className="font-display text-2xl font-bold text-slate-950">Looking for something specific?</h2>
          <p className="mt-3 text-slate-600">
            We routinely produce custom briefs for procurement, regulatory affairs and security teams under NDA.
          </p>
          <div className="mt-6">
            <Button asChild size="lg" className="gap-2">
              <Link href="/contact?topic=custom-brief">Request a custom brief <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
