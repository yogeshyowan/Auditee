import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Mailbox,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
} from "lucide-react";

interface LeadRow {
  id: string;
  clerkUserId: string | null;
  name: string;
  email: string;
  source: "signup" | "login" | "waitlist";
  forwardedToFormAt: string | null;
  forwardError: string | null;
  createdAt: string;
  workspaceId: string | null;
  workspaceName: string | null;
  plan: string | null;
  planActivatedAt: string | null;
  planExpiresAt: string | null;
  workspaceCreatedAt: string | null;
}

const PLAN_BADGE: Record<string, string> = {
  free: "bg-slate-100 text-slate-700",
  standard: "bg-emerald-100 text-emerald-800",
  professional: "bg-indigo-100 text-indigo-800",
  enterprise: "bg-amber-100 text-amber-800",
};

interface ResyncResult {
  started: boolean;
  pending: number;
}

interface FetchError extends Error {
  status?: number;
  body?: { error?: string };
}

const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

async function authedFetch<T>(
  path: string,
  token: string | null,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  const res = await fetch(`${apiBase}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const msg =
      (body as { error?: string } | null)?.error ??
      `Request failed (${res.status})`;
    const err: FetchError = new Error(msg);
    err.status = res.status;
    err.body = body as FetchError["body"];
    throw err;
  }
  return body as T;
}

const SOURCE_BADGE: Record<LeadRow["source"], string> = {
  signup: "bg-emerald-100 text-emerald-800",
  login: "bg-sky-100 text-sky-800",
  waitlist: "bg-violet-100 text-violet-800",
};

export default function AdminLeadsPage() {
  const { getToken, isLoaded } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    document.title = "Captured Leads — Auditee";
  }, []);

  // While a background resync is running we poll the captures list so the
  // admin sees rows flip to "Synced" without manually refreshing. We snapshot
  // the row IDs and their initial forwardError values at start time so we can
  // tell when each row has been processed — including failed and skipped
  // rows that will never have forwardedToFormAt set.
  const [resyncRun, setResyncRun] = useState<{
    snapshot: Map<string, string | null>;
    hardDeadline: number;
  } | null>(null);
  const isResyncPolling = resyncRun !== null;

  const query = useQuery<{ leads: LeadRow[]; count: number }, FetchError>({
    queryKey: ["admin", "lead-captures"],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      return authedFetch("/leads/captures/all", token);
    },
    retry: false,
    refetchInterval: isResyncPolling ? 3000 : false,
  });

  // Decide when the run is finished. A snapshot row is "done" if it's been
  // synced (forwardedToFormAt set) OR its forwardError changed since we
  // started (the worker touched it — success or failure both count). We also
  // bail out at a hard deadline so the UI never gets stuck if e.g. the
  // server crashes mid-run.
  useEffect(() => {
    if (!resyncRun) return;
    const rowsById = new Map(
      (query.data?.leads ?? []).map((r) => [r.id, r] as const),
    );

    let processed = 0;
    let synced = 0;
    let failed = 0;
    for (const [id, initialError] of resyncRun.snapshot) {
      const row = rowsById.get(id);
      if (!row) {
        processed++;
        continue;
      }
      if (row.forwardedToFormAt) {
        processed++;
        synced++;
      } else if ((row.forwardError ?? null) !== (initialError ?? null)) {
        processed++;
        failed++;
      }
    }

    const total = resyncRun.snapshot.size;
    const allDone = processed >= total;
    const timedOut = Date.now() > resyncRun.hardDeadline;

    if (allDone || timedOut) {
      setResyncRun(null);
      const parts: string[] = [];
      if (synced) parts.push(`${synced} synced`);
      if (failed) parts.push(`${failed} failed`);
      const stillPending = total - processed;
      if (stillPending > 0)
        parts.push(`${stillPending} still pending (timed out)`);
      if (!parts.length) parts.push("nothing changed");
      toast({
        title: timedOut && !allDone ? "Resync stopped" : "Resync complete",
        description: parts.join(", ") + ".",
        variant: timedOut && !allDone ? "destructive" : undefined,
      });
    }
  }, [query.data, resyncRun, toast]);

  const resyncMutation = useMutation<ResyncResult, FetchError>({
    mutationFn: async () => {
      const token = await getToken();
      return authedFetch<ResyncResult>("/leads/resync-unforwarded", token, {
        method: "POST",
      });
    },
    onSuccess: (data) => {
      // Snapshot the rows the backend will be processing so we have a stable
      // completion target even if rows fail or are skipped.
      const snapshot = new Map<string, string | null>();
      for (const r of query.data?.leads ?? []) {
        if (!r.forwardedToFormAt) snapshot.set(r.id, r.forwardError ?? null);
      }
      // Generous hard cap (~1.5s/row, min 60s, max 15min) — only used as a
      // safety net so the UI doesn't poll forever on a stuck server.
      const estMs = Math.min(
        15 * 60 * 1000,
        Math.max(60_000, data.pending * 1500),
      );
      setResyncRun({ snapshot, hardDeadline: Date.now() + estMs });
      toast({
        title: "Resync started",
        description: `${data.pending} row${data.pending === 1 ? "" : "s"} queued. The list will refresh as rows are forwarded.`,
      });
      qc.invalidateQueries({ queryKey: ["admin", "lead-captures"] });
    },
    onError: (err) =>
      toast({
        title: "Resync failed",
        description: err.message,
        variant: "destructive",
      }),
  });

  const filtered = useMemo(() => {
    const rows = query.data?.leads ?? [];
    const q = search.trim().toLowerCase();
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(`${to}T23:59:59`) : null;
    return rows.filter((r) => {
      if (q) {
        if (
          !r.email.toLowerCase().includes(q) &&
          !r.name.toLowerCase().includes(q) &&
          !r.source.includes(q)
        )
          return false;
      }
      if (fromDate && new Date(r.createdAt) < fromDate) return false;
      if (toDate && new Date(r.createdAt) > toDate) return false;
      return true;
    });
  }, [query.data, search, from, to]);

  const [isDownloading, setIsDownloading] = useState(false);
  async function downloadCsv() {
    // Hit the server-side streaming endpoint instead of building the CSV in
    // the browser so the export contains every captured lead, not just the
    // rows currently loaded into the table (or matching the active filters).
    setIsDownloading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${apiBase}/leads/captures/all.csv`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: "include",
      });
      if (!res.ok) {
        let msg = `Request failed (${res.status})`;
        try {
          const body = (await res.json()) as { error?: string };
          if (body?.error) msg = body.error;
        } catch {
          /* non-JSON error body — keep generic message */
        }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `captured-leads-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast({
        title: "Export failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  }

  const unforwardedCount = useMemo(
    () =>
      (query.data?.leads ?? []).filter((r) => !r.forwardedToFormAt).length,
    [query.data],
  );

  if (!isLoaded || query.isLoading)
    return <div className="p-8 text-slate-500">Loading…</div>;

  if (query.isError) {
    const err = query.error;
    if (err.status === 403) {
      return (
        <div className="mx-auto w-full max-w-3xl p-6 md:p-10">
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <ShieldAlert className="h-5 w-5" /> Workspace owner + internal admin access required
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-amber-800">
              Captured leads contain personal information collected at signup
              and login. Access requires both the workspace <strong>owner</strong>
              {" "}role <em>and</em> membership in the internal operator
              allowlist (LEAD_ADMIN_EMAILS env var). Ask an existing admin to
              add you.
            </CardContent>
          </Card>
        </div>
      );
    }
    return (
      <div className="p-8 text-red-600">
        Failed to load captured leads: {err.message}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6 md:p-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Mailbox className="h-7 w-7 text-primary" /> Captured Leads
          </h1>
          <p className="mt-1 text-slate-500">
            Every signup, login, and waitlist capture, with a live indicator of
            whether the row was forwarded to the connected Google Sheet.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={downloadCsv}
            disabled={isDownloading}
            data-testid="button-export-csv"
          >
            <Download className="h-4 w-4 mr-2" />
            {isDownloading ? "Exporting…" : "Export CSV"}
          </Button>
          <Button
            onClick={() => resyncMutation.mutate()}
            disabled={
              resyncMutation.isPending ||
              isResyncPolling ||
              unforwardedCount === 0
            }
            data-testid="button-resync-unforwarded"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${resyncMutation.isPending || isResyncPolling ? "animate-spin" : ""}`}
            />
            {resyncMutation.isPending
              ? "Starting…"
              : isResyncPolling
              ? `Resyncing in background (${unforwardedCount} left)`
              : `Resync all unforwarded (${unforwardedCount})`}
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="md:col-span-1">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Search
            </label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by name, email, or source…"
              data-testid="input-filter-leads"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              From
            </label>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              data-testid="input-filter-from"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              To
            </label>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              data-testid="input-filter-to"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="p-3">Captured at</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Workspace</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Sheet sync</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-8 text-center text-slate-400"
                      data-testid="empty-state"
                    >
                      {query.data?.count === 0
                        ? "No leads captured yet."
                        : "No leads match this filter."}
                    </td>
                  </tr>
                )}
                {filtered.map((r) => {
                  const synced = !!r.forwardedToFormAt;
                  return (
                    <tr
                      key={r.id}
                      className="border-t border-slate-100"
                      data-testid={`row-lead-${r.id}`}
                    >
                      <td className="p-3 whitespace-nowrap text-slate-700">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <Badge
                          className={`capitalize ${SOURCE_BADGE[r.source] ?? "bg-slate-100 text-slate-700"}`}
                        >
                          {r.source}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-700">{r.name}</td>
                      <td className="p-3 text-slate-700 font-mono text-xs">
                        {r.email}
                      </td>
                      <td className="p-3 text-slate-600 text-xs">
                        {r.workspaceName ? (
                          <span title={r.workspaceId ?? ""}>
                            {r.workspaceName}
                            {r.workspaceCreatedAt && (
                              <span className="block text-[10px] text-slate-400">
                                joined{" "}
                                {new Date(
                                  r.workspaceCreatedAt,
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        {r.plan ? (
                          <Badge
                            className={`capitalize ${PLAN_BADGE[r.plan] ?? "bg-slate-100 text-slate-700"}`}
                            title={
                              r.planExpiresAt
                                ? `Expires ${new Date(r.planExpiresAt).toLocaleDateString()}`
                                : r.planActivatedAt
                                  ? `Activated ${new Date(r.planActivatedAt).toLocaleDateString()}`
                                  : ""
                            }
                          >
                            {r.plan}
                          </Badge>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        {synced ? (
                          <span
                            className="inline-flex items-center gap-1.5 text-emerald-700"
                            data-testid={`sync-ok-${r.id}`}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-xs">
                              Synced{" "}
                              {new Date(
                                r.forwardedToFormAt!,
                              ).toLocaleString()}
                            </span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1.5 text-red-700"
                            data-testid={`sync-fail-${r.id}`}
                            title={r.forwardError ?? "Not yet forwarded"}
                          >
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-xs">
                              {r.forwardError
                                ? r.forwardError.length > 60
                                  ? r.forwardError.slice(0, 60) + "…"
                                  : r.forwardError
                                : "Not synced"}
                            </span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-slate-400">
        Showing {filtered.length} of {query.data?.count ?? 0} captured leads.
      </p>
    </div>
  );
}
