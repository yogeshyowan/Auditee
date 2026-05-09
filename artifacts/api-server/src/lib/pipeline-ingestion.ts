/**
 * Pipeline ingestion — parses payloads from CI/CD/CD/test/data/MLOps/scan/infra
 * pipelines and persists them as `pipeline_runs` (+ `pipeline_findings`) rows
 * linked to a `project_sources` row.
 *
 * Six adapters are wired up:
 *   - github_actions   (workflow_run / check_run webhook)
 *   - gitlab_ci        (Pipeline Hook / Job Hook)
 *   - jenkins          (Notification Plugin JSON)
 *   - sarif_upload     (SARIF v2.1.0 — covers SonarQube/Snyk/Semgrep/Checkmarx/Veracode/ZAP/Black Duck)
 *   - junit_upload     (JUnit XML — covers every test runner on Earth)
 *   - generic_webhook  (best-effort field mapping for any tool emitting JSON)
 */
import { randomUUID } from "node:crypto";
import {
  db,
  pipelineRunsTable,
  pipelineFindingsTable,
  projectSourcesTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import type { PipelineCategory, PipelineToolDef } from "./pipeline-registry.js";
import { getPipelineTool } from "./pipeline-registry.js";

interface PipelineRunInput {
  sourceId: string;
  projectId: string;
  kind: string;
  category: PipelineCategory;
  externalId?: string | null;
  externalUrl?: string | null;
  name: string;
  branch?: string | null;
  commitSha?: string | null;
  triggeredBy?: string | null;
  status: string;
  conclusion?: string | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  durationSec?: number | null;
  testsTotal?: number | null;
  testsPassed?: number | null;
  testsFailed?: number | null;
  testsSkipped?: number | null;
  findingsCritical?: number;
  findingsHigh?: number;
  findingsMedium?: number;
  findingsLow?: number;
  environment?: string | null;
  rawPayload?: Record<string, unknown> | null;
}

export async function persistPipelineRun(
  input: PipelineRunInput,
  findings: Array<Omit<typeof pipelineFindingsTable.$inferInsert, "id" | "runId" | "sourceId" | "projectId">> = [],
): Promise<{ runId: string }> {
  const id = randomUUID();
  await db.insert(pipelineRunsTable).values({
    id,
    sourceId: input.sourceId,
    projectId: input.projectId,
    kind: input.kind,
    category: input.category,
    externalId: input.externalId ?? null,
    externalUrl: input.externalUrl ?? null,
    name: input.name.slice(0, 480),
    branch: input.branch ?? null,
    commitSha: input.commitSha ?? null,
    triggeredBy: input.triggeredBy ?? null,
    status: input.status,
    conclusion: input.conclusion ?? null,
    startedAt: input.startedAt ?? null,
    completedAt: input.completedAt ?? null,
    durationSec: input.durationSec ?? null,
    testsTotal: input.testsTotal ?? null,
    testsPassed: input.testsPassed ?? null,
    testsFailed: input.testsFailed ?? null,
    testsSkipped: input.testsSkipped ?? null,
    findingsCritical: input.findingsCritical ?? 0,
    findingsHigh: input.findingsHigh ?? 0,
    findingsMedium: input.findingsMedium ?? 0,
    findingsLow: input.findingsLow ?? 0,
    environment: input.environment ?? null,
    rawPayload: input.rawPayload ?? null,
  });

  if (findings.length > 0) {
    // Cap to 500 findings per run — anything more is statistically a duplicate
    // glut and bloats the audit-prompt evidence block.
    const capped = findings.slice(0, 500);
    await db.insert(pipelineFindingsTable).values(
      capped.map((f) => ({
        ...f,
        id: randomUUID(),
        runId: id,
        sourceId: input.sourceId,
        projectId: input.projectId,
      })),
    );
  }

  // Touch the parent source so the UI shows a recent sync time.
  await db
    .update(projectSourcesTable)
    .set({
      status: "ready",
      statusMessage: `Last pipeline run: ${input.name} — ${input.status}`,
      lastSyncAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(projectSourcesTable.id, input.sourceId));

  return { runId: id };
}

// ─── GitHub Actions adapter ───────────────────────────────────────────────
export function parseGithubActionsWorkflowRun(payload: any): Omit<PipelineRunInput, "sourceId" | "projectId"> {
  const wr = payload?.workflow_run ?? {};
  const status = String(wr.status ?? "queued");
  const conclusion = wr.conclusion ? String(wr.conclusion) : null;
  // GitHub uses status (queued/in_progress/completed) + conclusion
  // (success/failure/cancelled/neutral/skipped/timed_out/action_required).
  const normStatus = status === "completed"
    ? (conclusion === "success" ? "success"
      : conclusion === "failure" ? "failure"
      : conclusion === "cancelled" ? "cancelled"
      : conclusion === "skipped" ? "skipped"
      : "failure")
    : (status === "in_progress" ? "running" : "queued");
  const startedAt = wr.run_started_at ? new Date(wr.run_started_at) : null;
  const completedAt = wr.updated_at && status === "completed" ? new Date(wr.updated_at) : null;
  const durationSec = startedAt && completedAt
    ? Math.max(0, Math.round((completedAt.getTime() - startedAt.getTime()) / 1000))
    : null;
  return {
    kind: "github_actions",
    category: "ci_cd",
    externalId: String(wr.id ?? ""),
    externalUrl: wr.html_url ?? null,
    name: String(wr.name ?? wr.display_title ?? "GitHub Actions run"),
    branch: wr.head_branch ?? null,
    commitSha: wr.head_sha ?? null,
    triggeredBy: wr.actor?.login ?? wr.triggering_actor?.login ?? null,
    status: normStatus,
    conclusion,
    startedAt,
    completedAt,
    durationSec,
    rawPayload: clamp(payload),
  };
}

// ─── GitLab CI adapter ────────────────────────────────────────────────────
export function parseGitlabPipelineHook(payload: any): Omit<PipelineRunInput, "sourceId" | "projectId"> {
  const oa = payload?.object_attributes ?? {};
  const project = payload?.project ?? {};
  const commit = payload?.commit ?? {};
  const status = String(oa.status ?? "pending");
  // GitLab: created/waiting_for_resource/preparing/pending/running/success/failed/canceled/skipped/manual/scheduled
  const normStatus = status === "success" ? "success"
    : status === "failed" ? "failure"
    : status === "canceled" ? "cancelled"
    : status === "skipped" ? "skipped"
    : status === "running" ? "running"
    : "queued";
  const startedAt = oa.created_at ? new Date(oa.created_at) : null;
  const completedAt = oa.finished_at ? new Date(oa.finished_at) : null;
  const durationSec = typeof oa.duration === "number" ? oa.duration : null;
  return {
    kind: "gitlab_ci",
    category: "ci_cd",
    externalId: String(oa.id ?? ""),
    externalUrl: oa.url ?? `${project.web_url ?? ""}/-/pipelines/${oa.id ?? ""}`,
    name: String(oa.name ?? `${project.name ?? "GitLab"} pipeline #${oa.id ?? ""}`),
    branch: oa.ref ?? null,
    commitSha: commit.id ?? oa.sha ?? null,
    triggeredBy: payload?.user?.username ?? null,
    status: normStatus,
    conclusion: status,
    startedAt,
    completedAt,
    durationSec,
    rawPayload: clamp(payload),
  };
}

// ─── Jenkins adapter ──────────────────────────────────────────────────────
export function parseJenkinsNotification(payload: any): Omit<PipelineRunInput, "sourceId" | "projectId"> {
  const build = payload?.build ?? {};
  const phase = String(build.phase ?? payload?.phase ?? "STARTED").toUpperCase();
  const result = build.status ? String(build.status).toUpperCase() : null;
  // Jenkins phases: STARTED / COMPLETED / FINALIZED. Result: SUCCESS / FAILURE / UNSTABLE / ABORTED / NOT_BUILT.
  const normStatus = phase === "STARTED" ? "running"
    : result === "SUCCESS" ? "success"
    : result === "FAILURE" ? "failure"
    : result === "UNSTABLE" ? "unstable"
    : result === "ABORTED" ? "cancelled"
    : result === "NOT_BUILT" ? "skipped"
    : "queued";
  const startedAt = build.timestamp ? new Date(build.timestamp) : null;
  const durationSec = typeof build.duration === "number" ? Math.round(build.duration / 1000) : null;
  const completedAt = startedAt && durationSec !== null
    ? new Date(startedAt.getTime() + durationSec * 1000)
    : null;
  return {
    kind: "jenkins",
    category: "ci_cd",
    externalId: String(build.number ?? ""),
    externalUrl: build.full_url ?? build.url ?? null,
    name: String(payload?.name ?? "Jenkins build"),
    branch: build.scm?.branch ?? null,
    commitSha: build.scm?.commit ?? null,
    triggeredBy: build.parameters?.userId ?? null,
    status: normStatus,
    conclusion: result,
    startedAt,
    completedAt,
    durationSec,
    rawPayload: clamp(payload),
  };
}

// ─── JUnit XML adapter ────────────────────────────────────────────────────
// Minimal regex-based JUnit parser. Sums up tests/failures/errors/skipped
// across <testsuite> / <testsuites> blocks. Captures up to 500 failed tests
// as findings so the audit can cite them.
export function parseJUnitXml(xml: string, tool: PipelineToolDef): {
  run: Omit<PipelineRunInput, "sourceId" | "projectId">;
  findings: Array<Omit<typeof pipelineFindingsTable.$inferInsert, "id" | "runId" | "sourceId" | "projectId">>;
} {
  const totals = { tests: 0, failures: 0, errors: 0, skipped: 0, time: 0 };
  // Sum across all testsuite tags (also handles single testsuites root)
  const suiteRegex = /<testsuite\b([^>]*)>/g;
  const findings: Array<Omit<typeof pipelineFindingsTable.$inferInsert, "id" | "runId" | "sourceId" | "projectId">> = [];
  let m: RegExpExecArray | null;
  while ((m = suiteRegex.exec(xml)) !== null) {
    const attrs = m[1] ?? "";
    const get = (k: string): number => {
      const r = new RegExp(`${k}="(\\d+(?:\\.\\d+)?)"`).exec(attrs);
      return r ? Number(r[1]) : 0;
    };
    totals.tests += get("tests");
    totals.failures += get("failures");
    totals.errors += get("errors");
    totals.skipped += get("skipped");
    totals.time += get("time");
  }

  // Capture failed testcases as findings
  const tcRegex = /<testcase\b([^>]*)>([\s\S]*?)<\/testcase>/g;
  while ((m = tcRegex.exec(xml)) !== null && findings.length < 500) {
    const attrs = m[1] ?? "";
    const body = m[2] ?? "";
    if (!/<(failure|error)\b/.test(body)) continue;
    const nameMatch = /name="([^"]*)"/.exec(attrs);
    const classMatch = /classname="([^"]*)"/.exec(attrs);
    const fileMatch = /file="([^"]*)"/.exec(attrs);
    const lineMatch = /line="(\d+)"/.exec(attrs);
    const msgMatch = /<(?:failure|error)[^>]*message="([^"]*)"/.exec(body);
    findings.push({
      ruleId: classMatch?.[1] ?? null,
      ruleName: nameMatch?.[1] ?? "test failure",
      severity: "high",
      filePath: fileMatch?.[1] ?? null,
      lineStart: lineMatch ? Number(lineMatch[1]) : null,
      message: msgMatch?.[1]?.slice(0, 1000) ?? "Test failed",
      findingKind: "test_failure",
      raw: null,
    });
  }

  const passed = Math.max(0, totals.tests - totals.failures - totals.errors - totals.skipped);
  const failed = totals.failures + totals.errors;
  return {
    run: {
      kind: tool.kind,
      category: tool.category,
      name: `${tool.title} test results`,
      status: failed > 0 ? "failure" : "success",
      testsTotal: totals.tests,
      testsPassed: passed,
      testsFailed: failed,
      testsSkipped: totals.skipped,
      durationSec: totals.time > 0 ? Math.round(totals.time) : null,
      completedAt: new Date(),
      findingsHigh: failed,
    },
    findings,
  };
}

