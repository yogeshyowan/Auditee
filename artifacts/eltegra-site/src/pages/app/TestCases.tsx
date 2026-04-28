import { useState, useMemo } from "react";
import { useProjectContext } from "@/lib/project-context";
import { useListRequirements } from "@workspace/api-client-react";
import {
  useTestCases,
  useCreateTestCase,
  useUpdateTestCase,
  useDeleteTestCase,
  useRunTestCase,
  useGenerateTestSuite,
  useRunTestSuite,
  exportBundleUrl,
  TC_LEVELS,
  TC_DISCIPLINES,
  TC_PARADIGMS,
  type TestCase,
  type TcLevel,
  type TcDiscipline,
  type TcParadigm,
  type TcSourceKind,
  type GenerateSuiteBody,
} from "@/lib/test-cases-api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Beaker,
  Sparkles,
  Plus,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  Pencil,
  PlayCircle,
  Download,
  Bot,
  Layers,
} from "lucide-react";
import { format } from "date-fns";
import { PushToRepoButton } from "@/components/PushToRepoButton";

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

const LEVEL_LABEL: Record<TcLevel, string> = {
  unit: "Unit",
  integration: "Integration",
  system: "System",
  acceptance: "Acceptance",
  operational: "Operational",
};

const DISCIPLINE_LABEL: Record<TcDiscipline, string> = {
  functional: "Functional",
  negative: "Negative",
  regulatory: "Regulatory",
  performance: "Performance",
  security: "Security",
  usability: "Usability",
  compatibility: "Compatibility",
  regression: "Regression",
  accessibility: "Accessibility",
  reliability: "Reliability",
  uat: "User Acceptance",
};

const PARADIGM_LABEL: Record<TcParadigm, string> = {
  procedural: "Procedural",
  bdd: "BDD (Gherkin)",
  oo_state: "OO state-based",
  functional_property: "Functional / property",
  exploratory: "Exploratory",
};

const SOURCE_KIND_LABEL: Record<TcSourceKind, string> = {
  requirement: "Requirements",
  design: "Design docs (HLD/LLD)",
  architecture: "Architecture (ISO 42010)",
  code: "Source code",
  report: "Specific AI report",
  project: "Whole project (everything)",
};

const LEVEL_BADGE_CLS: Record<TcLevel, string> = {
  unit: "bg-sky-50 text-sky-700 border-sky-200",
  integration: "bg-violet-50 text-violet-700 border-violet-200",
  system: "bg-indigo-50 text-indigo-700 border-indigo-200",
  acceptance: "bg-emerald-50 text-emerald-700 border-emerald-200",
  operational: "bg-amber-50 text-amber-700 border-amber-200",
};

