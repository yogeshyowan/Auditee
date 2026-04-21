import { pool } from "@workspace/db";
import { logger } from "./logger";

type GapReq = {
  code: string;
  title: string;
  description: string;
  type: "BRD" | "PRD" | "FRD" | "NFR";
  priority: "low" | "medium" | "high" | "critical";
  tags: string[];
};

const PROJECT = {
  id: "proj-platform-roadmap",
  name: "EltegraAI — Platform Capabilities Roadmap",
  slug: "platform",
  description:
    "Gap analysis vs. SafetyCulture iAuditor, Praxie, ReportGPT, and Process Street. Tracks capabilities EltegraAI must add to reach feature parity with adjacent inspection, work-management, AI-reporting, and workflow tools.",
  owner: "Product",
  complianceScore: 0,
};

const REQUIREMENTS: GapReq[] = [
  // ───────── SafetyCulture iAuditor ─────────
  {
    code: "ELTP-0001",
    title: "Mobile inspection app with offline-first sync",
    description:
      "Source: SafetyCulture iAuditor. Field engineers and auditors must be able to perform inspections from a mobile device without connectivity, with deferred sync of forms, photos, and signatures when back online.",
    type: "FRD",
    priority: "high",
    tags: ["mobile", "offline", "inspections", "iAuditor"],
  },
  {
    code: "ELTP-0002",
    title: "Photo and video evidence capture with annotations",
    description:
      "Source: SafetyCulture iAuditor. Allow inspectors to attach photos/videos to control evidence, annotate hotspots, and link to specific requirements or compliance controls.",
    type: "FRD",
    priority: "high",
    tags: ["evidence", "media", "inspections", "iAuditor"],
  },
  {
    code: "ELTP-0003",
    title: "GPS geo-tagging of audits and inspections",
    description:
      "Source: SafetyCulture iAuditor. Capture geo-location for each completed inspection/audit submission for chain-of-custody and on-site verification.",
    type: "FRD",
    priority: "medium",
    tags: ["geolocation", "audit", "iAuditor"],
  },
  {
    code: "ELTP-0004",
    title: "Recurring scheduled audits and inspections",
    description:
      "Source: SafetyCulture iAuditor. Configure inspection cadence (daily/weekly/monthly/quarterly), assign to teams, auto-create audit instances, and surface overdue items.",
    type: "FRD",
    priority: "high",
    tags: ["scheduling", "audit", "iAuditor"],
  },
  {
    code: "ELTP-0005",
    title: "Corrective action management with due dates and ownership",
    description:
      "Source: SafetyCulture iAuditor. From any failed control or open gap, create a CAPA item with assignee, severity, due date, evidence-on-close, and SLA tracking.",
    type: "FRD",
    priority: "critical",
    tags: ["CAPA", "actions", "iAuditor"],
  },
  {
    code: "ELTP-0006",
    title: "Asset and equipment register linked to inspections",
    description:
      "Source: SafetyCulture iAuditor. Maintain a register of physical assets (lines, devices, sites) with inspection history, certifications, and maintenance schedules.",
    type: "FRD",
    priority: "medium",
    tags: ["assets", "inventory", "iAuditor"],
  },
  {
    code: "ELTP-0007",
    title: "IoT sensor data ingestion for continuous compliance signals",
    description:
      "Source: SafetyCulture iAuditor. Ingest telemetry (temperature, vibration, access events) and trigger automatic findings or audits when thresholds breach.",
    type: "NFR",
    priority: "medium",
    tags: ["iot", "telemetry", "monitoring", "iAuditor"],
  },

  // ───────── Praxie ─────────
  {
    code: "ELTP-0008",
    title: "Process template library (Lean, Six Sigma, OKR, RACI)",
    description:
      "Source: Praxie. Provide a curated library of operational process templates that teams can fork into projects, with versioning and adoption analytics.",
    type: "FRD",
    priority: "high",
    tags: ["templates", "process", "praxie"],
  },
  {
    code: "ELTP-0009",
    title: "OKR tracking with alignment to projects and requirements",
    description:
      "Source: Praxie. Capture company / team / individual OKRs and align them to specific projects, requirements, or compliance controls; show roll-up health.",
    type: "FRD",
    priority: "high",
    tags: ["okr", "alignment", "praxie"],
  },
  {
    code: "ELTP-0010",
    title: "Custom KPI dashboard builder",
    description:
      "Source: Praxie. Drag-and-drop dashboard builder for project, compliance, traceability, and engineering KPIs; per-role views; embeddable widgets.",
    type: "FRD",
    priority: "medium",
    tags: ["dashboards", "kpi", "analytics", "praxie"],
  },
  {
    code: "ELTP-0011",
    title: "Cross-team workspace boards with comments and mentions",
    description:
      "Source: Praxie. Provide collaborative boards (kanban / list) tied to projects, with @mentions, threaded comments, and activity digests.",
    type: "FRD",
    priority: "medium",
    tags: ["collaboration", "workspaces", "praxie"],
  },
  {
    code: "ELTP-0012",
    title: "Multi-step approval routing for requirements and audits",
    description:
      "Source: Praxie. Define approval chains (parallel and sequential) for requirements, audit findings, and CAPAs with delegation, recall, and audit trail.",
    type: "FRD",
    priority: "high",
    tags: ["approvals", "workflow", "praxie"],
  },

  // ───────── ReportGPT ─────────
  {
    code: "ELTP-0013",
    title: "AI-generated long-form compliance and audit reports",
    description:
      "Source: ReportGPT. Generate executive-ready audit reports (HIPAA, SOC2, ASPICE, CMMI, etc.) from project + audit data with structured outline, findings, and recommendations.",
    type: "FRD",
    priority: "critical",
    tags: ["ai", "reports", "compliance", "ReportGPT"],
  },
  {
    code: "ELTP-0014",
    title: "Multi-format export of reports and traceability matrices (PDF, DOCX, HTML)",
    description:
      "Source: ReportGPT. Export any AI-generated report or live traceability/RTM view to PDF, DOCX, and HTML with brand styling and embedded charts.",
    type: "FRD",
    priority: "high",
    tags: ["export", "pdf", "docx", "ReportGPT"],
  },
  {
    code: "ELTP-0015",
    title: "Reference and citation manager for evidence in reports",
    description:
      "Source: ReportGPT. Maintain an evidence library (requirement codes, control codes, code artifacts, documents) with auto-numbered citations inserted into reports.",
    type: "FRD",
    priority: "medium",
    tags: ["citations", "evidence", "ReportGPT"],
  },
  {
    code: "ELTP-0016",
    title: "Iterative chat-based refinement of generated reports",
    description:
      "Source: ReportGPT. After initial generation, allow users to refine sections via chat (\"shorten exec summary\", \"add a section on supplier risk\") with diff preview and accept/reject.",
    type: "FRD",
    priority: "medium",
    tags: ["ai", "iterative", "ReportGPT"],
  },
  {
    code: "ELTP-0017",
    title: "Configurable tone and audience styles for AI outputs",
    description:
      "Source: ReportGPT. Provide selectable tone presets (executive, technical, regulator-facing) that adjust verbosity, jargon, and structure of AI-generated content.",
    type: "NFR",
    priority: "low",
    tags: ["ai", "tone", "ReportGPT"],
  },

  // ───────── Process Street ─────────
  {
    code: "ELTP-0018",
    title: "Workflow templates with structured checklists",
    description:
      "Source: Process Street. Define reusable workflow templates (e.g. release readiness, vendor onboarding, incident review) as ordered checklists that can be instantiated per project.",
    type: "FRD",
    priority: "high",
    tags: ["workflow", "checklists", "ProcessStreet"],
  },
  {
    code: "ELTP-0019",
    title: "Conditional logic and dynamic branching in workflows",
    description:
      "Source: Process Street. Show/hide steps and assign owners based on form input (e.g., \"if PHI involved, add HIPAA review step\").",
    type: "FRD",
    priority: "medium",
    tags: ["workflow", "conditional", "ProcessStreet"],
  },
  {
    code: "ELTP-0020",
    title: "Stop tasks and approval gates that block workflow progression",
    description:
      "Source: Process Street. Mark steps as gating: downstream steps cannot start until the gate is approved by the named role/user.",
    type: "FRD",
    priority: "high",
    tags: ["workflow", "gates", "approvals", "ProcessStreet"],
  },
  {
    code: "ELTP-0021",
    title: "Email and SMS notifications with reminder cadence",
    description:
      "Source: Process Street. Notify owners of new assignments, due-date proximity, and SLA breaches over email/SMS with quiet-hours and digest options.",
    type: "FRD",
    priority: "high",
    tags: ["notifications", "email", "sms", "ProcessStreet"],
  },
  {
    code: "ELTP-0022",
    title: "Third-party integrations (Zapier, Make, Slack, MS Teams, Jira)",
    description:
      "Source: Process Street. Surface workflow events into Zapier/Make and post updates to Slack/Teams; create/sync issues with Jira and Azure DevOps.",
    type: "FRD",
    priority: "high",
    tags: ["integrations", "zapier", "slack", "ProcessStreet"],
  },
  {
    code: "ELTP-0023",
    title: "Workflow analytics: cycle time, bottleneck and SLA dashboards",
    description:
      "Source: Process Street. Per-template analytics on cycle time, step bottlenecks, on-time completion rate, and SLA breaches with drill-down.",
    type: "FRD",
    priority: "medium",
    tags: ["analytics", "workflow", "ProcessStreet"],
  },
  {
    code: "ELTP-0024",
    title: "Dynamic due dates relative to workflow start or upstream completion",
    description:
      "Source: Process Street. Allow steps to compute their due date as \"start + N business days\" or \"previous step finish + N hours\".",
    type: "FRD",
    priority: "low",
    tags: ["workflow", "due-dates", "ProcessStreet"],
  },
];

