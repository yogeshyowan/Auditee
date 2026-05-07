import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { creditAwareFetch } from "./credits";

const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

async function jfetch<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await creditAwareFetch(`${apiBase}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!r.ok) {
    const text = await r.text();
    let message = text || `Request failed (${r.status})`;
    try {
      const j = JSON.parse(text);
      message = j.error || j.message || message;
    } catch {}
    throw new Error(message);
  }
  if (r.status === 204) return undefined as T;
  return r.json() as Promise<T>;
}

// ───────── Comments ─────────
export type CommentRow = {
  id: string;
  entityType: string;
  entityId: string;
  projectId: string | null;
  author: string;
  body: string;
  mentions: string[];
  createdAt: string;
};

export function useComments(entityType: string, entityId: string | undefined) {
  return useQuery({
    queryKey: ["comments", entityType, entityId],
    enabled: Boolean(entityId),
    queryFn: () =>
      jfetch<{ comments: CommentRow[] }>(`/comments?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId!)}`),
  });
}
export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { entityType: string; entityId: string; projectId?: string | null; author?: string; body: string }) =>
      jfetch<CommentRow>("/comments", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["comments", vars.entityType, vars.entityId] });
    },
  });
}
export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jfetch<void>(`/comments/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments"] }),
  });
}

// ───────── Compliance frameworks (lightweight list) ─────────
export type FrameworkRow = {
  id: string;
  code: string;
  name: string;
  category?: string | null;
  controlsMet?: number;
};

export function useFrameworksList() {
  return useQuery({
    queryKey: ["frameworks-list"],
    queryFn: () => jfetch<FrameworkRow[]>(`/compliance/frameworks`),
    staleTime: 60_000,
  });
}

// ───────── CAPA ─────────
export type CapaRow = {
  id: string;
  code: string;
  projectId: string;
  frameworkId: string | null;
  controlId: string | null;
  controlCode: string | null;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "blocked" | "done" | "cancelled";
  owner: string;
  source: string;
  evidenceCount: number;
  tags: string[];
  dueAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  frameworkName?: string | null;
  frameworkCode?: string | null;
};

export function useCapas(projectId: string | undefined, status?: string, frameworkId?: string) {
  return useQuery({
    queryKey: ["capa", projectId, status, frameworkId],
    enabled: Boolean(projectId),
    queryFn: () => {
      const qs = new URLSearchParams();
      if (projectId) qs.set("projectId", projectId);
      if (status) qs.set("status", status);
      if (frameworkId) qs.set("frameworkId", frameworkId);
      return jfetch<{ actions: CapaRow[] }>(`/capa?${qs.toString()}`);
    },
  });
}
export function useCreateCapa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<CapaRow> & { projectId: string; title: string }) =>
      jfetch<CapaRow>("/capa", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["capa"] }),
  });
}
export function useUpdateCapa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<CapaRow> & { id: string }) =>
      jfetch<CapaRow>(`/capa/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["capa"] }),
  });
}
export function useDeleteCapa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jfetch<void>(`/capa/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["capa"] }),
  });
}

// ───────── Reports ─────────
export type ReportSection = { id: string; heading: string; body: string; citations?: string[] };
export type ReportContent = {
  title: string;
  subtitle?: string;
  executiveSummary: string;
  sections: ReportSection[];
  evidence: Array<{ id: string; label: string; source: string }>;
};
export type ReportRow = {
  id: string;
  projectId: string;
  frameworkId: string | null;
  kind: string;
  tone: string;
  title: string;
  status: string;
  content: ReportContent;
  history: Array<{ at: string; instruction: string }>;
  createdAt: string;
  updatedAt: string;
};

