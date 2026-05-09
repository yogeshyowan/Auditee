import { useMemo, useState } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useProjectContext } from "@/lib/project-context";
import {
  useCompletenessSummary,
  LIFECYCLE_STAGES,
  type LifecycleStage,
  type CompletenessRequirementRow,
  type CompletenessCellStatus,
} from "@/lib/ai-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  CircleSlash,
  Loader2,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  ArrowRight,
  FileWarning,
} from "lucide-react";

const STAGE_LABEL: Record<LifecycleStage, string> = {
  architecture: "Architecture",
  design: "Design",
  implementation: "Implementation",
  testing: "Testing",
  deployment: "Deployment",
};

const STAGE_HINT: Record<LifecycleStage, string> = {
  architecture: "ADRs, C4 diagrams, architecture rationale",
  design: "HLD / LLD / specs / RFCs",
  implementation: "Source code that delivers the requirement",
  testing: "Unit / integration / e2e tests",
  deployment: "CI/CD, infra-as-code, runbooks",
};

const CELL_CLASS: Record<CompletenessCellStatus, string> = {
  covered: "bg-emerald-100 text-emerald-900 border-emerald-300",
  partial: "bg-amber-100 text-amber-900 border-amber-300",
  missing: "bg-rose-100 text-rose-900 border-rose-300",
  unaudited: "bg-slate-100 text-slate-500 border-slate-200",
};

const CELL_LABEL: Record<CompletenessCellStatus, string> = {
  covered: "✓",
  partial: "~",
  missing: "✗",
  unaudited: "?",
};

const CELL_TITLE: Record<CompletenessCellStatus, string> = {
  covered: "Covered",
  partial: "Partial",
  missing: "Missing",
  unaudited: "Not yet audited by any source",
};

function pctBarColor(pct: number): string {
  if (pct >= 75) return "bg-emerald-500";
  if (pct >= 50) return "bg-amber-500";
  if (pct >= 25) return "bg-orange-500";
  return "bg-rose-500";
}

