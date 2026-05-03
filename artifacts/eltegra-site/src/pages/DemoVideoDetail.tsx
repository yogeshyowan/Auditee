import { Link, useParams } from "wouter";
import { ArrowLeft, ArrowRight, Play, CheckCircle2 } from "lucide-react";
import { SEO, breadcrumbsLd } from "@/components/SEO";
import { Navigation, SiteFooter } from "@/components/site/Chrome";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShareButtons } from "@/components/ShareButtons";
import NotFound from "@/pages/not-found";

type ModuleEntry = {
  slug: string;
  title: string;
  project: string;
  domain: string;
  desc: string;
  steps: { title: string; body: string }[];
  minutes: number;
  standards: string[];
  tools: string[];
};

/**
 * Mirrors the per-module storylines defined in
 * `artifacts/auditee-tutorial/src/lib/demoUseCases.ts`. Kept as plain data here
 * because the two artifacts are deployed independently.
 */
const MODULES: ModuleEntry[] = [
  {
    slug: "dashboard", title: "Dashboard overview",
    project: "Helios — Patient Onboarding", domain: "Healthcare",
    desc: "Workspace health, project rollups, and the Auditee operating model — walked through on the live Helios demo project.",
    minutes: 4,
    standards: ["HIPAA", "DPDP", "SOC 2 Type II", "ISO 27001", "GDPR", "NIST CSF 2.0"],
    tools: ["Email digest", "Slack", "Jira", "Snowflake", "Looker"],
    steps: [
      { title: "Open the Helios project", body: "Pick Helios — Patient Onboarding from the project switcher." },
      { title: "Read the rings", body: "HIPAA, DPDP and SOC 2 are recomputed on every change — green means evidence is fresh." },
      { title: "Drill into a tile", body: "Click any gap or CAPA card to jump straight to its page with the right project pre-selected." },
      { title: "Subscribe to the daily summary", body: "Toggle the summary email so the team learns what changed overnight without logging in." },
    ],
  },
  {
    slug: "sources", title: "Project Sources",
    project: "Orion — Cardiac Monitor Firmware", domain: "Medical Devices",
    desc: "Connect GitHub, Jira, IBM DOORS and 12 clinical PDFs to the Orion firmware project — 184 requirements ingested in seconds.",
    minutes: 5,
    standards: ["IEC 62304", "ISO 14971", "ISO 13485", "IEC 60601", "IEC 62366", "FDA 21 CFR 820", "MDR 2017/745", "ISO/IEC/IEEE 42010"],
    tools: ["IBM DOORS", "GitHub", "Jira", "Azure DevOps", "ReqIF", "PDF bulk upload"],
    steps: [
      { title: "Open Project Sources for Orion", body: "In the Orion — Cardiac Monitor Firmware project, go to Project Sources." },
      { title: "Connect each tool", body: "Add IBM DOORS, GitHub, Jira, Azure DevOps, ReqIF and bulk-upload the 12 clinical PDFs." },
      { title: "Watch the ingest", body: "Auditee parses requirements, indexes code, cross-references IEC 62304 and ISO 14971." },
      { title: "Confirm the graph", body: "6 sources, 184 requirements, 1,840 firmware files — ready for AI requirements generation." },
    ],
  },
  {
    slug: "interview", title: "Smart Interview",
    project: "Aesop — Clinical Trial eCRF", domain: "Clinical Trials",
    desc: "Auditee interviews the Aesop clinical PM live, classifying each answer to ICH-GCP E6(R3) and 21 CFR Part 11.",
    minutes: 6,
    standards: ["ICH-GCP E6(R3)", "FDA 21 CFR Part 11", "ISO 14155", "GDPR", "HIPAA", "IEEE 1063"],
    tools: ["Conversational AI", "Microsoft Word", "Google Docs", "Confluence", "Smart Sheet"],
    steps: [
      { title: "Open Smart Interview on Aesop", body: "Inside Aesop — Clinical Trial eCRF, click Smart Interview." },
      { title: "Answer the AI", body: "Auditee asks 12 standards-aware questions about subject enrolment, e-signatures and audit trails." },
      { title: "Watch reqs appear", body: "Each answer is classified BRS / PRD / FRD with the original chat turn linked as provenance." },
      { title: "Promote to baseline", body: "Approve the 18 generated requirements — Aesop is auto-classified to ICH-GCP and 21 CFR Part 11." },
    ],
  },
  {
    slug: "requirements", title: "AI Requirements",
    project: "Apollo — EV Battery Management System", domain: "Automotive",
    desc: "Generate 192 Apollo requirements with ISO 26262, ISO 21434, UN R155 and IEC 61508 mapping in one click.",
    minutes: 5,
    standards: ["ISO 26262 ASIL-C", "ISO/SAE 21434", "UN R155", "IEC 61508", "Automotive SPICE 4.0", "ASPICE Cyber 2.0", "CMMI v3.0"],
    tools: ["IBM DOORS Next", "Polarion", "ReqIF", "Jama", "Azure DevOps"],
    steps: [
      { title: "Generate from sources", body: "In Apollo, click Generate — AI drafts BRS / PRD / FRD from connected sources." },
      { title: "Tag the standards", body: "Auditee maps each to ISO 26262 ASIL-C, ISO 21434 TARA, UN R155 and IEC 61508." },
      { title: "Baseline & version", body: "Lock the v1 baseline. Every later edit creates a tracked diff with a change reason." },
      { title: "Export", body: "Push to IBM DOORS Next or download a clean ReqIF for the OEM regulatory team." },
    ],
  },
  {
    slug: "gaps", title: "Gap Detection",
    project: "Ares — ADAS Vision Stack", domain: "Automotive Safety",
    desc: "AI scans Ares vision code against ISO 26262 + ISO 21448 SOTIF — surfaces missing tests, untraced files and unmitigated hazards.",
    minutes: 4,
    standards: ["ISO 26262 ASIL-D", "ISO 21448 SOTIF", "ISO/SAE 21434", "UN R157", "ASPICE Cyber 2.0", "ISO/IEC/IEEE 29119", "IEEE 1012 V&V"],
    tools: ["GitHub", "Vector CANoe", "TestRail", "Polyspace", "Coverity"],
    steps: [
      { title: "Run gap scan on Ares", body: "Open Gap Detection inside Ares — ADAS Vision Stack and click Scan." },
      { title: "Review findings", body: "AI lists missing tests, untraced files, unmitigated hazards — sorted critical first." },
      { title: "Convert to CAPA", body: "One-click open a CAPA per gap with owner, due date and standard control linked." },
      { title: "Verify clean run", body: "Re-scan after fixes — gap count drops to zero, ready for homologation review." },
    ],
  },
  {
    slug: "traceability", title: "Traceability Graph",
    project: "Titan — Industrial PLC Control System", domain: "Industrial Safety",
    desc: "Walk the IEC 61508 SIL-3 chain on Titan PLC — PRD-014 → ladder logic → 3 unit tests → 2 integration tests → zero open defects.",
    minutes: 5,
    standards: ["IEC 61508 SIL-3", "IEC 61511", "IEC 61131-3", "IEC 60204-1", "ISO 13849-1", "IEC 62443", "ISA-95 / IEC 62264"],
    tools: ["Codesys", "TIA Portal", "Git", "Jira", "Azure Test Plans"],
    steps: [
      { title: "Open the Titan trace graph", body: "Inside Titan, open Traceability. The graph renders the live req-code-test-CAPA web." },
      { title: "Click PRD-014", body: "Selecting the emergency-stop requirement highlights every linked node end-to-end." },
      { title: "Inspect coverage", body: "3 unit tests pass, 2 integration tests pass, 0 open defects, 1 closed CAPA — full evidence." },
      { title: "Export for the auditor", body: "Download the trace matrix as XLSX or PDF for the IEC 61508 SIL-3 dossier." },
    ],
  },
  {
    slug: "compliance", title: "Compliance",
    project: "Nexus — Hospital EHR Modernisation", domain: "Healthcare IT",
    desc: "Live framework rings on Nexus — HIPAA, HITRUST, ISO 27001, SOC 2 and FHIR R4 with click-through evidence.",
    minutes: 6,
    standards: ["HIPAA", "HITRUST CSF", "ISO/IEC 27001:2022", "ISO/IEC 27002:2022", "SOC 2 Type II", "FHIR R4", "GDPR", "NIST CSF 2.0"],
    tools: ["GitHub", "AWS Config", "Datadog", "Snowflake", "Okta"],
    steps: [
      { title: "Open Compliance for Nexus", body: "In Nexus — Hospital EHR Modernisation, open the Compliance page." },
      { title: "Read the framework rings", body: "Each ring is a live coverage score — green is evidence-ready, amber means gaps remain." },
      { title: "Inspect a finding", body: "Click HIPAA §164.312(b) — Auditee shows the missing audit-log control with code refs." },
      { title: "Open a CAPA", body: "One click converts the finding into CAPA-022, owner Ananya, due in 14 days, fully linked." },
    ],
  },
  {
    slug: "capa", title: "CAPA Actions",
    project: "Vega — Claims Intelligence", domain: "Insurance",
    desc: "Field complaint → root cause → owner → due date → verified closure on the Vega claims model.",
    minutes: 4,
    standards: ["IRDAI", "NAIC Model 668", "EU AI Act (limited risk)", "ISO 31000", "ISO 9001", "ISO/IEC 42001"],
    tools: ["Jira", "ServiceNow", "Salesforce", "MLflow", "Email triage"],
    steps: [
      { title: "Open CAPA on Vega", body: "Inside Vega — Claims Intelligence, click the CAPA page." },
      { title: "Triage the auto-opened CAPA", body: "CAPA-007 was created from a field complaint — owner, root cause and due date pre-filled." },
      { title: "Move through the lifecycle", body: "Open → In Progress → In Review → Verified Closed, every transition logged with evidence." },
      { title: "Close with proof", body: "Attach the retrained model card and the regression test run. Vega CAPA is audit-clean." },
    ],
  },
  {
    slug: "defects", title: "Defects",
    project: "Sterling — Core Banking Platform", domain: "Banking",
    desc: "Sterling defects pulled from Jira, Bugzilla and ServiceNow — auto-linked to requirement, test and CAPA.",
    minutes: 4,
    standards: ["PCI DSS v4.0", "DORA", "NIS2", "RBI IT Framework", "ISO/IEC 27001:2022", "SOC 2 Type II", "NIST CSF 2.0"],
    tools: ["Jira", "Bugzilla", "ServiceNow", "GitHub", "Splunk"],
    steps: [
      { title: "Open Defects on Sterling", body: "Inside Sterling — Core Banking Platform, open the Defects board." },
      { title: "Connect Jira / Bugzilla / ServiceNow", body: "Auditee pulls every defect, syncing every 5 minutes — no manual import." },
      { title: "Inspect the link", body: "Each defect auto-links to its requirement and the test that should have caught it." },
      { title: "Watch the trend", body: "Defect-leakage chart shows monthly churn — Sterling drops from 18 to 7 in two sprints." },
    ],
  },
  {
    slug: "tests", title: "Test Cases",
    project: "Bastion — Cloud Security Posture", domain: "Cloud Security",
    desc: "AI-generated tests for every CIS / SOC 2 / ISO 27001 control on Bastion — exportable to TestRail, Xray, qTest.",
    minutes: 5,
    standards: ["CIS Benchmarks", "SOC 2 Type II", "ISO/IEC 27001:2022", "ISO/IEC 27002:2022", "NIST CSF 2.0", "NIS2", "ISO/IEC/IEEE 29119", "IEEE 730"],
    tools: ["TestRail", "Xray", "qTest", "Azure Test Plans", "GitHub Actions"],
    steps: [
      { title: "Open Tests for Bastion", body: "Inside Bastion — Cloud Security Posture, click Test Cases." },
      { title: "Generate from requirements", body: "AI drafts a structured test for every requirement, tagged to CIS / SOC 2 / ISO 27001." },
      { title: "Review and approve", body: "Marcus accepts 312 cases in batch. Failed cases stay flagged with a re-run button." },
      { title: "Push to TestRail", body: "One click syncs the suite to TestRail with full requirement traceability." },
    ],
  },
  {
    slug: "reports", title: "AI Reports & Documents",
    project: "Atlas — Trade Settlement Engine", domain: "Capital Markets",
    desc: "Generate the Atlas SEC audit packet — 247 pages in 4 minutes, every claim sourced from live evidence.",
    minutes: 5,
    standards: ["CFTC Reg AT", "MiFID II RTS 6", "SOC 2 Type II", "DORA", "ISO 31000", "IEEE 1016 SDD", "IEEE 828 CM"],
    tools: ["Microsoft Word", "Adobe Sign", "DocuSign", "SharePoint", "Confluence"],
    steps: [
      { title: "Open Reports for Atlas", body: "Inside Atlas — Trade Settlement Engine, click Reports." },
      { title: "Pick the document", body: "Choose CFTC Reg AT, MiFID II RTS 6 or SOC 2 audit packet from the library." },
      { title: "Generate", body: "Auditee writes 247 pages in 4 minutes — every claim cited to a live requirement, test or CAPA." },
      { title: "Sign & ship", body: "Export DOCX + PDF, route through e-signature, hand to the SEC reviewer with confidence." },
    ],
  },
  {
    slug: "workflows", title: "Workflows",
    project: "Aegis — Identity & Access Platform", domain: "Identity Security",
    desc: "Automate the Aegis SOC 2 release gate — PR merged → reqs linked → tests must pass → security signs → release.",
    minutes: 4,
    standards: ["SOC 2 Type II", "ISO/IEC 27001:2022", "NIST CSF 2.0", "IEC 62443", "CMMI v3.0", "IEEE 730 SQA"],
    tools: ["GitHub Actions", "GitLab CI", "Jenkins", "Argo CD", "Slack"],
    steps: [
      { title: "Open Workflows on Aegis", body: "In Aegis — Identity & Access Platform, open the Workflows page." },
      { title: "Pick a template", body: "Use the SOC 2 release-gate template or build your own pipeline visually." },
      { title: "Wire the gates", body: "Each stage has automatic checks (test coverage, scan results) and manual approvals." },
      { title: "Watch a release", body: "PR-481 advances through 4 stages — Auditee blocks at the failed gate until coverage hits 85%." },
    ],
  },
  {
    slug: "analytics", title: "Analytics",
    project: "Cipher — API Gateway & Zero Trust", domain: "Network Security",
    desc: "Live KPI tiles, sparkline trends and sprint-over-sprint deltas for Cipher — exportable to PDF for the next board review.",
    minutes: 4,
    standards: ["NIST CSF 2.0", "ISO/IEC 27001:2022", "IEC 62443", "SOC 2 Type II", "ISO 31000", "PCI DSS v4.0"],
    tools: ["Datadog", "Grafana", "PagerDuty", "Snowflake", "PDF export"],
    steps: [
      { title: "Open Analytics for Cipher", body: "Inside Cipher — API Gateway & Zero Trust, click Analytics." },
      { title: "Read the KPI tiles", body: "Audit Readiness, Test Coverage, CAPA Closure, Traceability — each with sparkline trend." },
      { title: "Compare sprints", body: "Toggle the 7-week trend chart — Cipher readiness went from 62% to 84% in two months." },
      { title: "Export the board pack", body: "One click renders a PDF with every KPI tile, ready for the Cipher exec review." },
    ],
  },
  {
    slug: "recurring-audits", title: "Recurring Audits",
    project: "Nova — Crypto Exchange Compliance", domain: "FinTech",
    desc: "Daily VASP checks, weekly travel-rule reviews, monthly SOC 2 — Nova findings become CAPAs the moment they appear.",
    minutes: 4,
    standards: ["FATF VASP", "Travel Rule", "SOC 2 Type II", "PCI DSS v4.0", "DORA", "MiCA", "ISO/IEC 27001:2022"],
    tools: ["Chainalysis", "Elliptic", "Jira", "PagerDuty", "Snowflake"],
    steps: [
      { title: "Open Recurring Audits on Nova", body: "Inside Nova — Crypto Exchange Compliance, click Recurring Audits." },
      { title: "Schedule the cadence", body: "Daily VASP screening, weekly travel-rule review, monthly SOC 2 — pick the rhythm." },
      { title: "Auto-CAPA on findings", body: "Every finding opens a CAPA with the right owner, due date and standard control." },
      { title: "Track the streak", body: "Nova has run 9 consecutive monthly audits with zero overdue CAPAs." },
    ],
  },
];

