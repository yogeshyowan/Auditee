import { useGetRecentActivity } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Code2, ShieldCheck, AlertCircle, Activity as ActivityIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const KIND_META: Record<string, { icon: React.ComponentType<{ className?: string }>; cls: string }> = {
  requirement: { icon: FileText, cls: "bg-primary/10 text-primary" },
  code: { icon: Code2, cls: "bg-slate-900 text-white" },
  compliance: { icon: ShieldCheck, cls: "bg-emerald-100 text-emerald-700" },
  gap: { icon: AlertCircle, cls: "bg-red-100 text-red-700" },
};

export default function Activity() {
  const { data: events, isLoading } = useGetRecentActivity({ limit: 50 });

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 font-[Inter_Tight]">Activity</h1>
        <p className="text-slate-500 mt-1">Every change, scan, and audit signal across the platform.</p>
      </header>

      <Card className="rounded-xl border-slate-200">
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
          ) : !events || events.length === 0 ? (
            <div className="text-sm text-slate-500 py-12 text-center">No activity recorded yet.</div>
          ) : (
            <ol className="relative border-l border-slate-200 ml-3 space-y-6">
              {events.map(ev => {
                const meta = KIND_META[ev.kind] ?? { icon: ActivityIcon, cls: "bg-slate-100 text-slate-700" };
                const Icon = meta.icon;
                return (
                  <li key={ev.id} className="ml-6">
                    <span className={`absolute -left-[18px] flex h-9 w-9 items-center justify-center rounded-full ring-4 ring-white ${meta.cls}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">{ev.message}</span>
                      {ev.entityCode && <Badge variant="outline" className="font-mono text-[10px]">{ev.entityCode}</Badge>}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {ev.actor} · {formatDistanceToNow(new Date(ev.createdAt), { addSuffix: true })}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
