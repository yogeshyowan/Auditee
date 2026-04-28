import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { creditAwareFetch } from "./credits";

const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

export type TestCase = {
  id: string;
  projectId: string;
  requirementId: string | null;
  title: string;
  type: "functional" | "negative" | "non_functional" | "acceptance";
  steps: string[];
  expected: string;
  status: "draft" | "passing" | "failing" | "blocked";
  priority: "low" | "medium" | "high" | "critical";
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastRunAt: string | null;
  lastRunNote: string;
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${apiBase}${path}`, init);
  if (!r.ok) throw new Error((await r.text()) || `Request failed (${r.status})`);
  if (r.status === 204) return undefined as unknown as T;
  return r.json() as Promise<T>;
}

export function useTestCases(projectId: string | null | undefined, requirementId?: string | null) {
  return useQuery<{ testCases: TestCase[] }>({
    queryKey: ["test-cases", projectId, requirementId ?? null],
    queryFn: () =>
      api(
        `/test-cases?projectId=${encodeURIComponent(projectId ?? "")}${
          requirementId ? `&requirementId=${encodeURIComponent(requirementId)}` : ""
        }`,
      ),
    enabled: !!projectId,
  });
}

export function useCreateTestCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<TestCase> & { projectId: string; title: string }) =>
      api<{ testCase: TestCase }>("/test-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["test-cases", vars.projectId] });
    },
  });
}

export function useUpdateTestCase(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; patch: Partial<TestCase> }) =>
      api<{ testCase: TestCase }>(`/test-cases/${vars.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vars.patch),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["test-cases", projectId] }),
  });
}

export function useDeleteTestCase(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/test-cases/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["test-cases", projectId] }),
  });
}

export function useRunTestCase(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; status: "passing" | "failing" | "blocked"; note?: string }) =>
      api<{ testCase: TestCase }>(`/test-cases/${vars.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: vars.status, note: vars.note ?? "" }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["test-cases", projectId] }),
  });
}

export function useGenerateTestCases(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (requirementId: string) => {
      const r = await creditAwareFetch(`${apiBase}/ai/generate-test-cases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirementId }),
      });
      if (!r.ok) throw new Error((await r.text()) || `Request failed (${r.status})`);
      return r.json() as Promise<{ created: TestCase[]; count: number }>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["test-cases", projectId] });
      qc.invalidateQueries({ queryKey: ["test-case-counts", projectId] });
    },
  });
}

export function useTestCaseCountsByRequirement(projectId: string | null, requirementIds: string[]) {
  return useQuery<{
    counts: Record<string, { total: number; passing: number; failing: number; blocked: number; draft: number }>;
  }>({
    queryKey: ["test-case-counts", projectId, requirementIds.join(",")],
    queryFn: () =>
      api(`/test-cases/bulk-by-requirement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, requirementIds }),
      }),
    enabled: !!projectId && requirementIds.length > 0,
  });
}
