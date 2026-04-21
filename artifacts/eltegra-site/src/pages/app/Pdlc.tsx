import { useGetPdlcStages } from "@workspace/api-client-react";
import { useProjectContext } from "@/lib/project-context";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Layers, FileCode2, TestTube2, Rocket, Scale, AlertTriangle } from "lucide-react";

const STAGE_ORDER = ["ideation", "design", "development", "testing", "launch", "governance"];
const STAGE_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  ideation: { label: "Ideation", icon: Lightbulb },
  design: { label: "Design", icon: Layers },
  development: { label: "Development", icon: FileCode2 },
  testing: { label: "Testing", icon: TestTube2 },
  launch: { label: "Launch", icon: Rocket },
  governance: { label: "Governance", icon: Scale },
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

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 font-[Inter_Tight]">PDLC Pipeline</h1>
        <p className="text-slate-500 mt-1">Live progress across the six stages of product delivery.</p>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {ordered.map(stage => {
            const meta = STAGE_META[stage.stage] ?? { label: stage.stage, icon: Layers };
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
