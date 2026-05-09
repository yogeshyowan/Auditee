/**
 * Registry of every pipeline tool Auditee can ingest as a source.
 *
 * Each tool maps to one of six "adapter" handlers. Adding a new tool is just
 * one entry here — no new code is required as long as the tool emits one of
 * the supported standard formats (GitHub-Actions webhook, GitLab-CI webhook,
 * Jenkins notification JSON, JUnit XML, SARIF v2.1, or generic webhook JSON).
 *
 * Categories follow the user-facing taxonomy:
 *   ci_cd          - build pipelines that compile/test on every commit
 *   cd             - deployment / release-orchestration pipelines
 *   test_exec      - dedicated test-execution platforms (results-only)
 *   data           - data / ETL pipelines
 *   mlops          - ML training / experiment pipelines
 *   security_scan  - SAST / DAST / SCA / SBOM / secret / IaC scanners
 *   infra          - infrastructure-as-code provisioning pipelines
 */

export type PipelineCategory =
  | "ci_cd"
  | "cd"
  | "test_exec"
  | "data"
  | "mlops"
  | "security_scan"
  | "infra";

export type PipelineAdapter =
  | "github_actions"     // GitHub Actions webhook (workflow_run / check_run)
  | "gitlab_ci"          // GitLab CI webhook (Pipeline Hook / Job Hook)
  | "jenkins"            // Jenkins notification-plugin JSON
  | "sarif_upload"       // SARIF v2.1.0 upload (works for any SAST/DAST/SCA)
  | "junit_upload"       // JUnit XML upload (works for any test runner)
  | "generic_webhook";   // Generic JSON webhook (best-effort field mapping)

export type PipelineKind = string;

export interface PipelineToolDef {
  kind: PipelineKind;            // unique source kind, e.g. "github_actions"
  title: string;                 // display name, e.g. "GitHub Actions"
  vendor: string;                // marketing vendor name
  category: PipelineCategory;
  adapter: PipelineAdapter;
  blurb: string;                 // 1-line description for the source picker
  /**
   * Webhook secret semantics:
   *   "hmac-sha256"   - HMAC-SHA256 of raw body, header listed in `secretHeader`
   *   "shared-token"  - opaque shared token in header listed in `secretHeader`
   *   "none"          - no native webhook, upload-only or polling
   */
  webhookAuth: "hmac-sha256" | "shared-token" | "none";
  secretHeader?: string;
  /** Native upstream docs link the UI exposes when the user adds a source */
  docsUrl?: string;
  /** What kind of evidence this tool typically produces */
  produces: Array<"build_status" | "test_results" | "deploy_status" | "scan_findings" | "sbom" | "infra_plan" | "data_run" | "ml_run">;
}

