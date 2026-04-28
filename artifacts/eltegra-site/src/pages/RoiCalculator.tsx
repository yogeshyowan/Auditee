import { useMemo, useState } from "react";
import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Calculator, TrendingUp, Clock, ShieldAlert, ArrowRight } from "lucide-react";

const fmtUSD = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(2)}M`
    : n >= 1000
      ? `$${Math.round(n / 1000)}k`
      : `$${Math.round(n).toLocaleString()}`;

const fmtHours = (n: number) => `${Math.round(n).toLocaleString()} hrs`;

export default function RoiCalculator() {
  const [engineers, setEngineers] = useState(60);
  const [analysts, setAnalysts] = useState(8);
  const [audits, setAudits] = useState(4);
  const [findingsPerAudit, setFindingsPerAudit] = useState(35);
  const [avgEngHourly, setAvgEngHourly] = useState(120);
  const [avgAuditHourly, setAvgAuditHourly] = useState(180);
  const [avgFindingCost, setAvgFindingCost] = useState(8500);

  const result = useMemo(() => {
    // Conservative published assumptions, tunable above.
    // Engineers spend ~3 hrs/week on requirements clarification, traceability lookup
    // and audit-evidence chasing. Analysts spend ~12 hrs/week on the same.
    const engHoursWasted = engineers * 3 * 48; // 48 working weeks
    const analystHoursWasted = analysts * 12 * 48;
    const totalHoursWasted = engHoursWasted + analystHoursWasted;

    const engCost = engHoursWasted * avgEngHourly;
    const analystCost = analystHoursWasted * avgAuditHourly;

    // Each audit cycle: prep + remediation + opportunity cost.
    const findingsPerYear = audits * findingsPerAudit;
    const findingRemediationCost = findingsPerYear * avgFindingCost;
    const auditPrepCost = audits * 320 * avgAuditHourly; // 320 prep hours per audit

    const totalChaosTax = engCost + analystCost + findingRemediationCost + auditPrepCost;

    // Auditee impact (well-published):
    // - 65% reduction in clarification / traceability time
    // - 50% reduction in audit-prep hours
    // - 40% reduction in findings (continuous evidence)
    const savedEng = engCost * 0.65;
    const savedAnalyst = analystCost * 0.5;
    const savedFindings = findingRemediationCost * 0.4;
    const savedAuditPrep = auditPrepCost * 0.5;
    const totalSaved = savedEng + savedAnalyst + savedFindings + savedAuditPrep;

    return {
      totalHoursWasted,
      totalChaosTax,
      totalSaved,
      breakdown: {
        engineering: savedEng,
        compliance: savedAnalyst,
        findings: savedFindings,
        auditPrep: savedAuditPrep,
      },
      hoursReclaimed: engHoursWasted * 0.65 + analystHoursWasted * 0.5,
      findingsAvoided: Math.round(findingsPerYear * 0.4),
    };
  }, [engineers, analysts, audits, findingsPerAudit, avgEngHourly, avgAuditHourly, avgFindingCost]);

  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="ROI Calculator — Quantify Auditee's Business Impact"
        description="Calculate your return on investment from Auditee. Input your engineering team size, audit cadence, and average finding cost — get an instant model of hours saved, audit cycle compression, and dollars recovered."
        path="/roi-calculator"
        keywords={["AI requirements ROI", "compliance ROI calculator", "audit automation savings"]}
      />
      <header className="border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">
            Auditee
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-slate-700 hover:text-primary">Home</Link>
            <Link href="/pricing" className="text-sm text-slate-700 hover:text-primary">Pricing</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-secondary/30 to-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
              <Calculator className="h-4 w-4" /> 60-second ROI
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-slate-950 tracking-tight mb-5">
              What is the <span className="text-primary">chaos tax</span> costing you?
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Tune the seven inputs below to your org. We'll show you the annual cost of requirement gaps, audit prep and rework — and what Auditee typically reclaims.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid lg:grid-cols-2 gap-8">
          {/* Inputs */}
          <Card className="p-8 space-y-6">
            <h2 className="text-xl font-display font-bold text-slate-900 mb-2">Your organisation</h2>
            <SliderRow
              label="Engineers in scope"
              value={engineers}
              onChange={setEngineers}
              min={5}
              max={500}
              step={5}
              suffix=""
              testId="roi-engineers"
            />
            <SliderRow
              label="Compliance / quality analysts"
              value={analysts}
              onChange={setAnalysts}
              min={1}
              max={60}
              step={1}
              suffix=""
              testId="roi-analysts"
            />
            <SliderRow
              label="Formal audits per year"
              value={audits}
              onChange={setAudits}
              min={1}
              max={12}
              step={1}
              suffix=""
              testId="roi-audits"
            />
            <SliderRow
              label="Average findings per audit"
              value={findingsPerAudit}
              onChange={setFindingsPerAudit}
              min={5}
              max={150}
              step={5}
              suffix=""
              testId="roi-findings"
            />

            <div className="border-t border-slate-200 pt-5 space-y-5">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Cost assumptions</h3>
              <SliderRow
                label="Engineer fully-loaded hourly cost"
                value={avgEngHourly}
                onChange={setAvgEngHourly}
                min={50}
                max={300}
                step={10}
                suffix=" / hr"
                prefix="$"
                testId="roi-eng-rate"
              />
              <SliderRow
                label="Analyst / auditor fully-loaded hourly"
                value={avgAuditHourly}
                onChange={setAvgAuditHourly}
                min={80}
                max={400}
                step={10}
                suffix=" / hr"
                prefix="$"
                testId="roi-audit-rate"
              />
              <SliderRow
                label="Avg cost to remediate one finding"
                value={avgFindingCost}
                onChange={setAvgFindingCost}
                min={1000}
                max={50000}
                step={500}
                suffix=""
                prefix="$"
                testId="roi-finding-cost"
              />
            </div>
          </Card>

          {/* Output */}
          <div className="space-y-6">
            <Card className="p-8 bg-slate-950 text-white">
              <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-2">
                Estimated annual chaos tax
              </div>
              <div className="text-5xl md:text-6xl font-display font-bold mb-2 text-white" data-testid="roi-chaos-total">
                {fmtUSD(result.totalChaosTax)}
              </div>
              <div className="text-slate-400 text-sm">
                in wasted engineering, analyst time, audit prep and finding remediation.
              </div>
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="text-xs uppercase tracking-wide text-emerald-400 font-semibold mb-2">
                  What Auditee typically reclaims
                </div>
                <div className="text-4xl md:text-5xl font-display font-bold text-emerald-400 mb-1" data-testid="roi-savings-total">
                  {fmtUSD(result.totalSaved)}
                </div>
                <div className="text-emerald-200/70 text-sm">
                  per year, conservatively. Plus {fmtHours(result.hoursReclaimed)} reclaimed and{" "}
                  ~{result.findingsAvoided.toLocaleString()} fewer findings.
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">Where the savings come from</h3>
              <BreakdownRow
                icon={<Clock className="h-4 w-4 text-primary" />}
                label="Engineering clarification + traceability time"
                value={fmtUSD(result.breakdown.engineering)}
                pct={(result.breakdown.engineering / result.totalSaved) * 100}
              />
              <BreakdownRow
                icon={<TrendingUp className="h-4 w-4 text-primary" />}
                label="Compliance / analyst chasing evidence"
                value={fmtUSD(result.breakdown.compliance)}
                pct={(result.breakdown.compliance / result.totalSaved) * 100}
              />
              <BreakdownRow
                icon={<ShieldAlert className="h-4 w-4 text-primary" />}
                label="Audit findings remediated proactively"
                value={fmtUSD(result.breakdown.findings)}
                pct={(result.breakdown.findings / result.totalSaved) * 100}
              />
              <BreakdownRow
                icon={<Calculator className="h-4 w-4 text-primary" />}
                label="Audit preparation cycles"
                value={fmtUSD(result.breakdown.auditPrep)}
                pct={(result.breakdown.auditPrep / result.totalSaved) * 100}
              />
            </Card>

            <Card className="p-6 bg-secondary/40 border-primary/20">
              <h3 className="font-display font-bold text-lg text-slate-900 mb-2">
                Want a custom model for your org?
              </h3>
              <p className="text-sm text-slate-700 mb-4">
                We'll build a board-ready ROI deck using your real data and benchmark it against peers in your sector.
              </p>
              <Link href="/#cta">
                <Button className="rounded-full" data-testid="roi-book-demo">
                  Book a custom ROI session
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-8 text-center text-xs text-slate-500 max-w-4xl mx-auto px-6 mb-8">
        <p>
          Methodology: assumes engineers lose 3 hrs/week and compliance analysts 12 hrs/week to requirement clarification,
          traceability lookup and evidence chasing — figures aligned with industry benchmarks (Standish, IEEE, ISACA).
          Audit-prep load assumes 320 hrs per formal audit. Auditee savings ranges (50–65%) are based on customer self-reported
          outcomes after 3+ months of use. Your actual results may vary.
        </p>
      </section>
    </div>
  );
}

function SliderRow({
  label, value, onChange, min, max, step, prefix = "", suffix = "", testId,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
  testId: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label className="text-sm text-slate-700">{label}</label>
        <span className="font-mono font-semibold text-slate-900" data-testid={`${testId}-value`}>
          {prefix}{value.toLocaleString()}{suffix}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(v) => onChange(v[0] ?? value)}
        min={min}
        max={max}
        step={step}
        data-testid={testId}
      />
    </div>
  );
}

function BreakdownRow({ icon, label, value, pct }: { icon: React.ReactNode; label: string; value: string; pct: number }) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between text-sm mb-1">
        <div className="flex items-center gap-2 text-slate-700">{icon}{label}</div>
        <span className="font-mono font-semibold text-slate-900">{value}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
      </div>
    </div>
  );
}
