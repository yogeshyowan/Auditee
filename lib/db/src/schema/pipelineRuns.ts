import { pgTable, text, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";

/**
 * Pipeline runs ingested from CI/CD, CD, test-exec, data, MLOps, security-scan,
 * and infrastructure pipelines. Linked to a `project_sources` row (sourceId).
 *
 * Each run is one execution of an upstream pipeline — a GitHub Actions
 * workflow_run, a GitLab CI pipeline, a Jenkins build, a Spinnaker deploy,
 * an Airflow DAG run, an MLflow run, a SonarQube analysis, a Terraform plan,
 * etc. The shape is intentionally generic so a single audit-prompt builder
 * can summarise any of them as evidence.
 */
export const pipelineRunsTable = pgTable("pipeline_runs", {
  id: text("id").primaryKey(),
  sourceId: text("source_id").notNull(),
  projectId: text("project_id").notNull(),
  kind: text("kind").notNull(),                    // e.g. github_actions, gitlab_ci, jenkins, sonarqube
  category: text("category").notNull(),            // ci_cd | cd | test_exec | data | mlops | security_scan | infra
  externalId: text("external_id"),                 // upstream run/build/job id
  externalUrl: text("external_url"),
  name: text("name").notNull(),                    // workflow / job / pipeline name
  branch: text("branch"),
  commitSha: text("commit_sha"),
  triggeredBy: text("triggered_by"),
  status: text("status").notNull(),                // queued | running | success | failure | cancelled | unstable | skipped
  conclusion: text("conclusion"),                  // adapter-specific (e.g. neutral, action_required, timed_out)
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  durationSec: integer("duration_sec"),
  // Test-execution summary (JUnit / native test reports)
  testsTotal: integer("tests_total"),
  testsPassed: integer("tests_passed"),
  testsFailed: integer("tests_failed"),
  testsSkipped: integer("tests_skipped"),
  // Security-scan summary (SARIF / native scanner output)
  findingsCritical: integer("findings_critical").notNull().default(0),
  findingsHigh: integer("findings_high").notNull().default(0),
  findingsMedium: integer("findings_medium").notNull().default(0),
  findingsLow: integer("findings_low").notNull().default(0),
  // Optional environment for CD/MLOps/infra pipelines
  environment: text("environment"),                // e.g. prod, staging, dev
  rawPayload: jsonb("raw_payload").$type<Record<string, unknown>>(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  sourceIdx: index("pipeline_runs_source_idx").on(t.sourceId),
  projectIdx: index("pipeline_runs_project_idx").on(t.projectId, t.receivedAt),
  externalIdx: index("pipeline_runs_external_idx").on(t.sourceId, t.externalId),
}));

/**
 * Individual findings extracted from a pipeline run — SAST/DAST/SCA results
 * (SARIF), test failures, deployment-gate violations, IaC policy hits.
 */
export const pipelineFindingsTable = pgTable("pipeline_findings", {
  id: text("id").primaryKey(),
  runId: text("run_id").notNull(),
  sourceId: text("source_id").notNull(),
  projectId: text("project_id").notNull(),
  ruleId: text("rule_id"),
  ruleName: text("rule_name"),
  severity: text("severity").notNull(),            // critical | high | medium | low | note
  filePath: text("file_path"),
  lineStart: integer("line_start"),
  message: text("message"),
  findingKind: text("finding_kind"),               // sast | dast | sca | secret | license | iac | test_failure | gate_violation
  raw: jsonb("raw").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  runIdx: index("pipeline_findings_run_idx").on(t.runId),
  projectSeverityIdx: index("pipeline_findings_proj_sev_idx").on(t.projectId, t.severity),
}));

export type PipelineRun = typeof pipelineRunsTable.$inferSelect;
export type PipelineFinding = typeof pipelineFindingsTable.$inferSelect;
