import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

async function aiFetch<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${apiBase}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const text = await r.text();
    let message = text || `Request failed (${r.status})`;
    try {
      const j = JSON.parse(text);
      message = j.error || j.message || message;
    } catch {
      // not JSON; fall back to raw text
    }
    throw new Error(message);
  }
  return r.json() as Promise<T>;
}

export type GeneratedRequirement = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  priority: string;
};

export type GenerateRequirementsResult = {
  created: GeneratedRequirement[];
  count: number;
};

export function useGenerateRequirements() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { projectId: string; brief: string }) =>
      aiFetch<GenerateRequirementsResult>("/ai/generate-requirements", body),
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });
}

export type AnalyzeCodeMatch = {
  requirementCode: string;
  requirementId: string | null;
  kind: "implements" | "tests" | "violates";
  confidence: number;
  rationale: string;
};

export type AnalyzeCodeResult = {
  artifact: {
    id: string;
    projectId: string;
    filePath: string;
    symbol: string;
    language: string;
    kind: string;
  };
  summary: string;
  matches: AnalyzeCodeMatch[];
  linksCreated: number;
};

export function useAnalyzeCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      projectId: string;
      filePath: string;
      symbol: string;
      language: string;
      code: string;
    }) => aiFetch<AnalyzeCodeResult>("/ai/analyze-code", body),
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });
}

export type ControlAssessment = {
  controlCode: string;
  verdict: "met" | "partial" | "gap";
  coveringRequirementCodes: string[];
  evidenceFiles?: string[];
  requiredEvidence?: string[];
  foundEvidence?: string[];
  missingEvidence?: string[];
  recommendation: string;
};

export type AuditSourceSummary = {
  sourceId: string;
  sourceLabel: string;
  sourceKind: string;
  fileCount: number;
  citedCount: number;
  citedPaths: string[];
};

export type NativeRatingValue = { value: string; label: string; description: string };

export type NativeRating = {
  schemeName: string;
  basedOn: string;
  description: string;
  overall: NativeRatingValue;
  perControl: Record<string, NativeRatingValue>;
};

export type ComplianceAuditResult = {
  framework: { id: string; code: string; name: string };
  project: { id: string; name: string };
  overallVerdict: "strong" | "adequate" | "weak" | "failing";
  headlineFindings: string[];
  controlAssessments: ControlAssessment[];
  capasCreated?: number;
  compliancePercentage?: number;
  controlSummary?: { total: number; met: number; partial: number; gap: number };
  sourcesUsed?: AuditSourceSummary[];
  evidenceTotals?: { sources: number; indexedFiles: number; citedFiles: number };
  nativeRating?: NativeRating;
};

export type CoverageStage = {
  status: "covered" | "partial" | "missing";
  artifacts: string[];
  note: string;
};

export type RequirementCoverage = {
  requirementCode: string;
  design: CoverageStage;
  code: CoverageStage;
  tests: CoverageStage;
  reports: CoverageStage;
  recommendation: string;
};

export type TraceabilityAuditResult = {
  project: { id: string; name: string };
  overallVerdict: "strong" | "adequate" | "weak" | "failing";
  headlineFindings: string[];
  requirementCoverage: RequirementCoverage[];
  completenessPercentage: number;
  stagePercentages: { design: number; code: number; tests: number; reports: number };
  requirementsAudited: number;
  sourcesUsed: Array<{
    sourceId: string;
    sourceLabel: string;
    sourceKind: string;
    fileCount: number;
    designCount: number;
    codeCount: number;
    testCount: number;
    reportCount: number;
  }>;
};

export function useComplianceAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { projectId: string; frameworkId: string; sourceIds?: string[] }) =>
      aiFetch<ComplianceAuditResult>("/ai/compliance-audit", body),
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });
}

export function useTraceabilityAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { projectId: string; sourceIds?: string[] }) =>
      aiFetch<TraceabilityAuditResult>("/ai/traceability-audit", body),
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });
}

export type LegacyExtractRequirement = {
  title: string;
  description: string;
  type: "BRD" | "PRD" | "FRD" | "NFR";
  priority: "low" | "medium" | "high" | "critical";
  tags?: string[];
};

export type LegacyRisk = {
  severity: "low" | "medium" | "high";
  title: string;
  detail: string;
};

export type LegacyExtractResult = {
  legacySystemId: string;
  summary: string;
  requirements: LegacyExtractRequirement[];
  risks: LegacyRisk[];
  modernizationNotes: string;
  createdRequirementCount: number;
};

export function useLegacyExtract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { legacySystemId: string; code: string; projectId?: string }) =>
      aiFetch<LegacyExtractResult>("/ai/legacy-extract", body),
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });
}

export type AskResult = {
  answer: string;
  citations: string[];
  confidence: "low" | "medium" | "high";
  id?: string;
  createdAt?: string;
};

export type AskConversation = {
  id: string;
  projectId: string | null;
  question: string;
  answer: string;
  confidence: "low" | "medium" | "high" | null;
  citations: string[];
  createdAt: string;
};

const ASK_HISTORY_KEY = (projectId?: string) => ["ai", "ask", "history", projectId ?? "all"];

export function useAskMontana() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { question: string; projectId?: string }) =>
      aiFetch<AskResult>("/ai/ask", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai", "ask", "history"] });
    },
  });
}

export function useAskHistory(projectId?: string) {
  return useQuery({
    queryKey: ASK_HISTORY_KEY(projectId),
    queryFn: async () => {
      const qs = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";
      const r = await fetch(`${apiBase}/ai/ask/history${qs}`);
      if (!r.ok) throw new Error(await r.text());
      const json = (await r.json()) as { conversations: AskConversation[] };
      return json.conversations;
    },
  });
}

export function useDeleteAskConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`${apiBase}/ai/ask/history/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai", "ask", "history"] });
    },
  });
}