export function useReports(projectId: string | undefined) {
  return useQuery({
    queryKey: ["reports", projectId],
    enabled: Boolean(projectId),
    queryFn: () => jfetch<{ reports: ReportRow[] }>(`/reports?projectId=${projectId}`),
  });
}
export function useReport(id: string | undefined) {
  return useQuery({
    queryKey: ["report", id],
    enabled: Boolean(id),
    queryFn: () => jfetch<ReportRow>(`/reports/${id}`),
  });
}
export function useGenerateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      projectId: string;
      kind: string;
      tone: string;
      frameworkId?: string | null;
      frameworkIds?: string[];
      instructions?: string;
    }) =>
      jfetch<ReportRow>("/reports/generate", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
}
export function useRefineReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, instruction }: { id: string; instruction: string }) =>
      jfetch<ReportRow>(`/reports/${id}/refine`, { method: "POST", body: JSON.stringify({ instruction }) }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["report", data.id] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
export function useDeleteReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jfetch<void>(`/reports/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
}
export function reportExportUrl(id: string, format: "html" | "docx" | "pdf") {
  return `${apiBase}/reports/${id}/export?format=${format}`;
}

/**
 * Authenticated report download. The export endpoint sits behind
 * `requireProjectAccessInline`, which 401s any request without a userId.
 * Plain `<a href>` clicks don't pick up Clerk's Bearer token (the React SDK
 * only injects it into `fetch` calls), so anchor downloads were silently
 * failing with 401. This helper:
 *
 *   - fetches the export with `Authorization: Bearer <clerk token>` AND
 *     `credentials: include` so both auth modes (Bearer + session cookie)
 *     are covered,
 *   - reads the Content-Disposition filename if the server sent one,
 *   - for `docx`: triggers a save via a temporary anchor + object URL,
 *   - for `html` / `pdf`: opens the rendered HTML in a new tab so the
 *     embedded `window.print()` (PDF format) can fire.
 *
 * Throws a user-friendly error on failure — callers should toast it.
 */
export async function downloadReport(
  id: string,
  format: "html" | "docx" | "pdf",
  getToken: () => Promise<string | null>,
  filenameHint?: string,
): Promise<void> {
  const token = await getToken().catch(() => null);
  const headers: Record<string, string> = {};
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(reportExportUrl(id, format), {
    method: "GET",
    credentials: "include",
    headers,
  });
  if (!res.ok) {
    let msg = `Export failed (${res.status})`;
    try {
      const j = await res.json();
      msg = j.error ?? j.message ?? msg;
    } catch {
      /* not JSON — keep generic message */
    }
    throw new Error(msg);
  }

  // Honour server-provided filename when present, else build one from the hint.
  const cd = res.headers.get("content-disposition") ?? "";
  const m = cd.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  const ext = format === "html" ? "html" : format === "docx" ? "docx" : "html";
  const fallbackBase = (filenameHint ?? "report").replace(/[^\w\d-]+/g, "-").slice(0, 80) || "report";
  let filename = `${fallbackBase}.${ext}`;
  if (m?.[1]) {
    try {
      filename = decodeURIComponent(m[1]);
    } catch {
      filename = m[1];
    }
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  if (format === "docx") {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Give the browser a moment to start the download before revoking.
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return;
  }

  // html / pdf: open in a new tab. PDF is HTML with an embedded
  // window.print() autotrigger, so the new tab will pop the print dialog.
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (!win) {
    // Popup blocker fired — fall back to download instead of losing the file.
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// ───────── Workflows ─────────
export type WorkflowStepDef = {
  id: string;
  name: string;
  type: "task" | "approval" | "ai_action" | "branch" | "stop";
  assignee?: string;
  branches?: Array<{ when: string; goto: string }>;
  blockedUntil?: Array<{ expr: string; reason: string }>;
  aiPrompt?: string;
  outputKey?: string;
  dueOffsetDays?: number;
};
export type WorkflowRow = {
  id: string;
  name: string;
  description: string;
  version: number;
  status: string;
  trigger: string;
  definition: { steps: WorkflowStepDef[] };
  createdAt: string;
  updatedAt: string;
};
export type WorkflowRunRow = {
  id: string;
  workflowId: string;
  projectId: string | null;
  status: string;
  currentStepId: string | null;
  blockedReason: string | null;
  context: Record<string, unknown>;
  startedBy: string;
  startedAt: string;
  completedAt: string | null;
};
export type WorkflowStepRunRow = {
  id: string;
  runId: string;
  stepId: string;
  stepName: string;
  stepType: string;
  status: string;
  assignee: string | null;
  output: Record<string, unknown>;
  blockedReason: string | null;
  dueAt: string | null;
  startedAt: string;
  completedAt: string | null;
};

export function useWorkflows() {
  return useQuery({
    queryKey: ["workflows"],
    queryFn: () => jfetch<{ workflows: WorkflowRow[] }>("/workflows"),
  });
}
export function useWorkflowRuns(filters: { projectId?: string; workflowId?: string; status?: string } = {}) {
  const qs = new URLSearchParams();
  if (filters.projectId) qs.set("projectId", filters.projectId);
  if (filters.workflowId) qs.set("workflowId", filters.workflowId);
  if (filters.status) qs.set("status", filters.status);
  return useQuery({
    queryKey: ["workflow-runs", filters],
    queryFn: () => jfetch<{ runs: WorkflowRunRow[] }>(`/workflow-runs?${qs}`),
  });
}
export function useWorkflowRun(id: string | undefined) {
  return useQuery({
    queryKey: ["workflow-run", id],
    enabled: Boolean(id),
    refetchInterval: 4000,
    queryFn: () =>
      jfetch<{ run: WorkflowRunRow; stepRuns: WorkflowStepRunRow[]; workflow: WorkflowRow | null }>(`/workflow-runs/${id}`),
  });
}
export function useCreateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; description?: string; trigger?: string; definition: { steps: WorkflowStepDef[] } }) =>
      jfetch<WorkflowRow>("/workflows", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflows"] }),
  });
}
export function useStartRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workflowId, ...body }: { workflowId: string; projectId?: string; context?: Record<string, unknown>; startedBy?: string }) =>
      jfetch<{ run: WorkflowRunRow; currentStep: WorkflowStepDef }>(`/workflows/${workflowId}/runs`, {
        method: "POST",
        body: JSON.stringify({ startedBy: "avery.kim", ...body }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflow-runs"] }),
  });
}
export function useAdvanceRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ runId, contextPatch, output }: { runId: string; contextPatch?: Record<string, unknown>; output?: Record<string, unknown> }) =>
      jfetch<{ run: WorkflowRunRow; currentStep?: WorkflowStepDef; blockedReason?: string }>(`/workflow-runs/${runId}/advance`, {
        method: "POST",
        body: JSON.stringify({ contextPatch, output }),
      }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["workflow-run", vars.runId] });
      qc.invalidateQueries({ queryKey: ["workflow-runs"] });
    },
  });
}
export function useRecheckRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ runId, contextPatch }: { runId: string; contextPatch?: Record<string, unknown> }) =>
      jfetch<{ run: WorkflowRunRow; currentStep?: WorkflowStepDef; blockedReason?: string }>(`/workflow-runs/${runId}/recheck`, {
        method: "POST",
        body: JSON.stringify({ contextPatch }),
      }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["workflow-run", vars.runId] });
      qc.invalidateQueries({ queryKey: ["workflow-runs"] });
    },
  });
}
export function useCancelRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) => jfetch<WorkflowRunRow>(`/workflow-runs/${runId}/cancel`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflow-runs"] }),
  });
}

// ───────── Notifications ─────────
export type NotificationRow = {
  id: string;
  recipient: string;
  kind: string;
  title: string;
  body: string;
  link: string | null;
  channels: string[];
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};
export function useNotifications(recipient: string | undefined, opts: { unread?: boolean } = {}) {
  const qs = new URLSearchParams();
  if (recipient) qs.set("recipient", recipient);
  if (opts.unread) qs.set("unread", "true");
  return useQuery({
    queryKey: ["notifications", recipient, opts.unread],
    enabled: Boolean(recipient),
    refetchInterval: 10000,
    queryFn: () => jfetch<{ notifications: NotificationRow[] }>(`/notifications?${qs}`),
  });
}
export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jfetch<NotificationRow>(`/notifications/${id}/read`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (recipient: string) =>
      jfetch<{ ok: boolean }>(`/notifications/mark-all-read`, {
        method: "POST",
        body: JSON.stringify({ recipient }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

// ───────── Recurring audits ─────────
export type RecurringAuditRow = {
  id: string;
  projectId: string;
  frameworkId: string;
  cadence: string;
  hourUtc: number;
  notifyTo: string;
  active: boolean;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  nextRunAt: string;
  createdAt: string;
  updatedAt: string;
};
export function useRecurringAudits(projectId: string | undefined) {
  return useQuery({
    queryKey: ["recurring-audits", projectId],
    enabled: Boolean(projectId),
    queryFn: () => jfetch<{ schedules: RecurringAuditRow[] }>(`/recurring-audits?projectId=${projectId}`),
  });
}
export function useCreateRecurringAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<RecurringAuditRow>) =>
      jfetch<RecurringAuditRow>("/recurring-audits", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring-audits"] }),
  });
}
export function useUpdateRecurringAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<RecurringAuditRow> & { id: string }) =>
      jfetch<RecurringAuditRow>(`/recurring-audits/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring-audits"] }),
  });
}
export function useDeleteRecurringAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jfetch<void>(`/recurring-audits/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring-audits"] }),
  });
}

// ───────── Workflow analytics ─────────
export type WorkflowAnalytics = {
  workflows: Array<{
    workflowId: string;
    workflowName: string;
    total: number;
    running: number;
    blocked: number;
    completed: number;
    cancelled: number;
    completionRate: number;
    avgCycleTimeMinutes: number | null;
  }>;
  blockers: Array<{ stepName: string; stepType: string; reason: string; count: number }>;
  throughput: Array<{ day: string; starts: number; completions: number }>;
  totals: { runs: number; completed: number; blocked: number; running: number };
};
export function useWorkflowAnalytics(projectId: string | undefined) {
  return useQuery({
    queryKey: ["workflow-analytics", projectId],
    enabled: Boolean(projectId),
    queryFn: () => jfetch<WorkflowAnalytics>(`/analytics/workflows?projectId=${projectId}`),
  });
}

// ───────── Project Sources ─────────
export type ProjectSourceRow = {
  id: string;
  projectId: string;
  kind:
    // Code / build evidence
    | "github" | "zip" | "folder" | "jira" | "jenkins" | "aws_s3" | "gdrive" | "alm" | "cloud_server" | "url"
    // Requirements-management tools
    | "doors" | "doors_next" | "jama" | "polarion" | "codebeamer" | "helix_rm" | "visure" | "azure_devops" | "jira_reqs" | "reqif"
    // Defect-management tools
    | "jira_defects" | "ado_defects" | "bugzilla" | "mantis" | "redmine" | "youtrack" | "clickup" | "linear" | "servicenow" | "alm_octane" | "github_issues" | "gitlab_issues";
  label: string;
  config: Record<string, any>;
  status: "idle" | "syncing" | "ready" | "error";
  statusMessage: string | null;
  fileCount: number;
  byteCount: number;
  lastSyncAt: string | null;
  createdAt: string;
};
// ───────── Defects ─────────
export type DefectRow = {
  id: string;
  projectId: string;
  sourceId: string;
  externalId: string;
  externalUrl: string | null;
  externalSystem: string;
  key: string;
  title: string;
  description: string;
  status: string;
  severity: string;
  priority: string;
  component: string | null;
  raisedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  sourceName: string | null;
};
export type DefectSummary = {
  total: number;
  open: number;
  critical: number;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  bySystem: Record<string, number>;
};
export function useDefects(projectId: string | null | undefined, filters?: { status?: string; severity?: string; sourceId?: string; externalSystem?: string }) {
  return useQuery({
    queryKey: ["defects", projectId, filters],
    enabled: Boolean(projectId),
    queryFn: () => {
      const qs = new URLSearchParams({ projectId: projectId! });
      if (filters?.status) qs.set("status", filters.status);
      if (filters?.severity) qs.set("severity", filters.severity);
      if (filters?.sourceId) qs.set("sourceId", filters.sourceId);
      if (filters?.externalSystem) qs.set("externalSystem", filters.externalSystem);
      return jfetch<{ defects: DefectRow[] }>(`/defects?${qs.toString()}`);
    },
  });
}
export function useDefectsSummary(projectId: string | null | undefined) {
  return useQuery({
    queryKey: ["defects-summary", projectId],
    enabled: Boolean(projectId),
    queryFn: () => jfetch<DefectSummary>(`/defects/summary?projectId=${projectId}`),
  });
}

export function useSources(projectId: string | undefined) {
  return useQuery({
    queryKey: ["sources", projectId],
    enabled: Boolean(projectId),
    queryFn: () => jfetch<{ sources: ProjectSourceRow[] }>(`/sources?projectId=${projectId}`),
  });
}
export function useCreateSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<ProjectSourceRow>) =>
      jfetch<ProjectSourceRow>(`/sources`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sources"] }),
  });
}
export function useSyncSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jfetch<ProjectSourceRow>(`/sources/${id}/sync`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sources"] }),
  });
}
export function useDeleteSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jfetch<void>(`/sources/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sources"] }),
  });
}
export function useSourceFiles(sourceId: string | undefined) {
  return useQuery({
    queryKey: ["source-files", sourceId],
    enabled: Boolean(sourceId),
    queryFn: () => jfetch<{ files: Array<{ id: string; path: string; size: number; language: string | null; isBinary: string }>; totals: { count: number; bytes: number } }>(`/sources/${sourceId}/files?limit=2000`),
  });
}
export function useSourceFileContent(sourceId: string | undefined, fileId: string | undefined) {
  return useQuery({
    queryKey: ["source-file", sourceId, fileId],
    enabled: Boolean(sourceId && fileId),
    queryFn: () => jfetch<{ id: string; path: string; content: string | null; language: string | null; size: number }>(`/sources/${sourceId}/files/${fileId}`),
  });
}
export async function uploadZip(projectId: string, file: File, label?: string): Promise<ProjectSourceRow> {
  const fd = new FormData();
  fd.append("projectId", projectId);
  fd.append("file", file);
  if (label) fd.append("label", label);
  const r = await fetch(`/api/sources/upload-zip`, { method: "POST", body: fd });
  if (!r.ok) throw new Error((await r.json()).error ?? "Upload failed");
  return r.json();
}
export async function uploadFolder(projectId: string, files: FileList, label?: string): Promise<ProjectSourceRow> {
  const fd = new FormData();
  fd.append("projectId", projectId);
  if (label) fd.append("label", label);
  const paths: string[] = [];
  for (const f of Array.from(files)) {
    fd.append("files", f);
    paths.push((f as any).webkitRelativePath || f.name);
  }
  fd.append("paths", JSON.stringify(paths));
  const r = await fetch(`/api/sources/upload-folder`, { method: "POST", body: fd });
  if (!r.ok) throw new Error((await r.json()).error ?? "Upload failed");
  return r.json();
}
export async function uploadReqif(projectId: string, file: File, label?: string): Promise<ProjectSourceRow> {
  const fd = new FormData();
  fd.append("projectId", projectId);
  fd.append("file", file);
  if (label) fd.append("label", label);
  const r = await fetch(`/api/sources/upload-reqif`, { method: "POST", body: fd });
  if (!r.ok) throw new Error((await r.json()).error ?? "ReqIF import failed");
  return r.json();
}

