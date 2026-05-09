import { Link } from "wouter";
import { Play, ArrowRight, Video, Shield } from "lucide-react";
import { SEO, breadcrumbsLd } from "@/components/SEO";
import { Navigation, SiteFooter } from "@/components/site/Chrome";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShareButtons } from "@/components/ShareButtons";
import { ModuleThumbnail } from "@/components/ModuleThumbnail";

type ModuleSlug =
  | "dashboard" | "sources" | "interview" | "requirements" | "gaps"
  | "traceability" | "compliance" | "capa" | "defects" | "tests"
  | "reports" | "workflows" | "analytics" | "recurring-audits";

type ExtendedDemo = {
  slug: string;
  project: string;
  domain: string;
  blurb: string;
  standards: string[];
  tools: string[];
};

const EXTENDED_DEMOS: ExtendedDemo[] = [
  {
    slug: "hermes",
    project: "Hermes — Aircraft Flight Management System",
    domain: "Avionics",
    blurb:
      "Airborne software with DAL-A traceability — every requirement linked through low-level reqs to source code, with full ARP4754A allocation.",
    standards: ["DO-178C DAL-A", "DO-254", "ARP4754A", "IEEE 1012", "IEEE 828"],
    tools: ["IBM DOORS Next", "Polarion", "GitLab", "LDRA", "VectorCAST"],
  },
  {
    slug: "pioneer",
    project: "Pioneer — High-Speed Rail Signalling",
    domain: "Rail",
    blurb:
      "On-board signalling SIL-4 lifecycle — RAMS, software, signalling electronics and rolling-stock software in a single trace graph.",
    standards: ["EN 50128 SIL-4", "EN 50126 RAMS", "EN 50129", "EN 50657", "IEC 61508"],
    tools: ["IBM DOORS", "Jama", "GitHub Enterprise", "Polyspace", "Reactis"],
  },
  {
    slug: "vulcan",
    project: "Vulcan — Robotic Welding Cell",
    domain: "Industrial Robotics",
    blurb:
      "Collaborative robotic cell — machine safety, robot safety, electrical equipment and PLC code unified under one CAPA workflow.",
    standards: ["ISO 10218-1", "ISO 13849-1 PLd", "IEC 60204-1", "IEC 61131-3", "IEC 62443"],
    tools: ["Codesys", "GitHub", "Jira", "TestRail", "ServiceNow"],
  },
  {
    slug: "ironclad",
    project: "Ironclad — Power Grid SCADA",
    domain: "Critical Infrastructure",
    blurb:
      "Bulk-electric SCADA & pipeline control — NERC CIP audit packets, ISA-95 zone & conduit model, and IEC 61511 SIS lifecycle in one place.",
    standards: ["NERC CIP", "IEC 62443", "IEC 61511", "API 1164", "ISA-95 / IEC 62264"],
    tools: ["OSIsoft PI", "Splunk", "Azure DevOps", "ServiceNow", "Tenable OT"],
  },
  {
    slug: "lyra",
    project: "Lyra — Generative AI Underwriting",
    domain: "Responsible AI",
    blurb:
      "High-risk AI system under the EU AI Act — model cards, risk register, bias evaluation and post-market monitoring evidence.",
    standards: ["EU AI Act (high-risk)", "ISO/IEC 42001", "NIST AI RMF", "ISO 31000", "GDPR"],
    tools: ["MLflow", "Weights & Biases", "Hugging Face", "GitHub", "Snowflake"],
  },
];

