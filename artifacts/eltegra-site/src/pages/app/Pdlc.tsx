import { useGetPdlcStages } from "@workspace/api-client-react";
import { useProjectContext } from "@/lib/project-context";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Layers, FileCode2, TestTube2, Rocket, Scale, AlertTriangle, Info } from "lucide-react";

const STAGE_ORDER = ["ideation", "design", "development", "testing", "launch", "governance"];

const STAGE_META: Record<string, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  statusHint: string;
}> = {
  ideation:    { label: "Ideation",    icon: Lightbulb, statusHint: "Draft requirements" },
  design:      { label: "Design",      icon: Layers,    statusHint: "In-review requirements" },
  development: { label: "Development", icon: FileCode2, statusHint: "Approved requirements" },
  testing:     { label: "Testing",     icon: TestTube2, statusHint: "Implemented requirements" },
  launch:      { label: "Launch",      icon: Rocket,    statusHint: "Verified requirements" },
  governance:  { label: "Governance",  icon: Scale,     statusHint: "Verified requirements" },
};

export default function Pdlc() {
  const { projectId } = useProjectContext();
  const { data: stages, isLoading } = useGetPdlcStages(
    { projectId: projectId ?? "" },
    { query: { enabled: !!projectId } as any }
  );

  if (!projectId) return <div className="p-6 text-slate-500">Select a project to see PDLC stages.</div>;

  const ordered = (stages ?? []).slice().sort(
    (a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage)
  );

  const totalReqs = ordered.reduce((sum, s) => sum + (s.requirementCount ?? 0), 0);
  const hasActivity = totalReqs > 0 || ordered.some((s) => s.completion > 0);

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 font-[Inter_Tight]">PDLC Pipeline</h1>
        <p className="text-slate-500 mt-1">Live progress across the six stages of product delivery.</p>
      </header>

      {!isLoading && !hasActivity && (
        <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Stage counts reflect requirements by status — <strong>Draft</strong> → Ideation, <strong>In Review</strong> → Design, <strong>Approved</strong> → Development, <strong>Implemented</strong> → Testing, <strong>Verified</strong> → Launch &amp; Governance.
            Add requirements on the <strong>Requirements</strong> page to see progress here.
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {ordered.map(stage => {
            const meta = STAGE_META[stage.stage] ?? { label: stage.stage, icon: Layers, statusHint: "" };
            const Icon = meta.icon;
            return (
              <Card key={stage.id} className="rounded-xl border-slate-200">
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-xs uppercase tracking-wider text-slate-500">{meta.label}</div>
                  <div className="font-semibold text-slate-900 font-[Inter_Tight] tracking-tight mt-0.5">
                    {stage.title ?? meta.label}
                  </div>
                  {meta.statusHint && (
                    <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{meta.statusHint}</div>
                  )}

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Completion</span>
                      <span className="font-semibold text-slate-900">{stage.completion}%</span>
                    </div>
                    <Progress value={stage.completion} className="h-2" />
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="text-slate-500">{stage.requirementCount} reqs</span>
                    {stage.blockers && stage.blockers > 0 ? (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1">
                        <AlertTriangle className="h-3 w-3" /> {stage.blockers}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">No blockers</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
