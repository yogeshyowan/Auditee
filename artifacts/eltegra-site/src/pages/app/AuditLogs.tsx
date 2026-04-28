import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Sparkles, ShieldAlert, Download } from "lucide-react";
import { Link } from "wouter";

interface AuditLog {
  id: string;
  workspaceId: string;
  actorUserId: string;
  actorEmail: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

interface FetchError extends Error {
  status?: number;
  body?: { error?: string; requiresUpgrade?: boolean; plan?: string };
}

async function authedFetch<T>(path: string, token: string | null): Promise<T> {
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${apiBase}${path}`, { headers, credentials: "include" });
  const text = await res.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) {
    const err: FetchError = new Error(body?.error ?? `Request failed (${res.status})`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body as T;
}

export default function AuditLogsPage() {
  const { getToken, isLoaded } = useAuth();
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => { document.title = "Audit Log — Auditee"; }, []);

  const query = useQuery<{ logs: AuditLog[]; count: number }, FetchError>({
    queryKey: ["audit-logs"],
    enabled: isLoaded,
    queryFn: async () => {
      const token = await getToken();
      return authedFetch("/workspace/audit-logs", token);
    },
    retry: false,
  });

  const filtered = useMemo(() => {
    if (!query.data) return [] as AuditLog[];
    return query.data.logs.filter((l) => {
      if (actor && !(l.actorEmail ?? "").toLowerCase().includes(actor.toLowerCase())) return false;
      if (action && !l.action.toLowerCase().includes(action.toLowerCase())) return false;
      if (from && new Date(l.createdAt) < new Date(from)) return false;
      if (to && new Date(l.createdAt) > new Date(`${to}T23:59:59`)) return false;
      return true;
    });
  }, [query.data, actor, action, from, to]);

  function downloadCsv() {
    const headers = ["timestamp", "actor_email", "actor_user_id", "action", "resource_type", "resource_id", "ip", "metadata"];
    const rows = filtered.map((l) =>
      [
        l.createdAt,
        l.actorEmail ?? "",
        l.actorUserId,
        l.action,
        l.resourceType ?? "",
        l.resourceId ?? "",
        l.ip ?? "",
        JSON.stringify(l.metadata ?? {}).replace(/"/g, '""'),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!isLoaded || query.isLoading) return <div className="p-8 text-slate-500">Loading…</div>;

  if (query.isError) {
    const err = query.error;
    if (err.status === 402 || err.body?.requiresUpgrade) {
      return (
        <div className="mx-auto w-full max-w-3xl p-6 md:p-10">
          <Card className="border-primary/30 bg-primary/5" data-testid="card-audit-upgrade">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Sparkles className="h-5 w-5 text-primary" /> Audit Log is an Enterprise feature
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <p>
                Track every member invite, role change, plan switch, and SSO update — with timestamp, actor,
                IP, and full metadata. Required for SOC 2 evidence collection and incident response.
              </p>
              <Link href="/app/billing">
                <Button data-testid="button-upgrade-from-audit">Upgrade to Enterprise</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      );
    }
    if (err.status === 403) {
      return (
        <div className="mx-auto w-full max-w-3xl p-6 md:p-10">
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <ShieldAlert className="h-5 w-5" /> Admin or owner role required
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-amber-800">
              Ask a workspace owner to grant you the admin role to access the audit trail.
            </CardContent>
          </Card>
        </div>
      );
    }
    return <div className="p-8 text-red-600">Failed to load audit log: {err.message}</div>;
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6 md:p-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" /> Audit Log
          </h1>
          <p className="mt-1 text-slate-500">
            Append-only history of every workspace mutation. Used for SOC 2, ISO 27001, and incident-response evidence.
          </p>
        </div>
        <Button variant="outline" onClick={downloadCsv} disabled={filtered.length === 0} data-testid="button-export-csv">
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Actor email</label>
            <Input value={actor} onChange={(e) => setActor(e.target.value)} placeholder="alice@…" data-testid="input-filter-actor" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Action contains</label>
            <Input value={action} onChange={(e) => setAction(e.target.value)} placeholder="member.invited" data-testid="input-filter-action" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">From</label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} data-testid="input-filter-from" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">To</label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} data-testid="input-filter-to" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Resource</th>
                  <th className="p-3">IP</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      {query.data?.count === 0 ? "No audit events yet." : "No events match these filters."}
                    </td>
                  </tr>
                )}
                {filtered.map((l) => (
                  <tr key={l.id} className="border-t border-slate-100" data-testid={`row-log-${l.id}`}>
                    <td className="p-3 whitespace-nowrap text-slate-700">{new Date(l.createdAt).toLocaleString()}</td>
                    <td className="p-3 text-slate-700">{l.actorEmail ?? l.actorUserId}</td>
                    <td className="p-3"><Badge variant="secondary" className="font-mono text-[11px]">{l.action}</Badge></td>
                    <td className="p-3 text-slate-600">
                      {l.resourceType ? `${l.resourceType}${l.resourceId ? ":" + l.resourceId.slice(0, 8) : ""}` : "—"}
                    </td>
                    <td className="p-3 font-mono text-xs text-slate-500">{l.ip ?? "—"}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-500 max-w-xs truncate">
                      {l.metadata ? JSON.stringify(l.metadata) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-slate-400">
        Showing {filtered.length} of {query.data?.count ?? 0} events. Logs are append-only and retained for 90 days on Enterprise.
      </p>
    </div>
  );
}
