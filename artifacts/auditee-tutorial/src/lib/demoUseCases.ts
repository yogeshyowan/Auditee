/**
 * Per-module use-case storylines anchored to ONE real seeded demo project.
 * Used by every Module*.tsx and mirrored on the eltegra-site detail page.
 *
 * Each entry is a self-contained story: project name, domain, requirement IDs,
 * sample data rows, and the 4 step captions (timed to 23s total like every module).
 */

export type ModuleKey =
  | 'dashboard' | 'sources' | 'interview' | 'requirements' | 'gaps'
  | 'traceability' | 'compliance' | 'capa' | 'defects' | 'tests'
  | 'reports' | 'workflows' | 'analytics' | 'recurring-audits';

export type DemoStoryline = {
  project: string;
  domain: string;
  idPrefix: string;
  hero: { kicker: string; lineA: string; lineB: string; subtitle: string };
  cues: { startMs: number; endMs: number; text: string }[];
  steps: { title: string; body: string }[];
  finale: { stat: string; label: string; sub: string };
  coverage: { standards: string[]; tools: string[] };
};

export type ExtendedDemo = {
  slug: string;
  project: string;
  domain: string;
  blurb: string;
  standards: string[];
  tools: string[];
};

/**
 * Vignette demo projects used to surface platform breadth across standards
 * not anchored by the 14 main module storylines (avionics, railway, robotics,
 * power grid, AI Act). Surfaced on the eltegra-site Demo Videos index.
 */
export const EXTENDED_DEMOS: ExtendedDemo[] = [
  {
    slug: 'hermes',
    project: 'Hermes — Aircraft Flight Management System',
    domain: 'Avionics',
    blurb:
      "Airborne software with DAL-A traceability — every requirement linked through low-level reqs to source code, with full ARP4754A allocation.",
    standards: ['DO-178C DAL-A', 'DO-254', 'ARP4754A', 'IEEE 1012', 'IEEE 828'],
    tools: ['IBM DOORS Next', 'Polarion', 'GitLab', 'LDRA', 'VectorCAST'],
  },
  {
    slug: 'pioneer',
    project: 'Pioneer — High-Speed Rail Signalling',
    domain: 'Rail',
    blurb:
      "On-board signalling SIL-4 lifecycle — RAMS, software, signalling electronics and rolling-stock software in a single trace graph.",
    standards: ['EN 50128 SIL-4', 'EN 50126 RAMS', 'EN 50129', 'EN 50657', 'IEC 61508'],
    tools: ['IBM DOORS', 'Jama', 'GitHub Enterprise', 'Polyspace', 'Reactis'],
  },
  {
    slug: 'vulcan',
    project: 'Vulcan — Robotic Welding Cell',
    domain: 'Industrial Robotics',
    blurb:
      "Collaborative robotic cell — machine safety, robot safety, electrical equipment and PLC code unified under one CAPA workflow.",
    standards: ['ISO 10218-1', 'ISO 13849-1 PLd', 'IEC 60204-1', 'IEC 61131-3', 'IEC 62443'],
    tools: ['Codesys', 'GitHub', 'Jira', 'TestRail', 'ServiceNow'],
  },
  {
    slug: 'ironclad',
    project: 'Ironclad — Power Grid SCADA',
    domain: 'Critical Infrastructure',
    blurb:
      "Bulk-electric SCADA & pipeline control — NERC CIP audit packets, ISA-95 zone & conduit model, and IEC 61511 SIS lifecycle in one place.",
    standards: ['NERC CIP', 'IEC 62443', 'IEC 61511', 'API 1164', 'ISA-95 / IEC 62264'],
    tools: ['OSIsoft PI', 'Splunk', 'Azure DevOps', 'ServiceNow', 'Tenable OT'],
  },
  {
    slug: 'lyra',
    project: 'Lyra — Generative AI Underwriting',
    domain: 'Responsible AI',
    blurb:
      "High-risk AI system under the EU AI Act — model cards, risk register, bias evaluation and post-market monitoring evidence.",
    standards: ['EU AI Act (high-risk)', 'ISO/IEC 42001', 'NIST AI RMF', 'ISO 31000', 'GDPR'],
    tools: ['MLflow', 'Weights & Biases', 'Hugging Face', 'GitHub', 'Snowflake'],
  },
];

