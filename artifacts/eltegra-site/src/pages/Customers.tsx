import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Quote, Users } from "lucide-react";
import { SEO } from "@/components/SEO";

const LOGOS = [
  "Tier-1 European OEM (NDA)", "Listed Indian MedTech (NDA)", "Top-5 EV manufacturer (NDA)", "European IVD diagnostics", "US FinTech (Series C)", "Indian NBFC (RBI-regulated)", "Industrial robotics OEM", "EV battery management ODM", "Tier-1 telco (3GPP)", "ADAS perception startup", "MedDevice contract manufacturer", "Defence electronics PSU",
];

const QUOTES = [
  { quote: "Our ASPICE 4.0 audit prep dropped from six weeks to four working days. The auditor's only ask was 'send us a read-only login'.", who: "Head of SW Process, Tier-1 OEM", industry: "Automotive", href: "/case-studies" },
  { quote: "We replaced DOORS, a separate test-management tool, two SharePoint trees and a homegrown traceability sheet with Auditee. Net licence saving: ₹1.4 Cr/year.", who: "VP of Engineering, Listed MedTech", industry: "MedTech", href: "/compare/doors" },
  { quote: "Auditee's evidence packs got us through an unannounced FDA inspection in week 9 of using the product. The DHF was complete by close-of-day.", who: "QA Director, US-listed device maker", industry: "FDA QMSR", href: "/automated-compliance" },
  { quote: "The migration team mapped 47K Polarion items, including links and baselines, in 18 days flat. Zero data loss and a written reconciliation report.", who: "Engineering Manager, Tier-2 supplier", industry: "Migration", href: "/migrations" },
  { quote: "DPDP Act readiness in three weeks instead of three quarters. The notice & consent workflow alone paid for the platform.", who: "DPO, Indian NBFC", industry: "DPDP / RBI", href: "/ai-for-finance" },
  { quote: "Our BAs now write requirements 3× faster, and the quality-scorer rejects vague stories at the source. Velocity is up; defect-leakage is down.", who: "Lead BA, ADAS startup", industry: "Automotive", href: "/business-analyst" },
];

export default function Customers() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Customers — Auditee in Production at OEMs, MedTech, FinTech & More"
        description="Auditee runs in production at Tier-1 automotive OEMs, listed MedTech, EV manufacturers, IVD diagnostics, FinTech, NBFCs, telcos, and defence. Read what their teams say."
        path="/customers"
        keywords={["Auditee customers", "compliance SaaS customers", "ASPICE customers", "FDA QMSR customers", "MedTech customer stories", "automotive OEM customers"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/case-studies" className="text-sm text-slate-700 hover:text-primary">Case studies</Link>
            <Link href="/industries" className="text-sm text-slate-700 hover:text-primary">Industries</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Users className="h-10 w-10 mx-auto text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Built with — and trusted by — regulated teams</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            Most of our customers can't be named publicly (procurement constraints), but the work is real. Below: a representative slice of the teams shipping audit-ready software with Auditee.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {LOGOS.map((l) => (
              <div key={l} className="bg-white border border-slate-200 rounded-xl p-4 text-center text-sm text-slate-700 flex items-center justify-center min-h-[64px]">
                {l}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-4 text-center">"NDA" markers indicate customers under publicity restrictions. We can arrange direct customer references on request, gated by mutual NDA.</p>
        </div>
      </section>

      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">In their words</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {QUOTES.map((q) => (
              <Link key={q.who} href={q.href} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-primary transition-colors block">
                <Quote className="h-6 w-6 text-primary mb-3" />
                <blockquote className="text-slate-800 italic">"{q.quote}"</blockquote>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-slate-700 font-semibold">{q.who}</span>
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full px-2.5 py-1">{q.industry}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Want to talk to a customer?</h2>
          <p className="text-slate-300 mb-6">We can arrange a 30-min reference call with a customer in your industry, under mutual NDA.</p>
          <Link href="/contact?topic=reference-call">
            <Button size="lg" className="rounded-full" data-testid="customers-reference-cta">Request a reference call<ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
