// ─────────────────────────────────────────────────────────────────────────
// Framework rating schemes
//
// Each compliance/safety/quality standard expresses audit results in its
// own native vocabulary: ISO 27001 produces conformity verdicts (Conformant
// / Major NC / Minor NC / Observation), ASPICE produces Capability Levels
// 0-5 with N/P/L/F process-attribute ratings, NIST CSF produces Implementation
// Tiers 1-4, IEC 61508 produces SIL claim-limit, etc.
//
// Montana's audit pipeline still emits the universal {met, partial, gap}
// per-control verdict (and a 0-100 % roll-up), but it ALSO needs to surface
// the standard-appropriate rating so downstream artefacts (audit reports,
// CAPA priorities, certification submissions) are recognisable to the
// people who own the standard.
//
// This module provides:
//   • A `RatingScheme` definition for each framework code, including the
//     scheme name, what each per-control rating means, what each overall
//     rating means, and where it comes from in the standard.
//   • A `rateAudit()` function that DETERMINISTICALLY derives the native
//     rating from the existing compliance% + control verdicts. This avoids
//     asking the LLM for it (which would be fragile and non-reproducible).
// ─────────────────────────────────────────────────────────────────────────

export type Verdict = "met" | "partial" | "gap";

export interface PerControlRatingValue {
  value: string;       // short code shown as a chip (e.g. "F", "L", "P", "N")
  label: string;       // human label (e.g. "Fully achieved")
  description: string; // tooltip / report text
  /** which universal verdict this maps from */
  fromVerdict: Verdict;
}

export interface OverallRatingValue {
  value: string;       // short code (e.g. "CL3", "Tier 3", "Conformant")
  label: string;       // human label
  description: string; // tooltip
  /** Inclusive lower bound of compliancePercentage (0-100) for this rating. */
  minPercent: number;
}

export interface RatingScheme {
  /** human name of the scheme, e.g. "ISO/IEC 33020 Capability Levels". */
  schemeName: string;
  /** which clause / annex / appendix of the standard defines this scheme. */
  basedOn: string;
  /** scope/explanation surfaced in the report. */
  description: string;
  /** per-control rating chip values, ordered worst → best. */
  perControl: PerControlRatingValue[];
  /** overall rating values, ordered worst → best. */
  overall: OverallRatingValue[];
}

// ── Common per-control templates ─────────────────────────────────────────

const PC_NPLF: PerControlRatingValue[] = [
  { value: "N", label: "Not achieved (N)", description: "0–15% — no or little evidence of achievement of the defined attribute.", fromVerdict: "gap" },
  { value: "P", label: "Partially achieved (P)", description: "16–50% — some evidence; many aspects unpredictable.", fromVerdict: "partial" },
  { value: "L", label: "Largely achieved (L)", description: "51–85% — significant evidence; some weaknesses.", fromVerdict: "partial" },
  { value: "F", label: "Fully achieved (F)", description: "86–100% — complete and systematic evidence.", fromVerdict: "met" },
];

const PC_CONFORMITY: PerControlRatingValue[] = [
  { value: "NC", label: "Non-conformity", description: "Control is not implemented or has a serious defect against the standard.", fromVerdict: "gap" },
  { value: "OBS", label: "Observation", description: "Control is implemented but has weaknesses to address.", fromVerdict: "partial" },
  { value: "CONF", label: "Conformant", description: "Control is fully implemented and effective.", fromVerdict: "met" },
];

const PC_IMPLEMENTATION: PerControlRatingValue[] = [
  { value: "NI", label: "Not Implemented", description: "Safeguard is missing.", fromVerdict: "gap" },
  { value: "PI", label: "Partially Implemented", description: "Safeguard is present but incomplete.", fromVerdict: "partial" },
  { value: "I", label: "Implemented", description: "Safeguard is fully in place and effective.", fromVerdict: "met" },
];

const PC_PCI: PerControlRatingValue[] = [
  { value: "NIP", label: "Not in Place", description: "Requirement is not met and no compensating control exists.", fromVerdict: "gap" },
  { value: "CCW", label: "In Place w/ Compensating Control", description: "Requirement is met via a compensating control worksheet.", fromVerdict: "partial" },
  { value: "IP", label: "In Place", description: "Requirement is fully met.", fromVerdict: "met" },
];

