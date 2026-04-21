import { useState } from "react";
import { useProjectContext } from "@/lib/project-context";
import {
  useRecurringAudits,
  useCreateRecurringAudit,
  useUpdateRecurringAudit,
  useDeleteRecurringAudit,
} from "@/lib/wave1-api";
import { useListComplianceFrameworks } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Calendar, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RecurringAudits() {
  const { projectId } = useProjectContext();
  const { data, isLoading } = useRecurringAudits(projectId);
  const fw = useListComplianceFrameworks();
  const create = useCreateRecurringAudit();
  const update = useUpdateRecurringAudit();
  const del = useDeleteRecurringAudit();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    frameworkId: "",
    cadence: "weekly",
    hourUtc: 13,
    notifyTo: "",
  });

  const fwById = new Map((fw.data ?? []).map((f) => [f.id, f]));

  async function submit() {
    if (!projectId || !form.frameworkId) {
      toast({ title: "Pick a framework", variant: "destructive" });
      return;
    }
    try {
      await create.mutateAsync({ projectId, ...form });
      toast({ title: "Schedule created" });
      setOpen(false);
      setForm({ frameworkId: "", cadence: "weekly", hourUtc: 13, notifyTo: "" });
    } catch (err: any) {
      toast({ title: "Could not create schedule", description: err.message, variant: "destructive" });
    }
  }

  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Recurring Audits</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Schedule AI compliance audits to run on cadence. Each run produces a verdict, opens any new CAPAs, and notifies the assigned recipients.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="mr-2 h-4 w-4" /> New schedule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule recurring audit</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <div className="text-xs uppercase text-muted-foreground mb-1">Framework</div>
                  <Select value={form.frameworkId} onValueChange={(v) => setForm({ ...form, frameworkId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pick a framework" />
                    </SelectTrigger>
                    <SelectContent>
                      {(fw.data ?? []).map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.code} — {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs uppercase text-muted-foreground mb-1">Cadence</div>
                    <Select value={form.cadence} onValueChange={(v) => setForm({ ...form, cadence: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-muted-foreground mb-1">Run hour (UTC)</div>
                    <Input
                      type="number"
                      min={0}
                      max={23}
                      value={form.hourUtc}
                      onChange={(e) => setForm({ ...form, hourUtc: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase text-muted-foreground mb-1">Notify (comma separated)</div>
                  <Input
                    placeholder="avery.kim, compliance@team"
                    value={form.notifyTo}
                    onChange={(e) => setForm({ ...form, notifyTo: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={submit} disabled={create.isPending}>
                  {create.isPending ? "Saving…" : "Schedule"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scheduled audits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
            {(data?.schedules ?? []).length === 0 && (
              <div className="text-sm text-muted-foreground">No schedules yet.</div>
            )}
            {(data?.schedules ?? []).map((s) => {
              const f = fwById.get(s.frameworkId);
              return (
                <div key={s.id} className="flex items-center gap-3 border rounded-md px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{f?.code ?? s.frameworkId} · {s.cadence}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                      <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{String(s.hourUtc).padStart(2, "0")}:00 UTC</span>
                      <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />Next: {new Date(s.nextRunAt).toLocaleString()}</span>
                      {s.lastRunAt && <span>Last: {new Date(s.lastRunAt).toLocaleString()} ({s.lastRunStatus})</span>}
                    </div>
                    {s.notifyTo && <div className="text-xs text-muted-foreground mt-0.5">→ {s.notifyTo}</div>}
                  </div>
                  <Badge variant="outline" className={s.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}>
                    {s.active ? "active" : "paused"}
                  </Badge>
                  <Switch
                    checked={s.active}
                    onCheckedChange={(checked) => update.mutate({ id: s.id, active: checked })}
                  />
                  <Button variant="ghost" size="icon" onClick={() => del.mutate(s.id)}>
                    <Trash2 className="h-4 w-4 text-rose-600" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
    </div>
  );
}
