import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useProjectContext } from "@/lib/project-context";
import {
  useReports,
  useReport,
  useGenerateReport,
  useRefineReport,
  useDeleteReport,
  reportExportUrl,
  type ReportRow,
} from "@/lib/wave1-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { FileText, Sparkles, Download, Trash2, RefreshCw } from "lucide-react";
import { Comments } from "@/components/Comments";
import { StandardsMultiSelect } from "@/components/StandardsMultiSelect";

const KIND_LABELS: Record<string, string> = {
  brd: "Business Requirements Document (BRD)",
  prd: "Product Requirements Document (PRD)",
  frd: "Functional Requirements Document (FRD)",
  architecture_doc: "Architecture Description (ISO/IEC/IEEE 42010)",
  hld: "High-Level Design (HLD, IEEE 1016)",
  lld: "Low-Level Design (LLD, IEEE 1016)",
  test_cases: "Test Case Suite",
  deployment_doc: "Deployment Document",
  user_manual: "User Manual (IEEE 1063)",
  exec_brief: "Executive briefing",
  compliance_audit: "Compliance audit report",
  requirements_summary: "Requirements summary",
  traceability: "Traceability narrative",
};

const KIND_DESCRIPTIONS: Record<string, string> = {
  brd:
    "Canonical Business Requirements Document — context, stakeholders, objectives, scope, functional & non-functional requirements, constraints, risks, acceptance.",
  prd:
    "Canonical Product Requirements Document — overview, goals/non-goals, personas, user stories with acceptance, FR/NFR, UX flows, release plan, open risks.",
  frd:
    "Canonical Functional Requirements Document — system context, FR specs, data model, interface specs, business rules, error handling, security/compliance, test strategy, ops.",
  architecture_doc:
    "Architecture description per ISO/IEC/IEEE 42010 — stakeholders & concerns, drivers, system context, logical/process/data/deployment views, ADRs, risks.",
  hld:
    "High-Level Design per IEEE 1016 — module decomposition, component interactions, external interface design, data design, tech stack, cross-cutting concerns.",
  lld:
    "Low-Level Design per IEEE 1016 — class/method specs, API contracts, schemas, algorithms with pseudocode, error model, concurrency & state machines.",
  test_cases:
    "Standards-grade test suite generated from requirements — functional, negative/edge, non-functional, e2e — each case linked back to its requirement code.",
  deployment_doc:
    "Build, release, observability and rollback documentation — environments, infra components, CI pipeline, release strategy, runbook, DR posture.",
  user_manual:
    "End-user documentation per IEEE 1063 — getting started, key concepts, task-oriented procedures, screen reference, troubleshooting, glossary.",
  exec_brief:
    "Board-ready 1–2 page summary of program health, top risks, and momentum.",
  compliance_audit:
    "Standards-grounded audit report against a chosen framework (ISO/SOC2/HIPAA/etc.) with control verdicts and evidence.",
  requirements_summary:
    "Coverage and quality narrative across all project requirements, grouped by type and priority.",
  traceability:
    "Requirements → architecture → design → code → tests → deployment coverage story with gaps and recommendations.",
};