// ─── SARIF v2.1.0 adapter ─────────────────────────────────────────────────
// Covers SonarQube/Snyk/Semgrep/Checkmarx/Veracode/OWASP-ZAP/Black-Duck and
// any other tool that conforms to OASIS SARIF v2.1.0.
export function parseSarif(sarif: any, tool: PipelineToolDef): {
  run: Omit<PipelineRunInput, "sourceId" | "projectId">;
  findings: Array<Omit<typeof pipelineFindingsTable.$inferInsert, "id" | "runId" | "sourceId" | "projectId">>;
} {
  const runs = Array.isArray(sarif?.runs) ? sarif.runs : [];
  const findings: Array<Omit<typeof pipelineFindingsTable.$inferInsert, "id" | "runId" | "sourceId" | "projectId">> = [];
  let driverName = tool.title;
  let counts = { critical: 0, high: 0, medium: 0, low: 0, note: 0 };

  for (const run of runs) {
    driverName = run?.tool?.driver?.name ?? driverName;
    const rules = Array.isArray(run?.tool?.driver?.rules) ? run.tool.driver.rules : [];
    const ruleSeverityById = new Map<string, string>();
    for (const r of rules) {
      // SARIF defaultConfiguration.level: none/note/warning/error.
      // Some tools (Snyk) put a custom severity in properties.
      const level = r?.defaultConfiguration?.level ?? r?.properties?.["security-severity"] ?? "warning";
      ruleSeverityById.set(String(r.id), normalizeSarifLevel(level));
    }
    const results = Array.isArray(run?.results) ? run.results : [];
    for (const res of results) {
      if (findings.length >= 500) break;
      const ruleId = res.ruleId ?? "";
      const explicitLevel = res.level
        ?? res.properties?.["security-severity"]
        ?? ruleSeverityById.get(String(ruleId))
        ?? "warning";
      const sev = normalizeSarifLevel(explicitLevel);
      counts[sev as keyof typeof counts] = (counts[sev as keyof typeof counts] ?? 0) + 1;
      const loc = res.locations?.[0]?.physicalLocation;
      findings.push({
        ruleId: String(ruleId).slice(0, 240),
        ruleName: res.message?.text?.slice(0, 240) ?? null,
        severity: sev,
        filePath: loc?.artifactLocation?.uri ?? null,
        lineStart: loc?.region?.startLine ?? null,
        message: res.message?.text?.slice(0, 1000) ?? null,
        findingKind: "sast",
        raw: null,
      });
    }
  }

  return {
    run: {
      kind: tool.kind,
      category: tool.category,
      name: `${driverName} scan`,
      status: counts.critical + counts.high > 0 ? "failure" : "success",
      conclusion: `${findings.length} findings`,
      completedAt: new Date(),
      findingsCritical: counts.critical,
      findingsHigh: counts.high,
      findingsMedium: counts.medium,
      findingsLow: counts.low,
    },
    findings,
  };
}

