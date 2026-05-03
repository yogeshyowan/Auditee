import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Map } from "lucide-react";
import { SEO } from "@/components/SEO";

const SECTIONS: Array<{ heading: string; links: Array<{ href: string; label: string }> }> = [
  {
    heading: "Product",
    links: [
      { href: "/features", label: "All features" },
      { href: "/ai-product-development", label: "AI product development" },
      { href: "/automated-compliance", label: "Automated compliance" },
      { href: "/missing-requirements-analysis", label: "Missing-requirement analysis" },
      { href: "/requirements-management", label: "Requirements management" },
      { href: "/ai-requirements-management", label: "AI requirements management" },
      { href: "/requirements-linked-test-cases", label: "Requirements-linked test cases" },
      { href: "/test-case-generation", label: "Test-case generation" },
      { href: "/intelligent-document-analysis", label: "Intelligent document analysis" },
      { href: "/brd-generation", label: "BRD generation" },
    ],
  },
  {
    heading: "Solutions — by team",
    links: [
      { href: "/teams", label: "All teams" },
      { href: "/cto", label: "For CTOs" },
      { href: "/cpo", label: "For CPOs" },
      { href: "/business-analyst", label: "For Business Analysts" },
      { href: "/qa-and-compliance", label: "For QA & Compliance" },
    ],
  },
  {
    heading: "Solutions — by industry",
    links: [
      { href: "/industries", label: "All industries" },
      { href: "/ai-for-healthcare", label: "Healthcare & MedTech" },
      { href: "/ai-for-automotive", label: "Automotive" },
      { href: "/ai-for-finance", label: "Financial services" },
      { href: "/ai-for-telecom", label: "Telecom & networks" },
    ],
  },
  {
    heading: "Solutions — by company size",
    links: [
      { href: "/for-startups", label: "For startups" },
      { href: "/for-enterprise", label: "For enterprise" },
    ],
  },
  {
    heading: "Comparisons",
    links: [
      { href: "/compare", label: "Comparison hub" },
      { href: "/compare/doors", label: "vs IBM DOORS" },
      { href: "/compare/jama", label: "vs Jama Connect" },
      { href: "/compare/polarion", label: "vs Polarion ALM" },
      { href: "/migrations", label: "Migration guides" },
    ],
  },
  {
    heading: "Standards",
    links: [{ href: "/standards", label: "Standards library (ASPICE, ISO 26262, IEC 62304, FDA QMSR, MDR, DORA, DPDP, SOC 2…)" }],
  },
  {
    heading: "Resources",
    links: [
      { href: "/blog", label: "Blog" },
      { href: "/case-studies", label: "Case studies" },
      { href: "/customers", label: "Customers" },
      { href: "/whitepapers", label: "Whitepapers" },
      { href: "/webinars", label: "Webinars" },
      { href: "/demo-videos", label: "Demo videos" },
      { href: "/templates", label: "Templates" },
      { href: "/free-tools", label: "Free tools" },
      { href: "/roi-calculator", label: "ROI calculator" },
      { href: "/glossary", label: "Glossary" },
      { href: "/faqs", label: "FAQs" },
      { href: "/help", label: "Help center" },
      { href: "/changelog", label: "Changelog" },
      { href: "/roadmap", label: "Roadmap" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/careers", label: "Careers" },
      { href: "/newsroom", label: "Newsroom" },
      { href: "/brand", label: "Brand kit" },
      { href: "/partners", label: "Partners" },
      { href: "/affiliates", label: "Affiliate program" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    heading: "Trust & legal",
    links: [
      { href: "/trust", label: "Trust center" },
      { href: "/security", label: "Security" },
      { href: "/vdp", label: "Vulnerability disclosure" },
      { href: "/sla", label: "SLA" },
      { href: "/status", label: "Status" },
      { href: "/privacy-policy", label: "Privacy policy" },
      { href: "/terms-of-service", label: "Terms of service" },
      { href: "/cookies", label: "Cookie policy" },
      { href: "/dpa", label: "Data Processing Addendum" },
      { href: "/sub-processors", label: "Sub-processors" },
      { href: "/aup", label: "Acceptable Use Policy" },
    ],
  },
  {
    heading: "Developers & integrations",
    links: [
      { href: "/developers", label: "Developer docs" },
      { href: "/integrations", label: "Integrations" },
      { href: "/use-cases", label: "Use cases" },
    ],
  },
];

export default function HtmlSitemap() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Sitemap — Auditee"
        description="Browse every public page on auditee.site, organised by product, solutions, comparisons, standards, resources, company and trust & legal."
        path="/sitemap"
        keywords={["Auditee sitemap", "site map", "all pages"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/help" className="text-sm text-slate-700 hover:text-primary">Help</Link>
            <a href="/sitemap.xml" className="text-sm text-slate-700 hover:text-primary">XML sitemap</a>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Map className="h-10 w-10 mx-auto text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Sitemap</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            Every public page on auditee.site, in one list. Looking for the machine-readable version? <a href="/sitemap.xml" className="text-primary underline">/sitemap.xml</a>.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SECTIONS.map((s) => (
              <div key={s.heading}>
                <h2 className="font-display font-bold text-lg text-slate-950 mb-3">{s.heading}</h2>
                <ul className="space-y-1.5">
                  {s.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-sm text-slate-700 hover:text-primary hover:underline">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
