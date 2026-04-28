import { useState } from "react";
import { useProjectContext } from "@/lib/project-context";
import { useFrameworksList } from "@/lib/wave1-api";
import {
  useGapAnalysis,
  usePromoteGapFinding,
  type GapAnalysisResult,
  type GapMissing,
} from "@/lib/ai-api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  Sparkles,
  Loader2,
  Plus,
  ShieldAlert,
  GitMerge,
  Zap,
  CheckCircle2,
} from "lucide-react";

const SEVERITY_COLOR: Record<string, string> = {
  critical: "bg-rose-100 text-rose-800 border-rose-300",
  high: "bg-orange-100 text-orange-800 border-orange-300",
  medium: "bg-amber-100 text-amber-800 border-amber-300",
  low: "bg-slate-100 text-slate-700 border-slate-300",
};

const CATEGORY_COLOR: Record<string, string> = {
  security: "bg-rose-50 text-rose-700 border-rose-200",
  compliance: "bg-blue-50 text-blue-700 border-blue-200",
  accessibility: "bg-violet-50 text-violet-700 border-violet-200",
  performance: "bg-amber-50 text-amber-700 border-amber-200",
  error_handling: "bg-orange-50 text-orange-700 border-orange-200",
  observability: "bg-cyan-50 text-cyan-700 border-cyan-200",
  data: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ux: "bg-pink-50 text-pink-700 border-pink-200",
  other: "bg-slate-50 text-slate-700 border-slate-200",
};

