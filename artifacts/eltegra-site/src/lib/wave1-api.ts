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