export const TUTORIAL_TOTAL_MS = 23000;

export const DEMO_USE_CASES: Record<ModuleKey, DemoStoryline> = {
  dashboard: {
    project: 'Helios — Patient Onboarding',
    domain: 'Healthcare',
    idPrefix: 'HEL',
    hero: {
      kicker: 'Step 14 · Dashboard',
      lineA: 'Your Helios programme,',
      lineB: 'one screen, always live.',
      subtitle: 'HIPAA + DPDP + SOC 2 rings, open CAPAs, gap aging — exec view for the whole onboarding squad.',
    },
    cues: [
      { startMs: 0,     endMs: 5500,  text: "Helios is the patient-onboarding product Auditee runs every day — open the dashboard." },
      { startMs: 5500,  endMs: 12000, text: "HIPAA 92%, DPDP 88%, SOC 2 87% — three live framework rings, no spreadsheets." },
      { startMs: 12000, endMs: 18000, text: "Open gaps, CAPA aging, recent activity — every metric is one click from evidence." },
      { startMs: 18000, endMs: 23000, text: "Daily summary email lands at 7 a.m. Helios stays audit-ready, every morning." },
    ],
    steps: [
      { title: 'Open the Helios project', body: 'Pick Helios — Patient Onboarding from the project switcher.' },
      { title: 'Read the rings', body: 'HIPAA, DPDP and SOC 2 are recomputed on every change — green means evidence is fresh.' },
      { title: 'Drill into a tile', body: 'Click any gap or CAPA card to jump straight to its page with the right project pre-selected.' },
      { title: 'Subscribe to the daily summary', body: 'Toggle the summary email so the team learns what changed overnight without logging in.' },
    ],
    finale: { stat: '92%', label: 'HIPAA Coverage', sub: 'Helios · 3 frameworks · 14 days to audit' },
    coverage: {
      standards: ['HIPAA', 'DPDP', 'SOC 2 Type II', 'ISO 27001', 'GDPR', 'NIST CSF 2.0'],
      tools: ['Email digest', 'Slack', 'Jira', 'Snowflake', 'Looker'],
    },
  },

  sources: {
    project: 'Orion — Cardiac Monitor Firmware',
    domain: 'Medical Devices',
    idPrefix: 'ORN',
    hero: {
      kicker: 'Step 01 · Project Sources',
      lineA: 'Orion firmware,',
      lineB: 'every source connected.',
      subtitle: 'GitHub firmware, Jira tickets, IBM DOORS legacy specs, twelve clinical PDFs — wired into one graph in seconds.',
    },
    cues: [
      { startMs: 0,     endMs: 5500,  text: "Orion is the cardiac monitor firmware — let's wire up its sources first." },
      { startMs: 5500,  endMs: 12000, text: "Pull GitHub firmware, Jira tickets, IBM DOORS legacy specs, twelve clinical evaluation PDFs." },
      { startMs: 12000, endMs: 18000, text: "Auditee parses all of them in seconds — code, requirements, standards into one graph." },
      { startMs: 18000, endMs: 23000, text: "Six sources connected. 184 Orion requirements ready for the next step." },
    ],
    steps: [
      { title: 'Open Project Sources for Orion', body: 'In the Orion — Cardiac Monitor Firmware project, go to Project Sources.' },
      { title: 'Connect each tool', body: 'Add IBM DOORS, GitHub, Jira, Azure DevOps, ReqIF and bulk-upload the 12 clinical PDFs.' },
      { title: 'Watch the ingest', body: 'Auditee parses requirements, indexes code, cross-references IEC 62304 and ISO 14971.' },
      { title: 'Confirm the graph', body: '6 sources, 184 requirements, 1,840 firmware files — ready for AI requirements generation.' },
    ],
    finale: { stat: '6', label: 'Sources Connected', sub: 'Orion · 184 reqs · 1,840 files · 12 standards' },
    coverage: {
      standards: ['IEC 62304', 'ISO 14971', 'ISO 13485', 'IEC 60601', 'IEC 62366', 'FDA 21 CFR 820', 'MDR 2017/745', 'ISO/IEC/IEEE 42010'],
      tools: ['IBM DOORS', 'GitHub', 'Jira', 'Azure DevOps', 'ReqIF', 'PDF bulk upload'],
    },
  },

  interview: {
    project: 'Aesop — Clinical Trial eCRF',
    domain: 'Clinical Trials',
    idPrefix: 'AES',
    hero: {
      kicker: 'Step 02 · Smart Interview',
      lineA: 'From conversation',
      lineB: 'to GCP-grade requirements.',
      subtitle: 'Auditee interviews the Aesop clinical PM live, classifying each answer to ICH-GCP E6(R3) and 21 CFR Part 11.',
    },
    cues: [
      { startMs: 0,     endMs: 5500,  text: "Aesop is a clinical trial eCRF — Auditee interviews the PM, Riya, live." },
      { startMs: 5500,  endMs: 12000, text: "Twelve targeted questions — patient population, electronic signature flow, audit trail granularity, market." },
      { startMs: 12000, endMs: 18000, text: "Every answer becomes a structured BRS, PRD or FRD requirement, with full conversation provenance." },
      { startMs: 18000, endMs: 23000, text: "Aesop is classified — ICH-GCP E6(R3) plus 21 CFR Part 11. Ready for the full requirement set." },
    ],
    steps: [
      { title: 'Open Smart Interview on Aesop', body: 'Inside Aesop — Clinical Trial eCRF, click Smart Interview.' },
      { title: 'Answer the AI', body: 'Auditee asks 12 standards-aware questions about subject enrolment, e-signatures and audit trails.' },
      { title: 'Watch reqs appear', body: 'Each answer is classified BRS / PRD / FRD with the original chat turn linked as provenance.' },
      { title: 'Promote to baseline', body: 'Approve the 18 generated requirements — Aesop is auto-classified to ICH-GCP and 21 CFR Part 11.' },
    ],
    finale: { stat: '18', label: 'Requirements Elicited', sub: 'Aesop · BRS · PRD · FRD · full provenance chain' },
    coverage: {
      standards: ['ICH-GCP E6(R3)', 'FDA 21 CFR Part 11', 'ISO 14155', 'GDPR', 'HIPAA', 'IEEE 1063'],
      tools: ['Conversational AI', 'Microsoft Word', 'Google Docs', 'Confluence', 'Smart Sheet'],
    },
  },

  requirements: {
    project: 'Apollo — EV Battery Management System',
    domain: 'Automotive',
    idPrefix: 'APL',
    hero: {
      kicker: 'Step 03 · Requirements',
      lineA: 'Every Apollo BMS spec,',
      lineB: 'standards-tagged and versioned.',
      subtitle: 'BRS, PRD and FRD requirements with ISO 26262, ISO 21434, UN R155 and IEC 61508 mapping in one view.',
    },
    cues: [
      { startMs: 0,     endMs: 5500,  text: "Apollo is the EV battery management system — generate the full requirement set." },
      { startMs: 5500,  endMs: 12000, text: "Each requirement auto-tagged ISO 26262, ISO 21434, UN R155, IEC 61508 — four standards, one click." },
      { startMs: 12000, endMs: 18000, text: "Edit, baseline, version, export to DOORS or ReqIF for the Apollo regulatory team." },
      { startMs: 18000, endMs: 23000, text: "192 Apollo requirements tracked. Fully traceable from spec to firmware to test." },
    ],
    steps: [
      { title: 'Generate from sources', body: 'In Apollo, click Generate — AI drafts BRS / PRD / FRD from connected sources.' },
      { title: 'Tag the standards', body: 'Auditee maps each to ISO 26262 ASIL-C, ISO 21434 TARA, UN R155 and IEC 61508.' },
      { title: 'Baseline & version', body: 'Lock the v1 baseline. Every later edit creates a tracked diff with a change reason.' },
      { title: 'Export', body: 'Push to IBM DOORS Next or download a clean ReqIF for the OEM regulatory team.' },
    ],
    finale: { stat: '192', label: 'Requirements Tracked', sub: 'Apollo · baselined · versioned · export-ready' },
    coverage: {
      standards: ['ISO 26262 ASIL-C', 'ISO/SAE 21434', 'UN R155', 'IEC 61508', 'Automotive SPICE 4.0', 'ASPICE Cyber 2.0', 'CMMI v3.0'],
      tools: ['IBM DOORS Next', 'Polarion', 'ReqIF', 'Jama', 'Azure DevOps'],
    },
  },

  gaps: {
    project: 'Ares — ADAS Vision Stack',
    domain: 'Automotive Safety',
    idPrefix: 'ARE',
    hero: {
      kicker: 'Step 04 · Gap Detection',
      lineA: 'Find Ares coverage gaps',
      lineB: 'before homologation.',
      subtitle: 'AI scans every Ares vision file against ISO 26262 + ISO 21448 SOTIF — surfaces missing tests, untraced code and unmitigated hazards.',
    },
    cues: [
      { startMs: 0,     endMs: 5500,  text: "Ares is the ADAS vision stack — Auditee scans spec and code side by side." },
      { startMs: 5500,  endMs: 12000, text: "Eighteen gaps surfaced — no SOTIF rain test, untraced lane-keep module, missing ISO 21448 hazard." },
      { startMs: 12000, endMs: 18000, text: "Each gap auto-links to a CAPA — owner assigned, due date set, evidence required." },
      { startMs: 18000, endMs: 23000, text: "All eighteen gaps closed before the Ares pre-homologation review. Crisis averted." },
    ],
    steps: [
      { title: 'Run gap scan on Ares', body: 'Open Gap Detection inside Ares — ADAS Vision Stack and click Scan.' },
      { title: 'Review findings', body: 'AI lists missing tests, untraced files, unmitigated hazards — sorted critical first.' },
      { title: 'Convert to CAPA', body: 'One-click open a CAPA per gap with owner, due date and standard control linked.' },
      { title: 'Verify clean run', body: 'Re-scan after fixes — gap count drops to zero, ready for homologation review.' },
    ],
    finale: { stat: '18', label: 'Ares Gaps Closed', sub: 'ISO 26262 + SOTIF · all auto-linked to CAPA' },
    coverage: {
      standards: ['ISO 26262 ASIL-D', 'ISO 21448 SOTIF', 'ISO/SAE 21434', 'UN R157', 'ASPICE Cyber 2.0', 'ISO/IEC/IEEE 29119', 'IEEE 1012 V&V'],
      tools: ['GitHub', 'Vector CANoe', 'TestRail', 'Polyspace', 'Coverity'],
    },
  },

  traceability: {
    project: 'Titan — Industrial PLC Control System',
    domain: 'Industrial Safety',
    idPrefix: 'TTN',
    hero: {
      kicker: 'Step 05 · Traceability',
      lineA: 'Walk Titan PLC traceability,',
      lineB: 'one requirement, end to end.',
      subtitle: 'IEC 61508 SIL-3 chain — PRD-014 → ladder logic → 3 unit tests → 2 integration tests → zero open defects.',
    },
    cues: [
      { startMs: 0,     endMs: 5500,  text: "Titan is the industrial PLC control system — walk the trace graph end to end." },
      { startMs: 5500,  endMs: 12000, text: "PRD-014 emergency stop links to plc_estop dot st, three unit tests, two integration tests, zero open defects." },
      { startMs: 12000, endMs: 18000, text: "Click any node — see what's covered, what's broken, what's missing. Instantly." },
      { startMs: 18000, endMs: 23000, text: "192 Titan requirements, 91% chain coverage. The TUV auditor will love this." },
    ],
    steps: [
      { title: 'Open the Titan trace graph', body: 'Inside Titan, open Traceability. The graph renders the live req-code-test-CAPA web.' },
      { title: 'Click PRD-014', body: 'Selecting the emergency-stop requirement highlights every linked node end-to-end.' },
      { title: 'Inspect coverage', body: '3 unit tests pass, 2 integration tests pass, 0 open defects, 1 closed CAPA — full evidence.' },
      { title: 'Export for the auditor', body: 'Download the trace matrix as XLSX or PDF for the IEC 61508 SIL-3 dossier.' },
    ],
    finale: { stat: '91%', label: 'Titan Trace Coverage', sub: 'Req → code → test → audit · fully linked' },
    coverage: {
      standards: ['IEC 61508 SIL-3', 'IEC 61511', 'IEC 61131-3', 'IEC 60204-1', 'ISO 13849-1', 'IEC 62443', 'ISA-95 / IEC 62264'],
      tools: ['Codesys', 'TIA Portal', 'Git', 'Jira', 'Azure Test Plans'],
    },
  },

  compliance: {
    project: 'Nexus — Hospital EHR Modernisation',
    domain: 'Healthcare IT',
    idPrefix: 'NEX',
    hero: {
      kicker: 'Step 06 · Compliance',
      lineA: 'Nexus EHR — always',
      lineB: 'audit-ready, every framework, live.',
      subtitle: 'HIPAA, HITRUST CSF, ISO 27001, SOC 2 and FHIR R4 — coverage scores update on every commit Nexus engineers ship.',
    },
    cues: [
      { startMs: 0,     endMs: 5500,  text: "Nexus is the hospital EHR modernisation — see live coverage across five frameworks." },
      { startMs: 5500,  endMs: 12000, text: "HIPAA 89%, HITRUST 81%, ISO 27001 76%, SOC 2 88%, FHIR R4 92% — all scored from real evidence." },
      { startMs: 12000, endMs: 18000, text: "Scores update automatically as Ananya merges Nexus changes — no manual recompute." },
      { startMs: 18000, endMs: 23000, text: "Walk any finding straight into a CAPA. Continuous compliance, baked into the pipeline." },
    ],
    steps: [
      { title: 'Open Compliance for Nexus', body: 'In Nexus — Hospital EHR Modernisation, open the Compliance page.' },
      { title: 'Read the framework rings', body: 'Each ring is a live coverage score — green is evidence-ready, amber means gaps remain.' },
      { title: 'Inspect a finding', body: 'Click HIPAA §164.312(b) — Auditee shows the missing audit-log control with code refs.' },
      { title: 'Open a CAPA', body: 'One click converts the finding into CAPA-022, owner Ananya, due in 14 days, fully linked.' },
    ],
    finale: { stat: '5', label: 'Frameworks Active on Nexus', sub: 'Continuously monitored · audit-ready export' },
    coverage: {
      standards: ['HIPAA', 'HITRUST CSF', 'ISO/IEC 27001:2022', 'ISO/IEC 27002:2022', 'SOC 2 Type II', 'FHIR R4', 'GDPR', 'NIST CSF 2.0'],
      tools: ['GitHub', 'AWS Config', 'Datadog', 'Snowflake', 'Okta'],
    },
  },

  capa: {
    project: 'Vega — Claims Intelligence',
    domain: 'Insurance',
    idPrefix: 'VEG',
    hero: {
      kicker: 'Step 07 · CAPA Actions',
      lineA: 'Every Vega finding becomes',
      lineB: 'a tracked corrective action.',
      subtitle: 'Field complaint → root cause → owner → due date → verified closure — the full CAPA lifecycle, audit-grade.',
    },
    cues: [
      { startMs: 0,     endMs: 5500,  text: "A field complaint comes in — Vega's claims model is denying valid pet claims." },
      { startMs: 5500,  endMs: 12000, text: "CAPA-007 auto-opens. Owner Marcus. Due in fourteen days. Root cause — biased training set." },
      { startMs: 12000, endMs: 18000, text: "Track Open, In Progress, In Review, Verified Closed — every step audit-grade for the regulator." },
      { startMs: 18000, endMs: 23000, text: "Field issue, to fix, to verified closure. Vega ships the patch. Nothing slips through the cracks." },
    ],
    steps: [
      { title: 'Open CAPA on Vega', body: 'Inside Vega — Claims Intelligence, click the CAPA page.' },
      { title: 'Triage the auto-opened CAPA', body: 'CAPA-007 was created from a field complaint — owner, root cause and due date pre-filled.' },
      { title: 'Move through the lifecycle', body: 'Open → In Progress → In Review → Verified Closed, every transition logged with evidence.' },
      { title: 'Close with proof', body: 'Attach the retrained model card and the regression test run. Vega CAPA is audit-clean.' },
    ],
    finale: { stat: '100%', label: 'Vega CAPA Closure', sub: 'Full evidence chain · audit-ready' },
    coverage: {
      standards: ['IRDAI', 'NAIC Model 668', 'EU AI Act (limited risk)', 'ISO 31000', 'ISO 9001', 'ISO/IEC 42001'],
      tools: ['Jira', 'ServiceNow', 'Salesforce', 'MLflow', 'Email triage'],
    },
  },

  defects: {
    project: 'Sterling — Core Banking Platform',
    domain: 'Banking',
    idPrefix: 'STR',
    hero: {
      kicker: 'Step 08 · Defects',
      lineA: 'Sterling defects, linked',
      lineB: 'back to what they broke.',
      subtitle: 'Pulled from Jira, Bugzilla and ServiceNow — every Sterling defect auto-links to its requirement, test and CAPA.',
    },
    cues: [
      { startMs: 0,     endMs: 5500,  text: "Sterling is the core banking platform — defects flow in from Jira automatically." },
      { startMs: 5500,  endMs: 12000, text: "DEF-219, posting fails on UPI mandate creation — auto-linked to PRD-014 and the test that missed it." },
      { startMs: 12000, endMs: 18000, text: "Trends, churn, age, CAPA linkage — see Sterling's full health, not just open ticket counts." },
      { startMs: 18000, endMs: 23000, text: "DEF-219 fixed in commit a3f7b2. Closed loop. Sterling stays PCI-DSS clean." },
    ],
    steps: [
      { title: 'Open Defects on Sterling', body: 'Inside Sterling — Core Banking Platform, open the Defects board.' },
      { title: 'Connect Jira / Bugzilla / ServiceNow', body: 'Auditee pulls every defect, syncing every 5 minutes — no manual import.' },
      { title: 'Inspect the link', body: 'Each defect auto-links to its requirement and the test that should have caught it.' },
      { title: 'Watch the trend', body: 'Defect-leakage chart shows monthly churn — Sterling drops from 18 to 7 in two sprints.' },
    ],
    finale: { stat: '87', label: 'Sterling Defects Tracked', sub: 'Jira · Bugzilla · ServiceNow · linked to reqs' },
    coverage: {
      standards: ['PCI DSS v4.0', 'DORA', 'NIS2', 'RBI IT Framework', 'ISO/IEC 27001:2022', 'SOC 2 Type II', 'NIST CSF 2.0'],
      tools: ['Jira', 'Bugzilla', 'ServiceNow', 'GitHub', 'Splunk'],
    },
  },

  tests: {
    project: 'Bastion — Cloud Security Posture',
    domain: 'Cloud Security',
    idPrefix: 'BST',
    hero: {
      kicker: 'Step 09 · Test Cases',
      lineA: 'Bastion tests — AI-generated,',
      lineB: 'aligned to your controls.',
      subtitle: 'Every CIS Benchmark and SOC 2 control gets the tests its standard demands — exportable to TestRail, Xray, qTest.',
    },
    cues: [
      { startMs: 0,     endMs: 5500,  text: "Bastion is the cloud security posture product — generate test cases for every control." },
      { startMs: 5500,  endMs: 12000, text: "312 test cases — CIS Benchmark coverage 92%, SOC 2 78%, ISO 27001 84%. Marcus signs off in TestRail." },
      { startMs: 12000, endMs: 18000, text: "Push directly to TestRail, Xray, qTest, or Azure Test Plans — one click, mapped to your reqs." },
      { startMs: 18000, endMs: 23000, text: "From spec to verified coverage. Bastion's verification plan is ready for the SOC 2 auditor." },
    ],
    steps: [
      { title: 'Open Tests for Bastion', body: 'Inside Bastion — Cloud Security Posture, click Test Cases.' },
      { title: 'Generate from requirements', body: 'AI drafts a structured test for every requirement, tagged to CIS / SOC 2 / ISO 27001.' },
      { title: 'Review and approve', body: 'Marcus accepts 312 cases in batch. Failed cases stay flagged with a re-run button.' },
      { title: 'Push to TestRail', body: 'One click syncs the suite to TestRail with full requirement traceability.' },
    ],
    finale: { stat: '312', label: 'Bastion Tests Generated', sub: 'Standards-aligned · export-ready' },
    coverage: {
      standards: ['CIS Benchmarks', 'SOC 2 Type II', 'ISO/IEC 27001:2022', 'ISO/IEC 27002:2022', 'NIST CSF 2.0', 'NIS2', 'ISO/IEC/IEEE 29119', 'IEEE 730'],
      tools: ['TestRail', 'Xray', 'qTest', 'Azure Test Plans', 'GitHub Actions'],
    },
  },

  reports: {
    project: 'Atlas — Trade Settlement Engine',
    domain: 'Capital Markets',
    idPrefix: 'ATL',
    hero: {
      kicker: 'Step 10 · AI Reports',
      lineA: 'Atlas audit documents,',
      lineB: 'in one click.',
      subtitle: 'CFTC Reg AT report, MiFID II RTS 6, SOC 2 Type II audit packet — generated from Atlas live data, not a blank template.',
    },
    cues: [
      { startMs: 0,     endMs: 5500,  text: "Atlas is the trade settlement engine — the SEC needs an audit packet next week." },
      { startMs: 5500,  endMs: 12000, text: "One click. 247-page audit packet generated in four minutes — every section pulled from live reqs, tests, CAPA evidence." },
      { startMs: 12000, endMs: 18000, text: "MiFID II RTS 6, CFTC Reg AT, SOC 2 Type II — pick any, generate, sign." },
      { startMs: 18000, endMs: 23000, text: "Weeks of manual writing — done. Atlas is ready for the SEC reviewer." },
    ],
    steps: [
      { title: 'Open Reports for Atlas', body: 'Inside Atlas — Trade Settlement Engine, click Reports.' },
      { title: 'Pick the document', body: 'Choose CFTC Reg AT, MiFID II RTS 6 or SOC 2 audit packet from the library.' },
      { title: 'Generate', body: 'Auditee writes 247 pages in 4 minutes — every claim cited to a live requirement, test or CAPA.' },
      { title: 'Sign & ship', body: 'Export DOCX + PDF, route through e-signature, hand to the SEC reviewer with confidence.' },
    ],
    finale: { stat: '247', label: 'Atlas Pages Generated', sub: 'Audit packet · 100% from live project data' },
    coverage: {
      standards: ['CFTC Reg AT', 'MiFID II RTS 6', 'SOC 2 Type II', 'DORA', 'ISO 31000', 'IEEE 1016 SDD', 'IEEE 828 CM'],
      tools: ['Microsoft Word', 'Adobe Sign', 'DocuSign', 'SharePoint', 'Confluence'],
    },
  },

  workflows: {
    project: 'Aegis — Identity & Access Platform',
    domain: 'Identity Security',
    idPrefix: 'AEG',
    hero: {
      kicker: 'Step 11 · Workflows',
      lineA: 'Automate every Aegis',
      lineB: 'review and sign-off gate.',
      subtitle: 'PR merged → requirement linked → reviewer assigned → tests must pass → security approves → release. Zero manual chasing.',
    },
    cues: [
      { startMs: 0,     endMs: 5500,  text: "Aegis is the identity and access platform — automate the PR-to-release gating." },
      { startMs: 5500,  endMs: 12000, text: "PR merged to main? Auto-link the requirement, assign Marcus as reviewer, block until tests pass." },
      { startMs: 12000, endMs: 18000, text: "Stage gates — design freeze, V and V complete, security review — no code required to configure." },
      { startMs: 18000, endMs: 23000, text: "Nothing in Aegis ships until every gate passes. Full audit trail of who approved what." },
    ],
    steps: [
      { title: 'Open Workflows on Aegis', body: 'In Aegis — Identity & Access Platform, open the Workflows page.' },
      { title: 'Pick a template', body: 'Use the SOC 2 release-gate template or build your own pipeline visually.' },
      { title: 'Wire the gates', body: 'Each stage has automatic checks (test coverage, scan results) and manual approvals.' },
      { title: 'Watch a release', body: 'PR-481 advances through 4 stages — Auditee blocks at the failed gate until coverage hits 85%.' },
    ],
    finale: { stat: '4', label: 'Aegis Pipeline Stages', sub: 'Every gate logged · full audit trail' },
    coverage: {
      standards: ['SOC 2 Type II', 'ISO/IEC 27001:2022', 'NIST CSF 2.0', 'IEC 62443', 'CMMI v3.0', 'IEEE 730 SQA'],
      tools: ['GitHub Actions', 'GitLab CI', 'Jenkins', 'Argo CD', 'Slack'],
    },
  },

  analytics: {
    project: 'Cipher — API Gateway & Zero Trust',
    domain: 'Network Security',
    idPrefix: 'CPR',
    hero: {
      kicker: 'Step 12 · Analytics',
      lineA: 'Know Cipher\u2019s audit readiness',
      lineB: 'before the auditor does.',
      subtitle: 'Live KPI tiles, sparkline trends, sprint-over-sprint deltas — exportable to PDF for the next board review.',
    },
    cues: [
      { startMs: 0,     endMs: 5500,  text: "Cipher is the API gateway and zero-trust product — open the analytics dashboard." },
      { startMs: 5500,  endMs: 12000, text: "247 reqs tracked, 18 gaps closed, 87% audit-readiness — sparklines show the weekly trend." },
      { startMs: 12000, endMs: 18000, text: "Catch regressions before review — if Cipher coverage drops, Auditee pings Priya within minutes." },
      { startMs: 18000, endMs: 23000, text: "Export the whole view as a PDF for the Cipher board meeting." },
    ],
    steps: [
      { title: 'Open Analytics for Cipher', body: 'Inside Cipher — API Gateway & Zero Trust, click Analytics.' },
      { title: 'Read the KPI tiles', body: 'Audit Readiness, Test Coverage, CAPA Closure, Traceability — each with sparkline trend.' },
      { title: 'Compare sprints', body: 'Toggle the 7-week trend chart — Cipher readiness went from 62% to 84% in two months.' },
      { title: 'Export the board pack', body: 'One click renders a PDF with every KPI tile, ready for the Cipher exec review.' },
    ],
    finale: { stat: '84%', label: 'Cipher Audit Readiness', sub: '+6% this sprint · export PDF health report' },
    coverage: {
      standards: ['NIST CSF 2.0', 'ISO/IEC 27001:2022', 'IEC 62443', 'SOC 2 Type II', 'ISO 31000', 'PCI DSS v4.0'],
      tools: ['Datadog', 'Grafana', 'PagerDuty', 'Snowflake', 'PDF export'],
    },
  },

  'recurring-audits': {
    project: 'Nova — Crypto Exchange Compliance',
    domain: 'FinTech',
    idPrefix: 'NOV',
    hero: {
      kicker: 'Step 13 · Recurring Audits',
      lineA: 'Schedule once. Audit',
      lineB: 'Nova continuously.',
      subtitle: 'Daily VASP checks, weekly travel-rule reviews, monthly SOC 2 — Nova findings become CAPAs the moment they appear.',
    },
    cues: [
      { startMs: 0,     endMs: 5500,  text: "Nova is the crypto exchange compliance product — its monthly internal audit runs automatically." },
      { startMs: 5500,  endMs: 12000, text: "Last month's finding — missing travel-rule attestation. Auto-CAPA opened, assigned, closed in eleven days." },
      { startMs: 12000, endMs: 18000, text: "Set the cadence — daily, weekly, monthly, quarterly. Auditee handles the rest." },
      { startMs: 18000, endMs: 23000, text: "Nova is continuously compliant between formal audits. Zero scheduling overhead." },
    ],
    steps: [
      { title: 'Open Recurring Audits on Nova', body: 'Inside Nova — Crypto Exchange Compliance, click Recurring Audits.' },
      { title: 'Schedule the cadence', body: 'Daily VASP screening, weekly travel-rule review, monthly SOC 2 — pick the rhythm.' },
      { title: 'Auto-CAPA on findings', body: 'Every finding opens a CAPA with the right owner, due date and standard control.' },
      { title: 'Track the streak', body: 'Nova has run 9 consecutive monthly audits with zero overdue CAPAs.' },
    ],
    finale: { stat: '3', label: 'Nova Audits Scheduled', sub: 'Zero manual effort · findings → CAPA automatically' },
    coverage: {
      standards: ['FATF VASP', 'Travel Rule', 'SOC 2 Type II', 'PCI DSS v4.0', 'DORA', 'MiCA', 'ISO/IEC 27001:2022'],
      tools: ['Chainalysis', 'Elliptic', 'Jira', 'PagerDuty', 'Snowflake'],
    },
  },
};

/**
 * Convenience helper used by Module*.tsx — returns the full storyline given a key.
 */
export function getStory(key: ModuleKey): DemoStoryline {
  return DEMO_USE_CASES[key];
}
