import { Link } from "wouter";
import { Play, ArrowRight, Video } from "lucide-react";
import { SEO, breadcrumbsLd } from "@/components/SEO";
import { Navigation, SiteFooter } from "@/components/site/Chrome";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const MODULES: { slug: string; title: string; desc: string; minutes: number }[] = [
  { slug: "dashboard", title: "Dashboard overview", desc: "Workspace health, project rollups, recent activity and the Auditee operating model.", minutes: 4 },
  { slug: "sources", title: "Project Sources", desc: "Connect GitHub, GitLab, Azure DevOps, Jira, DOORS, Jama, Polarion or upload BRDs.", minutes: 5 },
  { slug: "interview", title: "Smart Interview", desc: "Turn a one-paragraph idea into a complete classified requirements set.", minutes: 6 },
  { slug: "requirements", title: "AI Requirements", desc: "Generate, classify, prioritize and trace requirements end-to-end.", minutes: 5 },
  { slug: "gaps", title: "Gap Detection", desc: "AI surfaces missing, duplicate, conflicting and weak requirements.", minutes: 4 },
  { slug: "traceability", title: "Traceability Graph", desc: "Bidirectional links from requirement to code, test and audit control.", minutes: 5 },
  { slug: "compliance", title: "Compliance", desc: "23+ frameworks with per-control coverage and live evidence.", minutes: 6 },
  { slug: "capa", title: "CAPA Actions", desc: "Corrective and Preventive Action workflow from finding to closure.", minutes: 4 },
  { slug: "defects", title: "Defects", desc: "Defect-to-requirement loop for root-cause analysis without archaeology.", minutes: 4 },
  { slug: "tests", title: "Test Cases", desc: "AI-generated structured tests for every requirement, exportable to JUnit / pytest / Postman.", minutes: 5 },
  { slug: "reports", title: "AI Reports & Documents", desc: "BRD / PRD / FRD generation in DOCX, PDF, HTML, Markdown.", minutes: 5 },
  { slug: "workflows", title: "Workflows", desc: "PDLC stage-gates, approvals and lifecycle automation.", minutes: 4 },
  { slug: "analytics", title: "Analytics", desc: "Velocity, defect leakage, quality scores and ROI dashboards.", minutes: 4 },
  { slug: "recurring-audits", title: "Recurring Audits", desc: "Daily / weekly / monthly audit jobs that catch drift before the auditor.", minutes: 4 },
];

const TUTORIAL_BASE = "/auditee-tutorial/";

export default function DemoVideos() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Demo Videos — Watch Auditee in Action | Auditee"
        description="14 narrated module tutorials covering Sources, Smart Interview, Requirements, Gap Detection, Traceability, Compliance, CAPA, Defects, Tests, Reports, Workflows, Analytics and Recurring Audits."
        path="/demo-videos"
        keywords={["Auditee demo", "AI requirements demo", "compliance platform tutorial"]}
        jsonLd={breadcrumbsLd([{ name: "Home", path: "/" }, { name: "Demo Videos", path: "/demo-videos" }])}
      />
      <Navigation />
      <main className="pt-28 pb-24">
        <header className="max-w-3xl mx-auto px-6 text-center">
          <Video className="w-10 h-10 mx-auto text-primary mb-4" />
          <h1 className="font-display text-4xl md:text-5xl font-bold text-slate-950 tracking-tight">
            Demo videos
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            14 narrated module tutorials — under 5 minutes each. Watch a single feature or run the whole tour end-to-end.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            <Button asChild size="lg" className="gap-2" data-testid="demo-cta-full-tour">
              <a href={TUTORIAL_BASE} target="_blank" rel="noopener">
                Play full tour <Play className="w-4 h-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/contact">Book a live walkthrough</Link>
            </Button>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-6 mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {MODULES.map((m) => (
            <Card key={m.slug} className="p-6 group hover:shadow-md transition-shadow flex flex-col">
              <div className="aspect-video bg-gradient-to-br from-primary/10 to-emerald-500/10 rounded-lg mb-4 flex items-center justify-center">
                <Play className="w-10 h-10 text-primary opacity-70 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-950">{m.title}</h3>
              <p className="mt-2 text-sm text-slate-600 flex-1">{m.desc}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span>{m.minutes} min</span>
                <a
                  href={`${TUTORIAL_BASE}?module=${m.slug}`}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1 text-primary font-medium hover:gap-2 transition-all"
                  data-testid={`demo-link-${m.slug}`}
                >
                  Watch <ArrowRight className="h-3 w-3" />
                </a>
              </div>
            </Card>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
