import { useMemo, useState } from "react";
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
  type WorkflowStepDef,
} from "@/lib/wave1-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Play,
  RefreshCw,
  X,
  GitBranch,
  Octagon,
  CheckCircle2,
  Clock,
  Hand,
  Sparkles,
  ArrowDown,
  ArrowUp,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// =============================================================
// Visual node palette — every step type is a clickable image
// (icon + colour). The user assembles a workflow purely by
// clicking and editing inline; no JSON is ever shown.
// =============================================================

type NodeType = WorkflowStepDef["type"];

const NODE_META: Record<NodeType, {
  label: string;
  icon: LucideIcon;
  colorBg: string;
  colorRing: string;
  colorText: string;
  blurb: string;
}> = {
  task: {
    label: "Task",
    icon: Clock,
    colorBg: "bg-sky-100",
    colorRing: "ring-sky-300",
    colorText: "text-sky-700",
    blurb: "Someone does work and ticks it complete.",
  },
  approval: {
    label: "Approval",
    icon: Hand,
    colorBg: "bg-purple-100",
    colorRing: "ring-purple-300",
    colorText: "text-purple-700",
    blurb: "Wait for an approver to sign off before moving on.",
  },
  ai_action: {
    label: "AI action",
    icon: Sparkles,
    colorBg: "bg-violet-100",
    colorRing: "ring-violet-300",
    colorText: "text-violet-700",
    blurb: "Run an AI step automatically (no human needed).",
  },
  branch: {
    label: "Branch",
    icon: GitBranch,
    colorBg: "bg-amber-100",
    colorRing: "ring-amber-300",
    colorText: "text-amber-700",
    blurb: "Send the run down a different path based on context.",
  },
  stop: {
    label: "Wait gate",
    icon: Octagon,
    colorBg: "bg-rose-100",
    colorRing: "ring-rose-300",
    colorText: "text-rose-700",
    blurb: "Pause until preconditions are met (evidence, RCA, …).",
  },
};

const RUN_STATUS_COLORS: Record<string, string> = {
  running: "bg-blue-100 text-blue-800",
  blocked: "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-slate-100 text-slate-500",
};

// -------------------------------------------------------------
// Wait-gate library — preset preconditions the user picks from
// (instead of typing JS expressions). Each entry maps to the
// expression+reason the engine actually evaluates, plus the
// context field the operator will later flip to true.
// -------------------------------------------------------------
const STOP_LIBRARY = [
  {
    id: "evidence",
    label: "Evidence document attached",
    expr: "context.evidenceAttached === true",
    reason: "Evidence document not attached",
    contextKey: "evidenceAttached",
    contextType: "boolean" as const,
  },
  {
    id: "rca",
    label: "Root-cause analysis completed",
    expr: "context.rcaCompleted === true",
    reason: "Root-cause analysis incomplete",
    contextKey: "rcaCompleted",
    contextType: "boolean" as const,
  },
  {
    id: "approval_received",
    label: "Approval received",
    expr: "context.approvalReceived === true",
    reason: "Approval not yet received",
    contextKey: "approvalReceived",
    contextType: "boolean" as const,
  },
  {
    id: "quality_signoff",
    label: "Quality sign-off",
    expr: "context.qualitySignoff === true",
    reason: "Quality sign-off pending",
    contextKey: "qualitySignoff",
    contextType: "boolean" as const,
  },
  {
    id: "ci_green",
    label: "CI build passing",
    expr: "context.ciGreen === true",
    reason: "CI is not yet green",
    contextKey: "ciGreen",
    contextType: "boolean" as const,
  },
  {
    id: "tests_passing",
    label: "Test suite passing",
    expr: "context.testsPassing === true",
    reason: "Test suite has failures",
    contextKey: "testsPassing",
    contextType: "boolean" as const,
  },
];

// -------------------------------------------------------------
// Branch library — preset “when context.X equals Y → goto”
// rules. Users pick a key, an option and a target node — never
// hand-write `context.severity === "high"`.
// -------------------------------------------------------------
const BRANCH_KEYS: Array<{
  key: string;
  label: string;
  options: string[];
}> = [
  {
    key: "severity",
    label: "Severity",
    options: ["critical", "high", "medium", "low"],
  },
  {
    key: "category",
    label: "Category",
    options: ["bug", "feature", "compliance", "security", "performance"],
  },
  {
    key: "environment",
    label: "Environment",
    options: ["production", "staging", "development"],
  },
];

