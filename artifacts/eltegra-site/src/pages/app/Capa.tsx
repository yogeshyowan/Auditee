import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useProjectContext } from "@/lib/project-context";
import { useCapas, useCreateCapa, useUpdateCapa, useDeleteCapa, useFrameworksList, type CapaRow } from "@/lib/wave1-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { Comments } from "@/components/Comments";

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-violet-100 text-violet-800",
  blocked: "bg-red-100 text-red-800",
  done: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-slate-100 text-slate-500",
};

export default function Capa() {
  const { projectId } = useProjectContext();
  const [frameworkFilter, setFrameworkFilter] = useState<string>("all");
  const { data, isLoading } = useCapas(
    projectId,
    undefined,
    frameworkFilter === "all" ? undefined : frameworkFilter,
  );
  const { data: frameworks } = useFrameworksList();
  const create = useCreateCapa();
  const update = useUpdateCapa();
  const del = useDeleteCapa();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<CapaRow | null>(null);
  const [form, setForm] = useState({ title: "", description: "", severity: "medium", owner: "", dueAt: "" });

  // Frameworks that actually have CAPAs in this project (computed from unfiltered queries
  // would be ideal, but we expose the full list as the dropdown source so users can pick
  // any standard even if no CAPAs exist for it yet).
  const frameworkOptions = (frameworks ?? []).slice().sort((a, b) => a.name.localeCompare(b.name));

  const counts = (data?.actions ?? []).reduce(
    (acc, a) => {
      acc.total++;
      if (a.status === "open" || a.status === "in_progress") acc.openOrInProgress++;
      if (a.severity === "critical" || a.severity === "high") acc.severe++;
      if (a.dueAt && new Date(a.dueAt) < new Date() && a.status !== "done" && a.status !== "cancelled") acc.overdue++;
      return acc;
    },
    { total: 0, openOrInProgress: 0, severe: 0, overdue: 0 },
  );

  function submit() {
    if (!projectId || !form.title.trim()) return;
    create.mutate(
      {
        projectId,
        title: form.title.trim(),
        description: form.description.trim(),
        severity: form.severity as any,
        owner: form.owner.trim() || "Unassigned",
        dueAt: form.dueAt || undefined,
      } as any,
      {
        onSuccess: () => {
          setOpen(false);
          setForm({ title: "", description: "", severity: "medium", owner: "", dueAt: "" });
        },
      },
    );
  }

  return (
    <AppLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">CAPA — Corrective Actions</h1>
            <p className="text-slate-600">Corrective and preventive actions tracked against findings, audits, and inspections.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="capa-new">
                <Plus className="h-4 w-4 mr-2" />
                New CAPA
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Open new CAPA</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input
                  placeholder="Title (what needs fixing?)"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  data-testid="capa-title"
                />
                <Textarea
                  placeholder="Describe the gap, root cause, and remediation"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
                <div className="grid grid-cols-3 gap-3">
                  <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Owner"
                    value={form.owner}
                    onChange={(e) => setForm({ ...form, owner: e.target.value })}
                  />
                  <Input
                    type="date"
                    value={form.dueAt}
                    onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
                  />
                </div>
                {create.error && <div className="text-sm text-red-600">{(create.error as Error).message}</div>}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={submit} disabled={create.isPending || !form.title.trim()}>
                  Create CAPA
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total CAPAs", value: counts.total, color: "text-slate-900" },
            { label: "Open / In progress", value: counts.openOrInProgress, color: "text-violet-700" },
            { label: "High / Critical", value: counts.severe, color: "text-orange-700" },
            { label: "Overdue", value: counts.overdue, color: "text-red-700" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5">
                <div className="text-xs uppercase tracking-wide text-slate-500">{s.label}</div>
                <div className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle>Action register</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Standard</span>
              <Select value={frameworkFilter} onValueChange={setFrameworkFilter}>
                <SelectTrigger className="w-[260px] h-8 text-xs" data-testid="capa-framework-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All standards</SelectItem>
                  {frameworkOptions.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading && <div className="text-sm text-slate-500">Loading…</div>}
            {data?.actions.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <AlertTriangle className="mx-auto h-10 w-10 mb-2 opacity-40" />
                No CAPAs yet. AI compliance audits will create these automatically as gaps are found, or open one manually.
              </div>
            )}
            <div className="divide-y divide-slate-200">
              {data?.actions.map((a) => (
                <div key={a.id} className="py-3 flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-slate-500">{a.code}</span>
                      <span className={`text-[10px] uppercase px-2 py-0.5 rounded ${SEVERITY_COLORS[a.severity]}`}>{a.severity}</span>
                      <span className={`text-[10px] uppercase px-2 py-0.5 rounded ${STATUS_COLORS[a.status]}`}>{a.status.replace("_", " ")}</span>
                      {a.controlCode && <Badge variant="outline" className="text-[10px]">{a.controlCode}</Badge>}
                      {a.frameworkName && (
                        <Badge variant="outline" className="text-[10px] border-indigo-200 bg-indigo-50 text-indigo-700">
                          {a.frameworkName}
                        </Badge>
                      )}
                    </div>
                    <button className="text-left font-medium text-slate-900 hover:text-primary" onClick={() => setActive(a)}>
                      {a.title}
                    </button>
                    <div className="text-xs text-slate-500 mt-1">
                      Owner: {a.owner}
                      {a.dueAt ? ` · Due ${new Date(a.dueAt).toLocaleDateString()}` : ""}
                    </div>
                  </div>
                  <Select value={a.status} onValueChange={(v) => update.mutate({ id: a.id, status: v as any })}>
                    <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["open", "in_progress", "blocked", "done", "cancelled"].map((s) => (
                        <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" onClick={() => del.mutate(a.id)}>
                    <Trash2 className="h-4 w-4 text-slate-400" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Dialog open={Boolean(active)} onOpenChange={(o) => !o && setActive(null)}>
          <DialogContent className="max-w-2xl">
            {active && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <span className="font-mono text-sm text-slate-500">{active.code}</span>
                    {active.title}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-1 rounded ${SEVERITY_COLORS[active.severity]}`}>{active.severity}</span>
                    <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[active.status]}`}>{active.status}</span>
                    {active.controlCode && <Badge variant="outline">{active.controlCode}</Badge>}
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{active.description || "(no description)"}</p>
                  <div className="text-xs text-slate-500">
                    Owner: <span className="font-medium text-slate-700">{active.owner}</span>
                    {active.dueAt ? <> · Due <span className="font-medium text-slate-700">{new Date(active.dueAt).toLocaleDateString()}</span></> : null}
                    {" · Source: "}<span className="font-medium text-slate-700">{active.source}</span>
                  </div>
                  <Comments entityType="capa" entityId={active.id} projectId={active.projectId} />
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
