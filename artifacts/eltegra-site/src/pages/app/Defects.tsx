import { useMemo, useState } from "react";
import { useProjectContext } from "@/lib/project-context";
import { useDefects, useDefectsSummary, useSources } from "@/lib/wave1-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bug, ExternalLink, Search, AlertTriangle, ShieldAlert, FolderInput } from "lucide-react";
import { Link } from "wouter";

const SEVERITY_COLOR: Record<string, string> = {
  blocker: "bg-red-100 text-red-800 border-red-200",
  critical: "bg-red-100 text-red-700 border-red-200",
  major: "bg-amber-100 text-amber-800 border-amber-200",
  minor: "bg-blue-50 text-blue-700 border-blue-200",
  trivial: "bg-slate-100 text-slate-600 border-slate-200",
};

const STATUS_COLOR: Record<string, string> = {
  open: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  blocked: "bg-red-50 text-red-700 border-red-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-slate-100 text-slate-600 border-slate-200",
  done: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function Defects() {
  const { projectId } = useProjectContext();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("__all");
  const [severityFilter, setSeverityFilter] = useState<string>("__all");
  const [systemFilter, setSystemFilter] = useState<string>("__all");

  const filters = useMemo(
    () => ({
      status: statusFilter === "__all" ? undefined : statusFilter,
      severity: severityFilter === "__all" ? undefined : severityFilter,
      externalSystem: systemFilter === "__all" ? undefined : systemFilter,
    }),
    [statusFilter, severityFilter, systemFilter],
  );

  const { data, isLoading } = useDefects(projectId, filters);
  const { data: summary } = useDefectsSummary(projectId);
  const { data: sources } = useSources(projectId);

  const defects = data?.defects ?? [];
  const filtered = useMemo(() => {
    if (!search.trim()) return defects;
    const q = search.toLowerCase();
    return defects.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.key.toLowerCase().includes(q) ||
        d.externalId.toLowerCase().includes(q) ||
        (d.component ?? "").toLowerCase().includes(q),
    );
  }, [defects, search]);

  // Source systems come from the unfiltered summary so the filter is
  // always available even when the current filter combo yields zero rows.
  const knownSystems = useMemo(
    () => Object.keys(summary?.bySystem ?? {}).sort(),
    [summary?.bySystem],
  );

  const hasDefectSources = (sources?.sources ?? []).some((s) =>
    ["jira", "azure_devops_bugs", "bugzilla", "servicenow", "alm_octane", "linear", "github_issues"].includes(s.kind),
  );

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 font-[Inter_Tight]">Defects</h1>
          <p className="text-slate-500 mt-1">
            Bugs and incidents pulled from your connected defect-management tools — used as audit evidence for compliance and CAPA workflows.
          </p>
        </div>
        <Link href="/app/sources">
          <Button variant="outline" className="gap-2" data-testid="button-defects-connect-source">
            <FolderInput className="h-4 w-4" /> Connect a defect tool
          </Button>
        </Link>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total imported</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-slate-400" />
            <span className="text-3xl font-semibold text-slate-900" data-testid="defects-total">
              {summary?.total ?? "—"}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wide">Open</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <span className="text-3xl font-semibold text-amber-700" data-testid="defects-open">
              {summary?.open ?? "—"}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wide">Critical / Blocker</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            <span className="text-3xl font-semibold text-red-700" data-testid="defects-critical">
              {summary?.critical ?? "—"}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wide">Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(summary?.bySystem ?? {}).map(([sys, count]) => (
                <Badge key={sys} variant="outline" className="text-[10px] font-mono">
                  {sys} · {count}
                </Badge>
              ))}
              {Object.keys(summary?.bySystem ?? {}).length === 0 && (
                <span className="text-sm text-slate-400">No defects yet</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by title, key, or component"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="defects-search"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]" data-testid="defects-status-filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[180px]" data-testid="defects-severity-filter">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All severities</SelectItem>
            <SelectItem value="blocker">Blocker</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="major">Major</SelectItem>
            <SelectItem value="minor">Minor</SelectItem>
            <SelectItem value="trivial">Trivial</SelectItem>
          </SelectContent>
        </Select>
        <Select value={systemFilter} onValueChange={setSystemFilter}>
          <SelectTrigger className="w-[200px]" data-testid="defects-system-filter">
            <SelectValue placeholder="Source system" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All systems</SelectItem>
            {knownSystems.map((sys) => (
              <SelectItem key={sys} value={sys}>{sys}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading defects…</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Bug className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              {defects.length === 0 ? (
                hasDefectSources ? (
                  <p>No defects synced yet. Trigger a sync from your connected source.</p>
                ) : (
                  <p>
                    No defects yet.{" "}
                    <Link href="/app/sources" className="text-primary underline">
                      Connect a defect-tracker
                    </Link>{" "}
                    to import bugs from Jira, Azure DevOps Bugs, GitHub Issues, Linear, Bugzilla, ServiceNow or ALM Octane.
                  </p>
                )
              ) : (
                <p>No defects match the current filters.</p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Key</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-[110px]">Severity</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[140px]">Source</TableHead>
                  <TableHead className="w-[140px]">Raised</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => (
                  <TableRow key={d.id} data-testid={`defect-row-${d.id}`}>
                    <TableCell className="font-mono text-xs text-slate-600">{d.key}</TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900 line-clamp-1">{d.title}</div>
                      {d.component && (
                        <div className="text-xs text-slate-500 mt-0.5">component: {d.component}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] uppercase font-semibold ${SEVERITY_COLOR[d.severity] ?? ""}`}>
                        {d.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${STATUS_COLOR[d.status] ?? ""}`}>
                        {d.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      <div className="font-mono">{d.externalSystem}</div>
                      {d.sourceName && <div className="text-slate-400">{d.sourceName}</div>}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {d.raisedAt ? new Date(d.raisedAt).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      {d.externalUrl && (
                        <a href={d.externalUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-primary">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
