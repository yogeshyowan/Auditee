import { Link, useParams } from "wouter";
import { useGetComplianceFramework, useListProjects } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, ShieldCheck, AlertTriangle, ShieldAlert, Wand2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useProjectContext } from "@/lib/project-context";
import { useComplianceAudit } from "@/lib/ai-api";
import { useToast } from "@/hooks/use-toast";

const VERDICT_BADGE: Record<string, string> = {
  strong: "bg-emerald-50 text-emerald-700 border-emerald-200",
  adequate: "bg-primary/10 text-primary border-primary/20",
  weak: "bg-amber-50 text-amber-700 border-amber-200",
  failing: "bg-red-50 text-red-700 border-red-200",
};

const ASSESSMENT_BADGE: Record<string, string> = {
  met: "bg-emerald-50 text-emerald-700 border-emerald-200",
  partial: "bg-amber-50 text-amber-700 border-amber-200",
  gap: "bg-red-50 text-red-700 border-red-200",
};

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
  const { projectId } = useProjectContext();
  const { data: projects } = useListProjects();
  const currentProject = projects?.find((p) => p.id === projectId);
  const auditMut = useComplianceAudit();
  const { toast } = useToast();

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
            <div className="flex items-center gap-3">
              <Badge className={STATUS_BADGE[fw.status] + " border"}>{fw.status}</Badge>
              {projectId ? (
                <Button
                  onClick={() => {
                    auditMut.mutate(
                      { projectId, frameworkId: fw.id },
                      {
                        onError: (err: Error) =>
                          toast({ title: "Audit failed", description: err.message, variant: "destructive" }),
                      },
                    );
                  }}
                  disabled={auditMut.isPending}
                  className="gap-2"
                  data-testid="button-run-audit"
                >
                  {auditMut.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Running audit...</>
                  ) : (
                    <><Wand2 className="h-4 w-4" /> Run AI audit</>
                  )}
                </Button>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0}>
                      <Button disabled className="gap-2 pointer-events-none">
                        <Wand2 className="h-4 w-4" /> Run AI audit
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Select a project</TooltipContent>
                </Tooltip>
              )}
            </div>
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

      {auditMut.data && (
        <Card className="rounded-xl border-slate-200" data-testid="card-audit-results">
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <CardTitle className="font-[Inter_Tight] flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-primary" /> AI audit results
                {currentProject && <span className="text-sm font-normal text-slate-500">· {currentProject.name}</span>}
              </CardTitle>
              <Badge className={(VERDICT_BADGE[auditMut.data.overallVerdict] ?? "bg-slate-100 text-slate-700") + " border"}>
                {auditMut.data.overallVerdict}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {auditMut.data.headlineFindings.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Headline findings</div>
                <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                  {auditMut.data.headlineFindings.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Control assessments</div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-28">Control</TableHead>
                    <TableHead className="w-24">Verdict</TableHead>
                    <TableHead>Covering requirements</TableHead>
                    <TableHead>Recommendation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditMut.data.controlAssessments.map((a, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs text-slate-600">{a.controlCode}</TableCell>
                      <TableCell><Badge className={(ASSESSMENT_BADGE[a.verdict] ?? "bg-slate-100 text-slate-700") + " border"}>{a.verdict}</Badge></TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {a.coveringRequirementCodes.length === 0 ? (
                            <span className="text-xs text-slate-400">None</span>
                          ) : (
                            a.coveringRequirementCodes.map((c) => (
                              <Badge key={c} variant="outline" className="font-mono text-[10px]">{c}</Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-700">{a.recommendation}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

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
