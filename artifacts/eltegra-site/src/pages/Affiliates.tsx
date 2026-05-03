import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Coins, TrendingUp, Award, Handshake } from "lucide-react";
import { SEO } from "@/components/SEO";

const TIERS = [
  { tier: "Affiliate", req: "Public link, blog post, newsletter or YouTube video", rev: "20% recurring · 12 months", payout: "Wise / UPI / bank, monthly" },
  { tier: "Consultant", req: "ASPICE / IEC 62304 / ISO 26262 / FDA QMSR consultancy or trainer", rev: "25% recurring · 24 months", payout: "Wise / UPI / bank, monthly · co-branded landing pages" },
  { tier: "Reseller", req: "Existing GTM motion in regulated industries (≥3 closed deals)", rev: "Custom — typically 30–35% margin", payout: "Net-30 invoice · MDF, lead-share, joint pipeline reviews" },
];

const PERKS = [
  { icon: Coins, title: "Real recurring revenue", desc: "Up to 35% margin and 24-month attribution. We don't shave commission when prices change." },
  { icon: TrendingUp, title: "Self-serve dashboard", desc: "Real-time clicks, sign-ups, MRR and payouts — no waiting for an end-of-quarter report." },
  { icon: Award, title: "Co-marketing budget", desc: "Joint webinars, conference booths and case studies for active resellers." },
  { icon: Handshake, title: "Honest attribution", desc: "First-touch + last-touch with deterministic deduplication. We side with the partner on disputes." },
];

export default function Affiliates() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Affiliate, Consultant & Reseller Program — Auditee"
        description="Earn 20–35% recurring revenue for 12–24 months by referring regulated-industry teams to Auditee. Three tiers: Affiliate, Consultant, Reseller. Wise/UPI payouts, real attribution dashboard, co-marketing budget."
        path="/affiliates"
        keywords={["Auditee affiliate", "Auditee reseller", "compliance SaaS affiliate", "ALM consultant program", "Auditee partner program"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/partners" className="text-sm text-slate-700 hover:text-primary">Partners</Link>
            <Link href="/pricing" className="text-sm text-slate-700 hover:text-primary">Pricing</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Coins className="h-10 w-10 mx-auto text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Earn recurring revenue with Auditee</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            Three tiers — pick the one that matches how you actually work. We pay 20–35% recurring for 12–24 months, in INR or USD, on every referred customer that converts.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">The three tiers</h2>
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <table className="min-w-full text-sm border border-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Tier</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Who it's for</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Revenue share</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Payout</th>
                </tr>
              </thead>
              <tbody>
                {TIERS.map((t) => (
                  <tr key={t.tier} className="border-t border-slate-200 align-top">
                    <td className="px-4 py-3 font-semibold text-slate-900">{t.tier}</td>
                    <td className="px-4 py-3 text-slate-700">{t.req}</td>
                    <td className="px-4 py-3 text-slate-700">{t.rev}</td>
                    <td className="px-4 py-3 text-slate-700">{t.payout}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-6">Why partner with us</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {PERKS.map((p) => (
              <div key={p.title} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start gap-3">
                <p.icon className="h-6 w-6 text-primary mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900">{p.title}</div>
                  <div className="text-sm text-slate-600 mt-1">{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-6 prose prose-slate prose-headings:font-display prose-headings:text-slate-950">
          <h2>How it works</h2>
          <ol>
            <li>Apply with a 2-line description of how you'd refer customers — we approve in 3 business days.</li>
            <li>Get your unique referral link and a partner-portal login (real-time clicks, sign-ups, MRR).</li>
            <li>Refer customers. Attribution window is 90 days for Affiliates, 180 days for Consultants, 365 days for Resellers.</li>
            <li>We pay monthly once you've cleared a $100 / ₹8,000 threshold.</li>
          </ol>

          <h2>What we won't do</h2>
          <ul>
            <li>We don't allow paid search bidding on "Auditee" or its variants — that's a fight that helps no-one.</li>
            <li>We don't run flash discounts that undercut partners. Pricing is the same on auditee.site and through every partner.</li>
            <li>We don't poach: if a customer signs through your link, they remain attributed to you for the full attribution window even if they later close inbound.</li>
          </ul>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Ready to apply?</h2>
          <p className="text-slate-300 mb-6">Tell us how you'd refer Auditee. We reply within 3 business days.</p>
          <Link href="/contact?topic=affiliate-application">
            <Button size="lg" className="rounded-full" data-testid="affiliates-apply-cta">Apply to the program<ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