// -------------------------------------------------------------
// Builder model — kept in local state, then serialised into the
// engine-friendly definition only at save time. The user never
// sees `id` or `goto` strings; we generate IDs and resolve
// goto-by-step-index for them.
// -------------------------------------------------------------
type DraftBranch = { keyId: string; value: string; gotoIndex: number };
type DraftNode = {
  uid: string;
  type: NodeType;
  name: string;
  assignee: string;
  dueOffsetDays: number | "";
  aiPrompt: string;
  branches: DraftBranch[];
  stopChecks: string[]; // ids from STOP_LIBRARY
};

function makeUid() {
  return Math.random().toString(36).slice(2, 9);
}

function newNode(type: NodeType): DraftNode {
  const defaults: Record<NodeType, string> = {
    task: "New task",
    approval: "New approval",
    ai_action: "AI step",
    branch: "Decision",
    stop: "Wait for…",
  };
  return {
    uid: makeUid(),
    type,
    name: defaults[type],
    assignee: "",
    dueOffsetDays: type === "task" ? 2 : "",
    aiPrompt: "",
    branches: [],
    stopChecks: type === "stop" ? ["evidence"] : [],
  };
}

function slugifyId(s: string, fallback: string) {
  const slug = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug || fallback;
}

function serialiseDraft(nodes: DraftNode[]): { steps: WorkflowStepDef[] } {
  // Assign deterministic ids first so branches can reference them.
  const ids = new Set<string>();
  const idForIndex: string[] = [];
  nodes.forEach((n, i) => {
    let base = slugifyId(n.name, `step-${i + 1}`);
    let candidate = base;
    let suffix = 2;
    while (ids.has(candidate)) candidate = `${base}-${suffix++}`;
    ids.add(candidate);
    idForIndex.push(candidate);
  });

  const steps: WorkflowStepDef[] = nodes.map((n, i) => {
    const base: WorkflowStepDef = { id: idForIndex[i]!, name: n.name.trim() || `Step ${i + 1}`, type: n.type };
    if (n.assignee.trim()) base.assignee = n.assignee.trim();
    if (typeof n.dueOffsetDays === "number" && n.dueOffsetDays > 0) base.dueOffsetDays = n.dueOffsetDays;
    if (n.type === "ai_action" && n.aiPrompt.trim()) base.aiPrompt = n.aiPrompt.trim();
    if (n.type === "branch" && n.branches.length > 0) {
      base.branches = n.branches
        .filter((b) => b.gotoIndex >= 0 && b.gotoIndex < nodes.length)
        .map((b) => {
          const meta = BRANCH_KEYS.find((k) => k.key === b.keyId)!;
          return {
            when: `context.${meta.key} === ${JSON.stringify(b.value)}`,
            goto: idForIndex[b.gotoIndex]!,
          };
        });
    }
    if (n.type === "stop" && n.stopChecks.length > 0) {
      base.blockedUntil = n.stopChecks
        .map((id) => STOP_LIBRARY.find((s) => s.id === id))
        .filter((x): x is (typeof STOP_LIBRARY)[number] => Boolean(x))
        .map((s) => ({ expr: s.expr, reason: s.reason }));
    }
    return base;
  });

  return { steps };
}

