import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

export type ControlEvidenceRow = {
  id: string;
  projectId: string;
  controlId: string;
  frameworkId: string;
  kind: "requirement" | "file" | "test_result" | "report" | "screenshot" | "note";
  refId: string | null;
  refLabel: string;
  source: "ai" | "user" | "trace";
  status: "ai_asserted" | "verified" | "rejected";
  note: string;
  createdAt: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
};

export type ControlEvidenceResponse = {
  control: { id: string; code: string; title: string; status: string; assertion: string | null };
  evidence: ControlEvidenceRow[];
};

export function useControlEvidence(controlId: string | null, projectId: string | null) {
  return useQuery<ControlEvidenceResponse>({
    queryKey: ["control-evidence", controlId, projectId],
    queryFn: async () => {
      const qs = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";
      const r = await fetch(`${apiBase}/compliance/controls/${controlId}/evidence${qs}`);
      if (!r.ok) throw new Error((await r.text()) || `Request failed (${r.status})`);
      return r.json();
    },
    enabled: !!controlId,
  });
}

export function useVerifyControl(frameworkId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      controlId: string;
      action: "verify" | "reject";
      projectId: string;
      evidenceId?: string;
      note?: string;
    }) => {
      const r = await fetch(`${apiBase}/compliance/controls/${vars.controlId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vars),
      });
      if (!r.ok) throw new Error((await r.text()) || `Request failed (${r.status})`);
      return r.json() as Promise<{
        controlId: string;
        updatedCount: number;
        assertion: string | null;
        status: string;
      }>;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["control-evidence", vars.controlId, vars.projectId] });
      qc.invalidateQueries({ queryKey: ["complianceFramework", frameworkId] });
      qc.invalidateQueries({ queryKey: ["getComplianceFramework", frameworkId] });
    },
  });
}