function StagePctBar({ stage, pct }: { stage: LifecycleStage; pct: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-700">{STAGE_LABEL[stage]}</span>
        <span className="font-mono tabular-nums text-slate-600">{pct}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${pctBarColor(pct)} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-[10px] text-slate-500">{STAGE_HINT[stage]}</div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "emerald" | "amber" | "rose" | "slate" | "indigo";
}) {
  const toneClass = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    slate: "bg-slate-50 text-slate-700 border-slate-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  }[tone];
  return (
    <Card className={`border ${toneClass}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider opacity-70 font-medium">
              {label}
            </div>
            <div className="text-2xl font-semibold mt-1">{value}</div>
            {hint && <div className="text-xs mt-1 opacity-80">{hint}</div>}
          </div>
          <Icon className="h-7 w-7 opacity-50" />
        </div>
      </CardContent>
    </Card>
  );
}

function RequirementRowCard({
  row,
  expanded,
  onToggle,
}: {
  row: CompletenessRequirementRow;
  expanded: boolean;
  onToggle: () => void;
}) {
  const typeColor: Record<string, string> = {
    BRD: "bg-violet-100 text-violet-800 border-violet-200",
    PRD: "bg-blue-100 text-blue-800 border-blue-200",
    FRD: "bg-emerald-100 text-emerald-800 border-emerald-200",
    NFR: "bg-amber-100 text-amber-800 border-amber-200",
  };
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <div className="grid grid-cols-[1.5rem_minmax(0,2.4fr)_repeat(5,minmax(0,1fr))_minmax(0,1.2fr)] items-center gap-2 px-3 py-2.5 hover:bg-slate-50">
        <button
          type="button"
          onClick={onToggle}
          className="text-slate-400 hover:text-slate-700 flex items-center justify-center"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-slate-500">{row.requirementCode}</span>
            <Badge className={`text-[10px] ${typeColor[row.type] ?? "bg-slate-100 text-slate-700"}`}>
              {row.type}
            </Badge>
            {row.auditedBySources === 0 && (
              <Badge variant="outline" className="text-[10px] text-slate-500">
                not yet audited
              </Badge>
            )}
          </div>
          <div className="text-sm text-slate-800 truncate font-medium">{row.requirementTitle}</div>
        </div>

        {LIFECYCLE_STAGES.map((stage) => {
          const cell = row.stages[stage];
          const cls = CELL_CLASS[cell.best];
          const tip =
            cell.perSource.length === 0
              ? "Not audited by any source yet"
              : cell.perSource
                  .map(
                    (s) =>
                      `${s.sourceLabel}: ${s.status}${s.note ? " — " + s.note : ""}${
                        s.artifacts.length ? "\n  → " + s.artifacts.slice(0, 2).join(", ") : ""
                      }`,
                  )
                  .join("\n");
          return (
            <TooltipProvider key={stage} delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`text-center text-sm font-semibold border rounded-md py-1.5 ${cls} cursor-default`}
                    data-testid={`cell-${row.requirementCode}-${stage}`}
                  >
                    {CELL_LABEL[cell.best]}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs whitespace-pre-line text-xs">
                  <div className="font-semibold mb-0.5">
                    {STAGE_LABEL[stage]} — {CELL_TITLE[cell.best]}
                  </div>
                  {tip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}

        <div className="text-right">
          <Link
            href="/app/sources"
            className="text-xs text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
            title="Re-run completeness check from the Sources page"
          >
            re-run <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {expanded && (
        <div className="bg-slate-50/70 border-t border-slate-100 px-10 py-3 space-y-3">
          {LIFECYCLE_STAGES.map((stage) => {
            const cell = row.stages[stage];
            return (
              <div key={stage} className="text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-slate-700 min-w-[110px]">
                    {STAGE_LABEL[stage]}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${CELL_CLASS[cell.best]} border`}
                  >
                    {CELL_TITLE[cell.best]}
                  </Badge>
                </div>
                {cell.perSource.length === 0 ? (
                  <div className="text-slate-500 italic ml-[110px]">
                    No source has audited this requirement yet.
                  </div>
                ) : (
                  <ul className="ml-[110px] space-y-1">
                    {cell.perSource.map((s, i) => (
                      <li key={`${s.sourceId}-${i}`} className="flex flex-col gap-0.5">
                        <div>
                          <span className="font-medium text-slate-700">{s.sourceLabel}:</span>{" "}
                          <span
                            className={
                              s.status === "covered"
                                ? "text-emerald-700"
                                : s.status === "partial"
                                  ? "text-amber-700"
                                  : "text-rose-700"
                            }
                          >
                            {s.status}
                          </span>
                          {s.note && <span className="text-slate-600"> — {s.note}</span>}
                        </div>
                        {s.artifacts.length > 0 && (
                          <div className="text-[10px] text-slate-500 font-mono ml-2">
                            {s.artifacts.slice(0, 4).map((p, j) => (
                              <span key={j} className="mr-2">
                                {p}
                              </span>
                            ))}
                            {s.artifacts.length > 4 && (
                              <span className="text-slate-400">
                                +{s.artifacts.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}

          {row.recommendations.length > 0 && (
            <div className="text-xs">
              <div className="font-semibold text-slate-700 mb-1">Recommendations</div>
              <ul className="space-y-1 ml-2">
                {row.recommendations.map((rec, i) => (
                  <li key={i} className="text-slate-700">
                    <span className="text-slate-500 italic">[{rec.sourceLabel}]</span>{" "}
                    {rec.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type GapFilter = "all" | "withGaps" | "missingOnly" | "unaudited" | "fullyCovered";

export default function CompletenessPage() {
  const { projectId, allProjects } = useProjectContext();
  const currentProject = allProjects.find((p) => p.id === projectId);
  const { data, isLoading, error, refetch, isFetching } = useCompletenessSummary(projectId);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<LifecycleStage | "any">("any");
  const [filter, setFilter] = useState<GapFilter>("withGaps");

  function toggle(code: string) {
    const next = new Set(expanded);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    setExpanded(next);
  }

  const filteredRows = useMemo(() => {
    if (!data) return [];
    return data.requirements.filter((r) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !r.requirementCode.toLowerCase().includes(q) &&
          !r.requirementTitle.toLowerCase().includes(q)
        )
          return false;
      }
      if (stageFilter !== "any") {
        const best = r.stages[stageFilter].best;
        if (best === "covered") return false;
      }
      switch (filter) {
        case "all":
          return true;
        case "withGaps":
          return LIFECYCLE_STAGES.some((s) => r.stages[s].best !== "covered");
        case "missingOnly":
          return LIFECYCLE_STAGES.some((s) => r.stages[s].best === "missing");
        case "unaudited":
          return r.auditedBySources === 0;
        case "fullyCovered":
          return LIFECYCLE_STAGES.every((s) => r.stages[s].best === "covered");
      }
    });
  }, [data, search, stageFilter, filter]);

  if (!projectId) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto py-16 text-center space-y-3">
          <FileWarning className="h-10 w-10 mx-auto text-slate-400" />
          <h2 className="text-xl font-semibold">No project selected</h2>
          <p className="text-sm text-slate-600">
            Pick a project from the top-left switcher to see its completeness gaps.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-indigo-600" />
              Completeness Gaps
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              A rolled-up view of every traceability completeness check ever run for{" "}
              <span className="font-medium text-slate-800">
                {currentProject?.name ?? "this project"}
              </span>
              . Each requirement is shown against the 5 PDLC stages — the cell takes the{" "}
              <span className="font-medium">best</span> status across every source you've
              audited (so a stage shows red only when no source covers it).
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            data-testid="completeness-refresh"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="py-16 flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">Loading completeness summary…</span>
          </div>
        ) : error ? (
          <Card className="border-rose-200 bg-rose-50">
            <CardContent className="p-4 text-sm text-rose-800">
              Failed to load completeness summary: {String((error as any)?.message ?? error)}
            </CardContent>
          </Card>
        ) : !data ? null : !data.hasAnyRun ? (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-6 text-center space-y-3">
              <AlertTriangle className="h-8 w-8 mx-auto text-amber-600" />
              <h3 className="text-lg font-semibold text-amber-900">
                No completeness checks have been run yet
              </h3>
              <p className="text-sm text-amber-800 max-w-xl mx-auto">
                Open{" "}
                <Link href="/app/sources" className="underline font-medium">
                  Project Sources
                </Link>{" "}
                and click <span className="font-semibold">Check completeness</span> on any
                ready source. Once at least one run has been persisted, this page will
                roll it up into a requirement × stage matrix.
              </p>
              <Link href="/app/sources">
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  Go to Project Sources
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : data.requirementsTotal === 0 ? (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-6 text-center text-sm text-amber-800">
              This project has no requirements yet — there's nothing to roll up. Add
              requirements first via the{" "}
              <Link href="/app/requirements" className="underline font-medium">
                Requirements
              </Link>{" "}
              page.
            </CardContent>
          </Card>
        ) : (
          <>
            {/* KPI strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard
                label="Overall completeness"
                value={`${data.completenessPercentage}%`}
                hint={`across ${data.requirementsTotal} requirement${data.requirementsTotal === 1 ? "" : "s"}`}
                icon={ShieldCheck}
                tone={
                  data.completenessPercentage >= 75
                    ? "emerald"
                    : data.completenessPercentage >= 50
                      ? "amber"
                      : "rose"
                }
              />
              <KpiCard
                label="With gaps"
                value={data.requirementsWithGaps}
                hint="missing at least one stage"
                icon={AlertTriangle}
                tone="rose"
              />
              <KpiCard
                label="Fully covered"
                value={data.requirementsFullyCovered}
                hint="all 5 stages covered"
                icon={CheckCircle2}
                tone="emerald"
              />
              <KpiCard
                label="Weakest stage"
                value={
                  data.weakestStage
                    ? `${STAGE_LABEL[data.weakestStage]} (${data.stagePercentages[data.weakestStage]}%)`
                    : "—"
                }
                hint="lowest coverage across reqs"
                icon={CircleSlash}
                tone="amber"
              />
            </div>

            {/* Stage bars */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Coverage by lifecycle stage</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {LIFECYCLE_STAGES.map((s) => (
                  <StagePctBar key={s} stage={s} pct={data.stagePercentages[s]} />
                ))}
              </CardContent>
            </Card>

            {/* Sources used */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Sources rolled up ({data.sourcesUsed.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1.5">
                {data.sourcesUsed.length === 0 ? (
                  <div className="text-slate-500 italic">No sources audited.</div>
                ) : (
                  data.sourcesUsed.map((s) => (
                    <div
                      key={s.sourceId ?? s.sourceLabel}
                      className="flex items-center justify-between gap-3 border border-slate-100 rounded-md px-3 py-1.5 bg-slate-50/60"
                    >
                      <div className="font-medium text-slate-800 truncate">{s.sourceLabel}</div>
                      <div className="flex items-center gap-3 text-slate-600 shrink-0">
                        {s.completenessPercentage !== null && (
                          <span className="font-mono tabular-nums">
                            {s.completenessPercentage}%
                          </span>
                        )}
                        {s.overallVerdict && (
                          <Badge variant="outline" className="capitalize text-[10px]">
                            {s.overallVerdict}
                          </Badge>
                        )}
                        <span className="text-slate-400">
                          {new Date(s.runAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Filters */}
            <Card>
              <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3 flex-wrap">
                <Input
                  placeholder="Search requirement code or title…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="md:max-w-xs"
                  data-testid="completeness-search"
                />
                <Select value={filter} onValueChange={(v) => setFilter(v as GapFilter)}>
                  <SelectTrigger className="md:w-[220px]" data-testid="completeness-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="withGaps">With gaps (any stage not covered)</SelectItem>
                    <SelectItem value="missingOnly">Missing in at least one stage</SelectItem>
                    <SelectItem value="unaudited">Not yet audited</SelectItem>
                    <SelectItem value="fullyCovered">Fully covered</SelectItem>
                    <SelectItem value="all">All requirements</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={stageFilter}
                  onValueChange={(v) => setStageFilter(v as LifecycleStage | "any")}
                >
                  <SelectTrigger
                    className="md:w-[220px]"
                    data-testid="completeness-stage-filter"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Gap in any stage</SelectItem>
                    {LIFECYCLE_STAGES.map((s) => (
                      <SelectItem key={s} value={s}>
                        Gap in {STAGE_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-xs text-slate-500 ml-auto">
                  Showing <span className="font-semibold">{filteredRows.length}</span> of{" "}
                  {data.requirementsTotal}
                </div>
              </CardContent>
            </Card>

            {/* Matrix */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Requirement × Stage matrix</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-[1.5rem_minmax(0,2.4fr)_repeat(5,minmax(0,1fr))_minmax(0,1.2fr)] gap-2 px-3 py-2 border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                  <div />
                  <div>Requirement</div>
                  {LIFECYCLE_STAGES.map((s) => (
                    <div key={s} className="text-center" title={STAGE_HINT[s]}>
                      {STAGE_LABEL[s]}
                    </div>
                  ))}
                  <div className="text-right">Action</div>
                </div>
                {filteredRows.length === 0 ? (
                  <div className="px-6 py-10 text-center text-sm text-slate-500">
                    No requirements match the current filters.
                  </div>
                ) : (
                  filteredRows.map((row) => (
                    <RequirementRowCard
                      key={row.requirementCode}
                      row={row}
                      expanded={expanded.has(row.requirementCode)}
                      onToggle={() => toggle(row.requirementCode)}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Legend */}
            <div className="flex items-center gap-4 flex-wrap text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Legend:</span>
              {(["covered", "partial", "missing", "unaudited"] as CompletenessCellStatus[]).map(
                (s) => (
                  <span key={s} className="inline-flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center justify-center text-xs font-semibold border rounded-md w-7 h-6 ${CELL_CLASS[s]}`}
                    >
                      {CELL_LABEL[s]}
                    </span>
                    <span>{CELL_TITLE[s]}</span>
                  </span>
                ),
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