export async function bootstrapGapRequirements(): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO projects (id, name, slug, description, owner, compliance_score, created_at)
       VALUES ($1,$2,$3,$4,$5,$6, NOW())
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description`,
      [PROJECT.id, PROJECT.name, PROJECT.slug, PROJECT.description, PROJECT.owner, PROJECT.complianceScore],
    );

    let inserted = 0;
    for (const r of REQUIREMENTS) {
      const id = `req-${PROJECT.slug}-${r.code.toLowerCase()}`;
      const res = await pool.query(
        `INSERT INTO requirements (id, project_id, code, title, description, type, status, priority, owner, tags, linked_frameworks, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        [
          id,
          PROJECT.id,
          r.code,
          r.title,
          r.description,
          r.type,
          "draft",
          r.priority,
          "Product",
          JSON.stringify(r.tags),
          JSON.stringify([]),
        ],
      );
      if (res.rowCount && res.rowCount > 0) inserted++;
    }
    if (inserted > 0) {
      logger.info({ project: PROJECT.id, inserted, total: REQUIREMENTS.length }, "Bootstrapped gap requirements");
    }

    // Mark requirements that have actually shipped as 'done' (idempotent).
    const shippedCodes = ["ELTP-0005", "ELTP-0011", "ELTP-0013", "ELTP-0014", "ELTP-0015", "ELTP-0016", "ELTP-0017"];
    await pool.query(
      `UPDATE requirements
       SET status = 'done', updated_at = NOW()
       WHERE project_id = $1 AND code = ANY($2::text[]) AND status <> 'done'`,
      [PROJECT.id, shippedCodes],
    );
  } catch (err) {
    logger.warn({ err }, "Gap requirements bootstrap failed (continuing startup)");
  }
}
