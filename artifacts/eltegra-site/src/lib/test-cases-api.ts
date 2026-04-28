import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { creditAwareFetch } from "./credits";

const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

export const TC_LEVELS = ["unit", "integration", "system", "acceptance", "operational"] as const;
export const TC_DISCIPLINES = [
  "functional",
  "negative",
  "regulatory",
  "performance",
  "security",
  "usability",
  "compatibility",
  "regression",
  "accessibility",
  "reliability",
  "uat",
] as const;
export const TC_PARADIGMS = ["procedural", "bdd", "oo_state", "functional_property", "exploratory"] as const;
export const TC_MODES = ["static", "dynamic"] as const;
export const TC_SOURCE_KINDS = ["requirement", "design", "architecture", "code", "report", "project"] as const;

export type TcLevel = (typeof TC_LEVELS)[number];
export type TcDiscipline = (typeof TC_DISCIPLINES)[number];
export type TcParadigm = (typeof TC_PARADIGMS)[number];
export type TcMode = (typeof TC_MODES)[number];
export type TcSourceKind = (typeof TC_SOURCE_KINDS)[number];

export type TestCase = {
  id: string;
  projectId: string;
  requirementId: string | null;
  title: string;
  type: "functional" | "negative" | "non_functional" | "acceptance";
  level: TcLevel;
  discipline: TcDiscipline;
  paradigm: TcParadigm;
  mode: TcMode;
  sourceKind: TcSourceKind;
  sourceRefs: Array<{ kind: string; id: string; label?: string }>;
  preconditions: string;
  steps: string[];
  expected: string;
  gherkin: string | null;
  status: "draft" | "passing" | "failing" | "blocked";
  priority: "low" | "medium" | "high" | "critical";
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastRunAt: string | null;
  lastRunNote: string;
  lastRunVerdict: "pass" | "fail" | "inconclusive" | null;
  lastRunReportId: string | null;
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

export type GenerateSuiteBody = {
  projectId: string;
  sourceKind: TcSourceKind;
  sourceIds?: string[];
  sourceFileIds?: string[];
  levels: TcLevel[];
  disciplines: TcDiscipline[];
  paradigms: TcParadigm[];
  includeStatic?: boolean;
  includeDynamic?: boolean;
  targetCount?: number;
};

export function useGenerateTestSuite(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: GenerateSuiteBody) => {
      const r = await creditAwareFetch(`${apiBase}/ai/generate-test-suite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

export function useRunTestSuite(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { projectId: string; testCaseIds?: string[] }) => {
      const r = await creditAwareFetch(`${apiBase}/ai/run-test-suite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error((await r.text()) || `Request failed (${r.status})`);
      return r.json() as Promise<{
        reportId: string;
        counts: { pass: number; fail: number; inconclusive: number };
        totalRun: number;
        passRate: number;
      }>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["test-cases", projectId] });
      qc.invalidateQueries({ queryKey: ["test-case-counts", projectId] });
      qc.invalidateQueries({ queryKey: ["ai-reports", projectId] });
    },
  });
}

export function exportBundleUrl(projectId: string, reportId?: string): string {
  const q = new URLSearchParams({ projectId });
  if (reportId) q.set("reportId", reportId);
  return `${apiBase}/test-cases/export-bundle?${q.toString()}`;
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
