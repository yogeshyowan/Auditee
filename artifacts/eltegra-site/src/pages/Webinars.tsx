import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Clock, Users, PlayCircle } from "lucide-react";
import { SEO } from "@/components/SEO";

const UPCOMING = [
  {
    date: "Wed, 22 May 2026 · 16:00 IST / 10:30 GMT",
    title: "ASPICE 4.0 evidence packs — going from 6-week audits to 6 days",
    speakers: "Karthik R., Solutions Architect (Auditee) · Inga M., ex-VW ASPICE assessor",
    track: "Automotive",
  },
  {
    date: "Thu, 5 Jun 2026 · 19:30 IST / 14:00 GMT",
    title: "FDA QMSR transition — turning your ISO 13485 evidence into 21 CFR 820 in 30 days",
    speakers: "Dr. Anitha S., Principal Consultant (Auditee) · former FDA reviewer",
    track: "MedTech",
  },
  {
    date: "Wed, 26 Jun 2026 · 17:00 IST / 11:30 GMT",
    title: "Migrating off DOORS — a live walkthrough with Q&A",
    speakers: "Suresh V., Implementation Lead (Auditee)",
    track: "Migrations",
  },
];

const ON_DEMAND = [
  { title: "AI-native traceability — what auditors actually accept (and what they reject)", duration: "42 min", track: "Compliance" },
  { title: "Replacing five tools with one knowledge graph — a MedTech case study", duration: "38 min", track: "MedTech" },
  { title: "From BRD to test cases in 90 minutes — live demo", duration: "31 min", track: "Product" },
  { title: "ISO 26262 ASIL decomposition with AI assistance", duration: "47 min", track: "Automotive" },
  { title: "DPDP Act 2023 — what India SaaS teams need to ship by year-end", duration: "29 min", track: "Compliance" },
  { title: "Auditee for CTOs — how engineering velocity survives compliance", duration: "44 min", track: "Leadership" },
];

export default function Webinars() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Webinars & Live Events — Auditee"
        description="Upcoming Auditee webinars on ASPICE 4.0, FDA QMSR, ISO 26262, DOORS migration and AI-native traceability. Free, recorded and Q&A. Plus 30+ on-demand sessions."
        path="/webinars"
        keywords={["Auditee webinars", "ASPICE webinar", "FDA QMSR webinar", "ISO 26262 webinar", "DOORS migration webinar"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/demo-videos" className="text-sm text-slate-700 hover:text-primary">Product demos</Link>
            <Link href="/whitepapers" className="text-sm text-slate-700 hover:text-primary">Whitepapers</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Users className="h-10 w-10 mx-auto text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Webinars &amp; live events</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            Practical, vendor-neutral sessions on ASPICE, IEC 62304, FDA QMSR, ISO 26262 and AI-native PDLC. All sessions are free, recorded, and end with live Q&amp;A. No marketing pitch.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <div className="flex items-center gap-2 mb-4 text-slate-700"><Calendar className="h-5 w-5" /><h2 className="font-display font-bold text-2xl text-slate-950">Upcoming sessions</h2></div>
          <div className="space-y-4">
            {UPCOMING.map((s) => (
              <div key={s.title} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <span className="inline-block text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full px-2.5 py-1 mb-2">{s.track}</span>
                  <div className="font-semibold text-slate-900">{s.title}</div>
                  <div className="text-sm text-slate-600 mt-1">{s.date}</div>
                  <div className="text-xs text-slate-500 mt-1">Speakers: {s.speakers}</div>
                </div>
                <Link href={`/contact?topic=${encodeURIComponent("Webinar registration: " + s.title)}`}>
                  <Button className="rounded-full whitespace-nowrap">Reserve seat<ArrowRight className="ml-2 h-4 w-4" /></Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <div className="flex items-center gap-2 mb-4 text-slate-700"><PlayCircle className="h-5 w-5" /><h2 className="font-display font-bold text-2xl text-slate-950">On-demand library</h2></div>
          <div className="grid md:grid-cols-2 gap-4">
            {ON_DEMAND.map((v) => (
              <div key={v.title} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3">
                <PlayCircle className="h-6 w-6 text-primary mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">{v.title}</div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-2"><Clock className="h-3 w-3" />{v.duration} · {v.track}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-sm text-slate-600 mt-6">
            Looking for product walkthroughs instead? See <Link href="/demo-videos" className="text-primary underline">demo videos</Link>.
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Want a private session for your team?</h2>
          <p className="text-slate-300 mb-6">We run customised sessions for compliance, engineering or audit teams of 10+, scoped to your standards (ASPICE, IEC 62304, ISO 26262, FDA QMSR, DPDP Act).</p>
          <Link href="/contact?topic=private-webinar">
            <Button size="lg" className="rounded-full" data-testid="webinars-private-cta">Request a private session<ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
