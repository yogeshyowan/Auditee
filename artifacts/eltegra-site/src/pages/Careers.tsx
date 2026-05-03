import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Briefcase, Globe2, HeartHandshake, Sparkles, BookOpen, Plane } from "lucide-react";
import { SEO } from "@/components/SEO";

const ROLES = [
  { team: "Engineering", role: "Senior Backend Engineer (Graph Infrastructure)", location: "Chennai / Remote — India", type: "Full-time" },
  { team: "Engineering", role: "Staff ML Engineer (Requirements Extraction)", location: "Chennai / Remote — India", type: "Full-time" },
  { team: "Engineering", role: "Senior Frontend Engineer (React / TypeScript)", location: "Chennai / Remote — India", type: "Full-time" },
  { team: "Engineering", role: "DevOps / SRE Engineer (Kubernetes, on-prem installers)", location: "Chennai / Remote — India", type: "Full-time" },
  { team: "Product", role: "Senior PM (Compliance & Audit)", location: "Chennai / Remote — India", type: "Full-time" },
  { team: "Product", role: "Senior PM (Requirements & PDLC)", location: "Chennai / Remote — India", type: "Full-time" },
  { team: "Design", role: "Senior Product Designer (Enterprise SaaS)", location: "Remote — India", type: "Full-time" },
  { team: "Customer Success", role: "Solutions Architect, Regulated Industries", location: "Chennai / Remote — India", type: "Full-time" },
  { team: "Customer Success", role: "Implementation Consultant — Automotive (ASPICE)", location: "Remote — Germany / India", type: "Full-time" },
  { team: "GTM", role: "Enterprise Account Executive — Healthcare & MedTech", location: "Chennai, Tamil Nadu / Remote — India", type: "Full-time" },
  { team: "GTM", role: "Enterprise Account Executive — EMEA", location: "Remote — UK / Germany", type: "Full-time" },
];

const PERKS = [
  { icon: Globe2, title: "Remote-first across India + EMEA", desc: "Quarterly all-hands in Chennai, otherwise work from wherever you do your best thinking." },
  { icon: HeartHandshake, title: "Family health cover", desc: "₹15L floater for you, spouse and up to 2 kids, plus parental insurance top-up." },
  { icon: BookOpen, title: "₹1L learning budget per year", desc: "Books, conferences, certifications (ISTQB, ISACA, AWS), or any course you can defend." },
  { icon: Plane, title: "Annual offsite", desc: "Past offsites: Coorg, Pondicherry, Goa. Next one is up for vote." },
  { icon: Sparkles, title: "Meaningful equity", desc: "Every full-time hire gets ISO-style options with a four-year vest and one-year cliff." },
  { icon: Briefcase, title: "20 days PTO + sick leave + public holidays", desc: "Plus a no-questions-asked 4-day mental-health break, twice a year." },
];

const TEAMS = ["Engineering", "Product", "Design", "Customer Success", "GTM"];

export default function Careers() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Careers at Auditee — Build the AI-Native PDLC Platform"
        description="Join Auditee. We're hiring engineers, product managers, designers, solutions architects and account executives across India and EMEA. Remote-first, meaningful equity, family health cover, ₹1L learning budget."
        path="/careers"
        keywords={["Auditee careers", "Auditee jobs", "AI requirements engineering jobs", "compliance SaaS careers India", "remote engineering jobs India"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/about" className="text-sm text-slate-700 hover:text-primary">About</Link>
            <Link href="/contact" className="text-sm text-slate-700 hover:text-primary">Contact</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-20 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-4">Build the AI-native platform regulated software runs on</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            We're a small, deliberate team replacing 30-year-old tools (DOORS, Jama, Polarion) with software that auditors actually trust. If you've ever shipped requirements into ASPICE, ISO 26262, IEC 62304 or FDA QMSR audits — you'll feel at home here.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-bold text-3xl text-slate-950 mb-8">Why Auditee</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {PERKS.map((p) => (
              <div key={p.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <p.icon className="h-7 w-7 text-primary mb-3" />
                <div className="font-semibold text-slate-900">{p.title}</div>
                <div className="text-sm text-slate-600 mt-1.5">{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-bold text-3xl text-slate-950 mb-8">Open roles ({ROLES.length})</h2>
          {TEAMS.map((team) => {
            const teamRoles = ROLES.filter((r) => r.team === team);
            if (teamRoles.length === 0) return null;
            return (
              <div key={team} className="mb-8">
                <div className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">{team}</div>
                <div className="space-y-2">
                  {teamRoles.map((r) => (
                    <div key={r.role} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">{r.role}</div>
                        <div className="text-sm text-slate-600 mt-0.5">{r.location} · {r.type}</div>
                      </div>
                      <Link href={`/contact?topic=${encodeURIComponent("Application: " + r.role)}`}>
                        <Button variant="outline" size="sm" className="rounded-full">
                          Apply
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          <div className="text-sm text-slate-600 mt-6">
            Don't see your role? Email <a href="mailto:careers@auditee.site" className="text-primary underline">careers@auditee.site</a> and tell us what you'd build.
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">How we hire</h2>
          <p className="text-slate-300 mb-2">1. 30-min intro with the hiring manager.</p>
          <p className="text-slate-300 mb-2">2. Take-home or scoping exercise (paid for engineering / design).</p>
          <p className="text-slate-300 mb-2">3. Two technical / craft interviews with future peers.</p>
          <p className="text-slate-300 mb-6">4. Final conversation with the founder. Offer within 5 working days.</p>
          <Link href="mailto:careers@auditee.site">
            <Button size="lg" className="rounded-full" data-testid="careers-email-cta">
              Email careers@auditee.site
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
