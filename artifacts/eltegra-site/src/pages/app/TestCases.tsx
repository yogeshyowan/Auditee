import { useState, useMemo } from "react";
import { useProjectContext } from "@/lib/project-context";
import { useListRequirements } from "@workspace/api-client-react";
import {
  useTestCases,
  useCreateTestCase,
  useUpdateTestCase,
  useDeleteTestCase,
  useRunTestCase,
  useGenerateTestCases,
  type TestCase,
} from "@/lib/test-cases-api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Beaker, Sparkles, Plus, Loader2, CheckCircle2, XCircle, AlertCircle, Trash2, Pencil, PlayCircle } from "lucide-react";
import { format } from "date-fns";

const STATUS_META: Record<TestCase["status"], { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  draft: { label: "Draft", cls: "bg-slate-100 text-slate-700 border-slate-300", icon: AlertCircle },
  passing: { label: "Passing", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  failing: { label: "Failing", cls: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircle },
  blocked: { label: "Blocked", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: AlertCircle },
};

const TYPE_LABEL: Record<TestCase["type"], string> = {
  functional: "Functional",
  negative: "Negative",
  non_functional: "Non-functional",
  acceptance: "Acceptance",
};

export default function TestCasesPage() {
  const { projectId } = useProjectContext();
  const { data: requirements } = useListRequirements(projectId ? ({ projectId } as any) : ({} as any));
  const { data, isLoading } = useTestCases(projectId ?? null);
  const generateMut = useGenerateTestCases(projectId ?? "");
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [requirementFilter, setRequirementFilter] = useState<string>("all");
  const [generateReqId, setGenerateReqId] = useState<string>("");

  const reqById = useMemo(
    () => new Map((requirements ?? []).map((r) => [r.id, r] as const)),
    [requirements],
  );

  const filtered = useMemo(() => {
    const list = data?.testCases ?? [];
    return list.filter((tc) => {
      if (statusFilter !== "all" && tc.status !== statusFilter) return false;
      if (typeFilter !== "all" && tc.type !== typeFilter) return false;
      if (requirementFilter !== "all" && tc.requirementId !== requirementFilter) return false;
      return true;
    });
  }, [data, statusFilter, typeFilter, requirementFilter]);

  const summary = useMemo(() => {
    const list = data?.testCases ?? [];
    return {
      total: list.length,
      passing: list.filter((t) => t.status === "passing").length,
      failing: list.filter((t) => t.status === "failing").length,
      blocked: list.filter((t) => t.status === "blocked").length,
      draft: list.filter((t) => t.status === "draft").length,
    };
  }, [data]);

  const onGenerate = () => {
    if (!generateReqId) {
      toast({ title: "Pick a requirement first", variant: "destructive" });
      return;
    }
    generateMut.mutate(generateReqId, {
      onSuccess: (d) => {
        toast({ title: `Generated ${d.count} test case(s)` });
        setGenerateReqId("");
      },
      onError: (e: Error) => toast({ title: "Generation failed", description: e.message, variant: "destructive" }),
    });
  };

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-950 flex items-center gap-2">
            <Beaker className="text-primary" />
            Test Cases
          </h1>
          <p className="text-slate-600 mt-2 max-w-2xl">
            Author, generate and run test cases linked to your requirements. AI can draft a complete suite for any single requirement in one click.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NewTestCaseDialog projectId={projectId ?? null} requirements={requirements ?? []} />
        </div>
      </header>

      {!projectId ? (
        <Card className="rounded-xl border-amber-200 bg-amber-50">
          <CardContent className="py-4 text-sm text-amber-900">
            Select a project to view its test cases.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <SummaryCard label="Total" value={summary.total} />
            <SummaryCard label="Passing" value={summary.passing} tone="emerald" />
            <SummaryCard label="Failing" value={summary.failing} tone="rose" />
            <SummaryCard label="Blocked" value={summary.blocked} tone="amber" />
            <SummaryCard label="Draft" value={summary.draft} tone="slate" />
          </div>

          <Card className="rounded-xl border-slate-200">
            <CardHeader>
              <CardTitle className="text-base font-[Inter_Tight] flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Generate test cases for a requirement
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1 min-w-[260px]">
                <Select value={generateReqId} onValueChange={setGenerateReqId}>
                  <SelectTrigger data-testid="select-generate-req">
                    <SelectValue placeholder="Pick a requirement…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(requirements ?? []).map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.code} — {r.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={onGenerate}
                disabled={!generateReqId || generateMut.isPending}
                className="gap-2 min-w-[180px]"
                data-testid="button-generate-test-cases"
              >
                {generateMut.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Generate suite</>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-slate-200">
            <CardHeader className="flex-row items-center justify-between gap-3 flex-wrap space-y-0">
              <CardTitle className="font-[Inter_Tight] text-base">All test cases</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="passing">Passing</SelectItem>
                    <SelectItem value="failing">Failing</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="functional">Functional</SelectItem>
                    <SelectItem value="negative">Negative</SelectItem>
                    <SelectItem value="non_functional">Non-functional</SelectItem>
                    <SelectItem value="acceptance">Acceptance</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={requirementFilter} onValueChange={setRequirementFilter}>
                  <SelectTrigger className="w-[200px] h-8 text-xs"><SelectValue placeholder="Requirement" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All requirements</SelectItem>
                    {(requirements ?? []).map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6"><Skeleton className="h-32 w-full" /></div>
              ) : filtered.length === 0 ? (
                <div className="text-sm text-slate-500 py-12 text-center">
                  No test cases match the current filters.
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {filtered.map((tc) => (
                    <TestCaseRow
                      key={tc.id}
                      tc={tc}
                      reqLabel={tc.requirementId ? reqById.get(tc.requirementId)?.code ?? null : null}
                      projectId={projectId}
                    />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone?: string }) {
  const cls =
    tone === "emerald" ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : tone === "rose" ? "text-rose-700 bg-rose-50 border-rose-200"
    : tone === "amber" ? "text-amber-700 bg-amber-50 border-amber-200"
    : tone === "slate" ? "text-slate-600 bg-slate-50 border-slate-200"
    : "text-primary bg-primary/5 border-primary/20";
  return (
    <div className={`border rounded-lg p-3 ${cls}`}>
      <div className="text-xs uppercase tracking-wider opacity-80">{label}</div>
      <div className="text-2xl font-bold tabular-nums mt-1">{value}</div>
    </div>
  );
}

function TestCaseRow({
  tc,
  reqLabel,
  projectId,
}: {
  tc: TestCase;
  reqLabel: string | null;
  projectId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const runMut = useRunTestCase(projectId);
  const delMut = useDeleteTestCase(projectId);
  const { toast } = useToast();
  const meta = STATUS_META[tc.status];
  const StatusIcon = meta.icon;

  const run = (status: "passing" | "failing" | "blocked") => {
    runMut.mutate(
      { id: tc.id, status, note: "" },
      {
        onSuccess: () => toast({ title: `Marked ${status}` }),
        onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
      },
    );
  };

  return (
    <li className="px-4 py-3" data-testid={`test-case-row-${tc.id}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`${meta.cls} border inline-flex items-center gap-1 text-[10px]`}>
              <StatusIcon className="h-3 w-3" /> {meta.label}
            </Badge>
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">{TYPE_LABEL[tc.type]}</span>
            {reqLabel && (
              <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">{reqLabel}</span>
            )}
            {tc.tags.includes("ai-generated") && (
              <span className="text-[10px] uppercase tracking-wider text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5" /> AI
              </span>
            )}
            {tc.lastRunAt && (
              <span className="text-[10px] text-slate-400">last run: {format(new Date(tc.lastRunAt), "MMM d HH:mm")}</span>
            )}
          </div>
          <button
            className="text-left text-sm font-medium text-slate-900 mt-1 hover:underline"
            onClick={() => setExpanded((v) => !v)}
            data-testid={`test-case-toggle-${tc.id}`}
          >
            {tc.title}
          </button>
          {expanded && (
            <div className="mt-3 space-y-3 text-sm">
              {tc.steps.length > 0 && (
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Steps</div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700">
                    {tc.steps.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                </div>
              )}
              {tc.expected && (
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Expected</div>
                  <p className="text-slate-700 whitespace-pre-wrap">{tc.expected}</p>
                </div>
              )}
              {tc.lastRunNote && (
                <div className="text-xs text-slate-500 italic">Last note: {tc.lastRunNote}</div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => run("passing")} disabled={runMut.isPending}
                  title="Mark passing" data-testid={`run-pass-${tc.id}`}>
            <CheckCircle2 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-700 hover:bg-rose-50"
                  onClick={() => run("failing")} disabled={runMut.isPending}
                  title="Mark failing" data-testid={`run-fail-${tc.id}`}>
            <XCircle className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-amber-700 hover:bg-amber-50"
                  onClick={() => run("blocked")} disabled={runMut.isPending}
                  title="Mark blocked" data-testid={`run-block-${tc.id}`}>
            <PlayCircle className="h-4 w-4" />
          </Button>
          <EditTestCaseDialog tc={tc} projectId={projectId} />
          <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-600 hover:bg-rose-50"
                  onClick={() => {
                    if (!confirm("Delete this test case?")) return;
                    delMut.mutate(tc.id, {
                      onSuccess: () => toast({ title: "Deleted" }),
                      onError: (e: Error) => toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
                    });
                  }}
                  disabled={delMut.isPending}
                  title="Delete" data-testid={`delete-${tc.id}`}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </li>
  );
}

function NewTestCaseDialog({
  projectId,
  requirements,
}: {
  projectId: string | null;
  requirements: Array<{ id: string; code: string; title: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TestCase["type"]>("functional");
  const [requirementId, setRequirementId] = useState<string>("__none");
  const [stepsRaw, setStepsRaw] = useState("");
  const [expected, setExpected] = useState("");
  const create = useCreateTestCase();
  const { toast } = useToast();

  const reset = () => {
    setTitle(""); setType("functional"); setRequirementId("__none");
    setStepsRaw(""); setExpected("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button className="gap-2" disabled={!projectId} data-testid="button-new-test-case">
          <Plus className="h-4 w-4" /> New test case
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>New test case</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Reject login with invalid OTP" data-testid="input-tc-title" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">Type</label>
              <Select value={type} onValueChange={(v) => setType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="functional">Functional</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                  <SelectItem value="non_functional">Non-functional</SelectItem>
                  <SelectItem value="acceptance">Acceptance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">Linked requirement</label>
              <Select value={requirementId} onValueChange={setRequirementId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">— None —</SelectItem>
                  {requirements.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.code} — {r.title.slice(0, 40)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">Steps (one per line)</label>
            <Textarea value={stepsRaw} onChange={(e) => setStepsRaw(e.target.value)} rows={5} data-testid="input-tc-steps" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">Expected result</label>
            <Textarea value={expected} onChange={(e) => setExpected(e.target.value)} rows={3} data-testid="input-tc-expected" />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={!projectId || create.isPending || title.trim().length < 3}
            onClick={() => {
              if (!projectId) return;
              create.mutate(
                {
                  projectId,
                  title: title.trim(),
                  type,
                  requirementId: requirementId === "__none" ? null : requirementId,
                  steps: stepsRaw.split("\n").map((s) => s.trim()).filter(Boolean),
                  expected: expected.trim(),
                  status: "draft",
                },
                {
                  onSuccess: () => { toast({ title: "Test case created" }); setOpen(false); reset(); },
                  onError: (e: Error) => toast({ title: "Create failed", description: e.message, variant: "destructive" }),
                },
              );
            }}
            data-testid="button-create-test-case"
          >
            {create.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating…</> : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditTestCaseDialog({ tc, projectId }: { tc: TestCase; projectId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(tc.title);
  const [type, setType] = useState<TestCase["type"]>(tc.type);
  const [stepsRaw, setStepsRaw] = useState(tc.steps.join("\n"));
  const [expected, setExpected] = useState(tc.expected);
  const update = useUpdateTestCase(projectId);
  const { toast } = useToast();
  return (
    <Dialog open={open} onOpenChange={(v) => {
      setOpen(v);
      if (v) { setTitle(tc.title); setType(tc.type); setStepsRaw(tc.steps.join("\n")); setExpected(tc.expected); }
    }}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-7 w-7" title="Edit" data-testid={`edit-${tc.id}`}>
          <Pencil className="h-4 w-4 text-slate-500" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Edit test case</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          <Select value={type} onValueChange={(v) => setType(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="functional">Functional</SelectItem>
              <SelectItem value="negative">Negative</SelectItem>
              <SelectItem value="non_functional">Non-functional</SelectItem>
              <SelectItem value="acceptance">Acceptance</SelectItem>
            </SelectContent>
          </Select>
          <Textarea value={stepsRaw} onChange={(e) => setStepsRaw(e.target.value)} rows={5} placeholder="Steps (one per line)" />
          <Textarea value={expected} onChange={(e) => setExpected(e.target.value)} rows={3} placeholder="Expected result" />
        </div>
        <DialogFooter>
          <Button
            disabled={update.isPending}
            onClick={() => {
              update.mutate(
                {
                  id: tc.id,
                  patch: {
                    title: title.trim(),
                    type,
                    steps: stepsRaw.split("\n").map((s) => s.trim()).filter(Boolean),
                    expected: expected.trim(),
                  },
                },
                {
                  onSuccess: () => { toast({ title: "Saved" }); setOpen(false); },
                  onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
                },
              );
            }}
          >{update.isPending ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