const PC_SOC2: PerControlRatingValue[] = [
  { value: "MW", label: "Material Weakness", description: "Deficiency that could result in a material misstatement.", fromVerdict: "gap" },
  { value: "DEF", label: "Deficiency", description: "Control was not designed or operating effectively.", fromVerdict: "partial" },
  { value: "EFF", label: "Effective", description: "Control is suitably designed and operating effectively.", fromVerdict: "met" },
];

const PC_DO178: PerControlRatingValue[] = [
  { value: "NS", label: "Not Satisfied", description: "DO-178C objective is not satisfied for the targeted DAL.", fromVerdict: "gap" },
  { value: "PS", label: "Partially Satisfied", description: "Objective evidence partially satisfies the objective.", fromVerdict: "partial" },
  { value: "SAT", label: "Satisfied", description: "Objective is satisfied with appropriate evidence and independence.", fromVerdict: "met" },
];

// ── Common overall templates ─────────────────────────────────────────────

const O_ISMS_CONFORMITY: OverallRatingValue[] = [
  { value: "Major NC", label: "Major Non-Conformity", description: "≥1 absent control or systemic gap that would block certification.", minPercent: 0 },
  { value: "Minor NC", label: "Minor Non-Conformity", description: "Isolated lapses against requirements; remediation needed before recommendation.", minPercent: 60 },
  { value: "Observation", label: "Observation", description: "Conforms but with weaknesses worth addressing.", minPercent: 80 },
  { value: "Conformant", label: "Conformant", description: "ISMS conforms to the standard; recommended for certification.", minPercent: 95 },
];

const O_ASPICE_CL: OverallRatingValue[] = [
  { value: "CL0", label: "CL0 — Incomplete", description: "Process not implemented or fails to achieve its purpose.", minPercent: 0 },
  { value: "CL1", label: "CL1 — Performed", description: "Process achieves its outcomes; PA 1.1 largely/fully achieved.", minPercent: 50 },
  { value: "CL2", label: "CL2 — Managed", description: "Performed process is now planned, monitored and controlled.", minPercent: 70 },
  { value: "CL3", label: "CL3 — Established", description: "Managed process is implemented using a defined organisation-wide process.", minPercent: 85 },
  { value: "CL4", label: "CL4 — Predictable", description: "Established process operates within defined limits using statistical techniques.", minPercent: 93 },
  { value: "CL5", label: "CL5 — Innovating", description: "Predictable process is continuously improved using innovative changes.", minPercent: 98 },
];

const O_NIST_TIER: OverallRatingValue[] = [
  { value: "Tier 1", label: "Tier 1 — Partial", description: "Risk management is ad-hoc; cybersecurity awareness is limited.", minPercent: 0 },
  { value: "Tier 2", label: "Tier 2 — Risk Informed", description: "Management approves risk-informed practices but they are not org-wide.", minPercent: 50 },
  { value: "Tier 3", label: "Tier 3 — Repeatable", description: "Org-wide practices, formally approved, regularly updated.", minPercent: 75 },
  { value: "Tier 4", label: "Tier 4 — Adaptive", description: "Adaptive practices using lessons learned and predictive indicators.", minPercent: 90 },
];

const O_CMMI_ML: OverallRatingValue[] = [
  { value: "ML 1", label: "ML 1 — Initial", description: "Processes are unpredictable, poorly controlled, reactive.", minPercent: 0 },
  { value: "ML 2", label: "ML 2 — Managed", description: "Processes are planned, performed, measured, and controlled at the project level.", minPercent: 60 },
  { value: "ML 3", label: "ML 3 — Defined", description: "Processes are characterised for the organisation and are proactive.", minPercent: 80 },
  { value: "ML 4", label: "ML 4 — Quantitatively Managed", description: "Processes are measured and controlled using statistical techniques.", minPercent: 92 },
  { value: "ML 5", label: "ML 5 — Optimising", description: "Focus on continuous process improvement.", minPercent: 97 },
];

const O_FDA_PART11: OverallRatingValue[] = [
  { value: "Non-Compliant", label: "Non-Compliant", description: "Material gaps in §11.10 / §11.30 / §11.50 / §11.70 / §11.100.", minPercent: 0 },
  { value: "Substantially Compliant", label: "Substantially Compliant", description: "Most Part 11 requirements met; isolated gaps with remediation plans.", minPercent: 70 },
  { value: "Compliant", label: "Compliant", description: "All Part 11 requirements satisfied; closed-system controls in place.", minPercent: 95 },
];

