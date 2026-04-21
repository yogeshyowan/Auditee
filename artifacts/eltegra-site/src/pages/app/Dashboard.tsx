import { useGetDashboardSummary, useGetRecentActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  ListChecks,
  Network,
  ShieldCheck,
  AlertTriangle,
  Gauge,
  DollarSign,
  FileText,
  Code2,
  Activity as ActivityIcon,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const COLORS = ["#00883A", "#01AB48", "#B1E1C5", "#0f172a", "#94a3b8"];

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  in_review: "In Review",
  approved: "Approved",
  implemented: "Implemented",
  verified: "Verified",
};

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card className="rounded-xl border-slate-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</div>
            <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 font-[Inter_Tight]">{value}</div>
            {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const KIND_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  requirement: FileText,
  code: Code2,
  compliance: ShieldCheck,
  gap: AlertCircle,
};

export default function Dashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary();
  const { data: activity } = useGetRecentActivity({ limit: 8 });

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 font-[Inter_Tight]">Dashboard</h1>
        <p className="text-slate-500 mt-1">Real-time view across requirements, traceability, and compliance.</p>
      </header>

      {isLoading || !summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiCard icon={ListChecks} label="Total Requirements" value={summary.totalRequirements.toLocaleString()} sub={`${summary.implementedRequirements} implemented`} />
          <KpiCard icon={Network} label="Traceability Coverage" value={`${summary.traceabilityCoverage}%`} />
          <KpiCard icon={ShieldCheck} label="Compliance Adherence" value={`${summary.complianceAdherence}%`} />
          <KpiCard icon={AlertTriangle} label="Open Gaps" value={summary.openGaps.toString()} />
          <KpiCard icon={Gauge} label="Velocity Index" value={`${summary.velocityIndex}`} />
          <KpiCard
            icon={DollarSign}
            label="Estimated Annual Savings"
            value={`$${(summary.savings.estimatedAnnualUsd / 1000).toFixed(0)}k`}
            sub={`${summary.savings.hoursSaved.toLocaleString()} hours saved`}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="rounded-xl border-slate-200 lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-[Inter_Tight]">Requirements by status</CardTitle>
          </CardHeader>
          <CardContent>
            {summary ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.byStatus.map(s => ({ ...s, status: STATUS_LABEL[s.status] ?? s.status }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="status" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: "#f1f5f9" }} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
                    <Bar dataKey="count" fill="#00883A" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Skeleton className="h-72" />
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-200">
          <CardHeader>
            <CardTitle className="font-[Inter_Tight]">By type</CardTitle>
          </CardHeader>
          <CardContent>
            {summary ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary.byType}
                      dataKey="count"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {summary.byType.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Skeleton className="h-72" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl border-slate-200">
        <CardHeader>
          <CardTitle className="font-[Inter_Tight]">Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          {!activity ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
            </div>
          ) : activity.length === 0 ? (
            <div className="text-sm text-slate-500 py-8 text-center">No recent activity yet.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {activity.map(ev => {
                const Icon = KIND_ICON[ev.kind] ?? ActivityIcon;
                return (
                  <li key={ev.id} className="py-3 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-900 font-medium truncate">{ev.message}</span>
                        {ev.entityCode && <Badge variant="outline" className="text-[10px] font-mono">{ev.entityCode}</Badge>}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {ev.actor} · {formatDistanceToNow(new Date(ev.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
