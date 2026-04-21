import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useProjectContext } from "@/lib/project-context";
import {
  useWorkflows,
  useWorkflowRuns,
  useWorkflowRun,
  useCreateWorkflow,
  useStartRun,
  useAdvanceRun,
  useRecheckRun,
  useCancelRun,
  type WorkflowRow,
  type WorkflowRunRow,
  type WorkflowStepDef,
} from "@/lib/wave1-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Plus, Play, RefreshCw, X, GitBranch, Octagon, CheckCircle2, Clock, Hand } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const RUN_STATUS_COLORS: Record<string, string> = {
  running: "bg-blue-100 text-blue-800",
  blocked: "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-slate-100 text-slate-500",
};

const STEP_ICONS: Record<string, JSX.Element> = {
  task: <Clock className="h-4 w-4" />,
  approval: <Hand className="h-4 w-4" />,
  ai_action: <RefreshCw className="h-4 w-4" />,
  branch: <GitBranch className="h-4 w-4" />,
  stop: <Octagon className="h-4 w-4" />,
};

const STARTER_DEFINITION: WorkflowStepDef[] = [
  { id: "review", name: "Initial review", type: "task", assignee: "Quality Lead", dueOffsetDays: 2 },
  {
    id: "branch",
    name: "Severity routing",
    type: "branch",
    branches: [
      { when: 'context.severity === "critical"', goto: "approval" },
      { when: 'context.severity === "high"', goto: "evidence" },
    ],
  },
  { id: "approval", name: "Director approval (critical)", type: "approval", assignee: "Director of Quality" },
  {
    id: "evidence",
    name: "Wait for evidence",
    type: "stop",
    blockedUntil: [
      { expr: "context.evidenceAttached === true", reason: "Evidence document not attached" },
      { expr: "context.rcaCompleted === true", reason: "Root-cause analysis incomplete" },
    ],
  },
  { id: "implement", name: "Implement fix", type: "task", assignee: "Engineering", dueOffsetDays: 7 },
  { id: "verify", name: "Verify & close", type: "task", assignee: "Quality Lead", dueOffsetDays: 3 },
];

