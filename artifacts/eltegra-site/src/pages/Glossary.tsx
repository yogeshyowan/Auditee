import { Link } from "wouter";
import { BookOpen, ArrowRight } from "lucide-react";
import { SEO, breadcrumbsLd } from "@/components/SEO";
import { Navigation, SiteFooter } from "@/components/site/Chrome";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Term { term: string; abbrev?: string; definition: string; }

const TERMS: Term[] = [
  { term: "ALM", abbrev: "Application Lifecycle Management", definition: "Combined discipline + tooling for managing a software system from inception through retirement, covering requirements, code, test, build, release and operations." },
  { term: "ASIL", abbrev: "Automotive Safety Integrity Level", definition: "ISO 26262 risk classification (A, B, C, D) for automotive electrical / electronic systems. ASIL D is the highest." },
  { term: "ASPICE", abbrev: "Automotive SPICE", definition: "Process assessment model used by automotive OEMs to evaluate Tier-1 software development capability. Based on ISO/IEC 33000." },
  { term: "BAA", abbrev: "Business Associate Agreement", definition: "HIPAA contract between a covered entity and a vendor handling PHI; required before PHI may be processed." },
  { term: "BRD", abbrev: "Business Requirements Document", definition: "Top-level document describing business objectives, scope, stakeholders and outcomes — independent of any specific solution." },
  { term: "CAPA", abbrev: "Corrective and Preventive Action", definition: "Quality-system process for diagnosing root cause of an issue, fixing it and preventing recurrence. Required by FDA QSR, ISO 13485 and ISO 9001." },
  { term: "CMMI", abbrev: "Capability Maturity Model Integration", definition: "Process improvement framework with five maturity levels (Initial → Optimizing). Common in defence and large-system contracts." },
  { term: "DHF", abbrev: "Design History File", definition: "FDA QSR-mandated record of a medical device's design — inputs, outputs, reviews, verification, validation, transfers and changes." },
  { term: "DORA", abbrev: "Digital Operational Resilience Act", definition: "EU regulation (effective Jan 2025) for ICT risk management in financial entities, including third-party risk and incident reporting." },
  { term: "DPDP", abbrev: "Digital Personal Data Protection Act, 2023", definition: "India's general personal-data privacy law. Comparable in spirit to GDPR; enforced by the Data Protection Board of India." },
  { term: "DXL", abbrev: "DOORS Extension Language", definition: "Proprietary scripting language used to customise IBM Rational DOORS Classic. C-like syntax." },
  { term: "FDA QSR", abbrev: "Quality System Regulation (21 CFR Part 820)", definition: "US FDA regulation governing the methods used in design, manufacture, packaging, labelling and servicing of medical devices. Being harmonised with ISO 13485 as QMSR." },
  { term: "FRD", abbrev: "Functional Requirements Document", definition: "Specification of what the system must do — functional behaviour, inputs, outputs and rules — typically derived from PRD." },
  { term: "FRS", abbrev: "Functional Requirements Specification", definition: "Same family as FRD; emphasises individual numbered requirements rather than a narrative." },
  { term: "GDPR", abbrev: "General Data Protection Regulation", definition: "EU/UK personal-data privacy regulation (2018). Applies to any organisation handling EU/UK resident data." },
  { term: "Gherkin", definition: "Plain-language syntax (Given / When / Then) used by BDD frameworks like Cucumber to describe acceptance criteria." },
  { term: "GxP", definition: "Umbrella term for 'good practice' regulations in life sciences (GMP, GLP, GCP, GDP). Software supporting GxP processes must be validated." },
  { term: "HIPAA", abbrev: "Health Insurance Portability and Accountability Act", definition: "US law (1996) and successor rules (Privacy, Security, Breach Notification) governing protected health information (PHI)." },
  { term: "IEC 62304", definition: "International standard for the software development lifecycle of medical-device software. Three software safety classes: A, B, C." },
  { term: "ISO 13485", definition: "Quality Management System standard for medical devices. Aligns with FDA QSR and is required for CE-marked devices." },
  { term: "ISO 14971", definition: "Risk-management standard for medical devices. Required by IEC 62304 for software hazards." },
  { term: "ISO 26262", definition: "Functional-safety standard for road vehicles, parts 1–12. Defines ASIL classification and lifecycle work products." },
  { term: "ISO/SAE 21434", definition: "Cybersecurity engineering standard for road vehicles. Required to satisfy UNECE WP.29 R155 type-approval." },
  { term: "ISO/IEC 27001:2022", definition: "International standard for an Information Security Management System (ISMS). Annex A controls map to most cloud SaaS audits." },
  { term: "MDR", abbrev: "Medical Device Regulation", definition: "EU 2017/745 — replaced the MDD. Stricter clinical evidence, technical documentation and post-market surveillance requirements." },
  { term: "MoSCoW", definition: "Requirement prioritisation scheme: Must / Should / Could / Won't." },
  { term: "NFR", abbrev: "Non-Functional Requirement", definition: "Cross-cutting quality attribute: performance, security, accessibility, reliability, observability, maintainability, etc." },
  { term: "NIST 800-53 / 800-171", definition: "US NIST control catalogues. 800-53 for federal information systems; 800-171 for protecting CUI in non-federal systems (CMMC basis)." },
  { term: "OSLC", abbrev: "Open Services for Lifecycle Collaboration", definition: "OASIS standard for tool-to-tool integration across the ALM stack. OSLC-RM is the requirements management profile." },
  { term: "PCI DSS v4", definition: "Payment Card Industry Data Security Standard, version 4 (effective 2024). Required for any system handling cardholder data." },
  { term: "PDLC", abbrev: "Product Development Lifecycle", definition: "End-to-end process of developing a product from idea through retirement. Auditee is an AI-native control plane for the entire PDLC." },
  { term: "PHI", abbrev: "Protected Health Information", definition: "Individually identifiable health information regulated under HIPAA." },
  { term: "PRD", abbrev: "Product Requirements Document", definition: "User-facing solution specification: personas, journeys, features, success metrics. Sits between BRD and FRD." },
  { term: "ReqIF", abbrev: "Requirements Interchange Format", definition: "OMG standard XML format for exchanging requirements between RM tools (DOORS, Jama, Polarion, etc.)." },
  { term: "RTM", abbrev: "Requirements Traceability Matrix", definition: "Matrix mapping each requirement to its sources, design elements, code, tests and audit evidence." },
  { term: "SaMD", abbrev: "Software as a Medical Device", definition: "IMDRF term for software intended to be used for medical purposes without being part of a hardware medical device." },
  { term: "SBOM", abbrev: "Software Bill of Materials", definition: "Machine-readable inventory of all components in a software build. Required by US EO 14028 and IEC 62304 SOUP register." },
  { term: "SOC 2", definition: "AICPA attestation framework based on Trust Services Criteria (Security, Availability, Processing Integrity, Confidentiality, Privacy). Type II = period-of-time audit." },
  { term: "SOTIF", abbrev: "Safety Of The Intended Functionality", definition: "ISO 21448 standard for hazards arising from intended functionality without component failure (especially relevant to AI/ADAS)." },
  { term: "SOUP", abbrev: "Software Of Unknown Provenance", definition: "IEC 62304 term for software previously developed for which adequate records of development processes are not available. Must be registered and risk-assessed." },
  { term: "TARA", abbrev: "Threat Analysis and Risk Assessment", definition: "ISO/SAE 21434 method for identifying cybersecurity threats to vehicle assets and assigning Cybersecurity Assurance Levels (CALs)." },
  { term: "UNECE WP.29", definition: "UN Working Party on Vehicle Regulations. R155 (cybersecurity) and R156 (software updates) regulate vehicle type approval in 60+ countries." },
  { term: "WCAG 2.2", abbrev: "Web Content Accessibility Guidelines", definition: "W3C standard for accessible web content. Levels A, AA (legal default in EU/US public sector) and AAA." },
  { term: "ZDR", abbrev: "Zero Data Retention", definition: "AI provider contract clause guaranteeing prompts and completions are not retained beyond the API call. Default for Auditee's managed AI providers." },
];

