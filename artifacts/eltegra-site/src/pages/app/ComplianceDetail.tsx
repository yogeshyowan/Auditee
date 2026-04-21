import { Link, useParams } from "wouter";
import { useGetComplianceFramework } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, ShieldCheck, AlertTriangle, ShieldAlert } from "lucide-react";
import { format } from "date-fns";

const STATUS_BADGE: Record<string, string> = {
  passing: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  gap: "bg-red-50 text-red-700 border-red-200",
};

const CONTROL_STATUS: Record<string, string> = {
  met: "bg-emerald-50 text-emerald-700 border-emerald-200",
  partial: "bg-amber-50 text-amber-700 border-amber-200",
  gap: "bg-red-50 text-red-700 border-red-200",
};

export default function ComplianceDetail() {
  const params = useParams();
  const id = (params as { id?: string }).id ?? "";
  const { data: fw, isLoading, error } = useGetComplianceFramework(id);

  if (isLoading) {
    return <div className="p-6 space-y-4"><Skeleton className="h-32 rounded-xl" /><Skeleton className="h-72 rounded-xl" /></div>;
  }

  if (error || !fw) {
    return (
      <div className="p-6 space-y-4">
        <Link href="/app/compliance">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2">
            <ArrowLeft className="h-4 w-4" /> Back to compliance
          </Button>
        </Link>
        <Card className="rounded-xl border-slate-200">
          <CardContent className="p-10 text-center">
            <ShieldAlert className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-slate-900">Framework not found</h2>
            <p className="text-sm text-slate-500 mt-1">
              {error ? "We hit an error loading this framework. Try again from the compliance list." : "This framework doesn't exist or has been removed."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const StatusIcon = fw.status === "passing" ? ShieldCheck : fw.status === "warning" ? AlertTriangle : ShieldAlert;

  return (
    <div className="p-6 space-y-6">
      <Link href="/app/compliance">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Back to compliance
        </Button>
      </Link>

      <Card className="rounded-xl border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <StatusIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="font-mono text-xs text-slate-500">{fw.code}</div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950 font-[Inter_Tight]">{fw.name}</h1>
                {fw.category && <div className="text-sm text-slate-500 mt-1">{fw.category}</div>}
              </div>
            </div>
            <Badge className={STATUS_BADGE[fw.status] + " border"}>{fw.status}</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6 pt-6 border-t border-slate-100">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500">Score</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">{fw.score}%</div>
              <Progress value={fw.score} className="h-2 mt-2" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500">Controls</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">{fw.controlsMet} / {fw.controlsTotal}</div>
              <div className="text-xs text-slate-500 mt-1">met</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500">Last audit</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">{format(new Date(fw.lastAuditAt), "MMM d, yyyy")}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-slate-200">
        <CardHeader><CardTitle className="font-[Inter_Tight]">Controls</CardTitle></CardHeader>
        <CardContent>
          {!fw.controls || fw.controls.length === 0 ? (
            <div className="text-sm text-slate-500 py-8 text-center">No controls listed for this framework.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="w-28">Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead className="w-40">Owner</TableHead>
                  <TableHead className="w-28 text-right">Evidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fw.controls.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs text-slate-600">{c.code}</TableCell>
                    <TableCell className="font-medium text-slate-900">{c.title}</TableCell>
                    <TableCell><Badge className={(CONTROL_STATUS[c.status] ?? "bg-slate-100 text-slate-700") + " border"}>{c.status}</Badge></TableCell>
                    <TableCell className="text-sm text-slate-600">{c.owner ?? "—"}</TableCell>
                    <TableCell className="text-right text-sm font-semibold text-slate-700">{c.evidenceCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
