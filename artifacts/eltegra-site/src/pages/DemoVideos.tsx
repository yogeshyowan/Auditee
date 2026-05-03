import { Link } from "wouter";
import { Play, ArrowRight, Video } from "lucide-react";
import { SEO, breadcrumbsLd } from "@/components/SEO";
import { Navigation, SiteFooter } from "@/components/site/Chrome";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShareButtons } from "@/components/ShareButtons";

const MODULES: { slug: string; title: string; project: string; desc: string; minutes: number }[] = [
  { slug: "dashboard", title: "Dashboard overview", project: "Helios — Patient Onboarding",
    desc: "Workspace health, project rollups and the daily summary email — narrated on the live Helios demo.", minutes: 4 },
  { slug: "sources", title: "Project Sources", project: "Orion — Cardiac Monitor Firmware",
    desc: "Wire GitHub, Jira, IBM DOORS and 12 clinical PDFs into the Orion firmware project — 184 reqs ingested.", minutes: 5 },
  { slug: "interview", title: "Smart Interview", project: "Aesop — Clinical Trial eCRF",
    desc: "Live AI interview with the Aesop PM, classified to ICH-GCP E6(R3) and 21 CFR Part 11.", minutes: 6 },
  { slug: "requirements", title: "AI Requirements", project: "Apollo — EV Battery Management System",
    desc: "Generate 192 Apollo BMS reqs, tagged to ISO 26262, ISO 21434, UN R155 and IEC 61508.", minutes: 5 },
  { slug: "gaps", title: "Gap Detection", project: "Ares — ADAS Vision Stack",
    desc: "Scan Ares vision code against ISO 26262 + SOTIF — every gap auto-converts to a CAPA.", minutes: 4 },
  { slug: "traceability", title: "Traceability Graph", project: "Titan — Industrial PLC Control System",
    desc: "Walk the IEC 61508 SIL-3 trace chain on Titan PLC, requirement to test to evidence.", minutes: 5 },
  { slug: "compliance", title: "Compliance", project: "Nexus — Hospital EHR Modernisation",
    desc: "HIPAA, HITRUST, ISO 27001, SOC 2 and FHIR R4 — live coverage on Nexus, audit-ready.", minutes: 6 },
  { slug: "capa", title: "CAPA Actions", project: "Vega — Claims Intelligence",
    desc: "Field complaint → root cause → verified closure on the Vega claims model.", minutes: 4 },
  { slug: "defects", title: "Defects", project: "Sterling — Core Banking Platform",
    desc: "Sterling defects pulled from Jira / Bugzilla / ServiceNow, auto-linked to req and test.", minutes: 4 },
  { slug: "tests", title: "Test Cases", project: "Bastion — Cloud Security Posture",
    desc: "AI-generated tests for every CIS / SOC 2 / ISO 27001 Bastion control. Push to TestRail in one click.", minutes: 5 },
  { slug: "reports", title: "AI Reports & Documents", project: "Atlas — Trade Settlement Engine",
    desc: "Generate Atlas’ 247-page SEC audit packet in 4 minutes — every claim sourced from live evidence.", minutes: 5 },
  { slug: "workflows", title: "Workflows", project: "Aegis — Identity & Access Platform",
    desc: "Automate the Aegis SOC 2 release gate — nothing ships until every check passes.", minutes: 4 },
  { slug: "analytics", title: "Analytics", project: "Cipher — API Gateway & Zero Trust",
    desc: "Live KPI tiles and 7-week trend charts for Cipher — export the board pack as PDF.", minutes: 4 },
  { slug: "recurring-audits", title: "Recurring Audits", project: "Nova — Crypto Exchange Compliance",
    desc: "Daily VASP checks, weekly travel-rule reviews, monthly SOC 2 on the Nova demo project.", minutes: 4 },
];

const TUTORIAL_BASE = "/auditee-tutorial/";

export default function DemoVideos() {
  const pageTitle = "Demo Videos — Watch Auditee in Action | Auditee";
  const pageDesc = "14 narrated tutorials walking real demo projects — Helios, Orion, Apollo, Ares, Atlas, Nova and more — across Sources, Smart Interview, Requirements, Gaps, Traceability, Compliance, CAPA, Defects, Tests, Reports, Workflows, Analytics and Recurring Audits.";
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title={pageTitle}
        description={pageDesc}
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
            14 narrated tutorials — under 5 minutes each — walking through real demo projects from healthcare, automotive,
            banking, fintech and security. Watch a single feature or run the whole tour end-to-end.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            <Button asChild size="lg" className="gap-2" data-testid="demo-cta-full-tour">
              <a href={TUTORIAL_BASE} target="_blank" rel="noopener noreferrer">
                Play full tour <Play className="w-4 h-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/contact">Book a live walkthrough</Link>
            </Button>
          </div>
          <div className="mt-6 flex justify-center">
            <ShareButtons url="/demo-videos" title={pageTitle} description={pageDesc} />
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-6 mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {MODULES.map((m) => (
            <Card key={m.slug} className="p-6 group hover:shadow-md transition-shadow flex flex-col">
              <div className="aspect-video bg-gradient-to-br from-primary/10 to-emerald-500/10 rounded-lg mb-4 flex items-center justify-center">
                <Play className="w-10 h-10 text-primary opacity-70 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">{m.project}</div>
              <h3 className="font-display text-lg font-bold text-slate-950">{m.title}</h3>
              <p className="mt-2 text-sm text-slate-600 flex-1">{m.desc}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span>{m.minutes} min</span>
                <Link
                  href={`/demo-videos/${m.slug}`}
                  className="inline-flex items-center gap-1 text-primary font-medium hover:gap-2 transition-all"
                  data-testid={`demo-link-${m.slug}`}
                >
                  Watch <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
