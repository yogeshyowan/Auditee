import { useMutation, useQueryClient } from "@tanstack/react-query";

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
  recommendation: string;
};

export type ComplianceAuditResult = {
  framework: { id: string; code: string; name: string };
  project: { id: string; name: string };
  overallVerdict: "strong" | "adequate" | "weak" | "failing";
  headlineFindings: string[];
  controlAssessments: ControlAssessment[];
};

export function useComplianceAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { projectId: string; frameworkId: string }) =>
      aiFetch<ComplianceAuditResult>("/ai/compliance-audit", body),
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
};

export function useAskEltegra() {
  return useMutation({
    mutationFn: (body: { question: string; projectId?: string }) =>
      aiFetch<AskResult>("/ai/ask", body),
  });
}
