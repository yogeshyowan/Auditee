import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useProjectContext } from "@/lib/project-context";
import { useListComplianceFrameworks } from "@workspace/api-client-react";
import {
  useReports,
  useReport,
  useGenerateReport,
  useRefineReport,
  useDeleteReport,
  reportExportUrl,
  type ReportRow,
} from "@/lib/wave1-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { FileText, Sparkles, Download, Trash2, RefreshCw } from "lucide-react";
import { Comments } from "@/components/Comments";
import { StandardsMultiSelect } from "@/components/StandardsMultiSelect";
import { PushToRepoButton } from "@/components/PushToRepoButton";

// Grouped catalogue of every report kind, used for both the dropdown UI
// and the display label/description maps below. Order inside each group
// is the order the user sees in the Select.
const KIND_GROUPS: Array<{ label: string; kinds: Array<{ kind: string; label: string; description: string }> }> = [
  {
    label: "Core",
    kinds: [
      { kind: "exec_brief", label: "Executive briefing", description: "Board-ready 1–2 page summary of program health, top risks, and momentum." },
      { kind: "compliance_audit", label: "Compliance audit report", description: "Standards-grounded audit report against a chosen framework (ISO/SOC2/HIPAA/etc.) with control verdicts and evidence." },
      { kind: "requirements_summary", label: "Requirements summary", description: "Coverage and quality narrative across all project requirements, grouped by type and priority." },
      { kind: "traceability", label: "Traceability narrative", description: "Requirements → architecture → design → code → tests → deployment coverage story with gaps and recommendations." },
    ],
  },
  {
    label: "Requirements / Design / Build",
    kinds: [
      { kind: "brd", label: "Business Requirements Document (BRD)", description: "Canonical BRD — context, stakeholders, objectives, scope, functional & non-functional requirements, constraints, risks, acceptance." },
      { kind: "prd", label: "Product Requirements Document (PRD)", description: "Canonical PRD — overview, goals/non-goals, personas, user stories with acceptance, FR/NFR, UX flows, release plan, open risks." },
      { kind: "frd", label: "Functional Requirements Document (FRD)", description: "Canonical FRD — system context, FR specs, data model, interface specs, business rules, error handling, security/compliance, test strategy, ops." },
      { kind: "architecture_doc", label: "Architecture Description (ISO/IEC/IEEE 42010)", description: "Architecture description per ISO/IEC/IEEE 42010 — stakeholders & concerns, drivers, system context, logical/process/data/deployment views, ADRs, risks." },
      { kind: "hld", label: "High-Level Design (HLD, IEEE 1016)", description: "HLD per IEEE 1016 — module decomposition, component interactions, external interface design, data design, tech stack, cross-cutting concerns." },
      { kind: "lld", label: "Low-Level Design (LLD, IEEE 1016)", description: "LLD per IEEE 1016 — class/method specs, API contracts, schemas, algorithms with pseudocode, error model, concurrency & state machines." },
      { kind: "test_cases", label: "Test Case Suite", description: "Standards-grade test suite generated from requirements — functional, negative/edge, non-functional, e2e — each case linked back to its requirement code." },
      { kind: "deployment_doc", label: "Deployment Document", description: "Build, release, observability and rollback documentation — environments, infra components, CI pipeline, release strategy, runbook, DR posture." },
      { kind: "user_manual", label: "User Manual (IEEE 1063)", description: "End-user documentation per IEEE 1063 — getting started, key concepts, task-oriented procedures, screen reference, troubleshooting, glossary." },
    ],
  },
  {
    label: "Functional Safety (ISO 26262 / IEC 61508 / EN 50128)",
    kinds: [
      { kind: "safety_plan", label: "Safety Plan", description: "Project-level functional Safety Plan per ISO 26262-2 / IEC 61508-1 — scope, lifecycle, roles, tailoring, confirmation measures, change control." },
      { kind: "hara", label: "HARA — Hazard Analysis & Risk Assessment", description: "ISO 26262-3 hazard analysis — operational situations, hazards, S/E/C classification, ASIL determination, Safety Goals." },
      { kind: "safety_concept", label: "Functional Safety Concept (FSC)", description: "ISO 26262-3 §7 — derives FSRs from Safety Goals, allocates to preliminary architecture, defines safe states, FTTI, warning & degradation strategy." },
      { kind: "tech_safety_concept", label: "Technical Safety Concept (TSC)", description: "ISO 26262-4 §7 — derives TSRs from FSRs, defines safety mechanisms, HW/SW allocation, ASIL decomposition with independence arguments." },
      { kind: "safety_case", label: "Safety Case (assurance argument)", description: "GSN-style safety case per ISO 26262-2 / IEC 61508-1 — top claim, sub-claims by Safety Goal, process & product compliance, residual risk." },
      { kind: "fmea", label: "FMEA / FMEDA", description: "AIAG-VDA / IEC 60812 failure mode analysis — functions, failure modes, S/O/D + AP, diagnostic coverage, FMEDA quantitative metrics." },
      { kind: "fta", label: "Fault Tree Analysis (FTA)", description: "IEC 61025 deductive analysis — top event, gates, basic events, cut sets, common-cause, importance measures, design implications." },
      { kind: "dia", label: "Development Interface Agreement (DIA)", description: "ISO 26262-8 §5 OEM↔supplier agreement — RACI per work product, joint reviews, deliverables, tailoring, communication & change management." },
      { kind: "srs_safety", label: "Safety Requirements Specification", description: "IEC 61508-1 §7.10 — safety functions catalogue, integrity requirements (PFD/PFH), allocation, environmental constraints, validation criteria." },
    ],
  },
  {
    label: "Cybersecurity (ISO/SAE 21434 / IEC 62443 / ISO 27001 / NIST)",
    kinds: [
      { kind: "cybersecurity_plan", label: "Cybersecurity Plan", description: "ISO/SAE 21434 §6 / IEC 62443-4-1 — scope, lifecycle, roles, methods, vulnerability & incident management, distributed activities, end-of-cybersecurity-support." },
      { kind: "tara", label: "TARA — Threat Analysis & Risk Assessment", description: "ISO/SAE 21434 §15 — assets, damage scenarios, threat scenarios (STRIDE), attack paths, feasibility & risk, treatment decisions, cybersecurity goals." },
      { kind: "cybersecurity_concept", label: "Cybersecurity Concept", description: "ISO/SAE 21434 §9 — derives CSRs from CGs, controls catalogue, key & identity management, secure boot/update, monitoring & incident response." },
      { kind: "cybersecurity_case", label: "Cybersecurity Case", description: "ISO/SAE 21434 §6.4.5 — argued, evidence-backed claim of cybersecurity across the lifecycle; process & product compliance, residual risk, EOCS plan." },
      { kind: "security_risk_assessment", label: "Security Risk Assessment", description: "NIST SP 800-30 / ISO 27005 / IEC 62443-3-2 — assets, threats, vulnerabilities, likelihood × impact, ranked risks with treatment & framework-mapped controls." },
    ],
  },
  {
    label: "Software Aspects (DO-178C / IEC 62304 / IEEE 730)",
    kinds: [
      { kind: "psac", label: "Plan for Software Aspects of Certification (PSAC)", description: "RTCA DO-178C §11.1 — system & software overview, certification considerations, lifecycle, lifecycle data, schedule with SOI reviews, additional considerations." },
      { kind: "software_dev_plan", label: "Software Development Plan (SDP)", description: "DO-178C §11.2 / IEC 62304 §5.1 — lifecycle model, environment, standards & methods, architecture strategy, COTS/SOUP policy, problem reporting." },
      { kind: "software_verification_plan", label: "Software Verification Plan (SVP)", description: "DO-178C §11.3 / IEC 62304 §5.6 — methods, reviews, test environment, coverage criteria (incl. MC/DC), verification of verification, regression strategy." },
      { kind: "software_qa_plan", label: "Software Quality Assurance Plan (SQAP)", description: "IEEE 730 / DO-178C §11.5 — SQA org & independence, activities, conformance reviews, anomaly & CAPA, metrics, records." },
      { kind: "soup_list", label: "SOUP / Third-Party Software List", description: "IEC 62304 §5.3.3 / §8.1.2 — itemised SOUP/OTS inventory with functional/perf requirements, env, anomaly analysis, vulnerability monitoring." },
    ],
  },
  {
    label: "Configuration & Quality",
    kinds: [
      { kind: "scmp", label: "Software Configuration Management Plan (SCMP)", description: "IEEE 828 / DO-178C §11.4 / IEC 62304 §8 — SCM org, identification, baselines, change control, status accounting, audits, tooling." },
      { kind: "ci_list", label: "Configuration Item List (CI List)", description: "Formal inventory of every CI — plans, requirements, design, source, V&V, tools, SOUP, with version & control class (CC1/CC2)." },
      { kind: "change_control_plan", label: "Change Control Plan", description: "IEEE 828 / ISO 9001 / IEC 62304 — CR workflow, CCB authorities, classification, mandatory impact analyses, emergency hot-fix process, metrics." },
      { kind: "vnv_plan", label: "Verification & Validation Plan (V&V)", description: "IEEE 1012 / ISO 26262-8 §9 / IEC 62304 §5.6–§5.7 — V&V tasks per phase, independence levels, test strategy, coverage, anomaly & re-verification." },
    ],
  },
  {
    label: "Risk Management",
    kinds: [
      { kind: "risk_management_plan", label: "Risk Management Plan", description: "ISO 14971 / ISO 31000 — risk process, identification techniques, acceptance criteria, register format, treatment, monitoring, retention." },
    ],
  },
];