const O_GDPR: OverallRatingValue[] = [
  { value: "Non-Compliant", label: "Non-Compliant", description: "Material breaches against GDPR articles; immediate action required.", minPercent: 0 },
  { value: "Action Required", label: "Action Required", description: "Significant gaps in lawful basis, DSR, or accountability evidence.", minPercent: 60 },
  { value: "Largely Compliant", label: "Largely Compliant", description: "Most articles satisfied; minor process gaps to close.", minPercent: 80 },
  { value: "Compliant", label: "Compliant", description: "Demonstrable accountability across all relevant articles.", minPercent: 95 },
];

const O_HIPAA: OverallRatingValue[] = [
  { value: "Non-Compliant", label: "Non-Compliant", description: "Required safeguards not in place; risk analysis missing or stale.", minPercent: 0 },
  { value: "Substantially Compliant", label: "Substantially Compliant", description: "Required safeguards in place; some addressable safeguards open.", minPercent: 75 },
  { value: "Compliant", label: "Compliant", description: "All required safeguards implemented; addressable safeguards justified.", minPercent: 95 },
];

const O_IEC61508_SIL: OverallRatingValue[] = [
  { value: "No SIL", label: "No SIL claimed", description: "Insufficient evidence to claim any SIL capability.", minPercent: 0 },
  { value: "SIL 1", label: "SIL 1 capable", description: "Lifecycle evidence supports SIL 1 (PFD 10⁻¹–10⁻²).", minPercent: 60 },
  { value: "SIL 2", label: "SIL 2 capable", description: "Lifecycle evidence supports SIL 2 (PFD 10⁻²–10⁻³).", minPercent: 75 },
  { value: "SIL 3", label: "SIL 3 capable", description: "Lifecycle evidence supports SIL 3 (PFD 10⁻³–10⁻⁴).", minPercent: 87 },
  { value: "SIL 4", label: "SIL 4 capable", description: "Lifecycle evidence supports SIL 4 (PFD 10⁻⁴–10⁻⁵).", minPercent: 96 },
];

const O_IEC62304_CLASS: OverallRatingValue[] = [
  { value: "Non-Conformant", label: "Non-Conformant", description: "Lifecycle evidence does not satisfy 62304 for any safety class.", minPercent: 0 },
  { value: "Class A", label: "Class A capable", description: "Adequate for software with no injury possible.", minPercent: 60 },
  { value: "Class B", label: "Class B capable", description: "Adequate for software where non-serious injury is possible.", minPercent: 78 },
  { value: "Class C", label: "Class C capable", description: "Adequate for software where death or serious injury is possible.", minPercent: 92 },
];

const O_IEC62443: OverallRatingValue[] = [
  { value: "ML 1 / SL 0", label: "ML 1 — Initial (no SL)", description: "Ad-hoc processes; no security-level capability claim.", minPercent: 0 },
  { value: "ML 2 / SL 1", label: "ML 2 — Managed (SL 1)", description: "Repeatable processes; protection against casual or coincidental violation.", minPercent: 55 },
  { value: "ML 3 / SL 2", label: "ML 3 — Defined (SL 2)", description: "Defined processes; protection against intentional violation with simple means.", minPercent: 75 },
  { value: "ML 4 / SL 3", label: "ML 4 — Improving (SL 3)", description: "Continuous improvement; protection against sophisticated attacks.", minPercent: 90 },
  { value: "ML 4 / SL 4", label: "ML 4 — Improving (SL 4)", description: "Protection against state-sponsored attacks with extensive resources.", minPercent: 97 },
];

const O_ISO26262_ASIL: OverallRatingValue[] = [
  { value: "Non-Conformant", label: "Non-Conformant", description: "Lifecycle evidence does not support a claim against ISO 26262.", minPercent: 0 },
  { value: "QM", label: "Quality-Managed (QM)", description: "Quality management is sufficient; no ASIL claim.", minPercent: 55 },
  { value: "ASIL A", label: "ASIL A capable", description: "Lowest ASIL; lifecycle evidence supports A claim.", minPercent: 70 },
  { value: "ASIL B", label: "ASIL B capable", description: "Lifecycle evidence supports ASIL B claim.", minPercent: 82 },
  { value: "ASIL C", label: "ASIL C capable", description: "Lifecycle evidence supports ASIL C claim.", minPercent: 91 },
  { value: "ASIL D", label: "ASIL D capable", description: "Highest ASIL; full lifecycle rigour evidenced.", minPercent: 97 },
];