export default function Workflows() {
  const { projectId } = useProjectContext();
  const wfList = useWorkflows();
  const runs = useWorkflowRuns({ projectId });
  const create = useCreateWorkflow();
  const start = useStartRun();
  const cancel = useCancelRun();
  const { toast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", definition: JSON.stringify({ steps: STARTER_DEFINITION }, null, 2) });
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [startWf, setStartWf] = useState<WorkflowRow | null>(null);
  const [startCtx, setStartCtx] = useState('{"severity":"high"}');

  async function handleCreate() {
    let parsed: { steps: WorkflowStepDef[] };
    try {
      parsed = JSON.parse(form.definition);
    } catch {
      toast({ title: "Definition is not valid JSON", variant: "destructive" });
      return;
    }
    try {
      await create.mutateAsync({ name: form.name, description: form.description, definition: parsed });
      toast({ title: "Workflow saved" });
      setCreateOpen(false);
      setForm({ name: "", description: "", definition: form.definition });
    } catch (err: any) {
      toast({ title: "Could not save workflow", description: err.message, variant: "destructive" });
    }
  }

  async function handleStart() {
    if (!startWf) return;
    let ctx: Record<string, unknown> = {};
    try {
      ctx = JSON.parse(startCtx || "{}");
    } catch {
      toast({ title: "Context must be valid JSON", variant: "destructive" });
      return;
    }
    try {
      const res = await start.mutateAsync({ workflowId: startWf.id, projectId: projectId ?? undefined, context: ctx });
      toast({ title: `Run started — current step: ${res.currentStep?.name ?? "(complete)"}` });
      setStartWf(null);
      setActiveRunId(res.run.id);
    } catch (err: any) {
      toast({ title: "Could not start run", description: err.message, variant: "destructive" });
    }
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Workflow Engine</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Build process templates with conditional logic, approval gates, and stop tasks. Steps advance only when their predicates resolve to true.
            </p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="mr-2 h-4 w-4" /> New workflow
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create workflow</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input placeholder="Short description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <div className="text-xs text-muted-foreground">
                  Step types: <code>task</code>, <code>approval</code>, <code>ai_action</code>, <code>branch</code> (with <code>branches</code>), <code>stop</code> (with <code>blockedUntil</code>). Conditions reference <code>context.&lt;key&gt;</code>.
                </div>
                <Textarea
                  className="font-mono text-xs"
                  rows={18}
                  value={form.definition}
                  onChange={(e) => setForm({ ...form, definition: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={create.isPending}>
                  {create.isPending ? "Saving…" : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Workflow library</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {wfList.isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
              {wfList.data?.workflows.length === 0 && (
                <div className="text-sm text-muted-foreground">No workflows yet — create your first.</div>
              )}
              {wfList.data?.workflows.map((wf) => (
                <div key={wf.id} className="flex items-center justify-between gap-2 border rounded-md px-3 py-2">
                  <div>
                    <div className="text-sm font-medium">{wf.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {wf.definition.steps.length} steps · v{wf.version} · trigger: {wf.trigger}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setStartWf(wf)}>
                    <Play className="mr-1 h-3 w-3" /> Start run
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent runs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {runs.isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
              {runs.data?.runs.length === 0 && <div className="text-sm text-muted-foreground">No runs yet.</div>}
              {runs.data?.runs.slice(0, 12).map((r) => {
                const wf = wfList.data?.workflows.find((w) => w.id === r.workflowId);
                return (
                  <div key={r.id} className="flex items-center justify-between gap-2 border rounded-md px-3 py-2">
                    <button className="text-left flex-1" onClick={() => setActiveRunId(r.id)}>
                      <div className="text-sm font-medium">{wf?.name ?? r.workflowId.slice(0, 8)}</div>
                      <div className="text-xs text-muted-foreground">
                        Started {new Date(r.startedAt).toLocaleString()} by {r.startedBy}
                      </div>
                    </button>
                    <Badge className={RUN_STATUS_COLORS[r.status] ?? "bg-slate-100"} variant="outline">
                      {r.status}
                    </Badge>
                    {r.status !== "completed" && r.status !== "cancelled" && (
                      <Button variant="ghost" size="icon" onClick={() => cancel.mutate(r.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Start run dialog */}
      <Dialog open={Boolean(startWf)} onOpenChange={(o) => !o && setStartWf(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start: {startWf?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              Initial context (JSON). Conditions in branches and stop tasks reference these values.
            </div>
            <Textarea className="font-mono text-xs" rows={6} value={startCtx} onChange={(e) => setStartCtx(e.target.value)} />
          </div>
          <DialogFooter>
            <Button onClick={handleStart} disabled={start.isPending}>
              {start.isPending ? "Starting…" : "Start"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Run detail */}
      <Sheet open={Boolean(activeRunId)} onOpenChange={(o) => !o && setActiveRunId(null)}>
        <SheetContent side="right" className="sm:max-w-2xl w-full overflow-y-auto">
          {activeRunId && <RunDetail runId={activeRunId} />}
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}

function RunDetail({ runId }: { runId: string }) {
  const { data, isLoading } = useWorkflowRun(runId);
  const advance = useAdvanceRun();
  const recheck = useRecheckRun();
  const { toast } = useToast();
  const [patch, setPatch] = useState("{}");

  if (isLoading || !data) return <div className="p-4 text-sm">Loading run…</div>;
  const { run, stepRuns, workflow } = data;
  const currentStep = workflow?.definition.steps.find((s) => s.id === run.currentStepId);

  function applyPatch(action: "advance" | "recheck") {
    let parsed: Record<string, unknown> = {};
    try {
      parsed = patch ? JSON.parse(patch) : {};
    } catch {
      toast({ title: "Patch must be valid JSON", variant: "destructive" });
      return;
    }
    if (action === "advance") {
      advance.mutate(
        { runId, contextPatch: parsed },
        {
          onSuccess: (res) =>
            toast({ title: `Run ${res.run.status}`, description: res.currentStep?.name ?? "completed" }),
          onError: (e: any) => toast({ title: "Advance failed", description: e.message, variant: "destructive" }),
        },
      );
    } else {
      recheck.mutate(
        { runId, contextPatch: parsed },
        {
          onSuccess: (res) =>
            toast({
              title: res.run.status === "blocked" ? "Still blocked" : `Unblocked → ${res.currentStep?.name ?? "complete"}`,
              description: res.blockedReason ?? undefined,
            }),
        },
      );
    }
    setPatch("{}");
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>{workflow?.name ?? "Run"}</SheetTitle>
      </SheetHeader>
      <div className="space-y-4 mt-4">
        <div className="flex items-center gap-2">
          <Badge className={RUN_STATUS_COLORS[run.status] ?? "bg-slate-100"} variant="outline">
            {run.status}
          </Badge>
          {currentStep && (
            <span className="text-sm text-muted-foreground">
              · current step: <span className="font-medium text-foreground">{currentStep.name}</span>
            </span>
          )}
          {run.blockedReason && (
            <span className="text-xs text-amber-700 ml-auto">{run.blockedReason}</span>
          )}
        </div>

        <div>
          <div className="text-xs uppercase text-muted-foreground mb-1">Context</div>
          <pre className="text-xs bg-slate-50 border rounded p-2 overflow-x-auto">
            {JSON.stringify(run.context, null, 2)}
          </pre>
        </div>

        <div>
          <div className="text-xs uppercase text-muted-foreground mb-1">Step trail</div>
          <div className="space-y-1.5">
            {stepRuns.map((s) => (
              <div key={s.id} className="flex items-center gap-2 border rounded px-2 py-1.5 text-sm">
                <span className="text-muted-foreground">{STEP_ICONS[s.stepType] ?? null}</span>
                <span className="flex-1">
                  {s.stepName}
                  {s.assignee && <span className="text-xs text-muted-foreground"> · {s.assignee}</span>}
                </span>
                <Badge variant="outline" className="text-xs">
                  {s.status === "done" ? <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" /> : null}
                  {s.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {(run.status === "running" || run.status === "blocked") && (
          <div className="border rounded-md p-3 space-y-2 bg-slate-50">
            <div className="text-xs text-muted-foreground">
              Patch context (JSON) and {run.status === "blocked" ? "recheck blockers" : "complete the current step"}.
            </div>
            <Textarea className="font-mono text-xs" rows={4} value={patch} onChange={(e) => setPatch(e.target.value)} />
            <div className="flex gap-2">
              {run.status === "blocked" ? (
                <Button size="sm" onClick={() => applyPatch("recheck")} disabled={recheck.isPending}>
                  Recheck blockers
                </Button>
              ) : (
                <Button size="sm" onClick={() => applyPatch("advance")} disabled={advance.isPending}>
                  Complete step & advance
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
