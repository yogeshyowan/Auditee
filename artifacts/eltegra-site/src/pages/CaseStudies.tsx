import { Link } from "wouter";
import { ArrowRight, FileText, Heart, Banknote, Car, Factory } from "lucide-react";
import { SEO, breadcrumbsLd } from "@/components/SEO";
import { Navigation, SiteFooter } from "@/components/site/Chrome";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STUDIES: {
  industry: string;
  Icon: typeof Heart;
  title: string;
  summary: string;
  metrics: { label: string; value: string }[];
  challenge: string;
  solution: string;
  outcome: string;
}[] = [
  {
    industry: "Healthcare / SaMD",
    Icon: Heart,
    title: "Mid-stage telehealth platform compresses IEC 62304 evidence cycle 7×",
    summary:
      "A 90-engineer telehealth provider with FDA Class II SaMD obligations replaced the DOORS+Word+Excel triad with Auditee.",
    metrics: [
      { label: "IEC 62304 evidence pack time", value: "7× faster" },
      { label: "First-cycle audit findings", value: "−68%" },
      { label: "Requirement classification effort", value: "−85%" },
      { label: "Time to first audit-ready BRD", value: "11 days → 36 hours" },
    ],
    challenge:
      "DOORS Classic ran the legacy regulatory program; new product squads worked in Confluence + Jira. Audit prep took 4 weeks of one BA's time per quarter. Two FDA pre-sub findings on insufficient SOUP register and missing software-class B unit tests had escalated.",
    solution:
      "Auditee connected to DOORS via ReqIF and to GitHub for the new platform. AI extracted requirements from the React Native + FastAPI codebase, mapped them to IEC 62304 work products and generated a SOUP register from package-lock.json + go.mod. Recurring audit jobs caught drift between merges and the design history file.",
    outcome:
      "Pre-sub round 2 closed with zero major findings. The same evidence pack now satisfies their next ISO 13485 surveillance audit. Quarterly BA effort dropped from 160 hours to ~22.",
  },
  {
    industry: "Fintech / payments",
    Icon: Banknote,
    title: "Asia-pacific payments PSP runs PCI DSS v4 evidence on autopilot",
    summary:
      "A licensed payment service provider replaced four spreadsheets, three Confluence spaces and a Jama instance with Auditee.",
    metrics: [
      { label: "Quarterly PCI evidence prep", value: "12× faster" },
      { label: "RBI IT-Governance audit findings", value: "0 majors" },
      { label: "Control-narrative export", value: "On-demand (was 2 weeks)" },
      { label: "Per-seat tooling cost", value: "−72%" },
    ],
    challenge:
      "The compliance team manually re-collected screenshots, log samples and Jira tickets every quarter to evidence PCI DSS v4 requirements. RBI's IT-governance master direction added overlapping evidence. The team was burning out and the next ISO 27001 surveillance was 90 days away.",
    solution:
      "Auditee replaced the spreadsheets with a single living PCI + ISO 27001 + RBI control map. Webhooks from GitHub, Snowflake and PagerDuty kept evidence fresh. The CAPA workflow tracked findings from quarterly internal audits to closure.",
    outcome:
      "Three back-to-back audits (PCI, RBI, ISO 27001) closed with zero major findings. The compliance team reclaimed roughly 30 hours / week.",
  },
  {
    industry: "Automotive Tier-1",
    Icon: Car,
    title: "ASIL-D ECU supplier cuts ASPICE work-product effort 8×",
    summary:
      "A European Tier-1 supplier of brake-by-wire ECUs uses Auditee alongside Polarion for new programmes.",
    metrics: [
      { label: "ASPICE work-product creation", value: "8× faster" },
      { label: "Hazard-to-requirement coverage", value: "100%" },
      { label: "TARA refresh on architectural change", value: "Automatic" },
      { label: "Requirements-to-MIL-test traceability", value: "End-to-end" },
    ],
    challenge:
      "The legacy programme ran in Polarion with hand-maintained ASIL-decomposition spreadsheets. New programmes were under pressure to ship sooner with thinner safety teams. UNECE R155 cybersecurity work products were a constant audit blocker.",
    solution:
      "Auditee bridged Polarion bidirectionally; AI generated FSR/TSR/SwSR drafts from system requirements and refreshed the TARA every time the architecture changed. Generated test cases plugged into the existing HIL pipeline.",
    outcome:
      "First ASIL-D ECU programme on Auditee passed assessor review with 'no major findings' on ASPICE SWE.4 / SWE.5 / SWE.6. Programme ship-date pulled in by 6 weeks.",
  },
  {
    industry: "Telecom / OSS-BSS",
    Icon: Factory,
    title: "Tier-2 operator modernizes 25-year-old Java/COBOL OSS in 9 months",
    summary:
      "A regional telecom operator used Auditee to reverse-engineer a quarter-century OSS estate and rebuild on TM Forum ODA.",
    metrics: [
      { label: "Modules reverse-engineered", value: "112" },
      { label: "Requirements derived (auto-classified)", value: "8,400+" },
      { label: "RFP response time", value: "10× faster" },
      { label: "Strangler-pattern modules shipped in 9 months", value: "23" },
    ],
    challenge:
      "Original OSS architects had retired; the codebase mixed COBOL, Java and PL/SQL with one PDF spec from 2003. Operators couldn't accurately respond to RFIs without weeks of code archaeology.",
    solution:
      "Auditee indexed all 112 modules, derived the de-facto requirements set, mapped each to TM Forum Open APIs and surfaced gaps in security, observability and idempotency. Generated test cases backed the strangler-pattern rebuild.",
    outcome:
      "23 cloud-native modules shipped in 9 months under a strangler pattern, with the legacy core still serving traffic. Subsequent RFIs are turned around in days, not weeks.",
  },
];