const TUTORIAL_BASE = "/auditee-tutorial/";

export default function DemoVideoDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const idx = MODULES.findIndex((m) => m.slug === slug);
  if (idx === -1) return <NotFound />;

  const module = MODULES[idx];
  const prev = MODULES[(idx - 1 + MODULES.length) % MODULES.length];
  const next = MODULES[(idx + 1) % MODULES.length];

  const path = `/demo-videos/${module.slug}`;
  const seoTitle = `${module.title} — ${module.project} demo | Auditee`;
  const description = `${module.desc} Step-by-step ${module.minutes}-minute video tutorial using the ${module.project} demo project.`;

  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title={seoTitle}
        description={description}
        path={path}
        keywords={[module.title, module.project, "Auditee tutorial", `${module.domain} compliance`]}
        jsonLd={breadcrumbsLd([
          { name: "Home", path: "/" },
          { name: "Demo Videos", path: "/demo-videos" },
          { name: module.title, path },
        ])}
      />
      <Navigation />
      <main className="pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <Link
            href="/demo-videos"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
            data-testid="link-back-to-index"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All demo videos
          </Link>

          <header className="mt-6">
            <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-2">
              {module.domain} · {module.project}
            </div>
            <h1
              className="font-display text-3xl md:text-4xl font-bold text-slate-950 tracking-tight"
              data-testid="detail-title"
            >
              {module.title}
            </h1>
            <p className="mt-3 text-lg text-slate-600 max-w-3xl">{module.desc}</p>
          </header>

          <div className="mt-6">
            <ShareButtons url={path} title={seoTitle} description={description} data-testid="share-row-top" />
          </div>

          <Card className="mt-6 overflow-hidden border-slate-200">
            <div className="aspect-video w-full bg-slate-950">
              <iframe
                src={`${TUTORIAL_BASE}?module=${module.slug}&embed=1`}
                title={`${module.title} tutorial`}
                className="w-full h-full"
                allow="autoplay; fullscreen"
                data-testid="tutorial-iframe"
              />
            </div>
          </Card>

          <section className="mt-10">
            <h2 className="font-display text-2xl font-bold text-slate-950 mb-4">
              Step by step on the {module.project.split(" — ")[0]} demo project
            </h2>
            <ol className="space-y-3" data-testid="steps-list">
              {module.steps.map((s, i) => (
                <li
                  key={s.title}
                  className="flex items-start gap-4 rounded-lg border border-slate-200 bg-white p-4"
                  data-testid={`step-${i + 1}`}
                >
                  <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                    {i + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{s.title}</div>
                    <div className="mt-1 text-sm text-slate-600">{s.body}</div>
                  </div>
                  <CheckCircle2 className="ml-auto h-5 w-5 text-emerald-500 shrink-0 mt-1" aria-hidden="true" />
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-10" data-testid="coverage-section">
            <h2 className="font-display text-2xl font-bold text-slate-950 mb-4">
              Standards & tools covered in this walkthrough
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">
                  Standards & frameworks
                </div>
                <div className="flex flex-wrap gap-2" data-testid="standards-chips">
                  {module.standards.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center rounded-full bg-primary/10 text-primary text-xs font-medium px-3 py-1"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="text-xs uppercase tracking-widest text-emerald-600 font-semibold mb-3">
                  Tools & integrations
                </div>
                <div className="flex flex-wrap gap-2" data-testid="tools-chips">
                  {module.tools.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="font-display text-lg font-bold text-slate-950 mb-3">Share this tutorial</h3>
            <p className="text-sm text-slate-600 mb-4">
              Send the {module.title.toLowerCase()} walkthrough to your team or post it to your network.
            </p>
            <ShareButtons url={path} title={seoTitle} description={description} />
          </section>

          <div className="mt-10 grid sm:grid-cols-2 gap-4">
            <Link
              href={`/demo-videos/${prev.slug}`}
              className="group rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow"
              data-testid="link-prev-tutorial"
            >
              <div className="text-xs uppercase tracking-widest text-slate-400 mb-1">← Previous</div>
              <div className="font-semibold text-slate-900 group-hover:text-primary">{prev.title}</div>
              <div className="text-xs text-slate-500 mt-1">{prev.project}</div>
            </Link>
            <Link
              href={`/demo-videos/${next.slug}`}
              className="group rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow text-right"
              data-testid="link-next-tutorial"
            >
              <div className="text-xs uppercase tracking-widest text-slate-400 mb-1">Next →</div>
              <div className="font-semibold text-slate-900 group-hover:text-primary">{next.title}</div>
              <div className="text-xs text-slate-500 mt-1">{next.project}</div>
            </Link>
          </div>

          <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
            <Button asChild size="lg" className="gap-2" data-testid="cta-full-tour">
              <a href={TUTORIAL_BASE} target="_blank" rel="noopener noreferrer">
                Watch full tour <Play className="w-4 h-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/contact">
                Book a live walkthrough <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