function categoryLabel(c: string) {
  return c.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function GapsPage() {
  const { projectId, allProjects } = useProjectContext();
  const currentProject = allProjects.find((p) => p.id === projectId);
  const { data: frameworks } = useFrameworksList();
  const { toast } = useToast();
  const [frameworkId, setFrameworkId] = useState<string>("");
  const [result, setResult] = useState<GapAnalysisResult | null>(null);
  const [promoted, setPromoted] = useState<Set<string>>(new Set());

  const gapMut = useGapAnalysis();
  const promoteMut = usePromoteGapFinding();

  const run = () => {
    if (!projectId) {
      toast({
        title: "No project selected",
        description: "Choose a project from the top-left switcher first.",
        variant: "destructive",
      });
      return;
    }
    gapMut.mutate(
      { projectId, frameworkId: frameworkId || undefined },
      {
        onSuccess: (r) => {
          setResult(r);
          // Reset promoted-tracking on every new run so stale "Added" badges
          // from a previous analysis don't bleed onto a fresh result set.
          setPromoted(new Set());
          toast({
            title: "Gap analysis complete",
            description: `${r.missing.length} missing, ${r.duplicates.length} duplicates, ${r.conflicts.length} conflicts`,
          });
        },
        onError: (err: any) => {
          toast({
            title: "Gap analysis failed",
            description: err?.message || "Unknown error",
            variant: "destructive",
          });
        },
      },
    );
  };

  // Track promoted findings by their title (stable across re-renders) rather
  // than by array index — index would shift if findings get re-ordered or the
  // analysis is re-run, leading to "Added" badges on the wrong items.
  const findingKey = (m: GapMissing) => `${m.category}::${m.title}`;

  const promote = (m: GapMissing) => {
    if (!projectId) return;
    promoteMut.mutate(
      {
        projectId,
        title: m.title,
        description: m.description,
        type: m.suggestedType,
        priority: m.suggestedPriority,
        category: m.category,
      },
      {
        onSuccess: (r) => {
          setPromoted((s) => new Set(s).add(findingKey(m)));
          toast({
            title: "Requirement created",
            description: `${r.created.code} — ${r.created.title}`,
          });
        },
        onError: (err: any) => {
          toast({
            title: "Could not create requirement",
            description: err?.message || "Unknown error",
            variant: "destructive",
          });
        },
      },
    );
  };

  const missingCount = result?.missing.length ?? 0;
  const dupCount = result?.duplicates.length ?? 0;
  const confCount = result?.conflicts.length ?? 0;
  const recCount = result?.recommendations.length ?? 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-950 flex items-center gap-2">
            <AlertTriangle className="text-rose-600" />
            Automated Gap Detection
          </h1>
          <p className="text-slate-600 mt-2 max-w-2xl">
            AI analyses your project's requirements set against industry best practices,
            security standards, and your chosen compliance framework. Surfaces missing
            requirements, duplicates, conflicts, and improvement opportunities — before
            they hit production.
          </p>
        </div>
      </header>

      <Card className="p-6 border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1 min-w-[220px]">
            <label className="text-sm font-medium text-slate-700 mb-1 block">
              Reference framework <span className="text-slate-400">(optional)</span>
            </label>
            <Select value={frameworkId} onValueChange={setFrameworkId}>
              <SelectTrigger data-testid="select-framework">
                <SelectValue placeholder="General industry best practices" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">General industry best practices</SelectItem>
                {(frameworks ?? []).map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.code} — {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={run}
            disabled={!projectId || gapMut.isPending}
            className="gap-2 min-w-[200px]"
            data-testid="button-run-gap-analysis"
          >
            {gapMut.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analysing requirements…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Run gap analysis
              </>
            )}
          </Button>
        </div>
        {currentProject && (
          <p className="text-xs text-slate-500 mt-3">
            Project: <span className="font-medium text-slate-700">{currentProject.name}</span>
          </p>
        )}
      </Card>

      {!result && !gapMut.isPending && (
        <Card className="p-12 border-dashed border-2 border-slate-200 text-center">
          <ShieldAlert className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="mt-4 text-lg font-semibold text-slate-700">
            No analysis yet
          </h3>
          <p className="text-slate-500 max-w-md mx-auto mt-2">
            Click <span className="font-medium">Run gap analysis</span> to scan your
            project's requirements for missing items, conflicts, duplicates, and
            improvement opportunities.
          </p>
        </Card>
      )}

      {result && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-xs text-slate-500 uppercase tracking-wide">Missing</div>
              <div className="text-3xl font-bold text-rose-600 mt-1">{missingCount}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-slate-500 uppercase tracking-wide">Duplicates</div>
              <div className="text-3xl font-bold text-amber-600 mt-1">{dupCount}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-slate-500 uppercase tracking-wide">Conflicts</div>
              <div className="text-3xl font-bold text-orange-600 mt-1">{confCount}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-slate-500 uppercase tracking-wide">Suggestions</div>
              <div className="text-3xl font-bold text-blue-600 mt-1">{recCount}</div>
            </Card>
          </div>

          {result.summary && (
            <Card className="p-5 bg-slate-50 border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-2">
                Summary
              </h3>
              <p className="text-slate-700">{result.summary}</p>
              <p className="text-xs text-slate-500 mt-3">
                Analysed {result.requirementCount} requirements
                {result.framework ? ` against ${result.framework}` : ""} ·{" "}
                {new Date(result.runAt).toLocaleString()}
              </p>
            </Card>
          )}

          <Tabs defaultValue="missing">
            <TabsList>
              <TabsTrigger value="missing" data-testid="tab-missing">
                Missing ({missingCount})
              </TabsTrigger>
              <TabsTrigger value="duplicates">
                Duplicates ({dupCount})
              </TabsTrigger>
              <TabsTrigger value="conflicts">
                Conflicts ({confCount})
              </TabsTrigger>
              <TabsTrigger value="recommendations">
                Suggestions ({recCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="missing" className="space-y-3 mt-4">
              {missingCount === 0 ? (
                <Card className="p-8 text-center text-slate-500">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
                  <p className="mt-3">No missing requirements detected. Great coverage.</p>
                </Card>
              ) : (
                result.missing.map((m, idx) => {
                  const isPromoted = promoted.has(findingKey(m));
                  return (
                    <Card key={findingKey(m)} className="p-5" data-testid={`gap-missing-${idx}`}>
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-[260px]">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <Badge
                              variant="outline"
                              className={CATEGORY_COLOR[m.category] || CATEGORY_COLOR.other}
                            >
                              {categoryLabel(m.category)}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={SEVERITY_COLOR[m.severity] || SEVERITY_COLOR.low}
                            >
                              {m.severity}
                            </Badge>
                            <Badge variant="outline" className="bg-slate-50">
                              {m.suggestedType}
                            </Badge>
                            <Badge variant="outline" className="bg-slate-50">
                              priority: {m.suggestedPriority}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-slate-900">{m.title}</h3>
                          <p className="text-sm text-slate-700 mt-1">{m.description}</p>
                          <p className="text-xs text-slate-500 mt-2 italic">
                            Why: {m.rationale}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant={isPromoted ? "outline" : "default"}
                          disabled={isPromoted || promoteMut.isPending}
                          onClick={() => promote(m)}
                          className="gap-1.5"
                          data-testid={`button-promote-${idx}`}
                        >
                          {isPromoted ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              Added
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              Add as requirement
                            </>
                          )}
                        </Button>
                      </div>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="duplicates" className="space-y-3 mt-4">
              {dupCount === 0 ? (
                <Card className="p-8 text-center text-slate-500">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
                  <p className="mt-3">No duplicate requirements detected.</p>
                </Card>
              ) : (
                result.duplicates.map((d, idx) => (
                  <Card key={idx} className="p-5">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <GitMerge className="w-4 h-4 text-amber-600" />
                      {d.requirementCodes.map((c) => (
                        <Badge key={c} variant="outline" className="font-mono">
                          {c}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-slate-700">{d.rationale}</p>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="conflicts" className="space-y-3 mt-4">
              {confCount === 0 ? (
                <Card className="p-8 text-center text-slate-500">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
                  <p className="mt-3">No conflicts detected.</p>
                </Card>
              ) : (
                result.conflicts.map((c, idx) => (
                  <Card key={idx} className="p-5">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Zap className="w-4 h-4 text-orange-600" />
                      <Badge
                        variant="outline"
                        className={SEVERITY_COLOR[c.severity] || SEVERITY_COLOR.medium}
                      >
                        {c.severity}
                      </Badge>
                      {c.requirementCodes.map((code) => (
                        <Badge key={code} variant="outline" className="font-mono">
                          {code}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-slate-700">{c.rationale}</p>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-3 mt-4">
              {recCount === 0 ? (
                <Card className="p-8 text-center text-slate-500">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
                  <p className="mt-3">No improvement suggestions.</p>
                </Card>
              ) : (
                result.recommendations.map((r, idx) => (
                  <Card key={idx} className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="font-mono">
                        {r.requirementCode}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-900 font-medium">{r.issue}</p>
                    <p className="text-sm text-slate-700 mt-2">
                      <span className="font-semibold text-emerald-700">Suggestion:</span>{" "}
                      {r.improvement}
                    </p>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
