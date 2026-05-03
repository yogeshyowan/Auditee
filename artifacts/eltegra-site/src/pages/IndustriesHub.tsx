import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, HeartPulse, Landmark, Car, Antenna, Building2 } from "lucide-react";
import { SEO } from "@/components/SEO";

const INDUSTRIES = [
  { icon: HeartPulse, title: "Healthcare & MedTech", standards: "IEC 62304, ISO 13485, ISO 14971, FDA QMSR (21 CFR 820), MDR 2017/745, IVDR 2017/746, HIPAA", desc: "Auto-link clinical evaluation reports, risk files, design history files, software-of-unknown-provenance assessments and unit-test evidence to every requirement.", href: "/ai-for-healthcare" },
  { icon: Car, title: "Automotive", standards: "ASPICE 4.0, ISO 26262, ISO 21434 (cybersecurity), SOTIF (ISO 21448), AUTOSAR", desc: "Generate ASPICE work products from a single source of truth — system, software and hardware requirements with bidirectional links to test cases and review records.", href: "/ai-for-automotive" },
  { icon: Landmark, title: "Financial Services", standards: "DORA, RBI master directions, PCI-DSS 4.0, SOX, GDPR, India DPDP Act 2023", desc: "Map controls to product requirements, evidence sampling for SOX and ISAE 3402 audits, and immutable audit trails for change management.", href: "/ai-for-finance" },
  { icon: Antenna, title: "Telecom & Networks", standards: "3GPP, ETSI, TM Forum, ONAP, O-RAN ALLIANCE", desc: "Manage 3GPP-spec-derived requirements at scale, with traceability to test plans, conformance suites and field-trial reports.", href: "/ai-for-telecom" },
];

export default function IndustriesHub() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Industries — AI-Native PDLC for Regulated Sectors | Auditee"
        description="Auditee for healthcare, automotive, financial services and telecom. Pre-mapped to IEC 62304, ISO 13485, FDA QMSR, ASPICE 4.0, ISO 26262, DORA, PCI-DSS 4.0 and 3GPP."
        path="/industries"
        keywords={["regulated industries SaaS", "AI compliance industries", "MedTech compliance", "automotive ASPICE", "financial services compliance", "telecom 3GPP requirements"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/use-cases" className="text-sm text-slate-700 hover:text-primary">Use cases</Link>
            <Link href="/case-studies" className="text-sm text-slate-700 hover:text-primary">Case studies</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Building2 className="h-10 w-10 mx-auto text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Built for regulated industries</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            One platform, four industry-tuned configurations. Standards, controls and evidence templates pre-mapped — so your first audit-ready project goes live in weeks, not quarters.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-5">
            {INDUSTRIES.map((i) => (
              <Link key={i.title} href={i.href} className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-primary transition-colors block">
                <i.icon className="h-8 w-8 text-primary mb-3" />
                <div className="font-display font-bold text-xl text-slate-950">{i.title}</div>
                <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mt-2">Standards</div>
                <div className="text-sm text-slate-700 mt-1">{i.standards}</div>
                <div className="text-sm text-slate-600 mt-3">{i.desc}</div>
                <div className="mt-4 text-sm text-primary font-medium inline-flex items-center gap-1">Explore {i.title} <ArrowRight className="h-4 w-4" /></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-3">Industry not listed?</h2>
          <p className="text-slate-700 mb-6">We've also deployed Auditee in aerospace (DO-178C / DO-254), railway (EN 50128 / EN 50657), industrial automation (IEC 61508), and energy (NERC CIP). The platform is standard-agnostic — bring your own control library.</p>
          <Link href="/contact?topic=industry-fit">
            <Button size="lg" className="rounded-full" data-testid="industries-fit-cta">Talk to a solutions architect<ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