function normalizeSarifLevel(level: string | number): "critical" | "high" | "medium" | "low" | "note" {
  // Numeric: SARIF security-severity is CVSS 0-10
  if (typeof level === "number" || /^\d+(\.\d+)?$/.test(String(level))) {
    const n = Number(level);
    if (n >= 9.0) return "critical";
    if (n >= 7.0) return "high";
    if (n >= 4.0) return "medium";
    if (n > 0) return "low";
    return "note";
  }
  const s = String(level).toLowerCase();
  if (["critical", "blocker"].includes(s)) return "critical";
  if (["error", "high"].includes(s)) return "high";
  if (["warning", "medium", "moderate"].includes(s)) return "medium";
  if (["low", "info"].includes(s)) return "low";
  if (["note", "none"].includes(s)) return "note";
  return "medium";
}

// ─── Generic webhook adapter ──────────────────────────────────────────────
// Best-effort field mapping for tools we haven't built a native parser for.
// Looks for a small set of common field names; falls back to "ok" / payload.
export function parseGenericWebhook(payload: any, tool: PipelineToolDef): Omit<PipelineRunInput, "sourceId" | "projectId"> {
  const pickStr = (...keys: string[]): string | null => {
    for (const k of keys) {
      const v = getDeep(payload, k);
      if (typeof v === "string" && v) return v;
    }
    return null;
  };
  const pickNum = (...keys: string[]): number | null => {
    for (const k of keys) {
      const v = getDeep(payload, k);
      if (typeof v === "number") return v;
      if (typeof v === "string" && /^\d+$/.test(v)) return Number(v);
    }
    return null;
  };
  const status = (pickStr("status", "state", "result", "conclusion", "phase") ?? "received").toLowerCase();
  const norm = status.includes("succ") || status === "ok" || status === "passed" ? "success"
    : status.includes("fail") || status === "error" ? "failure"
    : status.includes("cancel") || status === "aborted" ? "cancelled"
    : status.includes("running") || status === "in_progress" || status === "started" ? "running"
    : status.includes("skip") ? "skipped"
    : "queued";
  return {
    kind: tool.kind,
    category: tool.category,
    externalId: pickStr("id", "run_id", "build_id", "execution_id", "pipelineId", "buildNumber"),
    externalUrl: pickStr("url", "html_url", "web_url", "link", "build_url"),
    name: pickStr("name", "pipeline_name", "workflow_name", "job_name", "title", "dag_id", "flow_name") ?? `${tool.title} run`,
    branch: pickStr("branch", "ref", "git.branch"),
    commitSha: pickStr("commit", "commit_sha", "sha", "head_sha", "git.commit"),
    triggeredBy: pickStr("user", "actor", "triggered_by", "user.name"),
    status: norm,
    conclusion: status,
    environment: pickStr("environment", "env", "stage", "target_env"),
    startedAt: dateOrNull(pickStr("started_at", "start_time", "createdAt", "created_at")),
    completedAt: dateOrNull(pickStr("completed_at", "finished_at", "end_time", "completedAt")),
    durationSec: pickNum("duration", "duration_sec", "elapsed_seconds"),
    testsTotal: pickNum("tests.total", "test_count"),
    testsPassed: pickNum("tests.passed"),
    testsFailed: pickNum("tests.failed"),
    testsSkipped: pickNum("tests.skipped"),
    rawPayload: clamp(payload),
  };
}

function getDeep(obj: any, path: string): any {
  if (!obj) return undefined;
  const parts = path.split(".");
  let cur: any = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = cur[p];
  }
  return cur;
}

function dateOrNull(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : null;
}

function clamp(payload: unknown): Record<string, unknown> | null {
  // Cap raw payload at ~32 KB serialised so the row stays light.
  try {
    const s = JSON.stringify(payload);
    if (s.length > 32_768) return { __truncated: true, preview: s.slice(0, 32_768) };
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

export { getPipelineTool };
