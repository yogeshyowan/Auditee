// ----------------------------------------------------------------------------
// standards-blueprints.ts
// ----------------------------------------------------------------------------
// Central mapping from compliance frameworks → the *document-writing rules* a
// generated artefact (BRD/PRD/FRD/Test Cases/Requirements) MUST observe when
// that framework is in scope for the project.
//
// Each blueprint declares:
//   - `matches(codeOrName)`: predicate to attach the blueprint to a framework
//     (we pattern-match on substrings so synonymous codes like "ISO 27001"
//     and "ISO/IEC 27001" both hit).
//   - `label`: short human label used in prompts and citations.
//   - `documentSections`: required section topics that must appear in any
//     generated document (BRD/PRD/FRD/Test Cases). The model is instructed to
//     fold these into the existing canonical section structure rather than
//     replacing it.
//   - `requirementCoverage`: control-area topics the model MUST emit at least
//     one requirement for when generating a fresh requirements set.
//   - `citationHint`: a one-liner the model uses to remind itself how to cite
//     this framework's controls in the body text.
//
// Call `selectStandardsBlueprints(frameworks)` to get the union of blueprints
// that apply, then `renderStandardsAddendum(blueprints, mode)` to render the
// prompt addendum that goes into the system message.
// ----------------------------------------------------------------------------

