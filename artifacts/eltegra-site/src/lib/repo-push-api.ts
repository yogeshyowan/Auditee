import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { creditAwareFetch } from "./credits";

const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

export type PushTarget = {
  id: string;
  label: string;
  repoUrl: string | null;
  branch: string | null;
  hasToken: boolean;
  status: string;
};

export type PushResult = {
  commitSha: string;
  commitUrl: string;
  branch: string;
  fileCount: number;
  path?: string;
};

export function usePushTargets(projectId: string | null) {
  return useQuery<{ sources: PushTarget[] }>({
    queryKey: ["push-targets", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const r = await creditAwareFetch(`${apiBase}/repo/push-targets?projectId=${projectId}`);
      if (!r.ok) {
        const j = await r.json().catch(() => ({} as any));
        throw new Error(j?.error ?? "Failed to load push targets");
      }
      return r.json();
    },
  });
}

export function usePushReport() {
  const qc = useQueryClient();
  return useMutation<
    PushResult,
    Error,
    { projectId: string; reportId: string; sourceId?: string; branch?: string; subdir?: string; commitMessage?: string }
  >({
    mutationFn: async (body) => {
      const r = await creditAwareFetch(`${apiBase}/repo/push-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({} as any));
        throw new Error(j?.error ?? "Push failed");
      }
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["activity"] }),
  });
}

export function usePushTestBundle() {
  const qc = useQueryClient();
  return useMutation<
    PushResult,
    Error,
    { projectId: string; sourceId?: string; branch?: string; subdir?: string; commitMessage?: string; reportId?: string }
  >({
    mutationFn: async (body) => {
      const r = await creditAwareFetch(`${apiBase}/repo/push-test-bundle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({} as any));
        throw new Error(j?.error ?? "Push failed");
      }
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["activity"] }),
  });
}