const O_PCI: OverallRatingValue[] = [
  { value: "Non-Compliant", label: "Non-Compliant", description: "≥1 requirement Not in Place; SAQ/ROC cannot be signed.", minPercent: 0 },
  { value: "Compliant w/ CCW", label: "Compliant with Compensating Controls", description: "All requirements met, some via CCW.", minPercent: 80 },
  { value: "Compliant", label: "Compliant", description: "All applicable PCI-DSS requirements In Place.", minPercent: 100 },
];

const O_SOC2: OverallRatingValue[] = [
  { value: "Disclaimer", label: "Disclaimer of Opinion", description: "Insufficient evidence to form an opinion.", minPercent: 0 },
  { value: "Adverse", label: "Adverse Opinion", description: "Material misstatements in the description or controls.", minPercent: 50 },
  { value: "Qualified", label: "Qualified Opinion", description: "Most TSC met but with at least one material exception.", minPercent: 80 },
  { value: "Unqualified", label: "Unqualified Opinion (Clean)", description: "Description fairly presented; controls effective across the period.", minPercent: 95 },
];

const O_DO178: OverallRatingValue[] = [
  { value: "DAL E", label: "DAL E — No effect", description: "Failure has no effect on operation; minimal objectives.", minPercent: 0 },
  { value: "DAL D", label: "DAL D — Minor", description: "Failure has minor effect; ~26 objectives evidenced.", minPercent: 50 },
  { value: "DAL C", label: "DAL C — Major", description: "Failure has major effect; ~62 objectives evidenced.", minPercent: 70 },
  { value: "DAL B", label: "DAL B — Hazardous", description: "Failure has hazardous effect; ~69 objectives evidenced (with independence).", minPercent: 85 },
  { value: "DAL A", label: "DAL A — Catastrophic", description: "Failure prevents continued safe flight; ~71 objectives with independence.", minPercent: 96 },
];

// ── Per-framework scheme map ─────────────────────────────────────────────
//
// Framework codes match `compliance_frameworks.code` in the database
// (see bootstrap-frameworks.ts). When a code isn't present we fall back to
// the universal scheme so the audit still produces SOMETHING sensible.