export type StandardsBlueprint = {
  label: string;
  matches: (token: string) => boolean;
  documentSections: string[];
  requirementCoverage: string[];
  citationHint: string;
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

const has = (token: string, ...needles: string[]) => {
  const t = norm(token);
  return needles.some((n) => t.includes(norm(n)));
};

export const STANDARDS_BLUEPRINTS: StandardsBlueprint[] = [
  {
    label: "ISO/IEC 27001",
    matches: (t) => has(t, "iso27001", "isoiec27001"),
    documentSections: [
      "Information Security Management System scope statement",
      "Risk assessment & treatment summary mapped to Annex A controls",
      "Statement of Applicability (SoA) cross-reference",
      "Access control & cryptographic policy alignment",
    ],
    requirementCoverage: [
      "Information classification and handling rules",
      "Access control (identity, authentication, least-privilege, segregation of duties)",
      "Cryptographic controls at rest and in transit",
      "Logging, monitoring and incident response",
      "Supplier and third-party security obligations",
      "Business continuity and backup",
    ],
    citationHint: "Cite Annex A control identifiers (e.g. A.5.15, A.8.24) when referencing controls.",
  },
  {
    label: "ISO/IEC 27002",
    matches: (t) => has(t, "iso27002", "isoiec27002"),
    documentSections: [
      "Mapping of each functional area to ISO/IEC 27002 control themes (Organizational, People, Physical, Technological)",
    ],
    requirementCoverage: [
      "Acceptable use, screening and awareness",
      "Secure configuration and change management",
      "Network and communications security",
      "Application security and secure development lifecycle",
    ],
    citationHint: "Use 27002 control numbers (e.g. 5.10, 8.28) inline.",
  },
  {
    label: "SOC 2",
    matches: (t) => has(t, "soc2"),
    documentSections: [
      "Trust Services Criteria (Security, Availability, Confidentiality, Processing Integrity, Privacy) mapping",
      "Control description, owner, frequency, evidence type for each in-scope criterion",
    ],
    requirementCoverage: [
      "Logical access provisioning, review and de-provisioning",
      "Change management with peer review and audit trail",
      "System availability monitoring and incident response",
      "Vendor risk management",
      "Encryption and key management",
    ],
    citationHint: "Reference TSC criteria codes (CC1.x, CC6.x, A1.x) in the body.",
  },
  {
    label: "HIPAA",
    matches: (t) => has(t, "hipaa"),
    documentSections: [
      "PHI handling boundaries (collection, use, storage, transmission, destruction)",
      "Administrative, Physical and Technical Safeguards mapping",
      "Business Associate Agreement (BAA) flow-down",
      "Breach notification and incident response timing (≤60 days)",
    ],
    requirementCoverage: [
      "Unique user identification and emergency access procedure",
      "Automatic logoff and encryption of PHI at rest/in transit",
      "Audit controls and tamper-evident logging of PHI access",
      "Minimum necessary access and role-based authorisation",
      "Sanction policy and workforce training",
    ],
    citationHint: "Cite §164.308 / §164.312 / §164.314 paragraph references.",
  },
  {
    label: "FDA 21 CFR Part 11",
    matches: (t) => has(t, "21cfrpart11", "21cfr11", "fdacfr11", "part11"),
    documentSections: [
      "Electronic-records integrity controls",
      "Electronic-signature workflow (identity binding, intent capture, non-repudiation)",
      "System validation evidence per GAMP 5 category",
      "Audit-trail retention and reviewability",
    ],
    requirementCoverage: [
      "Tamper-evident audit trails on every record CRUD event",
      "Electronic signature components: printed name, date, meaning",
      "Closed-system access controls and authority checks",
      "Periodic and event-based system validation",
      "Record retention, archival and retrieval procedures",
    ],
    citationHint: "Cite §11.10 / §11.50 / §11.70 / §11.200 requirements.",
  },
  {
    label: "GDPR",
    matches: (t) => has(t, "gdpr"),
    documentSections: [
      "Lawful basis and processing purpose for each personal-data flow",
      "Data Protection Impact Assessment (DPIA) trigger and outcome",
      "Subject rights (access, rectification, erasure, portability) implementation",
      "Cross-border transfer safeguards (SCCs, adequacy)",
    ],
    requirementCoverage: [
      "Consent capture, withdrawal and audit",
      "Data minimisation and storage limitation",
      "72-hour breach notification workflow",
      "Records of processing activities (RoPA)",
      "Privacy by design and default in feature behaviour",
    ],
    citationHint: "Cite GDPR Articles (Art. 5, 25, 32, 33) inline.",
  },
  {
    label: "PCI DSS 4.0",
    matches: (t) => has(t, "pcidss"),
    documentSections: [
      "Cardholder Data Environment (CDE) scope diagram (narrative)",
      "12-requirement mapping with applicability",
      "Authenticated and unauthenticated scan plan",
      "Customised approach justification (if used)",
    ],
    requirementCoverage: [
      "Network segmentation between CDE and non-CDE",
      "Strong cryptography for stored and transmitted PAN",
      "MFA for all access into the CDE",
      "Quarterly vulnerability scans and annual penetration tests",
      "File-integrity monitoring on critical files",
    ],
    citationHint: "Cite PCI DSS requirement numbers (e.g. Req. 3.5.1, 8.4.2).",
  },
  {
    label: "NIST CSF 2.0",
    matches: (t) => has(t, "nistcsf"),
    documentSections: [
      "Function mapping (Govern, Identify, Protect, Detect, Respond, Recover)",
      "Tier and current/target profile statement",
    ],
    requirementCoverage: [
      "Asset inventory and risk-tier classification",
      "Continuous monitoring and anomaly detection",
      "Response and recovery playbooks",
      "Supply-chain risk management",
    ],
    citationHint: "Cite CSF subcategory IDs (e.g. PR.AC-1, DE.CM-7).",
  },
  {
    label: "NIST 800-53",
    matches: (t) => has(t, "nist80053"),
    documentSections: [
      "Control baseline statement (Low / Moderate / High)",
      "Tailoring rationale for any controls inherited or excluded",
    ],
    requirementCoverage: [
      "AC, AU, CM, IA, IR, SC and SI control families",
      "Continuous monitoring (CA-7) plan",
    ],
    citationHint: "Cite control IDs (AC-2(1), AU-12, IR-4(1)).",
  },
  {
    label: "IEC 62304",
    matches: (t) => has(t, "iec62304"),
    documentSections: [
      "Software Safety Classification (Class A / B / C) declaration",
      "Risk control measures mapped to identified hazards (per ISO 14971)",
      "Software development plan and configuration management",
      "Problem resolution and change-control workflow",
    ],
    requirementCoverage: [
      "Software requirements analysis with explicit risk-control trace",
      "Architecture design with segregation by safety class",
      "Unit and integration verification with coverage targets per class",
      "Anomaly handling, problem reports and CAPA loop",
      "Software Of Unknown Provenance (SOUP) inventory and risk assessment",
    ],
    citationHint: "Cite IEC 62304 clause numbers (5.2, 5.5, 7.x, 8.x, 9.x).",
  },
  {
    label: "ISO 13485",
    matches: (t) => has(t, "iso13485"),
    documentSections: [
      "Design and Development Plan with verification & validation milestones",
      "Design History File (DHF) reference structure",
      "Risk management file linkage (ISO 14971)",
    ],
    requirementCoverage: [
      "Design inputs, outputs, reviews and transfers",
      "CAPA process integration",
      "Document and record control",
    ],
    citationHint: "Cite ISO 13485 clauses (4.2.x, 7.3.x, 8.5.x).",
  },
  {
    label: "ISO 26262",
    matches: (t) => has(t, "iso26262"),
    documentSections: [
      "Item definition and ASIL allocation per hazard",
      "Functional, technical and software safety requirement decomposition",
      "Safety case skeleton with verification objectives",
    ],
    requirementCoverage: [
      "ASIL-decomposed safety requirements with verification method",
      "Confirmation measures (independence levels) per ASIL",
      "Tool qualification (TCL/TQL) statements for any tool in the chain",
    ],
    citationHint: "Cite ISO 26262 part:clause (e.g. Part 6, Clause 8.4.5).",
  },
  {
    label: "IEC 61508",
    matches: (t) => has(t, "iec61508"),
    documentSections: [
      "Safety Integrity Level (SIL) target with target failure measures",
      "Safety lifecycle phase mapping",
    ],
    requirementCoverage: [
      "Hardware fault tolerance and diagnostic coverage",
      "Systematic capability claim per SIL",
      "Validation against the safety requirements specification",
    ],
    citationHint: "Cite IEC 61508 part:clause (e.g. Part 3, 7.2).",
  },
  {
    label: "IEC 62443",
    matches: (t) => has(t, "iec62443"),
    documentSections: [
      "Zone & Conduit model for the system under control",
      "Security Level (SL-T) targets per zone",
      "Patch management and secure update path",
    ],
    requirementCoverage: [
      "Identification and authentication control (IAC) family",
      "Use control (UC) and system integrity (SI) requirements",
      "Restricted data flow (RDF) between zones",
      "Timely response to events (TRE) with SOC integration",
    ],
    citationHint: "Cite IEC 62443 FR/SR/CR identifiers (e.g. SR 1.1, CR 3.4).",
  },
  {
    label: "DO-178C",
    matches: (t) => has(t, "do178"),
    documentSections: [
      "Software Level (DAL A-E) declaration with rationale",
      "Plans for Software Aspects of Certification (PSAC) outline",
      "Verification independence statement per objective",
      "Structural coverage objective (statement / decision / MC/DC) per DAL",
    ],
    requirementCoverage: [
      "High-level and low-level software requirements with explicit trace",
      "Robustness test cases for every requirement",
      "Tool Qualification Level (TQL) statement for each tool used",
    ],
    citationHint: "Cite DO-178C objective tables (Table A-3 #N) and Annex A entries.",
  },
  {
    label: "ASPICE",
    matches: (t) => has(t, "aspice"),
    documentSections: [
      "Process group coverage map (ACQ / SYS / SWE / VAL / SUP / MAN)",
      "Bidirectional trace from stakeholder needs → system → software → unit",
    ],
    requirementCoverage: [
      "SYS.2 system requirements analysis outputs",
      "SWE.1 software requirements analysis with attributes per item",
      "Verification criteria for each requirement (SWE.4 / SWE.6)",
      "Configuration & change management evidence (SUP.8 / SUP.10)",
    ],
    citationHint: "Cite Automotive SPICE process IDs (SYS.2.BP1, SWE.1.BP3).",
  },
  {
    label: "CMMI",
    matches: (t) => has(t, "cmmi"),
    documentSections: [
      "Practice-area mapping (Estimating, Planning, Monitor & Control, Verification, Validation)",
      "Maturity / Capability Level target statement",
    ],
    requirementCoverage: [
      "Estimation method evidence (EST)",
      "Planning artefacts and dependencies (PLAN)",
      "Monitoring cadence and corrective action triggers (MC)",
    ],
    citationHint: "Cite CMMI practice IDs (PLAN 2.1, MC 1.2, VV 3.1).",
  },
  {
    label: "EU AI Act",
    matches: (t) => has(t, "euaiact", "aiact"),
    documentSections: [
      "AI system risk classification (prohibited / high-risk / limited / minimal)",
      "Conformity assessment route and post-market monitoring plan",
      "Technical documentation per Annex IV",
    ],
    requirementCoverage: [
      "Data governance and bias monitoring",
      "Human-oversight mechanisms",
      "Accuracy, robustness, and cybersecurity targets",
      "Logging and traceability of AI decisions",
    ],
    citationHint: "Cite EU AI Act Article numbers (Art. 9, 10, 14, 15).",
  },
  {
    label: "NIS2",
    matches: (t) => has(t, "nis2"),
    documentSections: [
      "Essential / important entity classification",
      "Incident-reporting flow with the 24h early warning + 72h notification deadlines",
    ],
    requirementCoverage: [
      "Risk-management measures from Article 21",
      "Supply-chain security and reporting obligations",
    ],
    citationHint: "Cite NIS2 Articles (Art. 21, 23).",
  },
  {
    label: "DORA",
    matches: (t) => has(t, "dora"),
    documentSections: [
      "ICT risk-management framework alignment",
      "Threat-led penetration testing (TLPT) plan",
      "ICT third-party arrangements register reference",
    ],
    requirementCoverage: [
      "ICT incident classification and reporting timeline",
      "Operational resilience testing programme",
      "Critical third-party concentration risk monitoring",
    ],
    citationHint: "Cite DORA Article numbers (Art. 5, 17, 24, 28).",
  },
  {
    label: "IEC 60601 (Medical Electrical Equipment)",
    matches: (t) => has(t, "iec60601", "60601"),
    documentSections: [
      "Device classification (Type B/BF/CF, IPxx, mode of operation, MOOP/MOPP)",
      "Essential performance and basic safety statement with risk acceptance criteria",
      "Means of protection (MOOP/MOPP) and electrical isolation barriers",
      "EMC test plan and intended electromagnetic environment (per IEC 60601-1-2)",
      "PEMS architecture and software safety classification (cross-reference IEC 62304 and IEC 60601-1 Cl. 14)",
      "Alarm system design (per IEC 60601-1-8): alarm conditions, priorities, signals, logging",
      "Usability engineering file cross-reference (IEC 60601-1-6 → IEC 62366-1)",
    ],
    requirementCoverage: [
      "Patient/operator electrical-shock protection limits in normal and single-fault conditions",
      "Limits on patient leakage and earth leakage current per applied-part type",
      "Mechanical strength, stability, expelled-parts and pressure-vessel safety",
      "Surface and applied-part temperature limits during normal and fault conditions",
      "Hazardous output protection for energy delivered to the patient (e.g. dose, voltage, fluid)",
      "EMC immunity and emission requirements for the intended use environment",
      "Alarm signal characteristics, escalation, latching and inactivation behavior",
    ],
    citationHint: "Cite IEC 60601-1 clauses (e.g. Cl. 8.7.3, Cl. 14, Cl. 17) and collateral standards (60601-1-2, 60601-1-6, 60601-1-8) by sub-clause.",
  },
  {
    label: "ISO 14971 (Medical Device Risk Management)",
    matches: (t) => has(t, "iso14971", "14971"),
    documentSections: [
      "Risk management plan: scope, criteria for acceptable risk, verification activities and review responsibilities",
      "Risk management file index: hazards → hazardous situations → harms with traceability to controls",
      "Risk analysis using a documented method (e.g. PHA, FMEA, FTA) with severity × probability scales",
      "Risk control measures applied in priority order (inherent safe design → protective measures → information for safety)",
      "Verification of implementation and effectiveness for each risk control",
      "Overall residual risk evaluation and benefit-risk analysis where applicable",
      "Production and post-production information feedback loop into the risk management process",
    ],
    requirementCoverage: [
      "Identification of intended use, reasonably foreseeable misuse and characteristics related to safety",
      "Hazard identification covering energy, biological, environmental, operational, IT/cyber and use-related hazards",
      "Risk estimation with documented severity and probability scales",
      "Risk control implementation and verification of effectiveness",
      "Disclosure of residual risks via labelling and information for safety",
      "Production/post-production monitoring and feedback into risk management",
    ],
    citationHint: "Cite ISO 14971:2019 clauses (e.g. 4.4, 5.4, 7.1, 7.4, 8, 10) and, where helpful, reference ISO/TR 24971 Annex H (examples of hazards, foreseeable sequences of events and hazardous situations).",
  },
  {
    label: "IEC 62366-1 (Medical Device Usability Engineering)",
    matches: (t) => has(t, "iec62366", "62366"),
    documentSections: [
      "Use specification: intended medical indication, patient population, user profile, use environment, operating principle",
      "User interface specification covering hazard-related use scenarios",
      "Usability engineering plan: formative and summative evaluation activities and acceptance criteria",
      "Hazard-related use scenarios linked to the risk management file (ISO 14971)",
      "Summative evaluation protocol, results and any residual usability-related risks",
      "UOUP rationale where reusing prior user interface designs",
    ],
    requirementCoverage: [
      "User profile, training assumptions and use environment constraints",
      "Identification of user-interface characteristics related to safety and potential use errors",
      "Hazard-related use scenarios for summative evaluation",
      "User-interface design requirements traceable to use specification and hazard-related scenarios",
      "Formative evaluation feedback loop and design iteration acceptance criteria",
      "Summative evaluation pass criteria and acceptable use-error rate",
    ],
    citationHint: "Cite IEC 62366-1:2015 clauses (e.g. 5.1, 5.4, 5.7, 5.9) and explicitly link to ISO 14971 hazard records.",
  },
  {
    label: "ISO 14155 (Clinical Investigation of Medical Devices)",
    matches: (t) => has(t, "iso14155", "14155"),
    documentSections: [
      "Clinical Investigation Plan (CIP) per Annex A: objectives, design, primary/secondary endpoints, statistical considerations",
      "Investigator's Brochure (IB) per Annex B: preclinical/prior clinical data, risks/benefits, IFU",
      "Risk-benefit assessment for clinical investigation subjects",
      "Ethical considerations: IRB/EC approvals, informed consent, vulnerable populations safeguards",
      "Adverse event (AE), serious adverse event (SAE) and device deficiency reporting procedures and timelines",
      "Sponsor and investigator responsibilities, monitoring plan, data management plan",
      "Clinical Investigation Report (CIR) outline with statistical analysis and conclusions on safety/performance",
    ],
    requirementCoverage: [
      "Subject eligibility, recruitment and informed consent procedures",
      "Primary and secondary clinical endpoints with statistical justification",
      "AE/SAE/device-deficiency definitions, recording and reporting timelines (sponsor, EC, regulatory authority)",
      "Monitoring plan including source data verification and protocol deviation handling",
      "Data integrity controls: audit trail, electronic case report forms (eCRF), source documents",
      "Sponsor QMS for the clinical investigation and document retention requirements",
    ],
    citationHint: "Cite ISO 14155:2020 clauses (e.g. 4, 5.5, 6.4, 8.2.4) and Annex references (A — CIP, B — IB, F — CIR).",
  },
  {
    label: "FDA 21 CFR Part 820 (Quality System Regulation)",
    matches: (t) => has(t, "21cfr820", "cfr820", "fda820", "qsr"),
    documentSections: [
      "Quality policy, quality manual and management responsibility statement",
      "Design controls: design plan, inputs, outputs, review, verification, validation, transfer, changes and DHF index",
      "Document control procedure with approval, distribution and obsolete document handling",
      "Purchasing controls: supplier qualification, evaluation, agreements and incoming acceptance",
      "Production and process controls including process validation (820.75) where outputs cannot be fully verified",
      "Nonconforming product disposition and CAPA procedure (820.90, 820.100)",
      "Records: DHR (820.184), DMR (820.181), QSR (820.186) indexes and retention",
      "Complaint files (820.198) and MDR-reportable event determination workflow",
    ],
    requirementCoverage: [
      "Design input requirements traceable to user needs and intended use",
      "Design verification activities demonstrating outputs meet inputs",
      "Design validation under defined operating conditions with production-equivalent units",
      "Process validation evidence (IQ/OQ/PQ) for processes whose output is not fully verifiable",
      "CAPA: data sources analysed, root-cause investigation, action implementation and effectiveness verification",
      "Complaint handling, MDR reportability evaluation and 21 CFR 803 reporting timelines",
      "DHR contents: dates, quantity, acceptance records, identification labels, UDI",
    ],
    citationHint: "Cite 21 CFR 820 sections (e.g. §820.30(g), §820.75, §820.100(a), §820.198(a)) inline.",
  },
  {
    label: "FDA 21 CFR Part 807 (Establishment Registration & 510(k))",
    matches: (t) => has(t, "21cfr807", "cfr807", "fda807", "510k", "510 k"),
    documentSections: [
      "Establishment registration record (FDA Form 3537) and device listing (FDA Form 3537a)",
      "510(k) cover letter, table of contents, indications-for-use statement and substantial-equivalence (SE) summary",
      "Device description including technological characteristics, principles of operation and hardware/software description",
      "Predicate device comparison table with SE rationale",
      "Performance data: bench, animal, clinical (if applicable), biocompatibility, sterilization, software (if applicable)",
      "Proposed labeling including IFU, warnings, contraindications and physician/patient labeling",
      "510(k) summary or 510(k) statement per §807.92 / §807.93",
      "Truthful and accurate certification per §807.94 signed by responsible party",
    ],
    requirementCoverage: [
      "Identification of device classification, product code and regulation number",
      "Predicate device(s) with K-number and SE comparison criteria",
      "Indications for use exactly as proposed for clearance",
      "Performance test reports demonstrating equivalence to predicate or addressing different technological characteristics",
      "Software documentation level (Basic / Enhanced) per FDA guidance for 510(k) software submissions",
      "Cybersecurity documentation per FDA premarket cybersecurity guidance",
      "Establishment registration and device listing prior to commercial distribution",
    ],
    citationHint: "Cite 21 CFR 807 sections (e.g. §807.81, §807.87, §807.92, §807.94) and FDA guidance documents by title and date.",
  },
  {
    label: "FDA 21 CFR Part 814 (Premarket Approval — PMA)",
    matches: (t) => has(t, "21cfr814", "cfr814", "fda814", "pma"),
    documentSections: [
      "PMA application table of contents per §814.20",
      "Indications for use, device description, alternative practices and procedures",
      "Marketing history of the device in foreign countries",
      "Summary of nonclinical laboratory studies (microbiology, toxicology, immunology, biocompatibility, software, animal)",
      "Summary of clinical investigations including study design, endpoints, results, AEs/SAEs and statistical analyses",
      "Risk-benefit assessment supported by clinical and nonclinical data",
      "Manufacturing information demonstrating QSR (21 CFR 820) compliance",
      "Proposed labeling including IFU, warnings, contraindications and patient labeling where applicable",
      "Postapproval study commitments and PAS (Post-Approval Study) protocols",
      "Environmental assessment or claim of categorical exclusion",
    ],
    requirementCoverage: [
      "Valid scientific evidence of safety and effectiveness for the proposed indications",
      "Statistical justification and powering of pivotal clinical study endpoints",
      "Manufacturing process validation aligned with §820.75",
      "Postapproval study design, milestones and reporting commitments",
      "Annual / periodic reports per §814.84 including MDR-reportable events",
      "PMA supplement criteria for changes affecting safety or effectiveness (§814.39)",
    ],
    citationHint: "Cite 21 CFR 814 sections (e.g. §814.20(b), §814.39, §814.80, §814.84) and reference applicable FDA guidance documents.",
  },
  {
    label: "EU MDR 2017/745",
    matches: (t) => has(t, "mdr2017745", "eumdr", "mdr745", "regulation2017745"),
    documentSections: [
      "Device classification and rationale per Annex VIII (Class I, IIa, IIb or III)",
      "GSPR (Annex I) conformity checklist with evidence references",
      "Technical documentation per Annex II: device description, design and manufacturing, GSPR, benefit-risk, V&V",
      "Clinical Evaluation Plan and Clinical Evaluation Report (CER) per Article 61 and Annex XIV Part A",
      "Post-Market Surveillance (PMS) plan (Annex III) and PSUR / PMS report per device class",
      "PMCF plan and PMCF evaluation report per Annex XIV Part B",
      "EU Declaration of Conformity per Article 19 and CE-marking statement per Article 20",
      "PRRC designation and qualifications record per Article 15",
      "Risk management file integrated with the technical documentation (per ISO 14971)",
      "UDI assignment and EUDAMED registration record per Article 27",
    ],
    requirementCoverage: [
      "Intended purpose statement aligned with device class and conformity-assessment route",
      "GSPR-by-GSPR conformity rationale with verification/validation evidence",
      "Clinical evidence sufficient for the device class (clinical investigations or equivalence)",
      "PMS data collection: complaints, vigilance, trend reports, PSUR/PMS report cadence",
      "Vigilance reporting timelines: serious incident ≤15 days; serious public health threat ≤2 days; death/unanticipated serious deterioration ≤10 days",
      "Implant card content for implantable devices (Article 18)",
      "Person responsible for regulatory compliance (PRRC) qualifications",
    ],
    citationHint: "Cite MDR 2017/745 Articles (e.g. Art. 10, 15, 27, 52, 61, 83, 87) and Annexes (I — GSPR, II — Tech Doc, III — PMS, VIII — Classification, XIV — CER/PMCF).",
  },
  {
    label: "EU IVDR 2017/746",
    matches: (t) => has(t, "ivdr2017746", "euivdr", "ivdr746", "regulation2017746", "ivdr"),
    documentSections: [
      "IVD classification and rationale per Annex VIII (Class A, B, C or D)",
      "GSPR (Annex I) conformity checklist with evidence references",
      "Technical documentation per Annex II including device description, design, manufacturing, GSPR and benefit-risk",
      "Performance Evaluation Plan and Performance Evaluation Report (PER) per Article 56 and Annex XIII",
      "Evidence of scientific validity, analytical performance and clinical performance",
      "Post-Market Surveillance (PMS) plan and PSUR (Class C, D) or PMS report (Class A, B)",
      "Post-Market Performance Follow-Up (PMPF) plan and PMPF evaluation report per Annex XIII Part B",
      "EU Declaration of Conformity per Article 17 and CE marking",
      "PRRC designation per Article 15 and risk management file (per ISO 14971)",
      "UDI assignment and EUDAMED registration record per Article 24",
    ],
    requirementCoverage: [
      "Intended purpose including the analyte, function (screening/diagnosis/monitoring), specimen type and intended user",
      "Scientific validity demonstration (analyte ↔ clinical condition association)",
      "Analytical performance: accuracy, precision, sensitivity, specificity, limit of detection, measuring range",
      "Clinical performance: diagnostic sensitivity, diagnostic specificity, predictive values, likelihood ratios",
      "PMS data flow from market complaints/vigilance into the PER update cycle",
      "Vigilance reporting timelines for serious incidents and trend reporting per Articles 82–84",
      "Companion-diagnostic / near-patient / self-test specific requirements where applicable",
    ],
    citationHint: "Cite IVDR 2017/746 Articles (e.g. Art. 5, 10, 24, 47, 56, 78, 83, 84) and Annexes (I — GSPR, II — Tech Doc, VIII — Classification, XIII — Performance Evaluation/PMPF).",
  },
];

/**
 * Returns the deduped set of blueprints that match any of the supplied
 * frameworks. We match against both the framework code AND name, so input
 * data like { code: "ISO 27001", name: "Information Security" } still attaches
 * the ISO/IEC 27001 blueprint.
 */
export function selectStandardsBlueprints(
  frameworks: Array<{ code?: string | null; name?: string | null }>,
): StandardsBlueprint[] {
  const out: StandardsBlueprint[] = [];
  const seen = new Set<string>();
  for (const fw of frameworks) {
    const tokens = [fw.code ?? "", fw.name ?? ""].filter(Boolean);
    for (const bp of STANDARDS_BLUEPRINTS) {
      if (seen.has(bp.label)) continue;
      if (tokens.some((tok) => bp.matches(tok))) {
        out.push(bp);
        seen.add(bp.label);
      }
    }
  }
  return out;
}

/**
 * Render the addendum that goes at the END of the system prompt for either a
 * document generator (`mode = "document"`) or the requirements generator
 * (`mode = "requirements"`). Returns an empty string when no blueprints apply.
 */
export function renderStandardsAddendum(
  blueprints: StandardsBlueprint[],
  mode: "document" | "requirements",
): string {
  if (blueprints.length === 0) return "";
  const lines: string[] = [
    "",
    "=== APPLICABLE STANDARDS — MANDATORY COMPLIANCE ===",
    `The following ${blueprints.length === 1 ? "standard is" : "standards are"} in scope for this project. The output MUST visibly address the topics listed below for each standard. Do NOT skip any of these — if a topic genuinely does not apply, state so explicitly and explain why in one short sentence.`,
    "",
  ];
  for (const bp of blueprints) {
    lines.push(`-- ${bp.label} --`);
    if (mode === "document") {
      lines.push(`Required document coverage:`);
      for (const s of bp.documentSections) lines.push(`  • ${s}`);
    } else {
      lines.push(`Required requirement coverage (emit at least one requirement per topic):`);
      for (const s of bp.requirementCoverage) lines.push(`  • ${s}`);
    }
    lines.push(`Citation rule: ${bp.citationHint}`);
    lines.push("");
  }
  lines.push(
    mode === "document"
      ? "Fold these required topics into the existing canonical section structure. Do NOT replace the canonical sections; extend them."
      : "Each generated requirement that addresses one of the topics above MUST list the corresponding standard's code in linkedFrameworkCodes.",
  );
  return lines.join("\n");
}
