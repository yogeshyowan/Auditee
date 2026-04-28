import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Globe2, Users, Newspaper, Briefcase, Target, Heart, ShieldCheck } from "lucide-react";
import { SEO } from "@/components/SEO";

const PRINCIPLES = [
  {
    icon: Target,
    title: "Truth over theatre",
    desc: "We build what auditors actually accept as evidence — not dashboards that look impressive but break under scrutiny.",
  },
  {
    icon: ShieldCheck,
    title: "Customer data is sacred",
    desc: "Single-tenant by default for Enterprise. SOC 2 Type II. No training on your IP. Encryption end-to-end.",
  },
  {
    icon: Heart,
    title: "Engineers in the room",
    desc: "Our PMs ship code. Our engineers talk to customers. No translation layer between research and reality.",
  },
];

const ROLES = [
  { team: "Engineering", role: "Senior Backend Engineer (Graph Infrastructure)", location: "Remote — EU/US" },
  { team: "Engineering", role: "Staff ML Engineer (Requirements Extraction)", location: "Remote — EU/US" },
  { team: "Product", role: "Senior PM (Compliance & Audit)", location: "Remote — EU" },
  { team: "Customer Success", role: "Solutions Architect, Regulated Industries", location: "Remote — US" },
  { team: "GTM", role: "Enterprise Account Executive — Healthcare & MedTech", location: "Boston / Remote — US" },
];

const PRESS = [
  { date: "March 2026", title: "Auditee raises Series A to bring AI-native PDLC to regulated enterprises", outlet: "TechCrunch" },
  { date: "January 2026", title: "Why one MedTech compliance team retired five tools for a single knowledge graph", outlet: "ISACA Journal" },
  { date: "November 2025", title: "Auditee receives SOC 2 Type II attestation", outlet: "Press Release" },
  { date: "September 2025", title: "How AI-native traceability is rewriting the audit playbook", outlet: "InfoQ" },
];

export default function About() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="About Auditee — The AI-Native Platform for the Product Development Lifecycle"
        description="Meet the team building Auditee, the AI-native platform replacing DOORS, Jama and Polarion for the next generation of regulated software. Founded by engineers and former auditors. Open roles in engineering, product, GTM."
        path="/about"
        keywords={["Auditee team", "AI requirements company", "Auditee careers", "compliance engineering jobs"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm text-slate-700 hover:text-primary">Pricing</Link>
            <Link href="/contact" className="text-sm text-slate-700 hover:text-primary">Contact</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 bg-gradient-to-b from-secondary/30 to-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-slate-950 tracking-tight mb-6">
              Rebuilding the PDLC for the <span className="text-primary">AI era.</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              We're a remote-first team of engineers, product leaders and regulated-industry specialists. We started Auditee because the spreadsheets-and-DOORS status quo was costing the world's most important industries — healthcare, finance, public infrastructure — the very thing they need most: speed without compromise on safety.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6 md:px-12 prose prose-slate max-w-none">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-950 mb-6">Our story</h2>
          <div className="space-y-4 text-slate-700 leading-relaxed">
            <p>
              Auditee was founded by veterans of regulated software — people who watched product launches stall for months because nobody could prove a single requirement still mapped to the function shipping in production. People who had answered "where is the evidence?" five hundred times in a single audit window.
            </p>
            <p>
              The core insight was simple: requirements, code, tests, defects and compliance evidence shouldn't live in five different tools maintained by five different teams. They should live in one continuously-updated knowledge graph that every stakeholder — product, engineering, compliance, audit — queries with the same question.
            </p>
            <p>
              That's the platform we built. It ingests from your existing stack (Jira, DOORS, Polarion, GitHub, ServiceNow, and dozens more), reasons over the graph with purpose-built AI, and emits the artifacts your business already runs on: BRDs, PRDs, FRDs, test suites, audit reports.
            </p>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="py-16 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-950 mb-10 text-center">What we believe</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <p.icon size={22} />
                </div>
                <h3 className="font-display font-bold text-slate-900 mb-2">{p.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* By the numbers */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-4 gap-6 text-center">
            {[
              { stat: "23+", label: "Compliance frameworks supported" },
              { stat: "60+", label: "Source connectors" },
              { stat: "3 continents", label: "Distributed engineering team" },
              { stat: "<60 days", label: "Median enterprise time-to-value" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-4xl font-display font-bold text-primary mb-1">{s.stat}</div>
                <div className="text-sm text-slate-600">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Careers */}
      <section id="careers" className="py-16 bg-slate-50 border-y border-slate-200 scroll-mt-20">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <div className="flex items-center gap-2 text-primary mb-3">
            <Briefcase className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">Careers</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-950 mb-3">Join us. Remote-first. Mission-led.</h2>
          <p className="text-slate-600 mb-8 max-w-3xl">
            We hire senior, autonomous people who care deeply about the regulated industries we serve. Equity for everyone, top-of-market base, real PTO, and a stack you'll actually enjoy working in.
          </p>
          <div className="space-y-3" data-testid="about-roles-list">
            {ROLES.map((r) => (
              <div key={r.role} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 hover:border-primary/30 transition-colors">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">{r.team}</div>
                  <div className="font-semibold text-slate-900">{r.role}</div>
                  <div className="text-sm text-slate-600 flex items-center gap-1.5 mt-1">
                    <Globe2 className="h-3.5 w-3.5" /> {r.location}
                  </div>
                </div>
                <Link href="/contact">
                  <Button variant="outline" className="rounded-full" data-testid={`apply-${r.role.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>Apply</Button>
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-6 text-sm text-slate-600">
            Don't see your fit?{" "}
            <Link href="/contact" className="text-primary underline">Send us a note</Link>
            {" "}— we hire opportunistically for exceptional people.
          </div>
        </div>
      </section>

      {/* Press */}
      <section id="press" className="py-16 scroll-mt-20">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <div className="flex items-center gap-2 text-primary mb-3">
            <Newspaper className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">Press</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-950 mb-8">In the news</h2>
          <div className="space-y-4" data-testid="about-press-list">
            {PRESS.map((p) => (
              <div key={p.title} className="rounded-xl border border-slate-200 bg-white p-5 flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1">{p.date} · {p.outlet}</div>
                  <div className="font-semibold text-slate-900">{p.title}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-sm text-slate-600">
            Press inquiries:{" "}
            <Link href="/contact" className="text-primary underline">contact our communications team</Link>.
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <Users className="h-10 w-10 mx-auto text-primary mb-4" />
          <h2 className="text-3xl font-display font-bold mb-4">Want to talk?</h2>
          <p className="text-slate-300 mb-6">
            Whether you're evaluating Auditee, exploring a partnership, or want to join the team — we read every message.
          </p>
          <Link href="/contact">
            <Button size="lg" className="rounded-full" data-testid="about-contact-cta">
              Contact us
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