// =============================================================
// Page
// =============================================================
export default function Workflows() {
  const { projectId } = useProjectContext();
  const wfList = useWorkflows();
  const runs = useWorkflowRuns({ projectId });
  const create = useCreateWorkflow();
  const start = useStartRun();
  const cancel = useCancelRun();
  const { toast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [startWf, setStartWf] = useState<WorkflowRow | null>(null);

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Workflow Engine</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Design processes visually — drag in tasks, approvals, branches and wait-gates.
              No code, no JSON. Just click the icons that match the steps you need.
            </p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700" data-testid="new-workflow">
                <Plus className="mr-2 h-4 w-4" /> New workflow
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <VisualBuilder
                onSaved={() => setCreateOpen(false)}
                onCancel={() => setCreateOpen(false)}
                createMutation={create}
              />
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
                <div className="text-sm text-muted-foreground">No workflows yet — click <b>New workflow</b> to design one visually.</div>
              )}
              {wfList.data?.workflows.map((wf) => (
                <div key={wf.id} className="flex items-center justify-between gap-2 border rounded-md px-3 py-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{wf.name}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      {wf.definition.steps.slice(0, 8).map((s, i) => {
                        const meta = NODE_META[s.type as NodeType];
                        const Icon = meta.icon;
                        return (
                          <span
                            key={i}
                            title={`${meta.label}: ${s.name}`}
                            className={`h-5 w-5 rounded-md flex items-center justify-center ${meta.colorBg} ${meta.colorText}`}
                          >
                            <Icon className="h-3 w-3" />
                          </span>
                        );
                      })}
                      {wf.definition.steps.length > 8 && (
                        <span className="text-[10px] text-muted-foreground">+{wf.definition.steps.length - 8}</span>
                      )}
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
                    <button className="text-left flex-1 min-w-0" onClick={() => setActiveRunId(r.id)}>
                      <div className="text-sm font-medium truncate">{wf?.name ?? r.workflowId.slice(0, 8)}</div>
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

      {/* Start run — friendly form, not JSON */}
      <Dialog open={Boolean(startWf)} onOpenChange={(o) => !o && setStartWf(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start: {startWf?.name}</DialogTitle>
            <DialogDescription>
              Set the starting context for this run. Only the values your workflow actually
              references are shown.
            </DialogDescription>
          </DialogHeader>
          {startWf && (
            <ContextForm
              workflow={startWf}
              submitLabel={start.isPending ? "Starting…" : "Start run"}
              disabled={start.isPending}
              onSubmit={async (ctx) => {
                try {
                  const res = await start.mutateAsync({ workflowId: startWf.id, projectId: projectId ?? undefined, context: ctx });
                  toast({ title: `Run started — current step: ${res.currentStep?.name ?? "(complete)"}` });
                  setStartWf(null);
                  setActiveRunId(res.run.id);
                } catch (err: any) {
                  toast({ title: "Could not start run", description: err.message, variant: "destructive" });
                }
              }}
            />
          )}
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

// =============================================================
// VisualBuilder — palette + node list + per-node inline editor
// =============================================================
function VisualBuilder({
  onSaved,
  onCancel,
  createMutation,
}: {
  onSaved: () => void;
  onCancel: () => void;
  createMutation: ReturnType<typeof useCreateWorkflow>;
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nodes, setNodes] = useState<DraftNode[]>([
    { ...newNode("task"), name: "Initial review", assignee: "Quality Lead" },
  ]);

  function addNode(type: NodeType) {
    setNodes((xs) => [...xs, newNode(type)]);
  }
  function update(uid: string, patch: Partial<DraftNode>) {
    setNodes((xs) => xs.map((n) => (n.uid === uid ? { ...n, ...patch } : n)));
  }
  function move(uid: string, dir: -1 | 1) {
    setNodes((xs) => {
      const i = xs.findIndex((n) => n.uid === uid);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= xs.length) return xs;
      const copy = [...xs];
      [copy[i], copy[j]] = [copy[j]!, copy[i]!];
      return copy;
    });
  }
  function remove(uid: string) {
    setNodes((xs) => xs.filter((n) => n.uid !== uid));
  }

  async function save() {
    if (!name.trim()) {
      toast({ title: "Give your workflow a name first", variant: "destructive" });
      return;
    }
    if (nodes.length === 0) {
      toast({ title: "Add at least one step", variant: "destructive" });
      return;
    }
    const def = serialiseDraft(nodes);
    try {
      await createMutation.mutateAsync({ name: name.trim(), description: description.trim(), definition: def });
      toast({ title: "Workflow saved" });
      onSaved();
    } catch (err: any) {
      toast({ title: "Could not save workflow", description: err.message, variant: "destructive" });
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Design a workflow</DialogTitle>
        <DialogDescription>Click an icon to add a step. Edit the fields inline. No code required.</DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
        {/* Left: name + palette */}
        <div className="md:col-span-1 space-y-3">
          <div>
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. CAPA approval" data-testid="wf-name" />
          </div>
          <div>
            <Label className="text-xs">Short description (optional)</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this workflow handles" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Add a step</Label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {(Object.keys(NODE_META) as NodeType[]).map((t) => {
                const m = NODE_META[t];
                const Icon = m.icon;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => addNode(t)}
                    className={`group flex flex-col items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-3 hover:border-slate-300 hover:shadow-sm transition`}
                    data-testid={`palette-${t}`}
                  >
                    <span className={`h-10 w-10 rounded-xl flex items-center justify-center ${m.colorBg} ${m.colorText} ring-1 ring-inset ${m.colorRing}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-medium text-slate-800">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="text-[11px] text-muted-foreground border-t pt-2">
            Tip: use <span className="font-medium">Branch</span> to send the run down a different
            path (e.g. when severity is critical) and <span className="font-medium">Wait gate</span>
            to pause until evidence or approvals are in.
          </div>
        </div>

        {/* Right: node stack */}
        <div className="md:col-span-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Steps (top → bottom)</Label>
          <div className="mt-2 space-y-2">
            {nodes.length === 0 && (
              <div className="text-sm text-muted-foreground border border-dashed rounded-md p-6 text-center">
                Click an icon on the left to add your first step.
              </div>
            )}
            {nodes.map((node, idx) => (
              <NodeEditor
                key={node.uid}
                node={node}
                idx={idx}
                allNodes={nodes}
                onChange={(p) => update(node.uid, p)}
                onMove={(d) => move(node.uid, d)}
                onRemove={() => remove(node.uid)}
              />
            ))}
          </div>
        </div>
      </div>

      <DialogFooter className="mt-4">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={save} disabled={createMutation.isPending} data-testid="wf-save">
          {createMutation.isPending ? "Saving…" : "Save workflow"}
        </Button>
      </DialogFooter>
    </>
  );
}

// =============================================================
// NodeEditor — inline editor for a single draft node
// =============================================================
function NodeEditor({
  node,
  idx,
  allNodes,
  onChange,
  onMove,
  onRemove,
}: {
  node: DraftNode;
  idx: number;
  allNodes: DraftNode[];
  onChange: (p: Partial<DraftNode>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const meta = NODE_META[node.type];
  const Icon = meta.icon;

  return (
    <div className={`rounded-lg border bg-white p-3 ${meta.colorRing} ring-1 ring-inset`}>
      <div className="flex items-start gap-3">
        <span className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${meta.colorBg} ${meta.colorText}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-center gap-2">
            <Input
              value={node.name}
              onChange={(e) => onChange({ name: e.target.value })}
              className="font-medium"
              placeholder={`${meta.label} name`}
            />
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground shrink-0">{meta.label}</span>
          </div>

          {(node.type === "task" || node.type === "approval") && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px] text-muted-foreground">Assignee</Label>
                <Input
                  value={node.assignee}
                  onChange={(e) => onChange({ assignee: e.target.value })}
                  placeholder="e.g. Quality Lead"
                />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Due in (days)</Label>
                <Input
                  type="number"
                  min={0}
                  value={node.dueOffsetDays === "" ? "" : String(node.dueOffsetDays)}
                  onChange={(e) =>
                    onChange({ dueOffsetDays: e.target.value === "" ? "" : Math.max(0, Number(e.target.value)) })
                  }
                  placeholder="2"
                />
              </div>
            </div>
          )}

          {node.type === "ai_action" && (
            <div>
              <Label className="text-[11px] text-muted-foreground">What should the AI do?</Label>
              <Input
                value={node.aiPrompt}
                onChange={(e) => onChange({ aiPrompt: e.target.value })}
                placeholder="e.g. Summarise the latest test report"
              />
            </div>
          )}

          {node.type === "branch" && (
            <BranchEditor node={node} idx={idx} allNodes={allNodes} onChange={onChange} />
          )}

          {node.type === "stop" && (
            <StopEditor node={node} onChange={onChange} />
          )}
        </div>

        <div className="flex flex-col gap-1 shrink-0">
          <Button variant="ghost" size="icon" onClick={() => onMove(-1)} title="Move up" disabled={idx === 0}>
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onMove(1)} title="Move down" disabled={idx === allNodes.length - 1}>
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onRemove} title="Remove">
            <Trash2 className="h-4 w-4 text-rose-500" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function BranchEditor({
  node,
  idx,
  allNodes,
  onChange,
}: {
  node: DraftNode;
  idx: number;
  allNodes: DraftNode[];
  onChange: (p: Partial<DraftNode>) => void;
}) {
  function addRule() {
    const fallbackGoto = allNodes.findIndex((_, i) => i !== idx);
    onChange({
      branches: [
        ...node.branches,
        { keyId: BRANCH_KEYS[0]!.key, value: BRANCH_KEYS[0]!.options[0]!, gotoIndex: Math.max(0, fallbackGoto) },
      ],
    });
  }
  function update(i: number, patch: Partial<DraftBranch>) {
    onChange({ branches: node.branches.map((b, j) => (j === i ? { ...b, ...patch } : b)) });
  }
  function remove(i: number) {
    onChange({ branches: node.branches.filter((_, j) => j !== i) });
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] text-muted-foreground">Routing rules</Label>
      {node.branches.length === 0 && (
        <div className="text-xs text-muted-foreground italic">No rules yet — falls through to next step.</div>
      )}
      {node.branches.map((b, i) => {
        const meta = BRANCH_KEYS.find((k) => k.key === b.keyId)!;
        return (
          <div key={i} className="flex flex-wrap items-center gap-1.5 text-xs bg-amber-50/60 border border-amber-200 rounded-md px-2 py-1.5">
            <span className="text-muted-foreground">When</span>
            <Select value={b.keyId} onValueChange={(v) => {
              const m = BRANCH_KEYS.find((k) => k.key === v)!;
              update(i, { keyId: v, value: m.options[0]! });
            }}>
              <SelectTrigger className="h-7 w-[120px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {BRANCH_KEYS.map((k) => <SelectItem key={k.key} value={k.key}>{k.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">is</span>
            <Select value={b.value} onValueChange={(v) => update(i, { value: v })}>
              <SelectTrigger className="h-7 w-[120px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {meta.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">→ go to</span>
            <Select
              value={String(b.gotoIndex)}
              onValueChange={(v) => update(i, { gotoIndex: Number(v) })}
            >
              <SelectTrigger className="h-7 min-w-[140px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {allNodes.map((n, j) => (
                  <SelectItem key={n.uid} value={String(j)} disabled={j === idx}>
                    {j + 1}. {n.name || NODE_META[n.type].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => remove(i)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        );
      })}
      <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={addRule}>
        <Plus className="h-3 w-3 mr-1" /> Add rule
      </Button>
    </div>
  );
}

function StopEditor({ node, onChange }: { node: DraftNode; onChange: (p: Partial<DraftNode>) => void }) {
  function toggle(id: string, on: boolean) {
    const next = on ? [...new Set([...node.stopChecks, id])] : node.stopChecks.filter((x) => x !== id);
    onChange({ stopChecks: next });
  }
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] text-muted-foreground">Wait until ALL of these are true</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {STOP_LIBRARY.map((s) => {
          const on = node.stopChecks.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => toggle(s.id, !on)}
              className={`text-left text-xs rounded-md border px-2 py-1.5 transition ${
                on ? "bg-rose-50 border-rose-300 text-rose-900" : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
              }`}
            >
              <span className="inline-block h-3 w-3 rounded-sm align-middle mr-1.5" style={{ background: on ? "currentColor" : "transparent", border: on ? "none" : "1px solid #cbd5e1" }} />
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================
// Context form — derives required fields from the workflow's
// branch / stop expressions, then renders proper inputs
// (boolean = Switch, enum = Select). No JSON shown to the user.
// =============================================================
type CtxField = {
  key: string;
  kind: "boolean" | "enum" | "text";
  label: string;
  options?: string[];
};

function deriveFields(workflow: WorkflowRow): CtxField[] {
  const fields = new Map<string, CtxField>();

  for (const step of workflow.definition.steps) {
    if (step.type === "branch" && step.branches) {
      for (const b of step.branches) {
        // Match patterns like:  context.<key> === "<value>"  or  context.<key>===<number>
        const m = b.when.match(/context\.(\w+)\s*===?\s*("([^"]*)"|'([^']*)'|true|false|\d+)/);
        if (!m) continue;
        const key = m[1]!;
        const lit = m[2]!;
        const valueStr = lit.startsWith('"') || lit.startsWith("'") ? lit.slice(1, -1) : lit;
        const known = BRANCH_KEYS.find((k) => k.key === key);
        if (known) {
          const existing = fields.get(key);
          const opts = new Set([...(existing?.options ?? known.options), valueStr]);
          fields.set(key, { key, kind: "enum", label: known.label, options: Array.from(opts) });
        } else if (lit === "true" || lit === "false") {
          fields.set(key, { key, kind: "boolean", label: humaniseKey(key) });
        } else {
          const existing = fields.get(key);
          const opts = new Set([...(existing?.options ?? []), valueStr]);
          fields.set(key, { key, kind: "enum", label: humaniseKey(key), options: Array.from(opts) });
        }
      }
    }
    if (step.type === "stop" && step.blockedUntil) {
      for (const p of step.blockedUntil) {
        const known = STOP_LIBRARY.find((s) => s.expr === p.expr);
        if (known) {
          fields.set(known.contextKey, { key: known.contextKey, kind: "boolean", label: known.label });
        } else {
          // Unknown expression — surface the referenced key as a text field so it can still be set.
          const m = p.expr.match(/context\.(\w+)/);
          if (m) fields.set(m[1]!, { key: m[1]!, kind: "text", label: humaniseKey(m[1]!) });
        }
      }
    }
  }
  return Array.from(fields.values());
}

function humaniseKey(k: string) {
  return k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

function ContextForm({
  workflow,
  initial,
  onlyKeys,
  submitLabel,
  disabled,
  onSubmit,
}: {
  workflow: WorkflowRow;
  initial?: Record<string, unknown>;
  onlyKeys?: string[]; // when set, only render these fields (used by RunDetail)
  submitLabel: string;
  disabled?: boolean;
  onSubmit: (ctx: Record<string, unknown>) => void;
}) {
  const allFields = useMemo(() => deriveFields(workflow), [workflow]);
  const fields = useMemo(
    () => (onlyKeys ? allFields.filter((f) => onlyKeys.includes(f.key)) : allFields),
    [allFields, onlyKeys],
  );

  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const seed: Record<string, unknown> = { ...(initial ?? {}) };
    for (const f of fields) {
      if (seed[f.key] === undefined) {
        if (f.kind === "boolean") seed[f.key] = false;
        else if (f.kind === "enum") seed[f.key] = f.options?.[0] ?? "";
        else seed[f.key] = "";
      }
    }
    return seed;
  });

  if (fields.length === 0) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-muted-foreground">
          This workflow doesn't reference any context — just hit the button to {submitLabel.toLowerCase()}.
        </div>
        <DialogFooter>
          <Button onClick={() => onSubmit({})} disabled={disabled}>{submitLabel}</Button>
        </DialogFooter>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2.5">
        {fields.map((f) => (
          <div key={f.key} className="flex items-center justify-between gap-3 border rounded-md px-3 py-2">
            <Label htmlFor={`ctx-${f.key}`} className="text-sm font-medium">{f.label}</Label>
            {f.kind === "boolean" && (
              <Switch
                id={`ctx-${f.key}`}
                checked={Boolean(values[f.key])}
                onCheckedChange={(v) => setValues({ ...values, [f.key]: v })}
                data-testid={`ctx-${f.key}`}
              />
            )}
            {f.kind === "enum" && (
              <Select
                value={String(values[f.key] ?? "")}
                onValueChange={(v) => setValues({ ...values, [f.key]: v })}
              >
                <SelectTrigger className="h-8 w-[180px] text-sm" id={`ctx-${f.key}`}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(f.options ?? []).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {f.kind === "text" && (
              <Input
                id={`ctx-${f.key}`}
                value={String(values[f.key] ?? "")}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                className="h-8 w-[220px] text-sm"
              />
            )}
          </div>
        ))}
      </div>
      <DialogFooter>
        <Button onClick={() => onSubmit(values)} disabled={disabled} data-testid="ctx-submit">{submitLabel}</Button>
      </DialogFooter>
    </div>
  );
}

// =============================================================
// RunDetail — uses the same friendly form for unblocking /
// advancing. No JSON anywhere.
// =============================================================
function RunDetail({ runId }: { runId: string }) {
  const { data, isLoading } = useWorkflowRun(runId);
  const advance = useAdvanceRun();
  const recheck = useRecheckRun();
  const { toast } = useToast();

  if (isLoading || !data) return <div className="p-4 text-sm">Loading run…</div>;
  const { run, stepRuns, workflow } = data;
  const currentStep = workflow?.definition.steps.find((s) => s.id === run.currentStepId);

  // For blocked runs, show only the keys referenced by the current stop step.
  // For running runs, show only keys referenced by the next branch step (so the
  // operator can steer routing) — fall back to all if none.
  let onlyKeys: string[] | undefined;
  if (currentStep?.type === "stop" && currentStep.blockedUntil) {
    onlyKeys = currentStep.blockedUntil
      .map((p) => p.expr.match(/context\.(\w+)/)?.[1])
      .filter((k): k is string => Boolean(k));
  } else if (currentStep?.type === "branch" && currentStep.branches) {
    onlyKeys = currentStep.branches
      .map((b) => b.when.match(/context\.(\w+)/)?.[1])
      .filter((k): k is string => Boolean(k));
  }

  const initial = (run.context ?? {}) as Record<string, unknown>;

  function submit(action: "advance" | "recheck", ctx: Record<string, unknown>) {
    if (action === "advance") {
      advance.mutate(
        { runId, contextPatch: ctx },
        {
          onSuccess: (res) => toast({ title: `Run ${res.run.status}`, description: res.currentStep?.name ?? "completed" }),
          onError: (e: any) => toast({ title: "Advance failed", description: e.message, variant: "destructive" }),
        },
      );
    } else {
      recheck.mutate(
        { runId, contextPatch: ctx },
        {
          onSuccess: (res) =>
            toast({
              title: res.run.status === "blocked" ? "Still blocked" : `Unblocked → ${res.currentStep?.name ?? "complete"}`,
              description: res.blockedReason ?? undefined,
            }),
        },
      );
    }
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>{workflow?.name ?? "Run"}</SheetTitle>
      </SheetHeader>
      <div className="space-y-4 mt-4">
        <div className="flex items-center gap-2 flex-wrap">
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
          <div className="text-xs uppercase text-muted-foreground mb-1.5">Step trail</div>
          <div className="space-y-1.5">
            {stepRuns.map((s) => {
              const meta = NODE_META[s.stepType as NodeType];
              const Icon = meta?.icon ?? Clock;
              return (
                <div key={s.id} className="flex items-center gap-2 border rounded px-2 py-1.5 text-sm">
                  <span className={`h-6 w-6 rounded-md flex items-center justify-center ${meta?.colorBg ?? "bg-slate-100"} ${meta?.colorText ?? "text-slate-700"}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="flex-1">
                    {s.stepName}
                    {s.assignee && <span className="text-xs text-muted-foreground"> · {s.assignee}</span>}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {s.status === "done" ? <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" /> : null}
                    {s.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        {(run.status === "running" || run.status === "blocked") && workflow && (
          <div className="border rounded-md p-3 bg-slate-50 space-y-2">
            <div className="text-xs text-muted-foreground">
              {run.status === "blocked"
                ? "Flip the switches once each precondition is met, then re-check."
                : "Confirm the values for the current step, then advance."}
            </div>
            <ContextForm
              workflow={workflow}
              initial={initial}
              onlyKeys={onlyKeys}
              submitLabel={
                run.status === "blocked"
                  ? recheck.isPending ? "Re-checking…" : "Re-check blockers"
                  : advance.isPending ? "Advancing…" : "Complete step & advance"
              }
              disabled={recheck.isPending || advance.isPending}
              onSubmit={(ctx) => submit(run.status === "blocked" ? "recheck" : "advance", ctx)}
            />
          </div>
        )}
      </div>
    </>
  );
}
