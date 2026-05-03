import type { ModuleKey } from './demoUseCases';

export const MODULE_ORDER: ModuleKey[] = [
  'dashboard', 'sources', 'interview', 'requirements', 'gaps',
  'traceability', 'compliance', 'capa', 'defects', 'tests',
  'reports', 'workflows', 'analytics', 'recurring-audits',
];

export type ShortHook = {
  punch: string;
  setup: string;
  payoff: string;
  emoji: string;
  accent: string;
};

export const SHORT_HOOKS: Record<ModuleKey, ShortHook> = {
  dashboard: {
    punch: "Still chasing audit status in 9 spreadsheets?",
    setup: "Watch a real HIPAA + DPDP + SOC 2 dashboard rebuild itself live.",
    payoff: "Helios. 14 days to audit. Zero panic.",
    emoji: "📊", accent: "#a78bfa",
  },
  sources: {
    punch: "GitHub, Jira, IBM DOORS, 12 PDFs.",
    setup: "Plug them in. Watch Auditee parse 184 firmware reqs in seconds.",
    payoff: "One source graph. Zero copy-paste.",
    emoji: "🔌", accent: "#38bdf8",
  },
  interview: {
    punch: "What if your AI just asked 12 GCP questions?",
    setup: "Auditee interviews your PM live — every answer becomes a real BRS.",
    payoff: "18 clinical reqs in 4 minutes.",
    emoji: "💬", accent: "#c084fc",
  },
  requirements: {
    punch: "ISO 26262, 21434, UN R155 — tagged in one click.",
    setup: "192 EV battery reqs, baselined, versioned, ReqIF-ready.",
    payoff: "Apollo. Spec to silicon. Traced.",
    emoji: "📋", accent: "#34d399",
  },
  gaps: {
    punch: "Your code IS your spec? Auditee will prove it isn't.",
    setup: "Sterling banking platform — 7 hidden gaps surfaced in seconds.",
    payoff: "Find the gap before your auditor does.",
    emoji: "🔍", accent: "#f87171",
  },
  traceability: {
    punch: "SIL-3 in 90 minutes. Not weeks.",
    setup: "Titan refinery PLC — every req → code → test in one graph.",
    payoff: "Functional safety, finally interactive.",
    emoji: "🕸️", accent: "#10b981",
  },
  compliance: {
    punch: "Drag a control. Watch coverage jump.",
    setup: "Bastion fintech KYC — PCI DSS, DORA, ISO 27001 evidence in one drawer.",
    payoff: "Audit-ready. Today. Not next quarter.",
    emoji: "🛡️", accent: "#60a5fa",
  },
  capa: {
    punch: "From defect to closure in 11 days.",
    setup: "Aegis defense radar — every CAPA stage owned, tracked, signed.",
    payoff: "ISO 9001 + AS9100, on auto-pilot.",
    emoji: "🔧", accent: "#fb923c",
  },
  defects: {
    punch: "Bug in your firmware → CAPA in your audit.",
    setup: "Vega satellite payload — defects auto-link to safety controls.",
    payoff: "Zero orphan bugs. Ever.",
    emoji: "🐞", accent: "#ec4899",
  },
  tests: {
    punch: "Every test → every requirement. Proven.",
    setup: "Ares missile guidance — DO-178C coverage matrix in one screen.",
    payoff: "100% trace. 0% spreadsheet.",
    emoji: "🧪", accent: "#84cc16",
  },
  reports: {
    punch: "247-page audit report. Generated in 12 seconds.",
    setup: "Atlas EHR — HIPAA + ISO 13485 + IEC 62304, one PDF, zero edits.",
    payoff: "Auditors will think your team is huge.",
    emoji: "📄", accent: "#fbbf24",
  },
  workflows: {
    punch: "Approvals stuck in email? End that today.",
    setup: "Nexus payments — every release gated by automatic compliance check.",
    payoff: "DORA-ready pipeline. Out of the box.",
    emoji: "⚙️", accent: "#06b6d4",
  },
  analytics: {
    punch: "Audit readiness: 62% → 84% in 8 weeks.",
    setup: "Cipher API gateway — KPI sparklines, regressions caught early.",
    payoff: "The board pack writes itself.",
    emoji: "📈", accent: "#a855f7",
  },
  'recurring-audits': {
    punch: "Schedule once. Audit forever.",
    setup: "Nova crypto exchange — daily VASP, monthly SOC 2, auto-CAPA on findings.",
    payoff: "9 audits in a row. Zero overdue.",
    emoji: "🔁", accent: "#22d3ee",
  },
};

export const CTA_COPY = {
  headline: "Try Auditee free.",
  sub: "14 demo projects. Every standard. Every tool. No card.",
  url: "auditee.site",
  cta: "Start your free trial →",
};

export const FULL_VIDEO_HOOK = {
  pain: "Compliance audits eat 3 months of every release.",
  twist: "What if AI ran them in 3 days?",
};

export const FULL_VIDEO_INTRO = {
  brand: "Auditee",
  pitch: "The compliance OS for regulated software teams.",
  bullets: [
    "AI-generated requirements — BRS, PRD, FRD",
    "Live trace from spec → code → test → CAPA",
    "Every standard. Every tool. One graph.",
  ],
};

export const FULL_VIDEO_CLOSURE = {
  headline: "14 demos. One platform.",
  sub: "Healthcare. Automotive. Avionics. Banking. Defense. SaaS.",
  cta: "Start your free trial at auditee.site",
};
