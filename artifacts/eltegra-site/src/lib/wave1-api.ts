import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

async function jfetch<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${apiBase}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
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
};

export function useCapas(projectId: string | undefined, status?: string) {
  return useQuery({
    queryKey: ["capa", projectId, status],
    enabled: Boolean(projectId),
    queryFn: () => {
      const qs = new URLSearchParams();
      if (projectId) qs.set("projectId", projectId);
      if (status) qs.set("status", status);
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
    mutationFn: (body: { projectId: string; kind: string; tone: string; frameworkId?: string | null; instructions?: string }) =>
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
