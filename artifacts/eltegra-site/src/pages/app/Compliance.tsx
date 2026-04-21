import { Link } from "wouter";
import { useListComplianceFrameworks } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, AlertTriangle, ShieldAlert, ChevronRight } from "lucide-react";

const STATUS_META: Record<string, { label: string; cls: string; icon: React.ComponentType<{ className?: string }> }> = {
  passing: { label: "Passing", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: ShieldCheck },
  warning: { label: "Warning", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: AlertTriangle },
  gap: { label: "Gap", cls: "bg-red-50 text-red-700 border-red-200", icon: ShieldAlert },
};

export default function Compliance() {
  const { data: frameworks, isLoading } = useListComplianceFrameworks();

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 font-[Inter_Tight]">Compliance</h1>
        <p className="text-slate-500 mt-1">Live status across regulatory frameworks mapped to your code and requirements.</p>
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
    </div>
  );
}