const KIND_LABELS: Record<string, string> = Object.fromEntries(
  KIND_GROUPS.flatMap((g) => g.kinds.map((k) => [k.kind, k.label])),
);

const KIND_DESCRIPTIONS: Record<string, string> = Object.fromEntries(
  KIND_GROUPS.flatMap((g) => g.kinds.map((k) => [k.kind, k.description])),
);

// Reports that are useful regardless of which standard is in scope (or when
// no standard has been picked yet). These are always shown in the report-kind
// dropdown so the user is never blocked.
const UNIVERSAL_KINDS: ReadonlySet<string> = new Set([
  "exec_brief",
  "compliance_audit",
  "requirements_summary",
  "traceability",
  "brd",
  "prd",
  "frd",
  "deployment_doc",
]);

// Map every supported framework code to the set of report kinds it
// effectively requires (or is the canonical author of). When the user
// picks one or more standards, the report-kind dropdown is narrowed to
// UNIVERSAL_KINDS ∪ (kinds required by any selected standard) and each
// kind that is mandated by a selected standard is badged "Required by X".
const STANDARD_REQUIRED_KINDS: Record<string, readonly string[]> = {
  // ── Functional safety ────────────────────────────────────────────────
  // ISO 26262: full automotive functional-safety lifecycle (Parts 2-9).
  "ISO 26262": ["safety_plan", "hara", "safety_concept", "tech_safety_concept", "safety_case", "srs_safety", "fmea", "fta", "dia", "vnv_plan", "scmp", "ci_list", "change_control_plan", "software_dev_plan", "software_verification_plan", "software_qa_plan", "architecture_doc", "hld", "lld", "test_cases"],
  // IEC 61508: generic E/E/PE functional safety (Parts 1-7).
  "IEC 61508": ["safety_plan", "srs_safety", "safety_case", "fmea", "fta", "vnv_plan", "scmp", "ci_list", "change_control_plan", "software_dev_plan", "software_verification_plan", "software_qa_plan", "architecture_doc", "hld", "lld", "test_cases"],
  // EN 5012x: railway functional safety — RAMS, software, communications, applications, on-board.
  "EN 50128": ["safety_plan", "srs_safety", "safety_case", "fmea", "fta", "vnv_plan", "scmp", "ci_list", "change_control_plan", "software_dev_plan", "software_verification_plan", "software_qa_plan", "architecture_doc", "hld", "lld", "test_cases"],
  "EN 50126": ["safety_plan", "srs_safety", "safety_case", "hara", "fmea", "fta", "vnv_plan", "change_control_plan"],
  "EN 50129": ["safety_plan", "srs_safety", "safety_case", "fmea", "fta", "vnv_plan", "scmp", "architecture_doc", "hld"],
  "EN 50657": ["safety_plan", "srs_safety", "safety_case", "fmea", "fta", "vnv_plan", "scmp", "ci_list", "software_dev_plan", "software_verification_plan", "software_qa_plan", "architecture_doc", "hld", "lld", "test_cases"],
  // IEC 61511: process-industry SIS — closely tied to IEC 61508.
  "IEC 61511": ["safety_plan", "srs_safety", "safety_case", "hara", "fmea", "fta", "vnv_plan", "change_control_plan"],
  // ISO 13849-1: safety of machinery (PL-based).
  "ISO 13849-1": ["safety_plan", "srs_safety", "fmea", "fta", "vnv_plan", "change_control_plan"],

  // ── Cybersecurity ─────────────────────────────────────────────────────
  // ISO/SAE 21434: automotive cybersecurity engineering lifecycle.
  "ISO/SAE 21434": ["cybersecurity_plan", "tara", "cybersecurity_concept", "cybersecurity_case", "security_risk_assessment", "vnv_plan", "change_control_plan"],
  // IEC 62443: industrial automation & control system security (-2-1 / -3-2 / -4-1 / -4-2).
  "IEC 62443": ["cybersecurity_plan", "tara", "cybersecurity_concept", "cybersecurity_case", "security_risk_assessment", "software_dev_plan", "software_verification_plan", "vnv_plan", "change_control_plan"],
  // ASPICE Cybersecurity 2.0: process-assessment companion to ISO/SAE 21434.
  "ASPICE Cybersecurity 2.0": ["cybersecurity_plan", "tara", "cybersecurity_concept", "cybersecurity_case", "change_control_plan", "software_qa_plan"],
  // ISO/IEC 27001 / 27002: ISMS + control catalogue.
  "ISO/IEC 27001": ["compliance_audit", "security_risk_assessment", "cybersecurity_plan", "change_control_plan", "software_qa_plan"],
  "ISO/IEC 27002": ["compliance_audit", "security_risk_assessment", "cybersecurity_plan", "change_control_plan"],
  // NIST CSF 2.0: govern / identify / protect / detect / respond / recover.
  "NIST CSF 2.0": ["compliance_audit", "security_risk_assessment", "cybersecurity_plan", "change_control_plan"],
  // PCI DSS 4.0: cardholder data security — req 6 secure-dev, req 12 policy.
  "PCI DSS 4.0": ["compliance_audit", "security_risk_assessment", "cybersecurity_plan", "change_control_plan", "vnv_plan", "software_dev_plan"],
  // HIPAA Security Rule: admin / physical / technical safeguards.
  "HIPAA": ["compliance_audit", "security_risk_assessment", "cybersecurity_plan", "change_control_plan"],
  // DORA: digital operational resilience (financial sector).
  "DORA": ["compliance_audit", "security_risk_assessment", "cybersecurity_plan", "change_control_plan", "vnv_plan"],
  // NIS2 directive: essential & important entities cyber.
  "NIS2": ["compliance_audit", "security_risk_assessment", "cybersecurity_plan", "change_control_plan"],
  // NERC CIP: bulk electric system cyber.
  "NERC CIP": ["compliance_audit", "security_risk_assessment", "cybersecurity_plan", "change_control_plan", "vnv_plan"],
  // API 1164: pipeline SCADA cybersecurity.
  "API 1164": ["compliance_audit", "security_risk_assessment", "cybersecurity_plan", "change_control_plan"],

  // ── Software-aspects standards ───────────────────────────────────────
  // DO-178C: airborne software (DAL A-E) — full plan/design/V&V/CM/QA stack.
  "DO-178C": ["psac", "software_dev_plan", "software_verification_plan", "software_qa_plan", "scmp", "ci_list", "vnv_plan", "change_control_plan", "architecture_doc", "hld", "lld", "test_cases", "srs_safety"],
  // IEC 62304: medical-device software lifecycle.
  "IEC 62304": ["software_dev_plan", "software_verification_plan", "software_qa_plan", "soup_list", "scmp", "ci_list", "vnv_plan", "risk_management_plan", "change_control_plan", "architecture_doc", "hld", "lld", "test_cases"],
  // IEEE point-standards.
  "IEEE 730": ["software_qa_plan"],
  "IEEE 828": ["scmp", "ci_list", "change_control_plan"],
  "IEEE 1012": ["vnv_plan", "test_cases", "software_verification_plan"],
  "IEEE 1016": ["hld", "lld"],
  "IEEE 1063": ["user_manual"],
  "ISO/IEC/IEEE 42010": ["architecture_doc", "hld"],
  "ISO/IEC/IEEE 29119": ["test_cases", "software_verification_plan", "vnv_plan"],

  // ── Risk management ──────────────────────────────────────────────────
  // ISO 14971: medical-device risk management.
  "ISO 14971": ["risk_management_plan", "fmea", "fta", "change_control_plan"],
  // ISO 31000: enterprise risk management framework.
  "ISO 31000": ["risk_management_plan"],

  // ── Medical / regulated devices ──────────────────────────────────────
  // ISO 13485: medical-device QMS — full QMS document set.
  "ISO 13485": ["risk_management_plan", "software_qa_plan", "scmp", "ci_list", "change_control_plan", "vnv_plan", "user_manual", "software_dev_plan", "software_verification_plan", "fmea"],
  // 21 CFR 820: FDA Quality System Regulation (design controls).
  "21 CFR 820": ["risk_management_plan", "software_qa_plan", "scmp", "ci_list", "change_control_plan", "vnv_plan", "software_dev_plan", "software_verification_plan", "fmea", "user_manual", "hld", "lld"],
  // 21 CFR 807: device establishment registration & listing.
  "21 CFR 807": ["compliance_audit", "change_control_plan"],
  // 21 CFR 814: PMA premarket approval submission.
  "21 CFR 814": ["compliance_audit", "risk_management_plan", "vnv_plan", "software_qa_plan", "change_control_plan", "test_cases"],
  // IEC 60601: medical electrical equipment (with 60601-1-6 usability + 62304 software).
  "IEC 60601": ["risk_management_plan", "software_qa_plan", "vnv_plan", "user_manual", "software_dev_plan", "software_verification_plan", "scmp", "ci_list", "change_control_plan", "fmea"],
  // EU MDR / IVDR: technical documentation Annex II/III + post-market surveillance.
  "MDR 2017/745": ["compliance_audit", "risk_management_plan", "vnv_plan", "user_manual", "software_dev_plan", "software_verification_plan", "scmp", "change_control_plan", "software_qa_plan", "test_cases", "fmea"],
  "IVDR 2017/746": ["compliance_audit", "risk_management_plan", "vnv_plan", "user_manual", "software_dev_plan", "software_verification_plan", "scmp", "change_control_plan", "software_qa_plan", "test_cases", "fmea"],
  // IEC 62366: medical-device usability engineering.
  "IEC 62366": ["risk_management_plan", "vnv_plan", "user_manual", "software_qa_plan", "change_control_plan", "test_cases"],
  // ISO 14155: clinical investigation of medical devices.
  "ISO 14155": ["compliance_audit", "risk_management_plan", "change_control_plan", "software_qa_plan"],
  // 21 CFR Part 11: electronic records & signatures (CSV — Computerized System Validation).
  // GxP CSV requires validation lifecycle, audit trails, access controls,
  // change control, training, SOPs, and software-development documentation.
  "21 CFR Part 11": ["compliance_audit", "software_qa_plan", "change_control_plan", "security_risk_assessment", "vnv_plan", "software_verification_plan", "software_dev_plan", "test_cases", "ci_list", "scmp", "cybersecurity_plan", "user_manual", "risk_management_plan"],

  // ── Quality / process ────────────────────────────────────────────────
  // ISO 9001: QMS — clause 7 documented info, clause 8 operations.
  "ISO 9001": ["software_qa_plan", "scmp", "ci_list", "change_control_plan", "vnv_plan", "risk_management_plan"],
  // CMMI 3.0: dev process maturity — TS, VV, CM, RSK, PQA practice areas.
  "CMMI 3.0": ["software_qa_plan", "scmp", "ci_list", "change_control_plan", "vnv_plan", "architecture_doc", "hld", "lld", "test_cases", "software_dev_plan", "software_verification_plan", "risk_management_plan"],
  // ASPICE 4.0: automotive SPICE — SYS, SWE, SUP, MAN process groups.
  "ASPICE 4.0": ["software_qa_plan", "scmp", "ci_list", "change_control_plan", "vnv_plan", "software_dev_plan", "software_verification_plan", "architecture_doc", "hld", "lld", "test_cases", "risk_management_plan"],

  // ── Industrial / OT control ──────────────────────────────────────────
  // IEC 61131-3: PLC programming languages & lifecycle.
  "IEC 61131-3": ["srs_safety", "fmea", "hld", "lld", "test_cases", "software_dev_plan", "software_verification_plan"],
  // IEC 60204-1: electrical equipment of machines.
  "IEC 60204-1": ["srs_safety", "fmea", "hld", "lld", "test_cases", "user_manual"],
  // ISO 10218-1: industrial robot safety.
  "ISO 10218-1": ["srs_safety", "fmea", "hld", "lld", "test_cases", "user_manual"],
  // ISA-95: enterprise-control system integration.
  "ISA-95": ["hld", "lld", "architecture_doc", "software_dev_plan"],

  // ── Privacy / AI / cross-cutting regulation ──────────────────────────
  // GDPR: lawful basis, security of processing (Art. 32), DPIA (Art. 35).
  "GDPR": ["compliance_audit", "risk_management_plan", "security_risk_assessment", "cybersecurity_plan", "change_control_plan"],
  // SOC 2 Trust Services Criteria.
  "SOC 2": ["compliance_audit", "security_risk_assessment", "cybersecurity_plan", "change_control_plan", "software_qa_plan"],
  // EU AI Act: Annex IV technical documentation for high-risk AI systems
  // (risk mgmt, data governance, accuracy/robustness/cybersecurity, human oversight).
  "EU AI Act": ["compliance_audit", "risk_management_plan", "security_risk_assessment", "cybersecurity_plan", "vnv_plan", "change_control_plan", "test_cases", "architecture_doc", "software_qa_plan"],
};