function groupAlpha(terms: Term[]) {
  const groups: Record<string, Term[]> = {};
  for (const t of [...terms].sort((a, b) => a.term.localeCompare(b.term))) {
    const k = t.term[0].toUpperCase();
    (groups[k] ??= []).push(t);
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

export default function Glossary() {
  const grouped = groupAlpha(TERMS);
  const definitionLd = TERMS.map((t) => ({
    "@type": "DefinedTerm",
    name: t.term,
    description: t.definition,
    ...(t.abbrev ? { alternateName: t.abbrev } : {}),
  }));
  const ld = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: "Auditee PDLC & Compliance Glossary",
    hasDefinedTerm: definitionLd,
  };

  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Glossary — Requirements, Standards & Compliance Terms | Auditee"
        description="A practical glossary of PDLC, requirements management and compliance terms — BRD, PRD, FRD, ASIL, IEC 62304, HIPAA, SOC 2, ISO 27001, PCI DSS, ASPICE, SaMD, SOUP, ReqIF, OSLC and more."
        path="/glossary"
        keywords={["PDLC glossary", "compliance glossary", "requirements terms", "ASIL", "IEC 62304", "BRD definition"]}
        jsonLd={[ld, breadcrumbsLd([{ name: "Home", path: "/" }, { name: "Glossary", path: "/glossary" }])]}
      />
      <Navigation />
      <main className="pt-28 pb-24">
        <header className="max-w-3xl mx-auto px-6 text-center">
          <BookOpen className="w-10 h-10 mx-auto text-primary mb-4" />
          <h1 className="font-display text-4xl md:text-5xl font-bold text-slate-950 tracking-tight">Glossary</h1>
          <p className="mt-4 text-lg text-slate-600">
            45+ practical definitions for the requirements, standards and compliance terms you'll see across Auditee.
          </p>
        </header>

        <nav className="max-w-3xl mx-auto px-6 mt-10 flex flex-wrap justify-center gap-1.5" aria-label="Glossary index">
          {grouped.map(([letter]) => (
            <a
              key={letter}
              href={`#letter-${letter}`}
              className="w-8 h-8 inline-flex items-center justify-center rounded text-sm font-medium text-slate-700 hover:bg-primary hover:text-white transition-colors border border-slate-200"
            >
              {letter}
            </a>
          ))}
        </nav>

        <div className="max-w-3xl mx-auto px-6 mt-12 space-y-10">
          {grouped.map(([letter, items]) => (
            <section key={letter} id={`letter-${letter}`}>
              <h2 className="font-display text-2xl font-bold text-slate-950 mb-4">{letter}</h2>
              <div className="space-y-4">
                {items.map((t) => (
                  <Card key={t.term} className="p-5">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="font-display text-lg font-bold text-slate-950">{t.term}</h3>
                      {t.abbrev && <span className="text-sm text-slate-500">— {t.abbrev}</span>}
                    </div>
                    <p className="mt-2 text-sm text-slate-700 leading-relaxed">{t.definition}</p>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="max-w-3xl mx-auto px-6 mt-20 text-center">
          <h2 className="font-display text-2xl font-bold text-slate-950">Term we missed?</h2>
          <p className="mt-3 text-slate-600">Send us the gap; we'll add it (and credit you in the changelog).</p>
          <div className="mt-6">
            <Button asChild size="lg" className="gap-2">
              <Link href="/contact">Suggest a term <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