export const PIPELINE_TOOLS: PipelineToolDef[] = [
  // ─── CI/CD build pipelines ──────────────────────────────────────────────
  {
    kind: "github_actions",
    title: "GitHub Actions",
    vendor: "GitHub",
    category: "ci_cd",
    adapter: "github_actions",
    blurb: "Native webhook for workflow_run and check_run events.",
    webhookAuth: "hmac-sha256",
    secretHeader: "x-hub-signature-256",
    docsUrl: "https://docs.github.com/en/webhooks/webhook-events-and-payloads#workflow_run",
    produces: ["build_status", "test_results", "scan_findings"],
  },
  {
    kind: "gitlab_ci",
    title: "GitLab CI",
    vendor: "GitLab",
    category: "ci_cd",
    adapter: "gitlab_ci",
    blurb: "Native Pipeline + Job webhook (SaaS or self-hosted).",
    webhookAuth: "shared-token",
    secretHeader: "x-gitlab-token",
    docsUrl: "https://docs.gitlab.com/ee/user/project/integrations/webhook_events.html",
    produces: ["build_status", "test_results"],
  },
  {
    kind: "jenkins",
    title: "Jenkins",
    vendor: "Jenkins",
    category: "ci_cd",
    adapter: "jenkins",
    blurb: "Notification Plugin posts JSON on every build event.",
    webhookAuth: "shared-token",
    secretHeader: "x-jenkins-token",
    docsUrl: "https://plugins.jenkins.io/notification/",
    produces: ["build_status", "test_results"],
  },
  {
    kind: "azure_pipelines",
    title: "Azure Pipelines",
    vendor: "Microsoft",
    category: "ci_cd",
    adapter: "generic_webhook",
    blurb: "Service hook posts build/release JSON. JUnit results via upload.",
    webhookAuth: "shared-token",
    secretHeader: "x-pipeline-token",
    docsUrl: "https://learn.microsoft.com/en-us/azure/devops/service-hooks/services/webhooks",
    produces: ["build_status", "test_results", "deploy_status"],
  },
  {
    kind: "circleci",
    title: "CircleCI",
    vendor: "CircleCI",
    category: "ci_cd",
    adapter: "generic_webhook",
    blurb: "Project webhook for workflow-completed events.",
    webhookAuth: "hmac-sha256",
    secretHeader: "circleci-signature",
    docsUrl: "https://circleci.com/docs/webhooks/",
    produces: ["build_status", "test_results"],
  },
  {
    kind: "bitbucket_pipelines",
    title: "Bitbucket Pipelines",
    vendor: "Atlassian",
    category: "ci_cd",
    adapter: "generic_webhook",
    blurb: "Repository webhook on pipeline status events.",
    webhookAuth: "shared-token",
    secretHeader: "x-pipeline-token",
    docsUrl: "https://support.atlassian.com/bitbucket-cloud/docs/event-payloads/",
    produces: ["build_status", "test_results"],
  },
  {
    kind: "bamboo",
    title: "Bamboo",
    vendor: "Atlassian",
    category: "ci_cd",
    adapter: "generic_webhook",
    blurb: "Notification post on plan / job result.",
    webhookAuth: "shared-token",
    secretHeader: "x-pipeline-token",
    docsUrl: "https://confluence.atlassian.com/bamboo/notifications-289277279.html",
    produces: ["build_status", "test_results"],
  },
  {
    kind: "teamcity",
    title: "TeamCity",
    vendor: "JetBrains",
    category: "ci_cd",
    adapter: "generic_webhook",
    blurb: "Webhook plugin posts build state JSON.",
    webhookAuth: "shared-token",
    secretHeader: "x-pipeline-token",
    docsUrl: "https://www.jetbrains.com/help/teamcity/configuring-build-notifications.html",
    produces: ["build_status", "test_results"],
  },
  {
    kind: "travis",
    title: "Travis CI",
    vendor: "Travis CI",
    category: "ci_cd",
    adapter: "generic_webhook",
    blurb: "Build webhook with signed payload.",
    webhookAuth: "shared-token",
    secretHeader: "signature",
    docsUrl: "https://docs.travis-ci.com/user/notifications/#webhook-notifications",
    produces: ["build_status", "test_results"],
  },
  {
    kind: "tekton",
    title: "Tekton",
    vendor: "CD Foundation",
    category: "ci_cd",
    adapter: "generic_webhook",
    blurb: "TaskRun / PipelineRun events via CloudEvents.",
    webhookAuth: "shared-token",
    secretHeader: "x-pipeline-token",
    docsUrl: "https://tekton.dev/docs/pipelines/events/",
    produces: ["build_status"],
  },
  {
    kind: "aws_codepipeline",
    title: "AWS CodePipeline",
    vendor: "Amazon Web Services",
    category: "ci_cd",
    adapter: "generic_webhook",
    blurb: "EventBridge → API Destinations forwards pipeline state events.",
    webhookAuth: "shared-token",
    secretHeader: "x-pipeline-token",
    docsUrl: "https://docs.aws.amazon.com/codepipeline/latest/userguide/detect-state-changes-cloudwatch-events.html",
    produces: ["build_status", "deploy_status"],
  },
  {
    kind: "google_cloudbuild",
    title: "Google Cloud Build",
    vendor: "Google Cloud",
    category: "ci_cd",
    adapter: "generic_webhook",
    blurb: "Pub/Sub → Cloud Function forwards build state events.",
    webhookAuth: "shared-token",
    secretHeader: "x-pipeline-token",
    docsUrl: "https://cloud.google.com/build/docs/subscribe-build-notifications",
    produces: ["build_status"],
  },
  {
    kind: "drone",
    title: "Drone CI",
    vendor: "Harness",
    category: "ci_cd",
    adapter: "generic_webhook",
    blurb: "Webhook plugin posts build status JSON.",
    webhookAuth: "shared-token",
    secretHeader: "x-drone-signature",
    docsUrl: "https://docs.drone.io/extensions/webhook/",
    produces: ["build_status", "test_results"],
  },
  {
    kind: "buddy",
    title: "Buddy",
    vendor: "Buddy",
    category: "ci_cd",
    adapter: "generic_webhook",
    blurb: "Pipeline webhook on execution events.",
    webhookAuth: "shared-token",
    secretHeader: "x-pipeline-token",
    docsUrl: "https://buddy.works/docs/pipelines/notifications#webhooks",
    produces: ["build_status"],
  },
  {
    kind: "concourse",
    title: "Concourse",
    vendor: "Concourse CI",
    category: "ci_cd",
    adapter: "generic_webhook",
    blurb: "Resource webhook posts build state JSON.",
    webhookAuth: "shared-token",
    secretHeader: "x-pipeline-token",
    docsUrl: "https://concourse-ci.org/jobs.html",
    produces: ["build_status"],
  },

  // ─── CD / deployment pipelines ──────────────────────────────────────────
  {
    kind: "spinnaker",
    title: "Spinnaker",
    vendor: "Netflix / CDF",
    category: "cd",
    adapter: "generic_webhook",
    blurb: "Echo webhook on pipeline / stage state changes.",
    webhookAuth: "shared-token",
    secretHeader: "x-pipeline-token",
    docsUrl: "https://spinnaker.io/docs/setup/other_config/notifications/webhooks/",
    produces: ["deploy_status"],
  },
  {
    kind: "argocd",
    title: "Argo CD",
    vendor: "CNCF / Argo",
    category: "cd",
    adapter: "generic_webhook",
    blurb: "Notifications controller posts sync / health events.",
    webhookAuth: "shared-token",
    secretHeader: "x-pipeline-token",
    docsUrl: "https://argo-cd.readthedocs.io/en/stable/operator-manual/notifications/services/webhook/",
    produces: ["deploy_status"],
  },
  {
    kind: "flux",
    title: "Flux CD",
    vendor: "CNCF / Flux",
    category: "cd",
    adapter: "generic_webhook",
    blurb: "Alerts notification provider posts reconciliation events.",
    webhookAuth: "shared-token",
    secretHeader: "x-pipeline-token",
    docsUrl: "https://fluxcd.io/flux/components/notification/providers/",
    produces: ["deploy_status"],
  },
  {
    kind: "harness",
    title: "Harness CD",
    vendor: "Harness",
    category: "cd",
    adapter: "generic_webhook",
    blurb: "Notification webhook on pipeline execution events.",
    webhookAuth: "shared-token",
    secretHeader: "x-pipeline-token",
    docsUrl: "https://developer.harness.io/docs/platform/notifications/notification-settings/",
    produces: ["deploy_status"],
  },
  {
    kind: "octopus_deploy",
    title: "Octopus Deploy",
    vendor: "Octopus",
    category: "cd",
    adapter: "generic_webhook",
    blurb: "Subscription webhook on deployment events.",
    webhookAuth: "shared-token",
    secretHeader: "x-pipeline-token",
    docsUrl: "https://octopus.com/docs/administration/managing-infrastructure/subscriptions",
    produces: ["deploy_status"],
  },

  // ─── Test execution pipelines (results-only via JUnit upload) ───────────
  {
    kind: "test_junit",
    title: "JUnit XML (any test runner)",
    vendor: "Generic",
    category: "test_exec",
    adapter: "junit_upload",
    blurb: "Upload JUnit XML from any test framework (pytest, mocha, jest, surefire, NUnit, RSpec, Go, …).",
    webhookAuth: "none",
    docsUrl: "https://github.com/jenkinsci/xunit-plugin/blob/master/src/main/resources/org/jenkinsci/plugins/xunit/types/model/xsd/junit-10.xsd",
    produces: ["test_results"],
  },
  {
    kind: "test_pipeline_generic",
    title: "Generic test-pipeline webhook",
    vendor: "Generic",
    category: "test_exec",
    adapter: "generic_webhook",
    blurb: "POST a JSON test summary from any CI step (counts + pass/fail).",
    webhookAuth: "shared-token",
    secretHeader: "x-pipeline-token",
    produces: ["test_results"],
  },

  // ─── Data / ETL pipelines ────────────────────────────────────────────────
  {
    kind: "airflow",
    title: "Apache Airflow",
    vendor: "Apache Software Foundation",
    category: "data",
    adapter: "generic_webhook",
    blurb: "DAG callback (on_success / on_failure) posts run summary.",
    webhookAuth: "shared-token",
    secretHeader: "x-pipeline-token",
    docsUrl: "https://airflow.apache.org/docs/apache-airflow/stable/administration-and-deployment/logging-monitoring/callbacks.html",
    produces: ["data_run"],
  },
  {
    kind: "dagster",
    title: "Dagster",
    vendor: "Dagster Labs",
    category: "data",
    adapter: "generic_webhook",
    blurb: "Sensor / hook posts run-status events.",
    webhookAuth: "shared-token",
    secretHeader: "x-pipeline-token",
    docsUrl: "https://docs.dagster.io/concepts/ops-jobs-graphs/op-hooks",
    produces: ["data_run"],
  },
  {
    kind: "prefect",
    title: "Prefect",
    vendor: "Prefect",
    category: "data",
    adapter: "generic_webhook",
    blurb: "Automation action 'Send a webhook' on flow-run state changes.",
    webhookAuth: "shared-token",
    secretHeader: "x-pipeline-token",
    docsUrl: "https://docs.prefect.io/latest/automations/",
    produces: ["data_run"],
  },
  {
    kind: "dbt",
    title: "dbt (Cloud or Core)",
    vendor: "dbt Labs",
    category: "data",
    adapter: "generic_webhook",
    blurb: "dbt Cloud webhook on run completion; dbt Core via run_results.json upload.",
    webhookAuth: "hmac-sha256",
    secretHeader: "authorization",
    docsUrl: "https://docs.getdbt.com/docs/deploy/webhooks",
    produces: ["data_run"],
  },
  {
    kind: "fivetran",
    title: "Fivetran",
    vendor: "Fivetran",
    category: "data",
    adapter: "generic_webhook",
    blurb: "Connector webhook on sync state changes.",
    webhookAuth: "hmac-sha256",
    secretHeader: "x-fivetran-signature",
    docsUrl: "https://fivetran.com/docs/rest-api/webhooks",
    produces: ["data_run"],
  },

  // ─── MLOps pipelines ────────────────────────────────────────────────────
  {
    kind: "kubeflow",
    title: "Kubeflow Pipelines",
    vendor: "Kubeflow",
    category: "mlops",
    adapter: "generic_webhook",
    blurb: "Pipeline-completion event via custom exit handler.",
    webhookAuth: "shared-token",
    secretHeader: "x-pipeline-token",
    docsUrl: "https://www.kubeflow.org/docs/components/pipelines/",
    produces: ["ml_run"],
  },
  {
    kind: "mlflow",
    title: "MLflow",
    vendor: "Linux Foundation / Databricks",
    category: "mlops",
    adapter: "generic_webhook",
    blurb: "MLflow webhook on run / model-version events.",
    webhookAuth: "shared-token",
    secretHeader: "x-pipeline-token",
    docsUrl: "https://mlflow.org/docs/latest/model-registry.html#webhooks",
    produces: ["ml_run"],
  },
  {
    kind: "wandb",
    title: "Weights & Biases",
    vendor: "Weights & Biases",
    category: "mlops",
    adapter: "generic_webhook",
    blurb: "Automation webhook on run / artifact events.",
    webhookAuth: "shared-token",
    secretHeader: "x-pipeline-token",
    docsUrl: "https://docs.wandb.ai/guides/automations/webhooks",
    produces: ["ml_run"],
  },
  {
    kind: "vertex_ai_pipelines",
    title: "Vertex AI Pipelines",
    vendor: "Google Cloud",
    category: "mlops",
    adapter: "generic_webhook",
    blurb: "Pub/Sub → Cloud Function forwards pipeline-job events.",
    webhookAuth: "shared-token",
    secretHeader: "x-pipeline-token",
    docsUrl: "https://cloud.google.com/vertex-ai/docs/pipelines/notifications",
    produces: ["ml_run"],
  },
  {
    kind: "sagemaker_pipelines",
    title: "Amazon SageMaker Pipelines",
    vendor: "Amazon Web Services",
    category: "mlops",
    adapter: "generic_webhook",
    blurb: "EventBridge → API Destinations forwards pipeline execution events.",
    webhookAuth: "shared-token",
    secretHeader: "x-pipeline-token",
    docsUrl: "https://docs.aws.amazon.com/sagemaker/latest/dg/pipelines-events.html",
    produces: ["ml_run"],
  },

  // ─── Security / scan pipelines (SARIF-native) ───────────────────────────
  {
    kind: "sonarqube",
    title: "SonarQube / SonarCloud",
    vendor: "SonarSource",
    category: "security_scan",
    adapter: "sarif_upload",
    blurb: "Native SARIF export from sonar-scanner; webhook for analysis-completion events.",
    webhookAuth: "hmac-sha256",
    secretHeader: "x-sonar-webhook-hmac-sha256",
    docsUrl: "https://docs.sonarqube.org/latest/project-administration/webhooks/",
    produces: ["scan_findings"],
  },
  {
    kind: "snyk",
    title: "Snyk",
    vendor: "Snyk",
    category: "security_scan",
    adapter: "sarif_upload",
    blurb: "Native SARIF + SBOM export from `snyk test --sarif-file-output`.",
    webhookAuth: "none",
    docsUrl: "https://docs.snyk.io/snyk-cli/commands/test#sarif-file-output",
    produces: ["scan_findings", "sbom"],
  },
  {
    kind: "blackduck",
    title: "Black Duck",
    vendor: "Synopsys",
    category: "security_scan",
    adapter: "sarif_upload",
    blurb: "SARIF + CycloneDX SBOM export from Detect.",
    webhookAuth: "none",
    docsUrl: "https://documentation.blackduck.com/",
    produces: ["scan_findings", "sbom"],
  },
  {
    kind: "veracode",
    title: "Veracode",
    vendor: "Veracode",
    category: "security_scan",
    adapter: "sarif_upload",
    blurb: "SARIF export from Veracode SAST / DAST scans.",
    webhookAuth: "none",
    docsUrl: "https://docs.veracode.com/r/Working_with_SARIF",
    produces: ["scan_findings"],
  },
  {
    kind: "checkmarx",
    title: "Checkmarx",
    vendor: "Checkmarx",
    category: "security_scan",
    adapter: "sarif_upload",
    blurb: "SARIF export from CxOne / SAST / SCA.",
    webhookAuth: "none",
    docsUrl: "https://checkmarx.com/resource/documents/en/34965-68625-results-format.html",
    produces: ["scan_findings"],
  },
  {
    kind: "owasp_zap",
    title: "OWASP ZAP",
    vendor: "OWASP Foundation",
    category: "security_scan",
    adapter: "sarif_upload",
    blurb: "SARIF report output via the SARIF add-on.",
    webhookAuth: "none",
    docsUrl: "https://www.zaproxy.org/docs/desktop/addons/sarif-support/",
    produces: ["scan_findings"],
  },
  {
    kind: "semgrep",
    title: "Semgrep",
    vendor: "Semgrep",
    category: "security_scan",
    adapter: "sarif_upload",
    blurb: "Native SARIF export with `semgrep --sarif`.",
    webhookAuth: "none",
    docsUrl: "https://semgrep.dev/docs/cli-reference",
    produces: ["scan_findings"],
  },
  {
    kind: "scan_sarif_generic",
    title: "Generic SARIF v2.1.0 upload",
    vendor: "OASIS",
    category: "security_scan",
    adapter: "sarif_upload",
    blurb: "Drop in any SARIF file from any tool that conforms to SARIF v2.1.0.",
    webhookAuth: "none",
    docsUrl: "https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html",
    produces: ["scan_findings"],
  },

  // ─── Infrastructure pipelines ───────────────────────────────────────────
  {
    kind: "terraform_cloud",
    title: "Terraform Cloud / HCP Terraform",
    vendor: "HashiCorp",
    category: "infra",
    adapter: "generic_webhook",
    blurb: "Run-task webhook on plan / apply events.",
    webhookAuth: "hmac-sha256",
    secretHeader: "x-tfc-task-signature",
    docsUrl: "https://developer.hashicorp.com/terraform/cloud-docs/integrations/run-tasks",
    produces: ["infra_plan", "deploy_status"],
  },
  {
    kind: "pulumi",
    title: "Pulumi",
    vendor: "Pulumi",
    category: "infra",
    adapter: "generic_webhook",
    blurb: "Stack webhook on update / preview events.",
    webhookAuth: "hmac-sha256",
    secretHeader: "pulumi-webhook-signature",
    docsUrl: "https://www.pulumi.com/docs/pulumi-cloud/webhooks/",
    produces: ["infra_plan", "deploy_status"],
  },
  {
    kind: "atlantis",
    title: "Atlantis",
    vendor: "Atlantis",
    category: "infra",
    adapter: "generic_webhook",
    blurb: "Plan / apply webhook on Terraform pull-request workflow.",
    webhookAuth: "shared-token",
    secretHeader: "x-pipeline-token",
    docsUrl: "https://www.runatlantis.io/docs/",
    produces: ["infra_plan"],
  },
];

export const PIPELINE_KINDS: ReadonlyArray<PipelineKind> = PIPELINE_TOOLS.map((t) => t.kind);

export function isPipelineKind(k: string): boolean {
  return PIPELINE_KINDS.includes(k);
}

export function getPipelineTool(kind: string): PipelineToolDef | undefined {
  return PIPELINE_TOOLS.find((t) => t.kind === kind);
}

export function pipelineCategoryOf(kind: string): PipelineCategory | undefined {
  return getPipelineTool(kind)?.category;
}

export function pipelineAdapterOf(kind: string): PipelineAdapter | undefined {
  return getPipelineTool(kind)?.adapter;
}