export default function Reports() {
  const { projectId } = useProjectContext();
  const { data, isLoading } = useReports(projectId);
  const generate = useGenerateReport();
  const del = useDeleteReport();
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    kind: string;
    tone: string;
    frameworkIds: string[];
    instructions: string;
  }>({
    kind: "exec_brief",
    tone: "executive",
    frameworkIds: [],
    instructions: "",
  });

  function submit() {
    if (!projectId) return;
    generate.mutate(
      {
        projectId,
        kind: form.kind,
        tone: form.tone,
        // Send the new multi-standard array. Backend also accepts the legacy
        // singular frameworkId for back-compat, but we now always send the
        // array shape so prompts get every selected standard's blueprint.
        frameworkIds: form.frameworkIds,
        // Keep singular frameworkId for the very first one as well, so any
        // server-side fallback that still reads it picks the primary.
        frameworkId: form.frameworkIds[0],
        instructions: form.instructions || undefined,
      },
      {
        onSuccess: (r) => {
          setOpen(false);
          setActiveId(r.id);
        },
      },
    );
  }

  // Compliance audit reports cannot be generated without at least one
  // standard — keep the UI in lockstep with the server-side guard.
  const submitDisabled =
    generate.isPending ||
    (form.kind === "compliance_audit" && form.frameworkIds.length === 0);

  return (
    <AppLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">AI Reports</h1>
            <p className="text-slate-600">
              Long-form audit, traceability, and executive reports generated from project data — refined by chat, exported to PDF/DOCX/HTML.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="report-new">
                <Sparkles className="h-4 w-4 mr-2" />
                Generate report
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate AI report</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Report kind</label>
                  <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v })}>
                    <SelectTrigger data-testid="report-kind-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(KIND_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          <div className="flex flex-col">
                            <span className="font-medium">{v}</span>
                            <span className="text-[10px] text-slate-500 max-w-[260px]">
                              {KIND_DESCRIPTIONS[k]}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {KIND_DESCRIPTIONS[form.kind] && (
                    <p className="text-[11px] text-slate-500 mt-1">{KIND_DESCRIPTIONS[form.kind]}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Audience tone</label>
                  <Select value={form.tone} onValueChange={(v) => setForm({ ...form, tone: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="executive">Executive (board-room)</SelectItem>
                      <SelectItem value="technical">Technical (engineering)</SelectItem>
                      <SelectItem value="regulator">Regulator / external auditor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <StandardsMultiSelect
                  value={form.frameworkIds}
                  onChange={(ids) => setForm({ ...form, frameworkIds: ids })}
                  required={form.kind === "compliance_audit"}
                  helper="Pick every standard this document must satisfy. Auditee will follow each one's required structure, language and citations."
                />
                {form.kind === "compliance_audit" && form.frameworkIds.length === 0 && (
                  <p className="text-[11px] text-amber-600">
                    Compliance audit reports need at least one standard selected.
                  </p>
                )}
                <div>
                  <label className="text-xs font-medium text-slate-600">Extra instructions (optional)</label>
                  <Textarea
                    rows={3}
                    placeholder="e.g. emphasise supplier risk, reference Q3 audit, target European market"
                    value={form.instructions}
                    onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                  />
                </div>
                {generate.error && <div className="text-sm text-red-600">{(generate.error as Error).message}</div>}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={submit} disabled={submitDisabled}>
                  {generate.isPending ? "Generating…" : "Generate"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader><CardTitle>Report library</CardTitle></CardHeader>
          <CardContent>
            {isLoading && <div className="text-sm text-slate-500">Loading…</div>}
            {data?.reports.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <FileText className="mx-auto h-10 w-10 mb-2 opacity-40" />
                No reports yet. Generate your first one above.
              </div>
            )}
            <div className="divide-y divide-slate-200">
              {data?.reports.map((r) => (
                <div key={r.id} className="py-3 flex items-center justify-between">
                  <button
                    className="text-left flex-1"
                    onClick={() => setActiveId(r.id)}
                    data-testid={`report-row-${r.id}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-[10px]">{KIND_LABELS[r.kind] ?? r.kind}</Badge>
                      <Badge variant="outline" className="text-[10px]">{r.tone}</Badge>
                    </div>
                    <div className="font-medium text-slate-900">{r.title}</div>
                    <div className="text-xs text-slate-500">Updated {new Date(r.updatedAt).toLocaleString()}</div>
                  </button>
                  <div className="flex items-center gap-1">
                    <a href={reportExportUrl(r.id, "pdf")} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1" />PDF</Button>
                    </a>
                    <a href={reportExportUrl(r.id, "docx")}>
                      <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1" />DOCX</Button>
                    </a>
                    <Button variant="ghost" size="icon" onClick={() => del.mutate(r.id)}>
                      <Trash2 className="h-4 w-4 text-slate-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {activeId && <ReportViewer id={activeId} onClose={() => setActiveId(null)} />}
      </div>
    </AppLayout>
  );
}

function ReportViewer({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: report, isLoading } = useReport(id);
  const refine = useRefineReport();
  const [instr, setInstr] = useState("");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {isLoading && <div className="text-sm text-slate-500">Loading…</div>}
        {report && (
          <>
            <DialogHeader>
              <DialogTitle>{report.title}</DialogTitle>
              {report.content.subtitle && <p className="text-sm text-slate-500">{report.content.subtitle}</p>}
            </DialogHeader>
            <div className="flex gap-2 mb-2">
              <a href={reportExportUrl(report.id, "html")} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1" />HTML</Button>
              </a>
              <a href={reportExportUrl(report.id, "pdf")} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1" />PDF (print)</Button>
              </a>
              <a href={reportExportUrl(report.id, "docx")}>
                <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1" />DOCX</Button>
              </a>
            </div>
            <div className="bg-slate-50 border-l-4 border-primary rounded p-4 my-3">
              <div className="text-xs font-bold text-slate-500 uppercase mb-1">Executive summary</div>
              <div className="text-sm text-slate-800 whitespace-pre-wrap">{report.content.executiveSummary}</div>
            </div>
            <div className="prose prose-sm max-w-none">
              {report.content.sections.map((s) => (
                <section key={s.id} className="mb-5">
                  <h3 className="font-semibold text-slate-900 border-b border-slate-200 pb-1 mb-2">{s.heading}</h3>
                  <div className="text-sm text-slate-700 whitespace-pre-wrap">{s.body}</div>
                  {s.citations && s.citations.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="text-[10px] uppercase text-slate-500 mr-1">Evidence:</span>
                      {s.citations.map((c) => (
                        <Badge key={c} variant="outline" className="font-mono text-[10px]">{c}</Badge>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
            <details className="border-t border-slate-200 pt-3 text-xs">
              <summary className="cursor-pointer font-semibold text-slate-700">Evidence index ({report.content.evidence.length})</summary>
              <ul className="mt-2 space-y-1 text-slate-600">
                {report.content.evidence.slice(0, 80).map((e) => (
                  <li key={e.id}><span className="font-mono">{e.id}</span> — {e.label} <em className="text-slate-400">({e.source})</em></li>
                ))}
              </ul>
            </details>
            <div className="border-t border-slate-200 pt-4 mt-2">
              <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                <RefreshCw className="h-3.5 w-3.5" />
                Refine with AI
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder='e.g. "shorten the exec summary" or "add a section on supplier risk"'
                  value={instr}
                  onChange={(e) => setInstr(e.target.value)}
                />
                <Button
                  disabled={refine.isPending || instr.trim().length < 3}
                  onClick={() =>
                    refine.mutate(
                      { id: report.id, instruction: instr },
                      { onSuccess: () => setInstr("") },
                    )
                  }
                >
                  {refine.isPending ? "Refining…" : "Refine"}
                </Button>
              </div>
              {refine.error && <div className="text-xs text-red-600 mt-2">{(refine.error as Error).message}</div>}
              {report.history.length > 1 && (
                <div className="mt-3 text-xs text-slate-500">
                  <div className="font-semibold mb-1">Refinement history</div>
                  <ul className="space-y-0.5">
                    {report.history.slice().reverse().map((h, i) => (
                      <li key={i}>· {h.instruction} <span className="text-slate-400">({new Date(h.at).toLocaleString()})</span></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <Comments entityType="report" entityId={report.id} projectId={report.projectId} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