export const FRAMEWORK_RATING_SCHEMES: Record<string, RatingScheme> = {
  "ISO/IEC 27001": {
    schemeName: "ISO/IEC 27001 ISMS Conformity",
    basedOn: "ISO/IEC 17021-1 (audit conformity classification)",
    description: "ISMS audits classify findings as Conformant, Observation, Minor Non-Conformity, or Major Non-Conformity. Major NCs block certification recommendation.",
    perControl: PC_CONFORMITY,
    overall: O_ISMS_CONFORMITY,
  },
  "ISO/IEC 27002": {
    schemeName: "ISO/IEC 27002 Control Implementation",
    basedOn: "ISO/IEC 27002:2022 control assessment",
    description: "Each Annex A control is rated Implemented / Partially Implemented / Not Implemented. Maturity rolls into ISMS conformity.",
    perControl: PC_IMPLEMENTATION,
    overall: O_ISMS_CONFORMITY,
  },
  "NIST CSF 2.0": {
    schemeName: "NIST CSF 2.0 Implementation Tiers",
    basedOn: "NIST CSF 2.0 §2.4 (Tiers 1–4) + Profile maturity",
    description: "Implementation Tiers describe how well an organisation's cybersecurity risk-management practices integrate the CSF Functions.",
    perControl: PC_IMPLEMENTATION,
    overall: O_NIST_TIER,
  },
  "ASPICE 4.0": {
    schemeName: "ISO/IEC 33020 Capability Levels (ASPICE 4.0)",
    basedOn: "Automotive SPICE 4.0 process assessment model",
    description: "Each process attribute rated N (Not), P (Partially), L (Largely), F (Fully) achieved. Capability Level 0–5 rolls up from PA ratings.",
    perControl: PC_NPLF,
    overall: O_ASPICE_CL,
  },
  "ASPICE Cybersecurity 2.0": {
    schemeName: "ISO/IEC 33020 Capability Levels (ASPICE Cybersecurity 2.0)",
    basedOn: "Automotive SPICE for Cybersecurity v2.0 (2025)",
    description: "Cybersecurity processes rated N/P/L/F; Capability Level 0–5 derived from process-attribute achievement.",
    perControl: PC_NPLF,
    overall: O_ASPICE_CL,
  },
  "CMMI 3.0": {
    schemeName: "CMMI 3.0 Maturity Levels",
    basedOn: "CMMI v3.0 Practice & Maturity Level model",
    description: "Practices rated against capability levels; org-wide rolls up to Maturity Levels 1 (Initial) through 5 (Optimising).",
    perControl: PC_NPLF,
    overall: O_CMMI_ML,
  },
  "FDA 21 CFR 11": {
    schemeName: "FDA 21 CFR Part 11 Compliance",
    basedOn: "21 CFR §11.10/§11.30/§11.50/§11.70/§11.100",
    description: "Each Part 11 requirement is rated Conformant / Partially Conformant / Non-Conformant. Overall classification used in 483 / Warning Letter risk.",
    perControl: PC_CONFORMITY,
    overall: O_FDA_PART11,
  },
  "GDPR": {
    schemeName: "GDPR Article Compliance",
    basedOn: "EU General Data Protection Regulation (Regulation 2016/679)",
    description: "Per-article compliance assessed against accountability evidence (Art. 5(2)). Rolls up to Compliant / Largely Compliant / Action Required / Non-Compliant.",
    perControl: PC_CONFORMITY,
    overall: O_GDPR,
  },
  "HIPAA": {
    schemeName: "HIPAA Security Rule Implementation",
    basedOn: "45 CFR §164 Subpart C (Required + Addressable safeguards)",
    description: "Required safeguards must be Implemented; Addressable safeguards must be Implemented or have a documented justification.",
    perControl: PC_IMPLEMENTATION,
    overall: O_HIPAA,
  },
  "IEC 61508": {
    schemeName: "IEC 61508 SIL Capability",
    basedOn: "IEC 61508-3 Tables A.1–A.10 + Annex F Route 1S/2S",
    description: "Lifecycle evidence determines the SIL claim limit (1–4) per Annex A techniques and measures.",
    perControl: PC_CONFORMITY,
    overall: O_IEC61508_SIL,
  },
  "IEC 62304": {
    schemeName: "IEC 62304 Software Safety Class",
    basedOn: "IEC 62304:2006/AMD1:2015 Clauses 5–9",
    description: "Lifecycle evidence determines the safety-class capability (A — no injury, B — non-serious injury, C — death/serious injury).",
    perControl: PC_IMPLEMENTATION,
    overall: O_IEC62304_CLASS,
  },
  "IEC 62443": {
    schemeName: "IEC 62443 Maturity & Security Level",
    basedOn: "IEC 62443-2-4 (ML 1–4) and IEC 62443-3-3 (SL 0–4)",
    description: "Combined Maturity Level (ML 1–4) and target Security Level (SL 0–4) capability for IACS components/systems.",
    perControl: PC_CONFORMITY,
    overall: O_IEC62443,
  },
  "ISO 26262": {
    schemeName: "ISO 26262 ASIL Capability",
    basedOn: "ISO 26262-2 to -9 lifecycle conformity",
    description: "Lifecycle evidence determines ASIL claim limit (QM / A / B / C / D) based on hazard analysis and risk assessment.",
    perControl: PC_CONFORMITY,
    overall: O_ISO26262_ASIL,
  },
  "PCI-DSS": {
    schemeName: "PCI-DSS v4.0 Requirement Compliance",
    basedOn: "PCI-DSS v4.0 Self-Assessment Questionnaire / ROC",
    description: "Each requirement is In Place, In Place w/ Compensating Control, or Not In Place. Overall report follows PCI Council classifications.",
    perControl: PC_PCI,
    overall: O_PCI,
  },
  "SOC2": {
    schemeName: "SOC 2 Trust Services Criteria Opinion",
    basedOn: "AICPA TSP Section 100 (2017) — SOC 2 Type II",
    description: "Each TSC control is Effective, Deficient, or a Material Weakness. Overall opinion follows AICPA AT-C 205 classifications.",
    perControl: PC_SOC2,
    overall: O_SOC2,
  },
  "DO-178C": {
    schemeName: "DO-178C Design Assurance Level Capability",
    basedOn: "DO-178C Tables A-1 through A-10 (objectives by DAL)",
    description: "Lifecycle evidence determines highest DAL (A–E) for which objectives are satisfied with required independence.",
    perControl: PC_DO178,
    overall: O_DO178,
  },
};

