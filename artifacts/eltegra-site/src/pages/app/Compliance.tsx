import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useListComplianceFrameworks } from "@workspace/api-client-react";
import { useProjectContext } from "@/lib/project-context";
import { useSources } from "@/lib/wave1-api";
import { useComplianceAudit, type ComplianceAuditResult } from "@/lib/ai-api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const STATUS_META: Record<string, { label: string; cls: string; icon: React.ComponentType<{ className?: string }> }> = {
  passing: { label: "Passing", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: ShieldCheck },
  warning: { label: "Warning", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: AlertTriangle },
  gap: { label: "Gap", cls: "bg-red-50 text-red-700 border-red-200", icon: ShieldAlert },
};

export default function Compliance() {
  const { data: frameworks, isLoading } = useListComplianceFrameworks();
  const [auditOpen, setAuditOpen] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 font-[Inter_Tight]">Compliance</h1>
          <p className="text-slate-500 mt-1">
            Live status across regulatory frameworks mapped to your code and requirements.
          </p>
        </div>
        <Button onClick={() => setAuditOpen(true)} data-testid="run-multi-audit">
          <Sparkles className="h-4 w-4 mr-2" />
          Run audit
        </Button>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : !frameworks || frameworks.length === 0 ? (
        <div className="p-12 text-center text-slate-500">No frameworks yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {frameworks.map(fw => {
            const meta = STATUS_META[fw.status] ?? STATUS_META.warning;
            const Icon = meta.icon;
            return (
              <Link key={fw.id} href={`/app/compliance/${fw.id}`}>
                <Card className="rounded-xl border-slate-200 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-mono text-xs text-slate-500">{fw.code}</div>
                          <div className="font-semibold text-slate-900 font-[Inter_Tight] tracking-tight">{fw.name}</div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors" />
                    </div>
                    {fw.category && <div className="text-xs text-slate-500 mb-3">{fw.category}</div>}
                    <Badge className={meta.cls + " border mb-4"}>{meta.label}</Badge>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Score</span>
                        <span className="font-semibold text-slate-900">{fw.score}%</span>
                      </div>
                      <Progress value={fw.score} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                        <span>Controls met</span>
                        <span><span className="font-semibold text-slate-700">{fw.controlsMet}</span> / {fw.controlsTotal}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <RunMultiAuditDialog
        open={auditOpen}
        onClose={() => setAuditOpen(false)}
        frameworks={frameworks ?? []}
      />
    </div>
  );
}

// ============================================================================
// Multi-framework audit launcher
// ============================================================================

type Framework = { id: string; code: string; name: string; status?: string };

interface AuditRun {
  frameworkId: string;
  frameworkCode: string;
  frameworkName: string;
  status: "pending" | "running" | "done" | "error";
  result?: ComplianceAuditResult;
  error?: string;
}

function RunMultiAuditDialog({
  open,
  onClose,
  frameworks,
}: {
  open: boolean;
  onClose: () => void;
  frameworks: Framework[];
}) {
  const { connectedProjects, projectId: currentProjectId } = useProjectContext();
  const [pickedProjectId, setPickedProjectId] = useState<string>(currentProjectId ?? "");
  const effectiveProjectId = pickedProjectId || currentProjectId || connectedProjects[0]?.id || "";
  const { data: sourcesResp } = useSources(effectiveProjectId || undefined);
  const readySources = useMemo(() => {
    const list = (sourcesResp && "sources" in sourcesResp ? sourcesResp.sources : []) ?? [];
    return list.filter((s) => s.status === "ready");
  }, [sourcesResp]);
  const [pickedSourceId, setPickedSourceId] = useState<string>("__all__");
  const [pickedFrameworks, setPickedFrameworks] = useState<Set<string>>(new Set());
  const [runs, setRuns] = useState<AuditRun[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const audit = useComplianceAudit();

  function toggleFramework(id: string) {
    setPickedFrameworks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function reset() {
    setRuns([]);
    setPickedFrameworks(new Set());
    setPickedSourceId("__all__");
  }

  function handleClose() {
    if (isRunning) return;
    reset();
    onClose();
  }

  async function runAudits() {
    if (!effectiveProjectId || pickedFrameworks.size === 0) return;
    const sourceIds =
      pickedSourceId === "__all__"
        ? readySources.map((s: any) => s.id)
        : [pickedSourceId];
    const queue: AuditRun[] = Array.from(pickedFrameworks).map((fid) => {
      const fw = frameworks.find((f) => f.id === fid);
      return {
        frameworkId: fid,
        frameworkCode: fw?.code ?? fid,
        frameworkName: fw?.name ?? fid,
        status: "pending" as const,
      };
    });
    setRuns(queue);
    setIsRunning(true);
    for (let i = 0; i < queue.length; i++) {
      setRuns((prev) =>
        prev.map((r, idx) => (idx === i ? { ...r, status: "running" } : r)),
      );
      try {
        const result = await audit.mutateAsync({
          projectId: effectiveProjectId,
          frameworkId: queue[i].frameworkId,
          sourceIds: sourceIds.length > 0 ? sourceIds : undefined,
        });
        setRuns((prev) =>
          prev.map((r, idx) => (idx === i ? { ...r, status: "done", result } : r)),
        );
      } catch (err) {
        setRuns((prev) =>
          prev.map((r, idx) =>
            idx === i ? { ...r, status: "error", error: err instanceof Error ? err.message : String(err) } : r,
          ),
        );
      }
    }
    setIsRunning(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Run compliance audit</DialogTitle>
          <p className="text-sm text-slate-500 mt-1">
            Pick a connected project, the source(s) to audit, and one or more standards to evaluate against.
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Project picker */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1 block">
              Project
            </label>
            {connectedProjects.length === 0 ? (
              <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
                No connected projects. Connect a repository or upload files in{" "}
                <Link href="/app/sources" className="underline font-medium">Project Sources</Link>{" "}
                first.
              </div>
            ) : (
              <Select value={pickedProjectId || effectiveProjectId} onValueChange={setPickedProjectId}>
                <SelectTrigger data-testid="audit-project-select">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {connectedProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} <span className="text-slate-400">({p.sourceCount} source{p.sourceCount === 1 ? "" : "s"})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Source picker */}
          {effectiveProjectId && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1 block">
                Source
              </label>
              {readySources.length === 0 ? (
                <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
                  No ready sources for this project. Wait for ingestion to finish or add a new source.
                </div>
              ) : (
                <Select value={pickedSourceId} onValueChange={setPickedSourceId}>
                  <SelectTrigger data-testid="audit-source-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">
                      All ready sources ({readySources.length})
                    </SelectItem>
                    {readySources.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label} <span className="text-slate-400">[{s.kind}]</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Framework checkboxes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Standards to audit against
              </label>
              <div className="flex gap-2 text-[10px]">
                <button
                  type="button"
                  className="text-primary underline"
                  onClick={() => setPickedFrameworks(new Set(frameworks.map((f) => f.id)))}
                  disabled={isRunning}
                >
                  Select all
                </button>
                <button
                  type="button"
                  className="text-slate-500 underline"
                  onClick={() => setPickedFrameworks(new Set())}
                  disabled={isRunning}
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-slate-200 rounded-lg p-3 max-h-60 overflow-y-auto">
              {frameworks.map((fw) => {
                const checked = pickedFrameworks.has(fw.id);
                return (
                  <label
                    key={fw.id}
                    className={`flex items-start gap-2 p-2 rounded border cursor-pointer transition-colors ${
                      checked ? "bg-primary/5 border-primary/30" : "border-transparent hover:bg-slate-50"
                    }`}
                    data-testid={`audit-framework-${fw.code}`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleFramework(fw.id)}
                      disabled={isRunning}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono text-slate-500">{fw.code}</div>
                      <div className="text-sm font-medium text-slate-900 truncate">{fw.name}</div>
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {pickedFrameworks.size} selected — each will run as a separate AI audit.
            </div>
          </div>

          {/* Run progress */}
          {runs.length > 0 && (
            <div className="border border-slate-200 rounded-lg p-3 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Audit progress
              </div>
              {runs.map((r) => (
                <RunRow key={r.frameworkId} run={r} />
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isRunning}>
            {runs.length > 0 && !isRunning ? "Close" : "Cancel"}
          </Button>
          <Button
            onClick={runAudits}
            disabled={
              isRunning ||
              !effectiveProjectId ||
              pickedFrameworks.size === 0 ||
              readySources.length === 0
            }
            data-testid="audit-run-button"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running {runs.filter((r) => r.status === "done" || r.status === "error").length}/{runs.length}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Run {pickedFrameworks.size || ""} audit{pickedFrameworks.size === 1 ? "" : "s"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RunRow({ run }: { run: AuditRun }) {
  const pct = run.result?.compliancePercentage;
  const sum = run.result?.controlSummary;
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-5 flex-shrink-0">
        {run.status === "pending" && <span className="block w-2 h-2 rounded-full bg-slate-300 mx-auto" />}
        {run.status === "running" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        {run.status === "done" && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
        {run.status === "error" && <XCircle className="h-4 w-4 text-rose-600" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[11px] text-slate-500">{run.frameworkCode}</div>
        <div className="font-medium truncate">{run.frameworkName}</div>
        {run.status === "error" && (
          <div className="text-xs text-rose-600 truncate" title={run.error}>
            {run.error}
          </div>
        )}
      </div>
      {run.status === "done" && typeof pct === "number" && (
        <div className="text-right flex-shrink-0">
          <div className={`text-lg font-bold ${pct >= 80 ? "text-emerald-700" : pct >= 50 ? "text-amber-700" : "text-rose-700"}`}>
            {pct}%
          </div>
          {sum && (
            <div className="text-[10px] text-slate-500">
              {sum.met} met · {sum.partial} partial · {sum.gap} gap
            </div>
          )}
        </div>
      )}
    </div>
  );
}
