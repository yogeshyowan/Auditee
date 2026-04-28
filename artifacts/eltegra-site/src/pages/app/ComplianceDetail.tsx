import { Link, useParams } from "wouter";
import { useState, useMemo } from "react";
import { useGetComplianceFramework, useListProjects } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ShieldCheck, AlertTriangle, ShieldAlert, Wand2, Loader2, FileCode2, FolderInput, ChevronDown, ChevronRight, BadgeCheck, BadgeX, Sparkles, ThumbsUp, ThumbsDown } from "lucide-react";
import { format } from "date-fns";
import { useProjectContext } from "@/lib/project-context";
import { useComplianceAudit } from "@/lib/ai-api";
import { useSources } from "@/lib/wave1-api";
import { useToast } from "@/hooks/use-toast";
import { useControlEvidence, useVerifyControl, type ControlEvidenceRow } from "@/lib/compliance-api";

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
  const { data: sourcesData } = useSources(projectId);
  const readySources = useMemo(() => (sourcesData?.sources ?? []).filter((s) => s.status === "ready"), [sourcesData]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[] | null>(null);
  // null means "all ready sources" (default).
  const effectiveSourceIds = selectedSourceIds ?? readySources.map((s) => s.id);

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
                      { projectId, frameworkId: fw.id, sourceIds: effectiveSourceIds.length > 0 ? effectiveSourceIds : undefined },
                      {
                        onSuccess: (data) => {
                          const cited = data.evidenceTotals?.citedFiles ?? 0;
                          toast({
                            title: `Audit complete — ${data.overallVerdict}`,
                            description: cited > 0
                              ? `${cited} file(s) cited as evidence across ${data.evidenceTotals?.sources ?? 0} source(s).`
                              : `No source evidence used. Connect a project source for code-grounded findings.`,
                          });
                        },
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

      {projectId && (
        <Card className="rounded-xl border-slate-200" data-testid="card-audit-sources">
          <CardHeader>
            <CardTitle className="font-[Inter_Tight] flex items-center gap-2 text-base">
              <FolderInput className="h-4 w-4 text-primary" /> Audit evidence sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            {readySources.length === 0 ? (
              <div className="text-sm text-slate-500 flex items-center justify-between gap-3">
                <span>No project sources connected — the audit will run against your requirements only.</span>
                <Link href="/app/sources">
                  <Button variant="outline" size="sm" className="gap-1.5"><FolderInput className="h-3.5 w-3.5" />Connect a source</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-slate-500">
                  Pick which sources to ingest as evidence. By default all ready sources are included.
                </div>
                {readySources.map((s) => {
                  const checked = (selectedSourceIds ?? readySources.map((x) => x.id)).includes(s.id);
                  return (
                    <label key={s.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-50 cursor-pointer">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          const cur = selectedSourceIds ?? readySources.map((x) => x.id);
                          const next = v ? Array.from(new Set([...cur, s.id])) : cur.filter((id) => id !== s.id);
                          setSelectedSourceIds(next);
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{s.label}</div>
                        <div className="text-xs text-slate-500">{s.kind} · {s.fileCount} files indexed</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {auditMut.data && (
        <Card className="rounded-xl border-slate-200" data-testid="card-audit-results">
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <CardTitle className="font-[Inter_Tight] flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-primary" /> AI audit results
                {currentProject && <span className="text-sm font-normal text-slate-500">· {currentProject.name}</span>}
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={(VERDICT_BADGE[auditMut.data.overallVerdict] ?? "bg-slate-100 text-slate-700") + " border"}>
                  {auditMut.data.overallVerdict}
                </Badge>
                {auditMut.data.nativeRating && (
                  <Badge
                    className="bg-indigo-600 text-white border-indigo-700"
                    title={`${auditMut.data.nativeRating.schemeName} — ${auditMut.data.nativeRating.overall.description}`}
                    data-testid="native-rating-overall"
                  >
                    {auditMut.data.nativeRating.overall.value} · {auditMut.data.nativeRating.overall.label}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {auditMut.data.nativeRating && (
              <div className="rounded-md border border-indigo-200 bg-indigo-50 p-3" data-testid="native-rating-block">
                <div className="text-[11px] uppercase tracking-wider text-indigo-700 font-semibold">{auditMut.data.framework.code} native rating</div>
                <div className="text-sm font-semibold text-indigo-900 mt-0.5">{auditMut.data.nativeRating.schemeName}</div>
                <div className="text-xs text-indigo-800 mt-0.5">Based on {auditMut.data.nativeRating.basedOn}</div>
                <div className="text-xs text-slate-700 mt-2">{auditMut.data.nativeRating.description}</div>
              </div>
            )}
            {(auditMut.data.evidenceTotals && auditMut.data.evidenceTotals.sources > 0) && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="font-semibold">Evidence:</span>
                <span>{auditMut.data.evidenceTotals.sources} source(s)</span>
                <span>·</span>
                <span>{auditMut.data.evidenceTotals.indexedFiles.toLocaleString()} files indexed</span>
                <span>·</span>
                <span>{auditMut.data.evidenceTotals.citedFiles} file(s) cited</span>
                {auditMut.data.capasCreated ? (<><span>·</span><span>{auditMut.data.capasCreated} CAPA(s) auto-opened</span></>) : null}
              </div>
            )}
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
                    <TableHead className="w-28">Native rating</TableHead>
                    <TableHead>Covering requirements</TableHead>
                    <TableHead>Evidence</TableHead>
                    <TableHead>Recommendation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditMut.data.controlAssessments.map((a, i) => {
                    const native = auditMut.data!.nativeRating?.perControl?.[a.controlCode];
                    return (
                    <TableRow key={i} className="align-top">
                      <TableCell className="font-mono text-xs text-slate-600">{a.controlCode}</TableCell>
                      <TableCell><Badge className={(ASSESSMENT_BADGE[a.verdict] ?? "bg-slate-100 text-slate-700") + " border"}>{a.verdict}</Badge></TableCell>
                      <TableCell>
                        {native ? (
                          <Badge
                            variant="outline"
                            title={`${native.label} — ${native.description}`}
                            className="bg-indigo-50 text-indigo-700 border-indigo-300 font-mono"
                            data-testid={`native-pc-${a.controlCode}`}
                          >
                            {native.value}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TableCell>
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
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {!a.evidenceFiles || a.evidenceFiles.length === 0 ? (
                            <span className="text-xs text-slate-400">—</span>
                          ) : (
                            a.evidenceFiles.map((path) => (
                              <span key={path} className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-700 bg-slate-100 rounded px-1.5 py-0.5 max-w-[16rem] truncate" title={path}>
                                <FileCode2 className="h-3 w-3 shrink-0" /> {path}
                              </span>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-700">{a.recommendation}</TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {auditMut.data.sourcesUsed && auditMut.data.sourcesUsed.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Sources scanned</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {auditMut.data.sourcesUsed.map((s) => (
                    <div key={s.sourceId} className="border rounded-md p-2.5 text-xs">
                      <div className="font-medium text-slate-800 flex items-center justify-between">
                        <span className="truncate">{s.sourceLabel}</span>
                        <span className="text-slate-500 capitalize">{s.sourceKind}</span>
                      </div>
                      <div className="text-slate-500 mt-0.5">{s.fileCount} indexed · {s.citedCount} cited</div>
                      {s.citedPaths.length > 0 && (
                        <ul className="mt-1.5 space-y-0.5">
                          {s.citedPaths.slice(0, 6).map((p) => (
                            <li key={p} className="font-mono text-[10px] text-slate-600 truncate" title={p}>· {p}</li>
                          ))}
                          {s.citedPaths.length > 6 && (
                            <li className="text-[10px] text-slate-400">…and {s.citedPaths.length - 6} more</li>
                          )}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                  <TableHead className="w-8" />
                  <TableHead className="w-28">Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-44">Status</TableHead>
                  <TableHead className="w-40">Owner</TableHead>
                  <TableHead className="w-28 text-right">Evidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fw.controls.map((c) => (
                  <ControlRow key={c.id} control={c as any} frameworkId={fw.id} projectId={projectId} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type ControlRowProps = {
  control: {
    id: string;
    code: string;
    title: string;
    status: string;
    owner: string | null;
    evidenceCount: number;
    assertion?: string | null;
    evidenceVerifiedCount?: number;
    evidenceTotalCount?: number;
  };
  frameworkId: string;
  projectId: string | null | undefined;
};

function ControlRow({ control, frameworkId, projectId }: ControlRowProps) {
  const [open, setOpen] = useState(false);
  const { data: evData, isLoading: evLoading } = useControlEvidence(open ? control.id : null, projectId ?? null);
  const verifyMut = useVerifyControl(frameworkId);
  const { toast } = useToast();

  const assertion = control.assertion ?? null;
  const statusBadge = renderControlStatusBadge(control.status, assertion);

  const verifyAll = (action: "verify" | "reject") => {
    if (!projectId) {
      toast({ title: "Select a project first", variant: "destructive" });
      return;
    }
    verifyMut.mutate(
      { controlId: control.id, projectId, action },
      {
        onSuccess: (d) =>
          toast({
            title: action === "verify" ? "Evidence verified" : "Evidence rejected",
            description: `${d.updatedCount} item(s) updated. Control is now ${d.status}.`,
          }),
        onError: (e: Error) =>
          toast({ title: "Update failed", description: e.message, variant: "destructive" }),
      },
    );
  };

  return (
    <>
      <TableRow data-testid={`control-row-${control.code}`}>
        <TableCell className="p-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setOpen((v) => !v)}
            data-testid={`control-toggle-${control.code}`}
            aria-label={open ? "Collapse" : "Expand"}
          >
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </Button>
        </TableCell>
        <TableCell className="font-mono text-xs text-slate-600">{control.code}</TableCell>
        <TableCell className="font-medium text-slate-900">{control.title}</TableCell>
        <TableCell>{statusBadge}</TableCell>
        <TableCell className="text-sm text-slate-600">{control.owner ?? "—"}</TableCell>
        <TableCell className="text-right text-sm font-semibold text-slate-700">
          {control.evidenceVerifiedCount !== undefined && control.evidenceTotalCount !== undefined
            ? `${control.evidenceVerifiedCount}/${control.evidenceTotalCount}`
            : control.evidenceCount}
        </TableCell>
      </TableRow>
      {open && (
        <TableRow className="bg-slate-50/40 hover:bg-slate-50/40">
          <TableCell colSpan={6} className="p-0">
            <div className="px-6 py-4 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Evidence locker</div>
                {assertion === "ai_asserted" && projectId && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 h-7 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      disabled={verifyMut.isPending}
                      onClick={() => verifyAll("verify")}
                      data-testid={`control-verify-all-${control.code}`}
                    >
                      <ThumbsUp className="h-3 w-3" /> Verify all
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 h-7 border-rose-300 text-rose-700 hover:bg-rose-50"
                      disabled={verifyMut.isPending}
                      onClick={() => verifyAll("reject")}
                      data-testid={`control-reject-all-${control.code}`}
                    >
                      <ThumbsDown className="h-3 w-3" /> Reject all
                    </Button>
                  </div>
                )}
              </div>
              {evLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : !evData || evData.evidence.length === 0 ? (
                <div className="text-sm text-slate-500 italic">
                  {projectId
                    ? "No evidence captured yet — run an AI audit or promote a gap-analysis finding to populate this locker."
                    : "Select a project to view its evidence for this control."}
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {evData.evidence.map((row) => (
                    <EvidenceRow
                      key={row.id}
                      row={row}
                      controlCode={control.code}
                      onAct={(action) => {
                        if (!projectId) return;
                        verifyMut.mutate(
                          { controlId: control.id, projectId, action, evidenceId: row.id },
                          {
                            onError: (e: Error) =>
                              toast({ title: "Update failed", description: e.message, variant: "destructive" }),
                          },
                        );
                      }}
                      pending={verifyMut.isPending}
                    />
                  ))}
                </ul>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function renderControlStatusBadge(status: string, assertion: string | null) {
  if (status === "met" && assertion === "verified") {
    return (
      <Badge className="border bg-emerald-100 text-emerald-800 border-emerald-300 inline-flex items-center gap-1">
        <BadgeCheck className="h-3 w-3" /> Met · Verified
      </Badge>
    );
  }
  if (status === "met" && assertion === "ai_asserted") {
    return (
      <Badge className="border bg-indigo-50 text-indigo-700 border-indigo-200 inline-flex items-center gap-1">
        <Sparkles className="h-3 w-3" /> Met · AI-asserted
      </Badge>
    );
  }
  if (assertion === "rejected") {
    return (
      <Badge className="border bg-rose-50 text-rose-700 border-rose-200 inline-flex items-center gap-1">
        <BadgeX className="h-3 w-3" /> Rejected
      </Badge>
    );
  }
  const cls =
    status === "met"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "partial"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-rose-50 text-rose-700 border-rose-200";
  return <Badge className={`${cls} border`}>{status}</Badge>;
}

function EvidenceRow({
  row,
  controlCode,
  onAct,
  pending,
}: {
  row: ControlEvidenceRow;
  controlCode: string;
  onAct: (action: "verify" | "reject") => void;
  pending: boolean;
}) {
  const statusClasses =
    row.status === "verified"
      ? "border-emerald-200 bg-emerald-50/60"
      : row.status === "rejected"
      ? "border-rose-200 bg-rose-50/60 opacity-60"
      : "border-indigo-200 bg-white";
  return (
    <li className={`border rounded-md p-2.5 text-sm flex items-start gap-3 ${statusClasses}`}
        data-testid={`evidence-row-${controlCode}-${row.id}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
            {row.kind}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-slate-400">{row.source}</span>
          <span className="text-[10px] text-slate-400">{format(new Date(row.createdAt), "MMM d, HH:mm")}</span>
          {row.status === "verified" && (
            <Badge className="border bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">verified</Badge>
          )}
          {row.status === "rejected" && (
            <Badge className="border bg-rose-100 text-rose-800 border-rose-300 text-[10px]">rejected</Badge>
          )}
        </div>
        <div className="text-slate-800 mt-1 break-words">{row.refLabel}</div>
        {row.note && <div className="text-xs text-slate-500 mt-1 italic">{row.note}</div>}
      </div>
      {row.status === "ai_asserted" && (
        <div className="flex gap-1 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-emerald-700 hover:bg-emerald-100"
            disabled={pending}
            onClick={() => onAct("verify")}
            title="Verify this evidence"
            data-testid={`evidence-verify-${row.id}`}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-rose-700 hover:bg-rose-100"
            disabled={pending}
            onClick={() => onAct("reject")}
            title="Reject this evidence"
            data-testid={`evidence-reject-${row.id}`}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </li>
  );
}