export default function Reports() {
  const { projectId } = useProjectContext();
  const { data, isLoading } = useReports(projectId);
  const { data: frameworksData } = useListComplianceFrameworks();
  const allFrameworks = (frameworksData ?? []) as Array<{ id: string; code: string; name: string }>;
  const generate = useGenerateReport();
  const del = useDeleteReport();
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    kind: string;
    tone: string;
    frameworkIds: string[];
    instructions: string;
  }>({
    kind: "exec_brief",
    tone: "executive",
    frameworkIds: [],
    instructions: "",
  });

  // Resolve the codes for the currently-selected standards. We key our
  // filtering map by code (not id) because codes are stable across DB seeds
  // and human-readable in the badge UI.
  const selectedCodes = useMemo(
    () => allFrameworks.filter((f) => form.frameworkIds.includes(f.id)).map((f) => f.code),
    [allFrameworks, form.frameworkIds],
  );

  // For each report kind, the list of selected standards that explicitly
  // require it. Empty when the kind is universal or simply not standard-bound.
  const requiredByMap = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const code of selectedCodes) {
      const kinds = STANDARD_REQUIRED_KINDS[code];
      if (!kinds) continue;
      for (const k of kinds) {
        if (!m[k]) m[k] = [];
        m[k].push(code);
      }
    }
    return m;
  }, [selectedCodes]);

  // Narrow the report-kind dropdown to just universal kinds + anything any
  // selected standard demands. With nothing selected, show everything so
  // the user is never blocked from picking a non-standards-bound report.
  const filteredKindGroups = useMemo(() => {
    if (selectedCodes.length === 0) return KIND_GROUPS;
    const allowed = new Set<string>(UNIVERSAL_KINDS);
    for (const code of selectedCodes) {
      for (const k of STANDARD_REQUIRED_KINDS[code] ?? []) allowed.add(k);
    }
    return KIND_GROUPS
      .map((g) => ({ ...g, kinds: g.kinds.filter((k) => allowed.has(k.kind)) }))
      .filter((g) => g.kinds.length > 0);
  }, [selectedCodes]);

  const allowedKindSet = useMemo(
    () => new Set(filteredKindGroups.flatMap((g) => g.kinds.map((k) => k.kind))),
    [filteredKindGroups],
  );

  // If the user changes their standards selection in a way that excludes
  // the currently-chosen kind, jump them to the first surviving kind so
  // the form never sits in an invalid state.
  useEffect(() => {
    if (allowedKindSet.size > 0 && !allowedKindSet.has(form.kind)) {
      setForm((f) => ({ ...f, kind: filteredKindGroups[0]!.kinds[0]!.kind }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedKindSet]);

  function submit() {
    if (!projectId) return;
    generate.mutate(
      {
        projectId,
        kind: form.kind,
        tone: form.tone,
        // Send the new multi-standard array. Backend also accepts the legacy
        // singular frameworkId for back-compat, but we now always send the
        // array shape so prompts get every selected standard's blueprint.
        frameworkIds: form.frameworkIds,
        // Keep singular frameworkId for the very first one as well, so any
        // server-side fallback that still reads it picks the primary.
        frameworkId: form.frameworkIds[0],
        instructions: form.instructions || undefined,
      },
      {
        onSuccess: (r) => {
          setOpen(false);
          setActiveId(r.id);
        },
      },
    );
  }

  // Compliance audit reports cannot be generated without at least one
  // standard — keep the UI in lockstep with the server-side guard.
  const submitDisabled =
    generate.isPending ||
    (form.kind === "compliance_audit" && form.frameworkIds.length === 0);

  return (
    <AppLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">AI Reports</h1>
            <p className="text-slate-600">
              Long-form audit, traceability, and executive reports generated from project data — refined by chat, exported to PDF/DOCX/HTML.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="report-new">
                <Sparkles className="h-4 w-4 mr-2" />
                Generate report
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate AI report</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                {/* 1. Standards first — they drive what reports are offered next. */}
                <StandardsMultiSelect
                  value={form.frameworkIds}
                  onChange={(ids) => setForm({ ...form, frameworkIds: ids })}
                  required={form.kind === "compliance_audit"}
                  helper="Pick every standard this document must satisfy. The list of available reports below will adapt to cover everything those standards require."
                />
                {form.kind === "compliance_audit" && form.frameworkIds.length === 0 && (
                  <p className="text-[11px] text-amber-600">
                    Compliance audit reports need at least one standard selected.
                  </p>
                )}

                {/* 2. Report kind — filtered to what the selected standards require. */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-600">Report kind</label>
                    {selectedCodes.length > 0 && (
                      <span className="text-[10px] text-slate-500">
                        Showing reports required by {selectedCodes.join(", ")}
                      </span>
                    )}
                  </div>
                  <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v })}>
                    <SelectTrigger data-testid="report-kind-select"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-[420px]">
                      {filteredKindGroups.map((group) => (
                        <SelectGroup key={group.label}>
                          <SelectLabel className="text-[11px] uppercase tracking-wide text-slate-500">
                            {group.label}
                          </SelectLabel>
                          {group.kinds.map((k) => {
                            const requiredBy = requiredByMap[k.kind];
                            return (
                              <SelectItem key={k.kind} value={k.kind}>
                                <div className="flex flex-col">
                                  <span className="font-medium flex items-center gap-1.5">
                                    {k.label}
                                    {requiredBy && requiredBy.length > 0 && (
                                      <Badge variant="secondary" className="text-[9px] py-0 px-1.5 font-normal">
                                        Required by {requiredBy.join(", ")}
                                      </Badge>
                                    )}
                                  </span>
                                  <span className="text-[10px] text-slate-500 max-w-[320px]">
                                    {k.description}
                                  </span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                  {KIND_DESCRIPTIONS[form.kind] && (
                    <p className="text-[11px] text-slate-500 mt-1">{KIND_DESCRIPTIONS[form.kind]}</p>
                  )}
                </div>

                {/* 3. Audience tone. */}
                <div>
                  <label className="text-xs font-medium text-slate-600">Audience tone</label>
                  <Select value={form.tone} onValueChange={(v) => setForm({ ...form, tone: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="executive">Executive (board-room)</SelectItem>
                      <SelectItem value="technical">Technical (engineering)</SelectItem>
                      <SelectItem value="regulator">Regulator / external auditor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600">Extra instructions (optional)</label>
                  <Textarea
                    rows={3}
                    placeholder="e.g. emphasise supplier risk, reference Q3 audit, target European market"
                    value={form.instructions}
                    onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                  />
                </div>
                {generate.error && <div className="text-sm text-red-600">{(generate.error as Error).message}</div>}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={submit} disabled={submitDisabled}>
                  {generate.isPending ? "Generating…" : "Generate"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader><CardTitle>Report library</CardTitle></CardHeader>
          <CardContent>
            {isLoading && <div className="text-sm text-slate-500">Loading…</div>}
            {data?.reports.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <FileText className="mx-auto h-10 w-10 mb-2 opacity-40" />
                No reports yet. Generate your first one above.
              </div>
            )}
            <div className="divide-y divide-slate-200">
              {data?.reports.map((r) => (
                <div key={r.id} className="py-3 flex items-center justify-between">
                  <button
                    className="text-left flex-1"
                    onClick={() => setActiveId(r.id)}
                    data-testid={`report-row-${r.id}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-[10px]">{KIND_LABELS[r.kind] ?? r.kind}</Badge>
                      <Badge variant="outline" className="text-[10px]">{r.tone}</Badge>
                    </div>
                    <div className="font-medium text-slate-900">{r.title}</div>
                    <div className="text-xs text-slate-500">Updated {new Date(r.updatedAt).toLocaleString()}</div>
                  </button>
                  <div className="flex items-center gap-1">
                    <a href={reportExportUrl(r.id, "pdf")} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1" />PDF</Button>
                    </a>
                    <a href={reportExportUrl(r.id, "docx")}>
                      <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1" />DOCX</Button>
                    </a>
                    <PushToRepoButton
                      projectId={projectId}
                      kind="report"
                      reportId={r.id}
                      label="Push"
                      defaultCommitMessage={`chore(auditee): add ${KIND_LABELS[r.kind] ?? r.kind} — ${r.title.slice(0, 60)}`}
                      testid={`push-report-${r.id}`}
                    />
                    <Button variant="ghost" size="icon" onClick={() => del.mutate(r.id)}>
                      <Trash2 className="h-4 w-4 text-slate-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {activeId && <ReportViewer id={activeId} onClose={() => setActiveId(null)} />}
      </div>
    </AppLayout>
  );
}

function ReportViewer({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: report, isLoading } = useReport(id);
  const refine = useRefineReport();
  const [instr, setInstr] = useState("");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {isLoading && <div className="text-sm text-slate-500">Loading…</div>}
        {report && (
          <>
            <DialogHeader>
              <DialogTitle>{report.title}</DialogTitle>
              {report.content.subtitle && <p className="text-sm text-slate-500">{report.content.subtitle}</p>}
            </DialogHeader>
            <div className="flex gap-2 mb-2 flex-wrap">
              <a href={reportExportUrl(report.id, "html")} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1" />HTML</Button>
              </a>
              <a href={reportExportUrl(report.id, "pdf")} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1" />PDF (print)</Button>
              </a>
              <a href={reportExportUrl(report.id, "docx")}>
                <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1" />DOCX</Button>
              </a>
              <PushToRepoButton
                projectId={projectId}
                kind="report"
                reportId={report.id}
                label="Push to repo"
                defaultCommitMessage={`chore(auditee): add report — ${report.title.slice(0, 60)}`}
                testid={`push-report-viewer-${report.id}`}
              />
            </div>
            <div className="bg-slate-50 border-l-4 border-primary rounded p-4 my-3">
              <div className="text-xs font-bold text-slate-500 uppercase mb-1">Executive summary</div>
              <div className="text-sm text-slate-800 whitespace-pre-wrap">{report.content.executiveSummary}</div>
            </div>
            <div className="prose prose-sm max-w-none">
              {report.content.sections.map((s) => (
                <section key={s.id} className="mb-5">
                  <h3 className="font-semibold text-slate-900 border-b border-slate-200 pb-1 mb-2">{s.heading}</h3>
                  <div className="text-sm text-slate-700 whitespace-pre-wrap">{s.body}</div>
                  {s.citations && s.citations.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="text-[10px] uppercase text-slate-500 mr-1">Evidence:</span>
                      {s.citations.map((c) => (
                        <Badge key={c} variant="outline" className="font-mono text-[10px]">{c}</Badge>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
            <details className="border-t border-slate-200 pt-3 text-xs">
              <summary className="cursor-pointer font-semibold text-slate-700">Evidence index ({report.content.evidence.length})</summary>
              <ul className="mt-2 space-y-1 text-slate-600">
                {report.content.evidence.slice(0, 80).map((e) => (
                  <li key={e.id}><span className="font-mono">{e.id}</span> — {e.label} <em className="text-slate-400">({e.source})</em></li>
                ))}
              </ul>
            </details>
            <div className="border-t border-slate-200 pt-4 mt-2">
              <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                <RefreshCw className="h-3.5 w-3.5" />
                Refine with AI
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder='e.g. "shorten the exec summary" or "add a section on supplier risk"'
                  value={instr}
                  onChange={(e) => setInstr(e.target.value)}
                />
                <Button
                  disabled={refine.isPending || instr.trim().length < 3}
                  onClick={() =>
                    refine.mutate(
                      { id: report.id, instruction: instr },
                      { onSuccess: () => setInstr("") },
                    )
                  }
                >
                  {refine.isPending ? "Refining…" : "Refine"}
                </Button>
              </div>
              {refine.error && <div className="text-xs text-red-600 mt-2">{(refine.error as Error).message}</div>}
              {report.history.length > 1 && (
                <div className="mt-3 text-xs text-slate-500">
                  <div className="font-semibold mb-1">Refinement history</div>
                  <ul className="space-y-0.5">
                    {report.history.slice().reverse().map((h, i) => (
                      <li key={i}>· {h.instruction} <span className="text-slate-400">({new Date(h.at).toLocaleString()})</span></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <Comments entityType="report" entityId={report.id} projectId={report.projectId} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
