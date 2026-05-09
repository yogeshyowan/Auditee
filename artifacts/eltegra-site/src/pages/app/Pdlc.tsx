import { useState } from "react";
import { useGetPdlcStages, useUpdatePdlcStage } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useProjectContext } from "@/lib/project-context";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Lightbulb, Layers, FileCode2, TestTube2, Rocket, Scale,
  AlertTriangle, Info, ShieldCheck, Pencil, Minus, Plus,
} from "lucide-react";

const STAGE_ORDER = ["ideation", "design", "development", "testing", "launch", "governance"];

const STAGE_META: Record<string, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  statusHint: string;
  completionTooltip: string;
}> = {
  ideation:    {
    label: "Ideation",
    icon: Lightbulb,
    statusHint: "Draft requirements",
    completionTooltip: "% of requirements that have advanced past Ideation (moved to In Review or beyond)",
  },
  design:      {
    label: "Design",
    icon: Layers,
    statusHint: "In-review requirements",
    completionTooltip: "% of requirements that have advanced past Design (Approved or beyond)",
  },
  development: {
    label: "Development",
    icon: FileCode2,
    statusHint: "Approved requirements",
    completionTooltip: "% of requirements that have advanced past Development (Implemented or Verified)",
  },
  testing:     {
    label: "Testing",
    icon: TestTube2,
    statusHint: "Implemented requirements",
    completionTooltip: "% of requirements that have reached Verified status",
  },
  launch:      {
    label: "Launch",
    icon: Rocket,
    statusHint: "Verified requirements",
    completionTooltip: "% of requirements that have reached Verified status",
  },
  governance:  {
    label: "Governance",
    icon: Scale,
    statusHint: "Verified requirements",
    completionTooltip: "% of requirements that have reached Verified status",
  },
};

function BlockerEditor({
  stageId,
  blockers,
  projectId,
}: {
  stageId: string;
  blockers: number;
  projectId: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(String(blockers));
  const queryClient = useQueryClient();
  const { mutate, isPending } = useUpdatePdlcStage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/pdlc/stages"] });
        setOpen(false);
      },
    },
  });

  function save(value: number) {
    const clamped = Math.max(0, value);
    mutate({ id: stageId, data: { blockers: clamped } });
  }

  function handleOpen(next: boolean) {
    if (next) setDraft(String(blockers));
    setOpen(next);
  }

  const parsed = parseInt(draft, 10);
  const isValid = !isNaN(parsed) && parsed >= 0;

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        {blockers > 0 ? (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200 gap-1 cursor-pointer hover:bg-red-100 transition-colors"
          >
            <AlertTriangle className="h-3 w-3" />
            {blockers} blocker{blockers !== 1 ? "s" : ""}
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 cursor-pointer hover:bg-emerald-100 transition-colors"
          >
            <ShieldCheck className="h-3 w-3" />
            No blockers
          </Badge>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-52 p-3" align="end">
        <div className="space-y-3">
          <p className="text-xs font-medium text-slate-700">Edit blockers</p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 shrink-0"
              disabled={isPending || parsed <= 0}
              onClick={() => {
                const next = Math.max(0, (isValid ? parsed : blockers) - 1);
                setDraft(String(next));
                save(next);
              }}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Input
              className="h-7 text-center text-sm px-1"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && isValid) save(parsed);
              }}
            />
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 shrink-0"
              disabled={isPending}
              onClick={() => {
                const next = (isValid ? parsed : blockers) + 1;
                setDraft(String(next));
                save(next);
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              className="h-7 text-xs flex-1"
              disabled={isPending || !isValid}
              onClick={() => save(parsed)}
            >
              {isPending ? "Saving…" : "Save"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              disabled={isPending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function Pdlc() {
  const { projectId } = useProjectContext();
  const { data: stages, isLoading } = useGetPdlcStages(
    { projectId: projectId ?? "" },
    { query: { enabled: !!projectId } as any }
  );

  if (!projectId) {
    return <div className="p-6 text-slate-500">Select a project to see PDLC stages.</div>;
  }

  const ordered = (stages ?? []).slice().sort(
    (a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage)
  );

  const totalReqs = ordered.reduce((sum, s) => sum + (s.requirementCount ?? 0), 0);
  const hasActivity = totalReqs > 0 || ordered.some((s) => s.completion > 0);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="p-6 space-y-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 font-[Inter_Tight]">
            PDLC Pipeline
          </h1>
          <p className="text-slate-500 mt-1">
            Live progress across the six stages of product delivery.
          </p>
        </header>

        {!isLoading && !hasActivity && (
          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              Completion % and stage counts reflect requirement statuses —{" "}
              <strong>Draft</strong> → Ideation, <strong>In Review</strong> → Design,{" "}
              <strong>Approved</strong> → Development, <strong>Implemented</strong> → Testing,{" "}
              <strong>Verified</strong> → Launch &amp; Governance. Add requirements and advance
              their status to see progress here.
            </span>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {ordered.map((stage) => {
              const meta = STAGE_META[stage.stage] ?? {
                label: stage.stage,
                icon: Layers,
                statusHint: "",
                completionTooltip: "% of requirements passing through this stage",
              };
              const Icon = meta.icon;
              const blockers = stage.blockers ?? 0;

              return (
                <Card key={stage.id} className="rounded-xl border-slate-200">
                  <CardContent className="p-5">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-xs uppercase tracking-wider text-slate-500">
                      {meta.label}
                    </div>
                    <div className="font-semibold text-slate-900 font-[Inter_Tight] tracking-tight mt-0.5">
                      {stage.title ?? meta.label}
                    </div>
                    {meta.statusHint && (
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                        {meta.statusHint}
                      </div>
                    )}

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-slate-500">
                          <span>Completion</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-slate-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[200px] text-xs">
                              {meta.completionTooltip}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <span className="font-semibold text-slate-900">{stage.completion}%</span>
                      </div>
                      <Progress value={stage.completion} className="h-2" />
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs">
                      <span className="text-slate-500">{stage.requirementCount} reqs</span>
                      <BlockerEditor
                        stageId={stage.id}
                        blockers={blockers}
                        projectId={stage.projectId}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