/** Universal fallback when a framework code has no explicit scheme yet. */
export const UNIVERSAL_SCHEME: RatingScheme = {
  schemeName: "Montana Universal Conformity",
  basedOn: "Montana platform default (control verdict + coverage %)",
  description: "Generic scheme used when the framework has no industry-specific rating model.",
  perControl: PC_CONFORMITY,
  overall: [
    { value: "Failing", label: "Failing", description: "Coverage <40% — major gaps across the framework.", minPercent: 0 },
    { value: "Weak", label: "Weak", description: "Coverage 40–69% — significant remediation needed.", minPercent: 40 },
    { value: "Adequate", label: "Adequate", description: "Coverage 70–89% — material weaknesses to close.", minPercent: 70 },
    { value: "Strong", label: "Strong", description: "Coverage ≥90% — broadly conformant with the framework.", minPercent: 90 },
  ],
};

export function getRatingScheme(frameworkCode: string): RatingScheme {
  return FRAMEWORK_RATING_SCHEMES[frameworkCode] ?? UNIVERSAL_SCHEME;
}

// ── Deterministic rating derivation ──────────────────────────────────────

export interface NativeRating {
  schemeName: string;
  basedOn: string;
  description: string;
  /** The single overall rating chosen for this audit (e.g. {value:"CL2", label:"…"}). */
  overall: { value: string; label: string; description: string };
  /** Per-control map keyed by controlCode. Always present for every assessed control. */
  perControl: Record<string, { value: string; label: string; description: string }>;
}

/**
 * Choose the highest overall rating tier whose minPercent ≤ compliancePercentage.
 * Schemes are ordered worst→best so we walk in reverse.
 */
function chooseOverall(scheme: RatingScheme, compliancePercentage: number): OverallRatingValue {
  for (let i = scheme.overall.length - 1; i >= 0; i--) {
    const tier = scheme.overall[i]!;
    if (compliancePercentage >= tier.minPercent) return tier;
  }
  return scheme.overall[0]!;
}

function pcForVerdict(scheme: RatingScheme, verdict: Verdict): PerControlRatingValue {
  // Best PC for each verdict, in case multiple PC entries map to it (e.g. NPLF
  // has both P and L mapping from "partial"; we pick the higher one — L —
  // when verdict alone says "partial" because that's the most generous read
  // before the AI would have given more granular evidence).
  const candidates = scheme.perControl.filter((p) => p.fromVerdict === verdict);
  if (candidates.length === 0) {
    // Defensive: every scheme MUST cover all three verdicts. If it doesn't,
    // fall back to the first per-control entry.
    return scheme.perControl[0]!;
  }
  // For "partial" we pick the highest-tier mapping (e.g. L over P for NPLF).
  // For "met" / "gap" there's typically only one mapping.
  if (verdict === "partial") {
    return candidates[candidates.length - 1]!;
  }
  return candidates[0]!;
}

export function rateAudit(
  frameworkCode: string,
  compliancePercentage: number,
  controlVerdicts: Array<{ controlCode: string; verdict: Verdict }>,
): NativeRating {
  const scheme = getRatingScheme(frameworkCode);
  const overall = chooseOverall(scheme, compliancePercentage);
  const perControl: NativeRating["perControl"] = {};
  for (const cv of controlVerdicts) {
    const pc = pcForVerdict(scheme, cv.verdict);
    perControl[cv.controlCode] = { value: pc.value, label: pc.label, description: pc.description };
  }
  return {
    schemeName: scheme.schemeName,
    basedOn: scheme.basedOn,
    description: scheme.description,
    overall: { value: overall.value, label: overall.label, description: overall.description },
    perControl,
  };
}