// Upload a defect-management export file (CSV / TSV / XLSX / XLS / PDF / JSON)
// from any defect tool. `tool` is a free-form label (e.g. "jira", "ado",
// "bugzilla") used purely for display — parsing is header-driven.
export async function uploadDefectsFile(
  projectId: string,
  file: File,
  tool?: string,
  label?: string,
): Promise<ProjectSourceRow & { syncResult?: { count: number; summary: string } }> {
  const fd = new FormData();
  fd.append("projectId", projectId);
  fd.append("file", file);
  if (tool) fd.append("tool", tool);
  if (label) fd.append("label", label);
  const r = await fetch(`/api/sources/upload-defects-file`, { method: "POST", body: fd });
  if (!r.ok) throw new Error((await r.json()).error ?? "Defects file import failed");
  return r.json();
}

// ───────── Custom Standards ─────────
export type UploadedStandard = {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  status: string;
  score: number;
  controlsTotal: number;
  workspaceId: string | null;
  source: string;
  originalFilename: string | null;
  uploadedBy: string | null;
  uploadedAt: string | null;
  lastAuditAt: string;
};

export type UploadStandardResult = {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  controlsTotal: number;
  originalFilename: string | null;
  uploadedAt: string;
};

export function listUploadedStandards(): Promise<{ standards: UploadedStandard[] }> {
  return jfetch<{ standards: UploadedStandard[] }>("/standards");
}

export async function uploadStandard(file: File): Promise<UploadStandardResult> {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch(`${apiBase}/standards/upload`, {
    method: "POST",
    body: fd,
    credentials: "include",
  });
  if (!r.ok) {
    const text = await r.text();
    let message = text || `Upload failed (${r.status})`;
    try {
      const j = JSON.parse(text);
      message = j.error || j.message || message;
    } catch {}
    throw new Error(message);
  }
  return r.json();
}

export async function deleteStandard(id: string): Promise<void> {
  const r = await fetch(`${apiBase}/standards/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!r.ok && r.status !== 204) {
    const text = await r.text();
    let message = text || `Delete failed (${r.status})`;
    try {
      const j = JSON.parse(text);
      message = j.error || j.message || message;
    } catch {}
    throw new Error(message);
  }
}