const MODULES: { slug: string; title: string; project: string; desc: string; minutes: number }[] = [
  { slug: "dashboard", title: "Dashboard overview", project: "Helios — Patient Onboarding",
    desc: "Workspace health, project rollups and the daily summary email — narrated on the live Helios demo.", minutes: 4 },
  { slug: "sources", title: "Project Sources", project: "Orion — Cardiac Monitor Firmware",
    desc: "Wire GitHub, Jira, IBM DOORS and 12 clinical PDFs into the Orion firmware project — 184 reqs ingested.", minutes: 5 },
  { slug: "interview", title: "Smart Interview", project: "Aesop — Clinical Trial eCRF",
    desc: "Live AI interview with the Aesop PM, classified to ICH-GCP E6(R3) and 21 CFR Part 11.", minutes: 6 },
  { slug: "requirements", title: "AI Requirements", project: "Apollo — EV Battery Management System",
    desc: "Generate 192 Apollo BMS reqs, tagged to ISO 26262, ISO 21434, UN R155 and IEC 61508.", minutes: 5 },
  { slug: "gaps", title: "Requirements Gap Detection", project: "Ares — ADAS Vision Stack",
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
  { slug: "legacy", title: "Legacy Modernisation", project: "Mercury — COBOL Core Banking Modernisation",
    desc: "1.2 million lines of COBOL, JCL, CICS and DB2 — extracted into 184 modern requirements with a risk-scored dependency heatmap.", minutes: 5 },
  { slug: "pdlc", title: "PDLC Pipeline", project: "Phoenix — Surgical Robotics Platform",
    desc: "Phoenix v2.4 walked through the 6-stage product lifecycle — Ideation → Governance — every IEC 62304 + FDA QSR gate signed and audit-trailed.", minutes: 5 },
  { slug: "ask", title: "Ask Auditee", project: "Sirius — 5G Core Network",
    desc: "Conversational AI grounded in the live project graph — every answer cited to real requirements, code, tests and CAPAs. Zero hallucinations.", minutes: 4 },
];

const TUTORIAL_BASE = "/auditee-tutorial/";

export default function DemoVideos() {
  const pageTitle = "Demo Videos — Watch Auditee in Action | Auditee";
  const pageDesc = `${MODULES.length} narrated tutorials walking real demo projects — Helios, Orion, Apollo, Ares, Atlas, Nova and more — across Sources, Smart Interview, Requirements, Gaps, Traceability, Compliance, CAPA, Defects, Tests, Reports, Workflows, Analytics, Recurring Audits, Legacy Modernisation, PDLC and Ask Auditee.`;
  const SITE = "https://auditee.site";
  const itemListLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Auditee — Demo Videos",
    description: pageDesc,
    numberOfItems: MODULES.length,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    itemListElement: MODULES.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE}/demo-videos/${m.slug}`,
      name: `${m.title} — ${m.project}`,
    })),
  };
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title={pageTitle}
        description={pageDesc}
        path="/demo-videos"
        keywords={["Auditee demo", "AI requirements demo", "compliance platform tutorial"]}
        jsonLd={[
          breadcrumbsLd([{ name: "Home", path: "/" }, { name: "Demo Videos", path: "/demo-videos" }]),
          itemListLd,
        ]}
      />
      <Navigation />
      <main className="pt-28 pb-24">
        <header className="max-w-3xl mx-auto px-6 text-center">
          <Video className="w-10 h-10 mx-auto text-primary mb-4" />
          <h1 className="font-display text-4xl md:text-5xl font-bold text-slate-950 tracking-tight">
            Demo videos
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            {MODULES.length} narrated tutorials — under 5 minutes each — walking through real demo projects from healthcare, automotive,
            banking, fintech and security. Watch a single feature or run the whole tour end-to-end.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            <Button asChild size="lg" className="gap-2" data-testid="demo-cta-aspice">
              <a href={`${TUTORIAL_BASE}?aspice=1`} target="_blank" rel="noopener noreferrer">
                Watch ASPICE walkthrough (~7 min) <Play className="w-4 h-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2" data-testid="demo-cta-full-tour">
              <a href={`${TUTORIAL_BASE}?full=1`} target="_blank" rel="noopener noreferrer">
                Play full tour <Play className="w-4 h-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2" data-testid="demo-cta-shorts">
              <a href={`${TUTORIAL_BASE}?shorts=`} target="_blank" rel="noopener noreferrer">
                📱 Watch as Shorts
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/contact">Book a live walkthrough</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            New: end-to-end <span className="font-semibold text-primary">Automotive SPICE 4.0</span> walkthrough on the Apollo EV BMS project — every module narrated step by step, from brief to signed audit packet.
          </p>
          <div className="mt-6 flex justify-center">
            <ShareButtons url="/demo-videos" title={pageTitle} description={pageDesc} />
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-6 mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {MODULES.map((m) => {
            const cardUrl = `/demo-videos/${m.slug}`;
            const cardTitle = `${m.title} — ${m.project} | Auditee tutorial`;
            return (
              <Card
                key={m.slug}
                className="p-0 group hover:shadow-lg transition-shadow flex flex-col overflow-hidden"
                data-testid={`demo-card-${m.slug}`}
              >
                <Link
                  href={cardUrl}
                  className="block relative"
                  data-testid={`demo-thumb-${m.slug}`}
                  aria-label={`Watch ${m.title}`}
                >
                  <ModuleThumbnail
                    slug={m.slug as ModuleSlug}
                    project={m.project}
                    className="w-full aspect-video block"
                    testId={`thumb-svg-${m.slug}`}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                    <div className="w-14 h-14 rounded-full bg-white/90 group-hover:bg-white shadow-lg flex items-center justify-center transition-transform group-hover:scale-110">
                      <Play className="w-6 h-6 text-primary translate-x-0.5" fill="currentColor" />
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur px-2 py-0.5 text-[10px] font-semibold text-white">
                    {m.minutes} min
                  </div>
                </Link>
                <div className="p-5 flex flex-col flex-1">
                  <div className="text-[10px] uppercase tracking-widest text-primary font-semibold mb-1">{m.project}</div>
                  <h3 className="font-display text-lg font-bold text-slate-950">{m.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 flex-1">{m.desc}</p>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <Link
                      href={cardUrl}
                      className="inline-flex items-center gap-1 text-sm text-primary font-semibold hover:gap-2 transition-all"
                      data-testid={`demo-link-${m.slug}`}
                    >
                      Watch <ArrowRight className="h-3 w-3" />
                    </Link>
                    <ShareButtons
                      url={cardUrl}
                      title={cardTitle}
                      description={m.desc}
                      compact
                      data-testid={`card-share-${m.slug}`}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <section className="max-w-6xl mx-auto px-6 mt-24" data-testid="extended-demos">
          <header className="text-center max-w-3xl mx-auto">
            <Shield className="w-8 h-8 mx-auto text-emerald-600 mb-3" />
            <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-950 tracking-tight">
              Other compliance plays Auditee covers
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Beyond the 14 anchor demos, Auditee ships seeded vignette projects across avionics, rail,
              industrial robotics, critical infrastructure and high-risk AI — every framework in our
              control library is exercised end-to-end.
            </p>
          </header>

          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {EXTENDED_DEMOS.map((d) => (
              <Card
                key={d.slug}
                className="p-6 flex flex-col border-slate-200"
                data-testid={`extended-demo-${d.slug}`}
              >
                <div className="text-xs uppercase tracking-widest text-emerald-600 font-semibold mb-1">
                  {d.domain}
                </div>
                <h3 className="font-display text-lg font-bold text-slate-950">{d.project}</h3>
                <p className="mt-2 text-sm text-slate-600 flex-1">{d.blurb}</p>
                <div className="mt-4">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5">
                    Standards
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {d.standards.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center rounded-full bg-primary/10 text-primary text-[11px] font-medium px-2.5 py-0.5"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5">
                    Tools
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {d.tools.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium px-2.5 py-0.5"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <p className="mt-10 text-center text-sm text-slate-500 max-w-2xl mx-auto">
            Want a walkthrough on one of these? <Link href="/contact" className="text-primary font-medium hover:underline">Book a live session</Link>{" "}
            and we'll demo on the project closest to your industry.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
