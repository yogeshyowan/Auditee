import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Briefcase, Code2, ClipboardCheck, Lightbulb } from "lucide-react";
import { SEO } from "@/components/SEO";

const ROLES = [
  { icon: Code2, title: "For CTOs", href: "/cto", desc: "Engineering velocity that survives compliance. Replace 4-6 tools, cut audit prep 80%, keep your team in their IDE." },
  { icon: Lightbulb, title: "For CPOs", href: "/cpo", desc: "Ship roadmaps your auditors can defend. Living traceability from PRD to release notes, with AI quality gates on every requirement." },
  { icon: Briefcase, title: "For Business Analysts", href: "/business-analyst", desc: "Author requirements 3× faster with AI quality scoring, automatic deduplication and one-click handoff to engineering." },
  { icon: ClipboardCheck, title: "For QA & Compliance", href: "/qa-and-compliance", desc: "Evidence packs that assemble themselves. Live audit trails, sampling support, and standard-mapped controls in one place." },
];

export default function Teams() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Solutions by Team — CTO, CPO, BA, QA & Compliance | Auditee"
        description="Auditee's role-specific value: how CTOs replace 4-6 tools, how CPOs ship audit-defensible roadmaps, how BAs author 3× faster, and how QA & Compliance teams assemble evidence packs in days, not weeks."
        path="/teams"
        keywords={["compliance SaaS for CTO", "PDLC for CPO", "BA tool", "QA compliance tool", "Auditee for engineering leaders", "ALM for business analysts"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/industries" className="text-sm text-slate-700 hover:text-primary">Industries</Link>
            <Link href="/use-cases" className="text-sm text-slate-700 hover:text-primary">Use cases</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Users className="h-10 w-10 mx-auto text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Solutions by team</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            One platform, four lenses. Pick the role that maps to how you'll use Auditee — every page below is written by someone who's done that job.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-5">
            {ROLES.map((r) => (
              <Link key={r.title} href={r.href} className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-primary transition-colors block">
                <r.icon className="h-8 w-8 text-primary mb-3" />
                <div className="font-display font-bold text-xl text-slate-950">{r.title}</div>
                <div className="text-sm text-slate-700 mt-2">{r.desc}</div>
                <div className="mt-4 text-sm text-primary font-medium inline-flex items-center gap-1">Read the full page <ArrowRight className="h-4 w-4" /></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-display font-bold text-2xl text-slate-950 mb-3">Cross-functional team?</h2>
          <p className="text-slate-700 mb-6">Most Auditee deployments span all four roles. Workspaces, projects and granular permissions keep each team in their lane while sharing the same source of truth.</p>
          <Link href="/security">
            <Button variant="outline" size="lg" className="rounded-full">See workspace permissions<ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Link>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Talk to your role's solutions architect</h2>
          <p className="text-slate-300 mb-6">30-minute call, scoped to your function. We'll show only what's relevant to your day-to-day.</p>
          <Link href="/contact?topic=role-demo">
            <Button size="lg" className="rounded-full" data-testid="teams-demo-cta">Book a role-specific demo<ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
