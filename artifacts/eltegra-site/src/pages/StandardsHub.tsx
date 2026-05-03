import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookCheck } from "lucide-react";
import { SEO } from "@/components/SEO";

const STANDARDS = [
  { code: "ASPICE 4.0", full: "Automotive SPICE 4.0", body: "VDA QMC", scope: "Automotive software process assessment", desc: "All 32 base practices pre-configured. SYS.1–SYS.5, SWE.1–SWE.6, MAN.3, SUP.1, SUP.8, SUP.9, SUP.10. Evidence packs export as PDF + ReqIF.", href: "/ai-for-automotive" },
  { code: "ISO 26262", full: "ISO 26262:2018", body: "ISO/TC 22/SC 32", scope: "Road-vehicle functional safety", desc: "HARA, ASIL allocation, FSR/TSR/HSR/SSR decomposition, GSN safety case. Bidirectional traceability across all 12 parts.", href: "/ai-for-automotive" },
  { code: "ISO 21434", full: "ISO/SAE 21434:2021", body: "ISO/TC 22 + SAE", scope: "Road-vehicle cybersecurity engineering", desc: "TARA workflows, CAL allocation, security goals → security requirements → controls, link to ISO 26262 safety case.", href: "/ai-for-automotive" },
  { code: "IEC 62304", full: "IEC 62304:2006+A1:2015", body: "IEC", scope: "Medical-device software lifecycle", desc: "Software safety classification (Class A/B/C), SOUP register, problem-resolution log, software development plan.", href: "/ai-for-healthcare" },
  { code: "ISO 13485", full: "ISO 13485:2016", body: "ISO/TC 210", scope: "Medical-devices QMS", desc: "Design history file (DHF), management review, CAPA, risk-based supplier management. Pre-mapped to FDA QMSR for parallel audits.", href: "/ai-for-healthcare" },
  { code: "ISO 14971", full: "ISO 14971:2019", body: "ISO/TC 210", scope: "Medical-device risk management", desc: "Hazard ID, risk estimation, risk control, residual risk, risk-benefit analysis. Live link to design inputs and verification.", href: "/ai-for-healthcare" },
  { code: "FDA QMSR", full: "21 CFR Part 820 (post-Feb 2026)", body: "US FDA", scope: "Medical-device QMSR (US)", desc: "ISO 13485:2016 incorporated by reference + the FDA-specific deltas (UDI, MDR, complaint files, CAPA). Crosswalk workbook included.", href: "/automated-compliance" },
  { code: "EU MDR", full: "Regulation (EU) 2017/745", body: "European Commission", scope: "Medical devices in the EU", desc: "Annex II technical documentation, post-market surveillance plans, PMCF, PSUR. UDI-DI / Basic UDI-DI registry tie-in.", href: "/ai-for-healthcare" },
  { code: "EU IVDR", full: "Regulation (EU) 2017/746", body: "European Commission", scope: "In-vitro diagnostic devices in the EU", desc: "Performance evaluation reports (PER), scientific validity, analytical and clinical performance, PMPF.", href: "/ai-for-healthcare" },
  { code: "DORA", full: "Regulation (EU) 2022/2554", body: "European Commission", scope: "Digital Operational Resilience Act", desc: "Register-of-information for ICT third-party arrangements, incident classification, threat-led penetration tests, exit strategy.", href: "/ai-for-finance" },
  { code: "DPDP Act", full: "Digital Personal Data Protection Act 2023", body: "Govt. of India / MeitY", scope: "Personal data protection (India)", desc: "Notice & consent management, data-principal rights, data-fiduciary duties, breach notification, cross-border transfer rules.", href: "/ai-for-finance" },
  { code: "GDPR", full: "Regulation (EU) 2016/679", body: "European Commission", scope: "Personal data protection (EU)", desc: "ROPA, DPIA, lawful-basis register, data-subject-rights workflows, Art. 28 sub-processor management, breach 72-hour clock.", href: "/dpa" },
  { code: "SOC 2", full: "AICPA Trust Services Criteria 2017 (2022 revision)", body: "AICPA", scope: "Security, availability, confidentiality (SaaS)", desc: "Type II control matrix, evidence-frequency calendar, auditor read-only role, continuous-control monitoring.", href: "/security" },
  { code: "ISO/IEC 27001", full: "ISO/IEC 27001:2022", body: "ISO + IEC", scope: "Information security management", desc: "Annex A 93-control mapping, statement of applicability, ISMS scope, risk-treatment plan, internal-audit calendar.", href: "/security" },
  { code: "HIPAA", full: "45 CFR Parts 160 & 164", body: "US HHS / OCR", scope: "Protected Health Information (US)", desc: "BAA-ready deployment, minimum-necessary controls, audit logs of PHI access, breach-notification timeline.", href: "/security" },
  { code: "PCI-DSS 4.0", full: "PCI Data Security Standard v4.0", body: "PCI SSC", scope: "Cardholder data environment", desc: "Targeted-risk-analysis framework, customised approach controls, evidence collection per requirement.", href: "/security" },
];

export default function StandardsHub() {
  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Standards Library — ASPICE, ISO 26262, IEC 62304, FDA QMSR, MDR, DORA, DPDP & More | Auditee"
        description="Auditee ships pre-configured for 16 standards: ASPICE 4.0, ISO 26262, ISO 21434, IEC 62304, ISO 13485, ISO 14971, FDA QMSR, EU MDR, IVDR, DORA, DPDP Act 2023, GDPR, SOC 2, ISO 27001, HIPAA, PCI-DSS 4.0."
        path="/standards"
        keywords={["compliance standards", "ASPICE 4.0", "ISO 26262", "IEC 62304", "FDA QMSR", "EU MDR", "DORA", "DPDP Act 2023", "SOC 2", "ISO 27001"]}
      />
      <header className="border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-2xl text-slate-950">Auditee</Link>
          <div className="flex items-center gap-4">
            <Link href="/templates" className="text-sm text-slate-700 hover:text-primary">Templates</Link>
            <Link href="/automated-compliance" className="text-sm text-slate-700 hover:text-primary">Automated compliance</Link>
            <Link href="/app">
              <Button variant="outline" className="rounded-full">Launch platform</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <BookCheck className="h-10 w-10 mx-auto text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-950 mb-3">Standards library</h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto">
            16 standards, pre-mapped to product features, evidence types and templates. Bring your own additions any time.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-4">
            {STANDARDS.map((s) => (
              <Link key={s.code} href={s.href} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-primary transition-colors block">
                <div className="flex items-baseline justify-between gap-3 mb-1 flex-wrap">
                  <span className="font-display font-bold text-lg text-slate-950">{s.code}</span>
                  <span className="text-xs text-slate-500">{s.body}</span>
                </div>
                <div className="text-xs text-slate-600">{s.full} · {s.scope}</div>
                <div className="text-sm text-slate-700 mt-2">{s.desc}</div>
                <div className="mt-3 text-sm text-primary font-medium inline-flex items-center gap-1">Open product page <ArrowRight className="h-4 w-4" /></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold mb-4">Need a standard not on this list?</h2>
          <p className="text-slate-300 mb-6">DO-178C / DO-254, EN 50128 / EN 50657, IEC 61508, NERC CIP, GxP, AS9100, TISAX, NIS2 — we've configured all of them. Tell us yours and we'll send the mapping.</p>
          <Link href="/contact?topic=standard-mapping">
            <Button size="lg" className="rounded-full" data-testid="standards-request-cta">Request a standard mapping<ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
