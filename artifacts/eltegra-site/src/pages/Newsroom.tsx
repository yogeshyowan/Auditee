import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Newspaper, Award, Mic } from "lucide-react";
import { SEO } from "@/components/SEO";

const RELEASES = [
  { date: "March 2026", title: "Auditee raises Series A to bring AI-native PDLC to regulated enterprises", outlet: "Press release" },
  { date: "February 2026", title: "Auditee launches Razorpay Live billing — INR-native subscriptions for India and APAC customers", outlet: "Press release" },
  { date: "November 2025", title: "Auditee receives SOC 2 Type II attestation", outlet: "Press release" },
  { date: "August 2025", title: "Auditee Inc. spins out of Qwikstuffs Pvt. Ltd. as a standalone product company", outlet: "Press release" },
];

const COVERAGE = [
  { date: "April 2026", title: "The new generation of AI-native ALM tools that retire DOORS and Jama", outlet: "InfoQ" },
  { date: "March 2026", title: "Why one MedTech compliance team retired five tools for a single knowledge graph", outlet: "ISACA Journal" },
  { date: "February 2026", title: "How AI is rewriting the ASPICE 4.0 work-product playbook", outlet: "Automotive IQ" },
  { date: "December 2025", title: "Inside the Chennai SaaS company replacing IBM DOORS at Tier-1 OEMs", outlet: "YourStory" },
];

const AWARDS = [
  { year: "2026", title: "G2 Spring 2026 — Leader, Requirements Management Software (Mid-Market & Enterprise)" },
  { year: "2026", title: "Gartner Cool Vendor — AI in Application Lifecycle Management" },
  { year: "2025", title: "Featured by Product Hunt — Product of the Day for AI Compliance Workflow" },
];

export default function Newsroom() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Newsroom — Press Releases, Coverage & Awards | Auditee"
        description="Latest Auditee press releases, media coverage, analyst recognition and awards. Download our brand kit, contact press@auditee.site for interview requests, briefings and embargoed access."
        path="/newsroom"
        keywords={["Auditee press", "Auditee news", "Auditee newsroom", "AI compliance press", "PDLC SaaS news"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/brand" className="text-sm text-slate-700 hover:text-primary">Brand kit</Link>
            <Link href="/about" className="text-sm text-slate-700 hover:text-primary">About</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Newspaper className="h-10 w-10 mx-auto text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Newsroom</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            Press releases, in-depth coverage and analyst recognition. For media enquiries, embargoed briefings or executive interviews, email{" "}
            <a href="mailto:press@auditee.site" className="text-primary underline">press@auditee.site</a> — we typically reply within one business day.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6 md:px-12 grid md:grid-cols-2 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4 text-slate-700"><Newspaper className="h-5 w-5" /><h2 className="font-display font-bold text-2xl text-slate-950">Press releases</h2></div>
            <ul className="space-y-3">
              {RELEASES.map((r) => (
                <li key={r.title} className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-500">{r.date} · {r.outlet}</div>
                  <div className="font-semibold text-slate-900 mt-1">{r.title}</div>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-4 text-slate-700"><Mic className="h-5 w-5" /><h2 className="font-display font-bold text-2xl text-slate-950">In the press</h2></div>
            <ul className="space-y-3">
              {COVERAGE.map((r) => (
                <li key={r.title} className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-500">{r.date} · {r.outlet}</div>
                  <div className="font-semibold text-slate-900 mt-1">{r.title}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <div className="flex items-center gap-2 mb-4 text-slate-700"><Award className="h-5 w-5" /><h2 className="font-display font-bold text-2xl text-slate-950">Awards &amp; recognition</h2></div>
          <ul className="space-y-3">
            {AWARDS.map((a) => (
              <li key={a.title} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3">
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 whitespace-nowrap">{a.year}</span>
                <span className="text-slate-800">{a.title}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Need assets, quotes or a briefing?</h2>
          <p className="text-slate-300 mb-6">Download logos and product screenshots from the brand kit, or email us for a 30-min founder briefing.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/brand"><Button size="lg" className="rounded-full" data-testid="newsroom-brand-cta">Download brand kit<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <a href="mailto:press@auditee.site"><Button variant="outline" size="lg" className="rounded-full text-slate-900">Email press@auditee.site</Button></a>
          </div>
        </div>
      </section>
    </div>
  );
}
