import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Rocket, Gift, Zap, Users } from "lucide-react";
import { SEO } from "@/components/SEO";

const PERKS = [
  { icon: Gift, title: "12 months free of Standard", desc: "All seed-stage startups (≤$3M raised, ≤25 employees) get the Standard plan free for 12 months. No credit card upfront." },
  { icon: Zap, title: "Founding-engineer onboarding", desc: "A 90-minute setup call with one of our founders to wire up your standard, baseline traceability, and first audit-ready project." },
  { icon: Users, title: "Access to the regulated-startup channel", desc: "A private community of ~80 founders building in MedTech, automotive, FinTech and infra — share auditor lists, templates, war stories." },
];

const STAGES = [
  { stage: "Pre-seed (≤$500K)", offer: "Free, forever, for the founding team — up to 5 users on Standard with usage caps. No card required." },
  { stage: "Seed (≤$3M)", offer: "12 months free of Standard. Then 50% off for year 2." },
  { stage: "Series A (≤$15M)", offer: "30% off Professional for the first year. Founder-led onboarding." },
  { stage: "Series B+", offer: "Standard pricing. Talk to us about volume + multi-year discounts." },
];

export default function ForStartups() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Auditee for Startups — 12 Months Free for Seed-Stage Regulated Startups"
        description="Building MedTech, AutoTech, FinTech or InfraTech? Get 12 months of Auditee free at seed. Founder-led onboarding, regulated-startup community, and the same platform Tier-1 OEMs use."
        path="/for-startups"
        keywords={["startup compliance SaaS", "MedTech startup", "automotive startup ASPICE", "FinTech compliance startup", "free SaaS for startups", "seed startup deals"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/for-enterprise" className="text-sm text-slate-700 hover:text-primary">For enterprise</Link>
            <Link href="/pricing" className="text-sm text-slate-700 hover:text-primary">Pricing</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-20 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Rocket className="h-10 w-10 mx-auto text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Auditee for startups</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            Audit-ready engineering shouldn't wait for Series B. Build with the same platform that Tier-1 OEMs and listed MedTech firms use — at a price designed for founders.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">By stage</h2>
          <div className="space-y-3">
            {STAGES.map((s) => (
              <div key={s.stage} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="font-semibold text-slate-900">{s.stage}</div>
                <div className="text-sm text-slate-700 md:text-right md:max-w-xl">{s.offer}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">What's included</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {PERKS.map((p) => (
              <div key={p.title} className="bg-white border border-slate-200 rounded-2xl p-5">
                <p.icon className="h-7 w-7 text-primary mb-3" />
                <div className="font-semibold text-slate-900">{p.title}</div>
                <div className="text-sm text-slate-600 mt-1.5">{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-6 prose prose-slate prose-headings:font-display prose-headings:text-slate-950">
          <h2>Eligibility</h2>
          <ul>
            <li>Total funds raised ≤ $3M (or local equivalent).</li>
            <li>≤ 25 employees on the date of application.</li>
            <li>Building a real product in a regulated space — MedTech, AutoTech, FinTech, energy, infra, defence-tech.</li>
            <li>Not currently a paid Auditee customer (existing customers get a separate retention discount).</li>
          </ul>

          <h2>How to claim</h2>
          <p>Email <a href="mailto:startups@auditee.site" className="text-primary underline">startups@auditee.site</a> from your company domain with a 2-line description of what you're building and your funding stage. We approve in 3 business days.</p>

          <h2>Investor-friends</h2>
          <p>Backed by these funds? You're auto-eligible — Sequoia India, Accel India, Lightspeed, Peak XV, Blume, India Quotient, Kalaari, Speciale, plus YC, a16z, Founders Fund, Initialized, Khosla, NEA, Bessemer.</p>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Apply for the startup deal</h2>
          <p className="text-slate-300 mb-6">3 business days to approval. Founder-led onboarding within a week.</p>
          <a href="mailto:startups@auditee.site">
            <Button size="lg" className="rounded-full" data-testid="for-startups-apply-cta">Email startups@auditee.site<ArrowRight className="ml-2 h-4 w-4" /></Button>
          </a>
        </div>
      </section>
    </div>
  );
}
