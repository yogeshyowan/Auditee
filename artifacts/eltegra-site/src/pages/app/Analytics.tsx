import { useProjectContext } from "@/lib/project-context";
import { useWorkflowAnalytics } from "@/lib/wave1-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function Analytics() {
  const { projectId } = useProjectContext();
  const { data, isLoading } = useWorkflowAnalytics(projectId);

  return (
    <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workflow Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Throughput, cycle time, completion rates, and the steps that block your runs most often.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total runs", value: data?.totals.runs ?? 0, color: "text-slate-900" },
            { label: "Completed", value: data?.totals.completed ?? 0, color: "text-emerald-700" },
            { label: "In progress", value: data?.totals.running ?? 0, color: "text-blue-700" },
            { label: "Blocked", value: data?.totals.blocked ?? 0, color: "text-amber-700" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="text-xs uppercase text-muted-foreground">{s.label}</div>
                <div className={`text-3xl font-semibold mt-1 ${s.color}`}>{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Throughput (last 14 days)</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : (data?.throughput.length ?? 0) === 0 ? (
                <div className="text-sm text-muted-foreground">No runs in the last 14 days.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data!.throughput}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="starts" stroke="#2563eb" strokeWidth={2} />
                    <Line type="monotone" dataKey="completions" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top blocker steps</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {(data?.blockers.length ?? 0) === 0 ? (
                <div className="text-sm text-muted-foreground">No blocked steps recorded.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data!.blockers} layout="vertical" margin={{ left: 80 }}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="reason" width={180} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#f59e0b">
                      {data!.blockers.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? "#dc2626" : "#f59e0b"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Per-workflow performance</CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.workflows.length ?? 0) === 0 ? (
              <div className="text-sm text-muted-foreground">No workflow runs yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground border-b">
                  <tr>
                    <th className="text-left py-2">Workflow</th>
                    <th className="text-right">Runs</th>
                    <th className="text-right">Completed</th>
                    <th className="text-right">Blocked</th>
                    <th className="text-right">Completion %</th>
                    <th className="text-right">Avg cycle</th>
                  </tr>
                </thead>
                <tbody>
                  {data!.workflows.map((w) => (
                    <tr key={w.workflowId} className="border-b last:border-0">
                      <td className="py-2 font-medium">{w.workflowName}</td>
                      <td className="text-right">{w.total}</td>
                      <td className="text-right">{w.completed}</td>
                      <td className="text-right">{w.blocked}</td>
                      <td className="text-right">
                        <Badge
                          variant="outline"
                          className={
                            w.completionRate >= 80
                              ? "bg-emerald-50 text-emerald-700"
                              : w.completionRate >= 50
                                ? "bg-amber-50 text-amber-700"
                                : "bg-rose-50 text-rose-700"
                          }
                        >
                          {w.completionRate}%
                        </Badge>
                      </td>
                      <td className="text-right text-muted-foreground">
                        {w.avgCycleTimeMinutes != null ? `${w.avgCycleTimeMinutes} min` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