export default function TestCasesPage() {
  const { projectId } = useProjectContext();
  const { data: requirements } = useListRequirements(projectId ? ({ projectId } as any) : ({} as any));
  const { data, isLoading } = useTestCases(projectId ?? null);
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [disciplineFilter, setDisciplineFilter] = useState<string>("all");
  const [paradigmFilter, setParadigmFilter] = useState<string>("all");
  const [requirementFilter, setRequirementFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const reqById = useMemo(
    () => new Map((requirements ?? []).map((r) => [r.id, r] as const)),
    [requirements],
  );

  const filtered = useMemo(() => {
    const list = data?.testCases ?? [];
    return list.filter((tc) => {
      if (statusFilter !== "all" && tc.status !== statusFilter) return false;
      if (levelFilter !== "all" && tc.level !== levelFilter) return false;
      if (disciplineFilter !== "all" && tc.discipline !== disciplineFilter) return false;
      if (paradigmFilter !== "all" && tc.paradigm !== paradigmFilter) return false;
      if (requirementFilter !== "all" && tc.requirementId !== requirementFilter) return false;
      return true;
    });
  }, [data, statusFilter, levelFilter, disciplineFilter, paradigmFilter, requirementFilter]);

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

  const runSuite = useRunTestSuite(projectId ?? "");

  const onRunSuite = () => {
    if (!projectId) return;
    const ids = selectedIds.size > 0 ? Array.from(selectedIds) : undefined;
    runSuite.mutate(
      { projectId, testCaseIds: ids },
      {
        onSuccess: (d) => {
          toast({
            title: "AI test run complete",
            description: `${d.counts.pass} pass · ${d.counts.fail} fail · ${d.counts.inconclusive} inconclusive (${d.passRate}% pass rate). Report saved to Reports.`,
          });
          setSelectedIds(new Set());
        },
        onError: (e: Error) =>
          toast({ title: "Run failed", description: e.message, variant: "destructive" }),
      },
    );
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((t) => t.id)));
  };

  const allFilteredSelected = filtered.length > 0 && selectedIds.size === filtered.length;

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-950 flex items-center gap-2">
            <Beaker className="text-primary" />
            Test Cases
          </h1>
          <p className="text-slate-600 mt-2 max-w-2xl">
            Author, generate and run test cases across every level, discipline and paradigm of testing — from unit and BDD to regulatory and performance — sourced from your requirements, design, architecture or code.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {projectId && (
            <Button asChild variant="outline" className="gap-2" data-testid="button-download-bundle">
              <a href={exportBundleUrl(projectId)} download>
                <Download className="h-4 w-4" /> Download bundle
              </a>
            </Button>
          )}
          <PushToRepoButton
            projectId={projectId ?? null}
            kind="test-bundle"
            label="Push bundle to repo"
            variant="outline"
            size="default"
            className="gap-2"
            testid="push-test-bundle"
          />
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

          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="rounded-xl border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="text-base font-[Inter_Tight] flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Generate test suite
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-600 mb-3">
                  Pick a source (requirements, design, code, whole project) and choose which levels, disciplines and paradigms to cover. The AI drafts a full suite — including static review checklists where applicable.
                </p>
                <GenerateSuiteDialog
                  projectId={projectId}
                  requirements={requirements ?? []}
                />
              </CardContent>
            </Card>

            <Card className="rounded-xl border-indigo-200 bg-gradient-to-br from-indigo-50 to-transparent">
              <CardHeader>
                <CardTitle className="text-base font-[Inter_Tight] flex items-center gap-2">
                  <Bot className="h-4 w-4 text-indigo-600" /> AI test execution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-slate-600">
                  Have the AI review every selected case against your project's ingested artefacts and assign a verdict (pass / fail / inconclusive). Result is saved as a Test Execution Report you can export and push back to your repo.
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    onClick={onRunSuite}
                    disabled={runSuite.isPending || (data?.testCases ?? []).length === 0}
                    className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                    data-testid="button-run-suite"
                  >
                    {runSuite.isPending ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Running…</>
                    ) : (
                      <><Bot className="h-4 w-4" /> Run {selectedIds.size > 0 ? `${selectedIds.size} selected` : "all"}</>
                    )}
                  </Button>
                  {selectedIds.size > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="text-xs">
                      Clear selection
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-xl border-slate-200">
            <CardHeader className="flex-row items-center justify-between gap-3 flex-wrap space-y-0">
              <div className="flex items-center gap-3">
                <CardTitle className="font-[Inter_Tight] text-base">All test cases</CardTitle>
                {filtered.length > 0 && (
                  <button
                    onClick={toggleSelectAll}
                    className="text-xs text-slate-500 hover:text-slate-900 underline"
                    data-testid="button-select-all"
                  >
                    {allFilteredSelected ? "Unselect all" : "Select all"}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="passing">Passing</SelectItem>
                    <SelectItem value="failing">Failing</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="Level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All levels</SelectItem>
                    {TC_LEVELS.map((l) => <SelectItem key={l} value={l}>{LEVEL_LABEL[l]}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
                  <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Discipline" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All disciplines</SelectItem>
                    {TC_DISCIPLINES.map((d) => <SelectItem key={d} value={d}>{DISCIPLINE_LABEL[d]}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={paradigmFilter} onValueChange={setParadigmFilter}>
                  <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Paradigm" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All paradigms</SelectItem>
                    {TC_PARADIGMS.map((p) => <SelectItem key={p} value={p}>{PARADIGM_LABEL[p]}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={requirementFilter} onValueChange={setRequirementFilter}>
                  <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Requirement" /></SelectTrigger>
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
                      selected={selectedIds.has(tc.id)}
                      onToggleSelect={() => toggleSelected(tc.id)}
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
  selected,
  onToggleSelect,
}: {
  tc: TestCase;
  reqLabel: string | null;
  projectId: string;
  selected: boolean;
  onToggleSelect: () => void;
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
        <Checkbox
          checked={selected}
          onCheckedChange={onToggleSelect}
          className="mt-1.5"
          data-testid={`select-${tc.id}`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge className={`${meta.cls} border inline-flex items-center gap-1 text-[10px]`}>
              <StatusIcon className="h-3 w-3" /> {meta.label}
            </Badge>
            <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border font-mono ${LEVEL_BADGE_CLS[tc.level]}`}>{LEVEL_LABEL[tc.level]}</span>
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">{DISCIPLINE_LABEL[tc.discipline]}</span>
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200">{PARADIGM_LABEL[tc.paradigm]}</span>
            {tc.mode === "static" && (
              <span className="text-[10px] uppercase tracking-wider text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Static</span>
            )}
            {reqLabel && (
              <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">{reqLabel}</span>
            )}
            {tc.tags.includes("ai-generated") && (
              <span className="text-[10px] uppercase tracking-wider text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5" /> AI
              </span>
            )}
            {tc.lastRunVerdict && (
              <span
                className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded inline-flex items-center gap-1 ${
                  tc.lastRunVerdict === "pass" ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                  : tc.lastRunVerdict === "fail" ? "text-rose-700 bg-rose-50 border border-rose-200"
                  : "text-amber-700 bg-amber-50 border border-amber-200"
                }`}
              >
                <Bot className="h-2.5 w-2.5" /> AI: {tc.lastRunVerdict}
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
              {tc.preconditions && (
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Preconditions</div>
                  <p className="text-slate-700 whitespace-pre-wrap">{tc.preconditions}</p>
                </div>
              )}
              {tc.gherkin && (
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Gherkin</div>
                  <pre className="text-xs bg-slate-50 border border-slate-200 rounded p-2 whitespace-pre-wrap font-mono text-slate-800">{tc.gherkin}</pre>
                </div>
              )}
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
                <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded p-2">
                  <span className="font-semibold">Last run note:</span> {tc.lastRunNote}
                </div>
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

// =============================================================
// Generate Test Suite Dialog — multi-source, multi-level,
// multi-discipline, multi-paradigm.
// =============================================================
function GenerateSuiteDialog({
  projectId,
  requirements,
}: {
  projectId: string;
  requirements: Array<{ id: string; code: string; title: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [sourceKind, setSourceKind] = useState<TcSourceKind>("requirement");
  const [pickedReqId, setPickedReqId] = useState<string>("");
  const [levels, setLevels] = useState<Set<TcLevel>>(new Set(["unit", "integration", "system", "acceptance"]));
  const [disciplines, setDisciplines] = useState<Set<TcDiscipline>>(
    new Set(["functional", "negative", "uat", "performance", "security"]),
  );
  const [paradigms, setParadigms] = useState<Set<TcParadigm>>(new Set(["procedural", "bdd"]));
  const [includeStatic, setIncludeStatic] = useState(true);
  const [includeDynamic, setIncludeDynamic] = useState(true);
  const [targetCount, setTargetCount] = useState(15);

  const generate = useGenerateTestSuite(projectId);
  const { toast } = useToast();

  const toggle = <T extends string>(set: Set<T>, setter: (s: Set<T>) => void, val: T) => {
    const next = new Set(set);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    setter(next);
  };

  const sourceNeedsRequirement = sourceKind === "requirement";
  const canSubmit =
    levels.size > 0 &&
    disciplines.size > 0 &&
    paradigms.size > 0 &&
    (includeStatic || includeDynamic) &&
    (!sourceNeedsRequirement || pickedReqId.length > 0);

  const onSubmit = () => {
    const body: GenerateSuiteBody = {
      projectId,
      sourceKind,
      sourceIds: sourceNeedsRequirement && pickedReqId ? [pickedReqId] : undefined,
      levels: Array.from(levels),
      disciplines: Array.from(disciplines),
      paradigms: Array.from(paradigms),
      includeStatic,
      includeDynamic,
      targetCount,
    };
    generate.mutate(body, {
      onSuccess: (d) => {
        toast({
          title: `Generated ${d.count} test case(s)`,
          description: `Across ${levels.size} level(s), ${disciplines.size} discipline(s), ${paradigms.size} paradigm(s).`,
        });
        setOpen(false);
      },
      onError: (e: Error) =>
        toast({ title: "Generation failed", description: e.message, variant: "destructive" }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 w-full" data-testid="button-open-generate-suite">
          <Layers className="h-4 w-4" /> Open generator
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Generate test suite
          </DialogTitle>
          <DialogDescription>
            The AI drafts test cases covering every level, discipline and paradigm you select — derived from the chosen project artefacts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Source */}
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">1. Source material</h4>
            <Select value={sourceKind} onValueChange={(v) => setSourceKind(v as TcSourceKind)}>
              <SelectTrigger data-testid="select-source-kind"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(SOURCE_KIND_LABEL) as TcSourceKind[]).map((k) => (
                  <SelectItem key={k} value={k}>{SOURCE_KIND_LABEL[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {sourceKind === "requirement" && (
              <div className="mt-2">
                <Select value={pickedReqId} onValueChange={setPickedReqId}>
                  <SelectTrigger data-testid="select-source-req">
                    <SelectValue placeholder="Pick a requirement…" />
                  </SelectTrigger>
                  <SelectContent>
                    {requirements.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.code} — {r.title.slice(0, 60)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {sourceKind === "design" && (
              <p className="text-xs text-slate-500 mt-2">Pulls the latest HLD / LLD / design-spec reports from this project.</p>
            )}
            {sourceKind === "architecture" && (
              <p className="text-xs text-slate-500 mt-2">Pulls the latest Architecture (ISO 42010) / HLD / Deployment reports.</p>
            )}
            {sourceKind === "code" && (
              <p className="text-xs text-slate-500 mt-2">Samples ingested code files from your connected repositories.</p>
            )}
            {sourceKind === "project" && (
              <p className="text-xs text-slate-500 mt-2">Combines requirements + code into one comprehensive context.</p>
            )}
          </section>

          {/* Levels */}
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">2. Test levels</h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {TC_LEVELS.map((l) => (
                <CheckCard
                  key={l}
                  label={LEVEL_LABEL[l]}
                  checked={levels.has(l)}
                  onToggle={() => toggle(levels, setLevels, l)}
                  testid={`level-${l}`}
                />
              ))}
            </div>
          </section>

          {/* Disciplines */}
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">3. Disciplines (functional + non-functional)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TC_DISCIPLINES.map((d) => (
                <CheckCard
                  key={d}
                  label={DISCIPLINE_LABEL[d]}
                  checked={disciplines.has(d)}
                  onToggle={() => toggle(disciplines, setDisciplines, d)}
                  testid={`disc-${d}`}
                />
              ))}
            </div>
          </section>

          {/* Paradigms */}
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">4. Design paradigms</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TC_PARADIGMS.map((p) => (
                <CheckCard
                  key={p}
                  label={PARADIGM_LABEL[p]}
                  checked={paradigms.has(p)}
                  onToggle={() => toggle(paradigms, setParadigms, p)}
                  testid={`para-${p}`}
                />
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              BDD produces Gherkin Given/When/Then. OO state-based produces explicit state-transition cases. Functional/property produces invariant + oracle cases.
            </p>
          </section>

          {/* Static/Dynamic + Count */}
          <section className="grid sm:grid-cols-3 gap-3 items-end">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">5. Modes</h4>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={includeDynamic} onCheckedChange={(v) => setIncludeDynamic(!!v)} data-testid="mode-dynamic" />
                  <span>Dynamic (executed)</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={includeStatic} onCheckedChange={(v) => setIncludeStatic(!!v)} data-testid="mode-static" />
                  <span>Static (review/inspection)</span>
                </label>
              </div>
            </div>
            <div className="sm:col-span-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">Target count</h4>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={4}
                  max={40}
                  value={targetCount}
                  onChange={(e) => setTargetCount(Number(e.target.value))}
                  className="flex-1"
                  data-testid="input-target-count"
                />
                <span className="text-sm font-mono w-10 text-right">{targetCount}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Soft cap — the AI may produce a few more or fewer to cover all requested combinations.</p>
            </div>
          </section>
        </div>

        <DialogFooter>
          <Button
            disabled={!canSubmit || generate.isPending}
            onClick={onSubmit}
            className="gap-2 min-w-[180px]"
            data-testid="button-submit-generate-suite"
          >
            {generate.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Generate suite</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CheckCard({
  label,
  checked,
  onToggle,
  testid,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  testid?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      data-testid={testid}
      className={`text-left px-3 py-2 rounded-lg border text-xs transition ${
        checked
          ? "border-primary bg-primary/5 text-primary font-medium"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
      }`}
    >
      <div className="flex items-center gap-2">
        <Checkbox checked={checked} onCheckedChange={onToggle} className="pointer-events-none" />
        <span>{label}</span>
      </div>
    </button>
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
        <Button variant="outline" className="gap-2" disabled={!projectId} data-testid="button-new-test-case">
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

void TYPE_LABEL;