export default function CaseStudies() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Case Studies — Auditee in Production | Auditee"
        description="How healthcare, fintech, automotive Tier-1 and telecom teams use Auditee to compress audit cycles, modernize legacy software and ship faster — with real metrics."
        path="/case-studies"
        keywords={["Auditee case studies", "IEC 62304 case study", "PCI DSS case study", "ASPICE case study", "OSS modernization"]}
        jsonLd={breadcrumbsLd([{ name: "Home", path: "/" }, { name: "Case Studies", path: "/case-studies" }])}
      />
      <Navigation />
      <main className="pt-28 pb-24">
        <header className="max-w-3xl mx-auto px-6 text-center">
          <FileText className="w-10 h-10 mx-auto text-primary mb-4" />
          <h1 className="font-display text-4xl md:text-5xl font-bold text-slate-950 tracking-tight">Case studies</h1>
          <p className="mt-4 text-lg text-slate-600">
            Composite cases drawn from active and prior engagements across healthcare, fintech,
            automotive and telecom. Names anonymised; metrics representative.
          </p>
        </header>

        <div className="max-w-5xl mx-auto px-6 mt-16 space-y-8">
          {STUDIES.map((s) => {
            const Icon = s.Icon;
            return (
              <Card key={s.title} className="p-6 md:p-8">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <Badge variant="outline" className="bg-slate-50 mb-2">{s.industry}</Badge>
                    <h2 className="font-display text-2xl font-bold text-slate-950">{s.title}</h2>
                    <p className="mt-2 text-slate-600">{s.summary}</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {s.metrics.map((m) => (
                    <div key={m.label} className="rounded-lg bg-slate-50 p-3">
                      <div className="text-2xl font-display font-bold text-primary">{m.value}</div>
                      <div className="text-xs text-slate-600 mt-1">{m.label}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid md:grid-cols-3 gap-5 text-sm">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1.5">Challenge</h3>
                    <p className="text-slate-600 leading-relaxed">{s.challenge}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1.5">Solution</h3>
                    <p className="text-slate-600 leading-relaxed">{s.solution}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1.5">Outcome</h3>
                    <p className="text-slate-600 leading-relaxed">{s.outcome}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="max-w-3xl mx-auto px-6 mt-20 text-center">
          <h2 className="font-display text-2xl font-bold text-slate-950">Want to see one of these in detail?</h2>
          <p className="mt-3 text-slate-600">We'll walk through the architecture, the connectors and the audit evidence — under NDA where needed.</p>
          <div className="mt-6">
            <Button asChild size="lg" className="gap-2">
              <Link href="/contact">Book a deep-dive <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
