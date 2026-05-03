import { Link } from "wouter";
import {
  Handshake, ArrowRight, Briefcase, Wrench, Building2, Globe2, Coins,
  type LucideIcon,
} from "lucide-react";
import { SEO, breadcrumbsLd } from "@/components/SEO";
import { Navigation, SiteFooter } from "@/components/site/Chrome";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TIERS: { name: string; Icon: LucideIcon; ideal: string; benefits: string[] }[] = [
  {
    name: "Implementation Partner",
    Icon: Wrench,
    ideal: "Boutique consultancies and SI practices delivering Auditee rollouts.",
    benefits: [
      "Free Auditee Pro internal sandbox + training credits",
      "Co-branded discovery + scoping templates",
      "20% rev-share on first-year ARR for partner-sourced deals",
      "Direct line to Solutions Engineering",
      "Quarterly partner enablement and roadmap previews",
    ],
  },
  {
    name: "Compliance & GRC Partner",
    Icon: Briefcase,
    ideal: "Regulatory affairs, GRC and audit firms (SOC 2, ISO, FDA, ASPICE).",
    benefits: [
      "Joint reference architectures and accelerator templates",
      "Co-marketing on whitepapers and webinars",
      "Partner discounts for client pilots",
      "Access to our Custom Standards builder for proprietary frameworks",
    ],
  },
  {
    name: "Technology Partner",
    Icon: Building2,
    ideal: "Vendors of complementary tools (RM, ALM, observability, e-signature, identity).",
    benefits: [
      "Integration roadmap collaboration with our engineering team",
      "Bidirectional listing on our /integrations directory",
      "Joint design partner program for new connectors",
      "Co-presence at industry events",
    ],
  },
  {
    name: "Reseller / Channel",
    Icon: Coins,
    ideal: "Regional resellers and value-added distributors in IN / EU / APAC.",
    benefits: [
      "Margin model and authorised-pricing playbook",
      "Tiered discounts based on annual commitment",
      "Co-funded MDF for regional events",
      "Local language collateral support",
    ],
  },
  {
    name: "Region & Sovereignty Partner",
    Icon: Globe2,
    ideal: "Hyperscalers, sovereign cloud providers, telcos hosting Auditee in-country.",
    benefits: [
      "Sovereign deployment reference architectures (UAE, KSA, IN, EU)",
      "Joint compliance attestations (ENS, IRAP, MeitY empanelment)",
      "Revenue model for managed-service operators",
    ],
  },
];

const PRINCIPLES = [
  { title: "We don't compete with our partners", desc: "Pre-sales, implementation, training and managed-service revenue are yours by default." },
  { title: "Predictable economics", desc: "Public price book + transparent tiered margins. No deal-by-deal renegotiation." },
  { title: "One partner per opportunity", desc: "Deal registration is honoured first-in. Joint pursuits are actively coached, not contested." },
  { title: "Roadmap influence", desc: "Quarterly partner advisory council shapes connector and framework priorities." },
];

export default function Partners() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Partner Program — Implementation, GRC, Technology & Channel | Auditee"
        description="Partner with Auditee — implementation, compliance / GRC, technology, reseller and sovereignty tracks. Predictable economics, deal registration, joint go-to-market and roadmap influence."
        path="/partners"
        keywords={["Auditee partner program", "Auditee channel", "Auditee reseller", "implementation partner", "GRC partner", "technology partner"]}
        jsonLd={breadcrumbsLd([{ name: "Home", path: "/" }, { name: "Partners", path: "/partners" }])}
      />
      <Navigation />
      <main className="pt-28 pb-24">
        <header className="max-w-3xl mx-auto px-6 text-center">
          <Handshake className="w-10 h-10 mx-auto text-primary mb-4" />
          <h1 className="font-display text-4xl md:text-5xl font-bold text-slate-950 tracking-tight">Partner Program</h1>
          <p className="mt-4 text-lg text-slate-600">
            Auditee is built to be deployed. We work with consultancies, GRC firms, technology
            vendors, regional resellers and sovereignty partners — with predictable economics
            and roadmap influence.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            <Button asChild size="lg" className="gap-2">
              <Link href="/contact?topic=partnership">Apply to partner <ArrowRight className="w-4 h-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/contact?topic=deal-registration">Register a deal</Link>
            </Button>
          </div>
        </header>

        <section className="max-w-6xl mx-auto px-6 mt-16">
          <h2 className="font-display text-2xl font-bold text-slate-950 mb-6">Tracks</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TIERS.map((t) => {
              const Icon = t.Icon;
              return (
                <Card key={t.name} className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-display font-bold text-slate-950">{t.name}</h3>
                  </div>
                  <Badge variant="outline" className="bg-slate-50 mb-3 text-xs">{t.ideal}</Badge>
                  <ul className="space-y-1.5 text-sm text-slate-700">
                    {t.benefits.map((b) => <li key={b} className="flex gap-2"><span className="text-primary">•</span><span>{b}</span></li>)}
                  </ul>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 mt-16">
          <h2 className="font-display text-2xl font-bold text-slate-950 mb-6">Operating principles</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {PRINCIPLES.map((p) => (
              <Card key={p.title} className="p-5">
                <h3 className="font-display font-bold text-slate-950 mb-1.5">{p.title}</h3>
                <p className="text-sm text-slate-700">{p.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-6 mt-16 text-center">
          <h2 className="font-display text-2xl font-bold text-slate-950">Ready to talk?</h2>
          <p className="mt-3 text-slate-600">
            Tell us about your practice — verticals, geos, current Auditee-adjacent revenue. We'll route you to the right track.
          </p>
          <div className="mt-6">
            <Button asChild size="lg" className="gap-2">
              <Link href="/contact?topic=partnership">Apply to partner <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
