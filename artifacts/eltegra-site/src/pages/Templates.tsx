import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Download, FileSpreadsheet, FileText, Library } from "lucide-react";
import { SEO } from "@/components/SEO";

const TEMPLATES = [
  { standard: "ASPICE 4.0", title: "ASPICE 4.0 work-product index + traceability matrix template", format: "XLSX + ReqIF", desc: "All 32 base practices with required work products and a pre-wired traceability matrix." },
  { standard: "IEC 62304", title: "IEC 62304 software lifecycle file template", format: "DOCX + XLSX", desc: "Software safety classification (Class A/B/C), SOUP register, software development plan, problem resolution log." },
  { standard: "ISO 13485", title: "ISO 13485 design history file (DHF) template", format: "DOCX + XLSX", desc: "Design inputs, design outputs, design verification, design validation, design transfer, design changes." },
  { standard: "ISO 14971", title: "ISO 14971 risk management file template", format: "XLSX", desc: "Hazard identification, risk estimation, risk control, residual risk, risk-benefit analysis." },
  { standard: "ISO 26262", title: "ISO 26262 ASIL decomposition + safety case template", format: "DOCX + XLSX", desc: "HARA, ASIL allocation, safety goals, FSR/TSR/HSR/SSR decomposition, GSN safety-case skeleton." },
  { standard: "FDA QMSR (21 CFR 820)", title: "FDA QMSR transition workbook (ISO 13485 → 21 CFR 820)", format: "XLSX", desc: "Crosswalk every clause, gap-analysis tab, remediation owners + due dates." },
  { standard: "MDR 2017/745", title: "EU MDR Annex II technical documentation template", format: "DOCX", desc: "Technical documentation skeleton aligned to MDR Annex II + Annex III for post-market surveillance." },
  { standard: "DPDP Act 2023", title: "DPDP Act 2023 readiness checklist (India)", format: "XLSX", desc: "Notice & consent, data principal rights, data fiduciary duties, breach notification, transfer rules." },
  { standard: "DORA (EU)", title: "DORA register-of-information template", format: "XLSX", desc: "ICT third-party arrangements, criticality classification, exit strategy, contractual provisions." },
  { standard: "SOC 2 Type II", title: "SOC 2 control matrix + evidence-pack template", format: "XLSX", desc: "All Trust Services Criteria with example controls, evidence types and frequency." },
];

export default function Templates() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Free Compliance & Requirements Templates — Auditee"
        description="Download free, vendor-neutral templates for ASPICE 4.0, IEC 62304, ISO 13485, ISO 14971, ISO 26262, FDA QMSR, EU MDR, DPDP Act 2023, DORA and SOC 2. XLSX, DOCX and ReqIF formats."
        path="/templates"
        keywords={["ASPICE template", "IEC 62304 template", "ISO 13485 DHF template", "ISO 26262 template", "FDA QMSR workbook", "DORA register template", "SOC 2 control matrix"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/free-tools" className="text-sm text-slate-700 hover:text-primary">Free tools</Link>
            <Link href="/whitepapers" className="text-sm text-slate-700 hover:text-primary">Whitepapers</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Library className="h-10 w-10 mx-auto text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Templates</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            Free, vendor-neutral templates for the standards we work with every day. Use them inside Auditee, your Excel of choice, or as the starting point for a custom QMS.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-4">
            {TEMPLATES.map((t) => (
              <Link key={t.title} href={`/contact?topic=${encodeURIComponent("Template request: " + t.standard)}`} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-primary transition-colors block">
                <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full px-2.5 py-1">{t.standard}</span>
                  <span className="text-xs text-slate-500 inline-flex items-center gap-1">
                    {t.format.includes("XLSX") ? <FileSpreadsheet className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                    {t.format}
                  </span>
                </div>
                <div className="font-semibold text-slate-900">{t.title}</div>
                <div className="text-sm text-slate-600 mt-1.5">{t.desc}</div>
                <div className="mt-3 text-sm text-primary font-medium inline-flex items-center gap-1"><Download className="h-4 w-4" />Request download</div>
              </Link>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-6">Templates are released under the Auditee Template Licence (free to use commercially within your organisation; redistribution requires attribution). Email <a href="mailto:templates@auditee.site" className="text-primary underline">templates@auditee.site</a> for a bundled ZIP.</p>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Need a template we haven't published?</h2>
          <p className="text-slate-300 mb-6">Tell us the standard and the work product. If it's broadly useful, we'll build it and add it here.</p>
          <Link href="/contact?topic=template-request">
            <Button size="lg" className="rounded-full" data-testid="templates-request-cta">Request a template<ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
