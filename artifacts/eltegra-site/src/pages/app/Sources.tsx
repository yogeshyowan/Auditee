import { useState, useRef, useEffect } from "react";
import { useProjectContext } from "@/lib/project-context";
import { useListComplianceFrameworks } from "@workspace/api-client-react";
import {
  useComplianceAudit,
  useTraceabilityAudit,
  useLatestAuditRun,
  type ComplianceAuditResult,
  type TraceabilityAuditResult,
  type CoverageStage,
} from "@/lib/ai-api";
import {
  useSources,
  useCreateSource,
  useSyncSource,
  useDeleteSource,
  useSourceFiles,
  useSourceFileContent,
  uploadZip,
  uploadFolder,
  uploadReqif,
  uploadDefectsFile,
  type ProjectSourceRow,
} from "@/lib/wave1-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Github,
  FolderUp,
  FileArchive,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CircleDot,
  FileCode2,
  Server,
  Cloud,
  HardDrive,
  Briefcase,
  Hammer,
  Globe,
  ChevronRight,
  Wand2,
  ShieldCheck,
  Download,
  ListChecks,
  FileText,
  BookOpen,
  GitBranch,
  Box,
  Building2,
  Bug,
  AlertOctagon,
  ShieldAlert,
  Activity,
  Layers,
  Zap,
  Upload,
} from "lucide-react";

type Kind = ProjectSourceRow["kind"];

type KindDef = {
  kind: Kind;
  title: string;
  blurb: string;
  icon: typeof Github;
  color: string;
  ingests: "code" | "metadata" | "requirements";
};

// Code & evidence sources — the previous set.
const KIND_DEFS: KindDef[] = [
  { kind: "github", title: "GitHub", blurb: "Pull source from any public or private repo by URL.", icon: Github, color: "bg-slate-900 text-white", ingests: "code" },
  { kind: "zip", title: "ZIP archive", blurb: "Upload a .zip of your project — files are extracted and indexed.", icon: FileArchive, color: "bg-amber-100 text-amber-800", ingests: "code" },
  { kind: "folder", title: "Project folder", blurb: "Drag a whole folder from your computer (browser permitting).", icon: FolderUp, color: "bg-emerald-100 text-emerald-800", ingests: "code" },
  { kind: "jira", title: "Jira (issues)", blurb: "Connect a Jira project — issues are pulled in as audit evidence.", icon: Briefcase, color: "bg-blue-100 text-blue-800", ingests: "metadata" },
  { kind: "alm", title: "ALM (Azure DevOps)", blurb: "Pull work items via WIQL from Azure DevOps Boards.", icon: Briefcase, color: "bg-sky-100 text-sky-800", ingests: "metadata" },
  { kind: "jenkins", title: "Jenkins", blurb: "Connect a Jenkins host or single job — recent builds are indexed.", icon: Hammer, color: "bg-rose-100 text-rose-800", ingests: "metadata" },
  { kind: "aws_s3", title: "AWS S3", blurb: "Index objects in an S3 bucket (read-only).", icon: Cloud, color: "bg-orange-100 text-orange-800", ingests: "metadata" },
  { kind: "gdrive", title: "Google Drive", blurb: "List files in a Drive folder by ID.", icon: HardDrive, color: "bg-yellow-100 text-yellow-800", ingests: "metadata" },
  { kind: "cloud_server", title: "Cloud server", blurb: "Probe a server URL and capture reachability evidence.", icon: Server, color: "bg-violet-100 text-violet-800", ingests: "metadata" },
  { kind: "url", title: "Public URL", blurb: "Probe an arbitrary URL for status + headers.", icon: Globe, color: "bg-cyan-100 text-cyan-800", ingests: "metadata" },
];

// Requirements-management connectors — pulls real requirement records into
// the Requirements page, tagged with the source they came from. Each kind is
// handled by a dedicated REST/OSLC client on the backend; ReqIF is a generic
// XML import for any tool that exports the OMG ReqIF standard (DOORS Classic,
// Visure, ReqView, Modern Requirements, Cradle, etc.).
const RM_KIND_DEFS: KindDef[] = [
  { kind: "doors_next", title: "IBM DOORS Next", blurb: "OSLC-RM connector for DOORS Next Generation (DNG 7.x).", icon: BookOpen, color: "bg-blue-100 text-blue-800", ingests: "requirements" },
  { kind: "doors", title: "IBM DOORS (Classic)", blurb: "Export your module as ReqIF from DOORS 9.x and upload it here.", icon: BookOpen, color: "bg-blue-100 text-blue-800", ingests: "requirements" },
  { kind: "jama", title: "Jama Connect", blurb: "REST integration — pulls items from a Jama project.", icon: ListChecks, color: "bg-rose-100 text-rose-800", ingests: "requirements" },
  { kind: "polarion", title: "Polarion ALM", blurb: "Siemens Polarion REST — pulls work items from a project.", icon: Box, color: "bg-emerald-100 text-emerald-800", ingests: "requirements" },
  { kind: "codebeamer", title: "codeBeamer", blurb: "PTC/Intland codeBeamer REST — pulls items from a tracker.", icon: ListChecks, color: "bg-orange-100 text-orange-800", ingests: "requirements" },
  { kind: "helix_rm", title: "Helix RM (Perforce)", blurb: "Perforce Helix ALM REST — pulls requirements from a project.", icon: Building2, color: "bg-indigo-100 text-indigo-800", ingests: "requirements" },
  { kind: "visure", title: "Visure Requirements", blurb: "REST integration with Visure Requirements ALM.", icon: ListChecks, color: "bg-purple-100 text-purple-800", ingests: "requirements" },
  { kind: "azure_devops", title: "Azure DevOps Boards", blurb: "WIQL query against Azure DevOps work items as requirements.", icon: GitBranch, color: "bg-sky-100 text-sky-800", ingests: "requirements" },
  { kind: "jira_reqs", title: "Jira (as requirements)", blurb: "Pull stories/features/epics from Jira as requirements.", icon: Briefcase, color: "bg-blue-100 text-blue-800", ingests: "requirements" },
  { kind: "reqif", title: "ReqIF / .reqifz upload", blurb: "Generic ReqIF (OMG) import — works for any RM tool that exports ReqIF.", icon: FileText, color: "bg-slate-100 text-slate-800", ingests: "requirements" },
];

// Defect-management connectors — pulls real defect/bug records from each tool
// and persists them with provenance. The audit pipeline reads these as direct
// evidence of incident-management maturity, problem-resolution effectiveness,
// and unresolved risk against safety/security controls.
const DEFECT_KIND_DEFS: KindDef[] = [
  { kind: "jira_defects", title: "Jira (Bugs)", blurb: "Pulls Jira issues of type Bug from a project.", icon: Bug, color: "bg-blue-100 text-blue-800", ingests: "metadata" },
  { kind: "ado_defects", title: "Azure DevOps (Bugs)", blurb: "WIQL query for Bug work items in Azure DevOps Boards.", icon: Bug, color: "bg-sky-100 text-sky-800", ingests: "metadata" },
  { kind: "bugzilla", title: "Bugzilla", blurb: "Mozilla Bugzilla REST — pulls bugs from a product.", icon: Bug, color: "bg-rose-100 text-rose-800", ingests: "metadata" },
  { kind: "mantis", title: "MantisBT", blurb: "MantisBT REST — pulls issues from a project.", icon: Bug, color: "bg-yellow-100 text-yellow-800", ingests: "metadata" },
  { kind: "redmine", title: "Redmine", blurb: "Redmine REST — pulls issues filtered by project.", icon: Layers, color: "bg-rose-100 text-rose-800", ingests: "metadata" },
  { kind: "youtrack", title: "JetBrains YouTrack", blurb: "YouTrack REST — pulls issues from a project.", icon: Zap, color: "bg-purple-100 text-purple-800", ingests: "metadata" },
  { kind: "clickup", title: "ClickUp", blurb: "ClickUp REST — pulls bug-tagged tasks from a list.", icon: ListChecks, color: "bg-pink-100 text-pink-800", ingests: "metadata" },
  { kind: "linear", title: "Linear", blurb: "Linear GraphQL — pulls bug-labelled issues from a team.", icon: Activity, color: "bg-indigo-100 text-indigo-800", ingests: "metadata" },
  { kind: "servicenow", title: "ServiceNow", blurb: "ServiceNow Table API — pulls incidents/problems.", icon: ShieldAlert, color: "bg-emerald-100 text-emerald-800", ingests: "metadata" },
  { kind: "alm_octane", title: "OpenText ALM Octane", blurb: "ALM Octane REST — pulls defects from a workspace.", icon: AlertOctagon, color: "bg-orange-100 text-orange-800", ingests: "metadata" },
  { kind: "github_issues", title: "GitHub Issues", blurb: "Pulls bug-labelled issues from a GitHub repository.", icon: Github, color: "bg-slate-900 text-white", ingests: "metadata" },
  { kind: "gitlab_issues", title: "GitLab Issues", blurb: "Pulls bug-labelled issues from a GitLab project.", icon: GitBranch, color: "bg-orange-100 text-orange-800", ingests: "metadata" },
];

// Synthetic kind for files uploaded via the "Upload exported file" flow
// (CSV / TSV / XLSX / XLS / PDF / JSON). Not shown as a connector tile, but
// rendered correctly in the Connected sources list when present.
const DEFECT_FILE_KIND_DEF: KindDef = {
  kind: "defects_file",
  title: "Defects file (uploaded)",
  blurb: "CSV / Excel / PDF / JSON export from any defect tool.",
  icon: Bug,
  color: "bg-rose-100 text-rose-800",
  ingests: "metadata",
};

const ALL_KIND_DEFS: KindDef[] = [...KIND_DEFS, ...RM_KIND_DEFS, ...DEFECT_KIND_DEFS, DEFECT_FILE_KIND_DEF];

const DEFECT_FILE_TOOLS: Array<{ value: string; label: string }> = [
  { value: "", label: "Auto-detect / generic" },
  { value: "jira", label: "Jira" },
  { value: "ado", label: "Azure DevOps" },
  { value: "bugzilla", label: "Bugzilla" },
  { value: "mantis", label: "MantisBT" },
  { value: "redmine", label: "Redmine" },
  { value: "youtrack", label: "JetBrains YouTrack" },
  { value: "clickup", label: "ClickUp" },
  { value: "linear", label: "Linear" },
  { value: "servicenow", label: "ServiceNow" },
  { value: "alm_octane", label: "OpenText ALM Octane" },
  { value: "github_issues", label: "GitHub Issues" },
  { value: "gitlab_issues", label: "GitLab Issues" },
  { value: "hp_qc", label: "HP / Micro Focus Quality Center" },
  { value: "trac", label: "Trac" },
  { value: "rally", label: "CA Rally / Broadcom Rally" },
  { value: "other", label: "Other" },
];

function statusBadge(s: ProjectSourceRow["status"]) {
  if (s === "ready") return <Badge variant="outline" className="bg-emerald-50 text-emerald-700"><CheckCircle2 className="h-3 w-3 mr-1" />ready</Badge>;
  if (s === "syncing") return <Badge variant="outline" className="bg-blue-50 text-blue-700"><Loader2 className="h-3 w-3 mr-1 animate-spin" />syncing</Badge>;
  if (s === "error") return <Badge variant="outline" className="bg-rose-50 text-rose-700"><AlertCircle className="h-3 w-3 mr-1" />error</Badge>;
  return <Badge variant="outline" className="bg-slate-100 text-slate-600"><CircleDot className="h-3 w-3 mr-1" />idle</Badge>;
}

function bytesHuman(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export default function Sources() {
  const { projectId } = useProjectContext();
  const { data, isLoading } = useSources(projectId);
  const create = useCreateSource();
  const sync = useSyncSource();
  const del = useDeleteSource();
  const { toast } = useToast();

  const [picker, setPicker] = useState<Kind | null>(null);
  const [browsing, setBrowsing] = useState<ProjectSourceRow | null>(null);
  const [auditing, setAuditing] = useState<ProjectSourceRow | null>(null);
  const [tracing, setTracing] = useState<ProjectSourceRow | null>(null);

  async function onUploadZip(file: File) {
    if (!projectId) return;
    try {
      await uploadZip(projectId, file, file.name);
      toast({ title: "ZIP indexed", description: file.name });
      window.location.reload();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
  }
  async function onUploadFolder(files: FileList) {
    if (!projectId) return;
    try {
      await uploadFolder(projectId, files, "Folder upload");
      toast({ title: "Folder indexed", description: `${files.length} files` });
      window.location.reload();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
  }
  async function onUploadReqif(file: File) {
    if (!projectId) return;
    try {
      const r = await uploadReqif(projectId, file, file.name);
      toast({
        title: "ReqIF imported",
        description: r.statusMessage ?? `${r.fileCount} requirements pulled in`,
      });
      window.location.reload();
    } catch (err: any) {
      toast({ title: "ReqIF import failed", description: err.message, variant: "destructive" });
    }
  }
  async function onUploadDefectsFile(file: File, tool?: string) {
    if (!projectId) return;
    try {
      const r = await uploadDefectsFile(projectId, file, tool, file.name);
      toast({
        title: "Defects file imported",
        description: r.syncResult?.summary ?? `${r.syncResult?.count ?? 0} defect(s) imported`,
      });
      window.location.reload();
    } catch (err: any) {
      toast({ title: "Defects import failed", description: err.message, variant: "destructive" });
    }
  }

  const sources = data?.sources ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Project Sources</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Bring your project into Auditee so the AI can audit it. Pull source from GitHub, upload a ZIP or folder, or
          connect Jira / Jenkins / AWS / Drive / ALM / a cloud server to ingest evidence for compliance reviews.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Code &amp; build evidence</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Pull in source code, repos, build artifacts and metadata so the AI can audit completeness and traceability.</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {KIND_DEFS.map((d) => (
              <button
                key={d.kind}
                data-testid={`kind-card-${d.kind}`}
                onClick={() => setPicker(d.kind)}
                className="text-left border rounded-lg p-3 hover:border-emerald-500 hover:shadow-sm transition group"
              >
                <div className={`inline-flex h-9 w-9 rounded-md items-center justify-center ${d.color} mb-2`}>
                  <d.icon className="h-5 w-5" />
                </div>
                <div className="font-medium text-sm">{d.title}</div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{d.blurb}</div>
                <div className="text-xs text-emerald-700 mt-2 inline-flex items-center opacity-0 group-hover:opacity-100 transition">
                  Connect <ChevronRight className="h-3 w-3 ml-0.5" />
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-emerald-700" /> Requirements management
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Pull existing requirements from your RM tool of record. Imported requirements show up on the Requirements page tagged with the source they came from.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {RM_KIND_DEFS.map((d) => (
              <button
                key={d.kind}
                data-testid={`kind-card-${d.kind}`}
                onClick={() => setPicker(d.kind)}
                className="text-left border rounded-lg p-3 hover:border-emerald-500 hover:shadow-sm transition group"
              >
                <div className={`inline-flex h-9 w-9 rounded-md items-center justify-center ${d.color} mb-2`}>
                  <d.icon className="h-5 w-5" />
                </div>
                <div className="font-medium text-sm">{d.title}</div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{d.blurb}</div>
                <div className="text-xs text-emerald-700 mt-2 inline-flex items-center opacity-0 group-hover:opacity-100 transition">
                  Connect <ChevronRight className="h-3 w-3 ml-0.5" />
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bug className="h-4 w-4 text-rose-700" /> Defect management
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Connect your bug-tracker of record — or skip the connector and just upload an exported file. Imported defects are weighed by the auditor: open critical bugs count against incident-response and problem-resolution controls; healthy close-rates count for them.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <DefectFileUploadPanel projectId={projectId} onUpload={onUploadDefectsFile} />
          <div className="text-xs text-muted-foreground uppercase tracking-wide pt-1">Or connect a live tool</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {DEFECT_KIND_DEFS.map((d) => (
              <button
                key={d.kind}
                data-testid={`kind-card-${d.kind}`}
                onClick={() => setPicker(d.kind)}
                className="text-left border rounded-lg p-3 hover:border-emerald-500 hover:shadow-sm transition group"
              >
                <div className={`inline-flex h-9 w-9 rounded-md items-center justify-center ${d.color} mb-2`}>
                  <d.icon className="h-5 w-5" />
                </div>
                <div className="font-medium text-sm">{d.title}</div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{d.blurb}</div>
                <div className="text-xs text-emerald-700 mt-2 inline-flex items-center opacity-0 group-hover:opacity-100 transition">
                  Connect <ChevronRight className="h-3 w-3 ml-0.5" />
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connected sources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
          {sources.length === 0 && !isLoading && (
            <div className="text-sm text-muted-foreground p-6 text-center border-2 border-dashed rounded-md">
              No sources yet. Connect one above to start auditing.
            </div>
          )}
          {sources.map((s) => {
            const def = ALL_KIND_DEFS.find((d) => d.kind === s.kind);
            const canSync = s.kind !== "zip" && s.kind !== "folder" && s.kind !== "reqif" && s.kind !== "doors" && s.kind !== "defects_file";
            return (
              <div key={s.id} className="flex items-center gap-3 border rounded-md p-3 hover:bg-slate-50">
                <div className={`h-9 w-9 rounded-md flex items-center justify-center ${def?.color ?? "bg-slate-100"}`}>
                  {def && <def.icon className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{s.label}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                    <span className="capitalize">{def?.title ?? s.kind}</span>
                    <span>·</span>
                    <span>{s.fileCount} files · {bytesHuman(s.byteCount)}</span>
                    {s.lastSyncAt && <><span>·</span><span>synced {new Date(s.lastSyncAt).toLocaleString()}</span></>}
                  </div>
                  {s.statusMessage && <div className="text-xs text-muted-foreground mt-0.5 italic">{s.statusMessage}</div>}
                </div>
                {statusBadge(s.status)}
                <Button
                  variant="default"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={s.status !== "ready"}
                  onClick={() => setAuditing(s)}
                  title={s.status !== "ready" ? "Source must be in 'ready' state to audit" : "Run AI audit on this source"}
                >
                  <Wand2 className="h-3 w-3 mr-1" /> Run audit
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700"
                  disabled={s.status !== "ready"}
                  onClick={() => setTracing(s)}
                  title={s.status !== "ready" ? "Source must be in 'ready' state to check completeness" : "Audit traceability completeness across architecture → design → implementation → testing → deployment"}
                >
                  <ShieldCheck className="h-3 w-3 mr-1" /> Check completeness
                </Button>
                <Button variant="outline" size="sm" onClick={() => setBrowsing(s)}>
                  <FileCode2 className="h-3 w-3 mr-1" /> Browse
                </Button>
                {canSync && (
                  <Button variant="outline" size="sm" disabled={sync.isPending} onClick={() => sync.mutate(s.id)}>
                    <RefreshCw className={`h-3 w-3 mr-1 ${sync.isPending ? "animate-spin" : ""}`} /> Sync
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => del.mutate(s.id)}>
                  <Trash2 className="h-4 w-4 text-rose-600" />
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <ConnectDialog
        kind={picker}
        onClose={() => setPicker(null)}
        projectId={projectId}
        onCreate={async (kind, label, config) => {
          if (!projectId) return;
          const created = await create.mutateAsync({ projectId, kind, label, config });
          toast({ title: "Source connected", description: label });
          if (kind !== "zip" && kind !== "folder") {
            try {
              await sync.mutateAsync(created.id);
              toast({ title: "Initial sync complete" });
            } catch (err: any) {
              toast({ title: "Sync failed", description: err.message, variant: "destructive" });
            }
          }
          setPicker(null);
        }}
        onZip={onUploadZip}
        onFolder={onUploadFolder}
        onReqif={onUploadReqif}
      />

      <BrowseDialog source={browsing} onClose={() => setBrowsing(null)} />
      <RunAuditDialog source={auditing} projectId={projectId} onClose={() => setAuditing(null)} />
      <TraceabilityAuditDialog source={tracing} projectId={projectId} onClose={() => setTracing(null)} />
    </div>
  );
}

// ───────── Defect-file upload panel ─────────
// Inline upload control inside the Defect-management card. Lets the user pick
// a CSV / TSV / XLSX / XLS / PDF / JSON exported from any defect tool, tag
// which tool it came from (display only), and post it to /sources/upload-defects-file.
function DefectFileUploadPanel({
  projectId,
  onUpload,
}: {
  projectId: string | undefined;
  onUpload: (file: File, tool?: string) => Promise<void>;
}) {
  const [tool, setTool] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const onPick = () => inputRef.current?.click();
  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      await onUpload(file, tool || undefined);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };
  return (
    <div className="rounded-lg border-2 border-dashed border-rose-200 bg-rose-50/40 p-4 flex flex-col sm:flex-row sm:items-end gap-3">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-rose-900 flex items-center gap-2">
          <FileArchive className="h-4 w-4" /> Upload an exported defects file
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Supports <strong>CSV, TSV, Excel (.xlsx / .xls), PDF, and JSON</strong> exports from
          Jira, Azure DevOps, Bugzilla, MantisBT, Redmine, YouTrack, ClickUp, Linear,
          ServiceNow, ALM Octane, GitHub / GitLab Issues, HP QC, Trac, Rally, or any
          other tool. Header columns are auto-mapped (ID/Key, Title/Summary, Status,
          Severity, Priority, Created, Resolved). No connector or credentials needed.
        </div>
      </div>
      <div className="flex items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-muted-foreground uppercase">Source tool</label>
          <select
            value={tool}
            onChange={(e) => setTool(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            data-testid="select-defect-tool"
          >
            {DEFECT_FILE_TOOLS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.tsv,.xlsx,.xls,.pdf,.json,text/csv,text/tab-separated-values,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/pdf,application/json"
          className="hidden"
          onChange={onChange}
          data-testid="input-defect-file"
        />
        <Button
          onClick={onPick}
          disabled={!projectId || busy}
          className="bg-rose-600 hover:bg-rose-700 text-white gap-2"
          data-testid="button-upload-defects-file"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {busy ? "Uploading…" : "Choose file"}
        </Button>
      </div>
    </div>
  );
}

function ConnectDialog({
  kind,
  onClose,
  projectId,
  onCreate,
  onZip,
  onFolder,
  onReqif,
}: {
  kind: Kind | null;
  onClose: () => void;
  projectId: string | undefined;
  onCreate: (kind: Kind, label: string, config: Record<string, any>) => Promise<void>;
  onZip: (file: File) => Promise<void>;
  onFolder: (files: FileList) => Promise<void>;
  onReqif: (file: File) => Promise<void>;
}) {
  const [label, setLabel] = useState("");
  const [cfg, setCfg] = useState<Record<string, any>>({});
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const reqifRef = useRef<HTMLInputElement>(null);

  if (!kind) return null;
  const def = ALL_KIND_DEFS.find((d) => d.kind === kind)!;

  function up(k: string, v: string) { setCfg((p) => ({ ...p, [k]: v })); }

  async function submit() {
    setBusy(true);
    try {
      await onCreate(kind!, label || def.title, cfg);
    } finally {
      setBusy(false);
      setLabel(""); setCfg({});
    }
  }

  let body: React.ReactNode = null;
  if (kind === "zip") {
    body = (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Upload a ZIP. Files inside will be extracted and indexed (skipping node_modules, .git, etc).</p>
        <input ref={fileRef} type="file" accept=".zip,application/zip" hidden
          onChange={async (e) => { const f = e.target.files?.[0]; if (f) { setBusy(true); await onZip(f); setBusy(false); onClose(); } }} />
        <Button className="w-full" disabled={busy || !projectId} onClick={() => fileRef.current?.click()}>
          <FileArchive className="h-4 w-4 mr-2" /> {busy ? "Uploading…" : "Choose ZIP file"}
        </Button>
      </div>
    );
  } else if (kind === "folder") {
    body = (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Pick a folder from your computer. Chromium-based browsers support full directory upload.</p>
        <input
          ref={folderRef}
          type="file"
          // @ts-expect-error chrome attrs
          webkitdirectory=""
          directory=""
          multiple
          hidden
          onChange={async (e) => { const fs = e.target.files; if (fs && fs.length) { setBusy(true); await onFolder(fs); setBusy(false); onClose(); } }}
        />
        <Button className="w-full" disabled={busy || !projectId} onClick={() => folderRef.current?.click()}>
          <FolderUp className="h-4 w-4 mr-2" /> {busy ? "Uploading…" : "Choose folder"}
        </Button>
      </div>
    );
  } else if (kind === "github") {
    body = (
      <div className="space-y-3">
        <Field label="Repository URL" placeholder="https://github.com/owner/repo" value={cfg.repoUrl ?? ""} onChange={(v) => up("repoUrl", v)} />
        <Field label="Branch (optional)" placeholder="main" value={cfg.branch ?? ""} onChange={(v) => up("branch", v)} />
        <Field
          label="Personal access token (recommended — required for private repos)"
          type="password"
          placeholder="ghp_… or github_pat_…"
          value={cfg.token ?? ""}
          onChange={(v) => up("token", v)}
        />
        <p className="text-xs text-slate-500 leading-relaxed -mt-1">
          GitHub limits anonymous calls from shared cloud IPs to 60/hour, which fills up fast.
          A token raises that to 5,000/hour. Create one at{" "}
          <a
            href="https://github.com/settings/tokens?type=beta"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            github.com/settings/tokens
          </a>{" "}
          with read-only "Contents" + "Metadata" scope on the repo.
        </p>
      </div>
    );
  } else if (kind === "jira") {
    body = (
      <div className="space-y-3">
        <Field label="Jira host" placeholder="https://yourorg.atlassian.net" value={cfg.host ?? ""} onChange={(v) => up("host", v)} />
        <Field label="Project key" placeholder="ABC" value={cfg.projectKey ?? ""} onChange={(v) => up("projectKey", v)} />
        <Field label="Email" value={cfg.email ?? ""} onChange={(v) => up("email", v)} />
        <Field label="API token" type="password" value={cfg.token ?? ""} onChange={(v) => up("token", v)} />
      </div>
    );
  } else if (kind === "jenkins") {
    body = (
      <div className="space-y-3">
        <Field label="Jenkins host" placeholder="https://ci.example.com" value={cfg.host ?? ""} onChange={(v) => up("host", v)} />
        <Field label="Job name (optional)" value={cfg.jobName ?? ""} onChange={(v) => up("jobName", v)} />
        <Field label="User" value={cfg.user ?? ""} onChange={(v) => up("user", v)} />
        <Field label="API token" type="password" value={cfg.token ?? ""} onChange={(v) => up("token", v)} />
      </div>
    );
  } else if (kind === "aws_s3") {
    body = (
      <div className="space-y-3">
        <Field label="Region" placeholder="us-east-1" value={cfg.region ?? ""} onChange={(v) => up("region", v)} />
        <Field label="Bucket" value={cfg.bucket ?? ""} onChange={(v) => up("bucket", v)} />
        <Field label="Access key ID" value={cfg.accessKeyId ?? ""} onChange={(v) => up("accessKeyId", v)} />
        <Field label="Secret access key" type="password" value={cfg.secretAccessKey ?? ""} onChange={(v) => up("secretAccessKey", v)} />
      </div>
    );
  } else if (kind === "gdrive") {
    body = (
      <div className="space-y-3">
        <Field label="Folder ID" placeholder="1AbCdEf..." value={cfg.folderId ?? ""} onChange={(v) => up("folderId", v)} />
        <Field label="API key" type="password" value={cfg.apiKey ?? ""} onChange={(v) => up("apiKey", v)} />
      </div>
    );
  } else if (kind === "alm") {
    body = (
      <div className="space-y-3">
        <Field label="Host" placeholder="https://dev.azure.com/yourorg" value={cfg.host ?? ""} onChange={(v) => up("host", v)} />
        <Field label="Project ID / name" value={cfg.projectId ?? ""} onChange={(v) => up("projectId", v)} />
        <Field label="Personal access token" type="password" value={cfg.token ?? ""} onChange={(v) => up("token", v)} />
      </div>
    );
  } else if (kind === "cloud_server" || kind === "url") {
    body = (
      <div className="space-y-3">
        <Field label="URL" placeholder="https://your-server.example.com/health" value={cfg.url ?? ""} onChange={(v) => up("url", v)} />
      </div>
    );
  } else if (kind === "doors_next") {
    body = (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">IBM DOORS Next Generation (DNG 7.x) over OSLC. Use the URL of the JTS root.</p>
        <Field label="DOORS Next host" placeholder="https://jazz.example.com" value={cfg.host ?? ""} onChange={(v) => up("host", v)} />
        <Field label="Project area URL" placeholder="https://jazz.example.com/rm/process/project-areas/_xxx" value={cfg.projectArea ?? ""} onChange={(v) => up("projectArea", v)} />
        <Field label="Bearer token (PAT)" type="password" value={cfg.token ?? ""} onChange={(v) => up("token", v)} />
      </div>
    );
  } else if (kind === "doors") {
    body = (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          IBM DOORS Classic (9.x) has no public REST API. Export your module from DOORS as <strong>ReqIF</strong> (File → Export → ReqIF) and upload the resulting <code>.reqif</code> or <code>.reqifz</code> file here.
        </p>
        <input
          ref={reqifRef}
          type="file"
          accept=".reqif,.reqifz,application/xml,application/zip"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) { setBusy(true); await onReqif(f); setBusy(false); onClose(); }
          }}
        />
        <Button className="w-full" disabled={busy || !projectId} onClick={() => reqifRef.current?.click()}>
          <FileText className="h-4 w-4 mr-2" /> {busy ? "Importing…" : "Choose ReqIF export"}
        </Button>
      </div>
    );
  } else if (kind === "jama") {
    body = (
      <div className="space-y-3">
        <Field label="Jama host" placeholder="https://yourorg.jamacloud.com" value={cfg.host ?? ""} onChange={(v) => up("host", v)} />
        <Field label="Project ID" placeholder="42" value={cfg.projectId ?? ""} onChange={(v) => up("projectId", v)} />
        <Field label="Access token" type="password" value={cfg.token ?? ""} onChange={(v) => up("token", v)} />
      </div>
    );
  } else if (kind === "polarion") {
    body = (
      <div className="space-y-3">
        <Field label="Polarion host" placeholder="https://polarion.example.com" value={cfg.host ?? ""} onChange={(v) => up("host", v)} />
        <Field label="Project ID" placeholder="elibrary" value={cfg.projectId ?? ""} onChange={(v) => up("projectId", v)} />
        <Field label="Bearer token" type="password" value={cfg.token ?? ""} onChange={(v) => up("token", v)} />
      </div>
    );
  } else if (kind === "codebeamer") {
    body = (
      <div className="space-y-3">
        <Field label="codeBeamer host" placeholder="https://codebeamer.example.com" value={cfg.host ?? ""} onChange={(v) => up("host", v)} />
        <Field label="Tracker ID" placeholder="1234" value={cfg.trackerId ?? ""} onChange={(v) => up("trackerId", v)} />
        <Field label="User (optional, for basic auth)" value={cfg.user ?? ""} onChange={(v) => up("user", v)} />
        <Field label="Password / token" type="password" value={cfg.token ?? ""} onChange={(v) => up("token", v)} />
      </div>
    );
  } else if (kind === "helix_rm") {
    body = (
      <div className="space-y-3">
        <Field label="Helix host" placeholder="https://helix.example.com" value={cfg.host ?? ""} onChange={(v) => up("host", v)} />
        <Field label="Project ID" value={cfg.projectId ?? ""} onChange={(v) => up("projectId", v)} />
        <Field label="User (optional, for basic auth)" value={cfg.user ?? ""} onChange={(v) => up("user", v)} />
        <Field label="Password / token" type="password" value={cfg.token ?? ""} onChange={(v) => up("token", v)} />
      </div>
    );
  } else if (kind === "visure") {
    body = (
      <div className="space-y-3">
        <Field label="Visure host" placeholder="https://visure.example.com" value={cfg.host ?? ""} onChange={(v) => up("host", v)} />
        <Field label="Project key" value={cfg.projectKey ?? ""} onChange={(v) => up("projectKey", v)} />
        <Field label="Access token" type="password" value={cfg.token ?? ""} onChange={(v) => up("token", v)} />
      </div>
    );
  } else if (kind === "azure_devops") {
    body = (
      <div className="space-y-3">
        <Field label="Org URL" placeholder="https://dev.azure.com/yourorg" value={cfg.orgUrl ?? ""} onChange={(v) => up("orgUrl", v)} />
        <Field label="Project" placeholder="MyProject" value={cfg.projectId ?? ""} onChange={(v) => up("projectId", v)} />
        <Field label="Personal access token" type="password" value={cfg.token ?? ""} onChange={(v) => up("token", v)} />
        <Field label="WIQL (optional override)" placeholder="SELECT [System.Id] FROM WorkItems WHERE …" value={cfg.wiql ?? ""} onChange={(v) => up("wiql", v)} />
      </div>
    );
  } else if (kind === "jira_reqs") {
    body = (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Pulls Stories / Features / Epics / Requirements from Jira and inserts them as requirements (separate from the Jira-issues evidence connector).</p>
        <Field label="Jira host" placeholder="https://yourorg.atlassian.net" value={cfg.host ?? ""} onChange={(v) => up("host", v)} />
        <Field label="Project key" placeholder="ABC" value={cfg.projectKey ?? ""} onChange={(v) => up("projectKey", v)} />
        <Field label="Email (Atlassian Cloud only)" value={cfg.email ?? ""} onChange={(v) => up("email", v)} />
        <Field label="API token / PAT" type="password" value={cfg.token ?? ""} onChange={(v) => up("token", v)} />
      </div>
    );
  } else if (kind === "reqif") {
    body = (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Generic ReqIF (OMG) import. Works with anything that exports the ReqIF standard — DOORS Classic, Visure, ReqView, Modern Requirements, Cradle, Innoslate, etc. Upload either a <code>.reqif</code> XML file or a <code>.reqifz</code> archive.
        </p>
        <input
          ref={reqifRef}
          type="file"
          accept=".reqif,.reqifz,application/xml,application/zip"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) { setBusy(true); await onReqif(f); setBusy(false); onClose(); }
          }}
        />
        <Button className="w-full" disabled={busy || !projectId} onClick={() => reqifRef.current?.click()}>
          <FileText className="h-4 w-4 mr-2" /> {busy ? "Importing…" : "Choose .reqif / .reqifz"}
        </Button>
      </div>
    );
  } else if (kind === "jira_defects") {
    body = (
      <div className="space-y-3">
        <Field label="Jira host" placeholder="https://acme.atlassian.net" value={cfg.host ?? ""} onChange={(v) => up("host", v)} />
        <Field label="Project key" placeholder="ENG" value={cfg.projectKey ?? ""} onChange={(v) => up("projectKey", v)} />
        <Field label="Account email" placeholder="you@acme.com" value={cfg.email ?? ""} onChange={(v) => up("email", v)} />
        <Field label="API token" type="password" value={cfg.token ?? ""} onChange={(v) => up("token", v)} />
        <Field label="Extra JQL (optional)" placeholder='resolution = Unresolved' value={cfg.jql ?? ""} onChange={(v) => up("jql", v)} />
      </div>
    );
  } else if (kind === "ado_defects") {
    body = (
      <div className="space-y-3">
        <Field label="Organization URL" placeholder="https://dev.azure.com/acme" value={cfg.orgUrl ?? ""} onChange={(v) => up("orgUrl", v)} />
        <Field label="Project name" placeholder="MyProject" value={cfg.project ?? ""} onChange={(v) => up("project", v)} />
        <Field label="Personal access token" type="password" value={cfg.pat ?? ""} onChange={(v) => up("pat", v)} />
        <Field label="WIQL filter (optional)" placeholder="[State] <> 'Closed'" value={cfg.wiql ?? ""} onChange={(v) => up("wiql", v)} />
      </div>
    );
  } else if (kind === "bugzilla") {
    body = (
      <div className="space-y-3">
        <Field label="Bugzilla host" placeholder="https://bugzilla.acme.com" value={cfg.host ?? ""} onChange={(v) => up("host", v)} />
        <Field label="Product name" placeholder="MyProduct" value={cfg.product ?? ""} onChange={(v) => up("product", v)} />
        <Field label="API key" type="password" value={cfg.apiKey ?? ""} onChange={(v) => up("apiKey", v)} />
      </div>
    );
  } else if (kind === "mantis") {
    body = (
      <div className="space-y-3">
        <Field label="Mantis host" placeholder="https://mantis.acme.com" value={cfg.host ?? ""} onChange={(v) => up("host", v)} />
        <Field label="Project ID" placeholder="1" value={cfg.projectId ?? ""} onChange={(v) => up("projectId", v)} />
        <Field label="API token" type="password" value={cfg.token ?? ""} onChange={(v) => up("token", v)} />
      </div>
    );
  } else if (kind === "redmine") {
    body = (
      <div className="space-y-3">
        <Field label="Redmine host" placeholder="https://redmine.acme.com" value={cfg.host ?? ""} onChange={(v) => up("host", v)} />
        <Field label="Project identifier" placeholder="my-project" value={cfg.projectId ?? ""} onChange={(v) => up("projectId", v)} />
        <Field label="API key" type="password" value={cfg.apiKey ?? ""} onChange={(v) => up("apiKey", v)} />
      </div>
    );
  } else if (kind === "youtrack") {
    body = (
      <div className="space-y-3">
        <Field label="YouTrack host" placeholder="https://acme.youtrack.cloud" value={cfg.host ?? ""} onChange={(v) => up("host", v)} />
        <Field label="Project short name" placeholder="ENG" value={cfg.projectKey ?? ""} onChange={(v) => up("projectKey", v)} />
        <Field label="Permanent token" type="password" value={cfg.token ?? ""} onChange={(v) => up("token", v)} />
      </div>
    );
  } else if (kind === "clickup") {
    body = (
      <div className="space-y-3">
        <Field label="List ID" placeholder="901234567890" value={cfg.listId ?? ""} onChange={(v) => up("listId", v)} />
        <Field label="Personal API token" type="password" value={cfg.token ?? ""} onChange={(v) => up("token", v)} />
      </div>
    );
  } else if (kind === "linear") {
    body = (
      <div className="space-y-3">
        <Field label="Team key" placeholder="ENG" value={cfg.teamKey ?? ""} onChange={(v) => up("teamKey", v)} />
        <Field label="API key" type="password" value={cfg.apiKey ?? ""} onChange={(v) => up("apiKey", v)} />
      </div>
    );
  } else if (kind === "servicenow") {
    body = (
      <div className="space-y-3">
        <Field label="Instance host" placeholder="https://acme.service-now.com" value={cfg.instance ?? ""} onChange={(v) => up("instance", v)} />
        <Field label="Username" value={cfg.username ?? ""} onChange={(v) => up("username", v)} />
        <Field label="Password" type="password" value={cfg.password ?? ""} onChange={(v) => up("password", v)} />
        <Field label="Table name (optional)" placeholder="incident" value={cfg.table ?? ""} onChange={(v) => up("table", v)} />
      </div>
    );
  } else if (kind === "alm_octane") {
    body = (
      <div className="space-y-3">
        <Field label="Octane host" placeholder="https://octane.acme.com" value={cfg.host ?? ""} onChange={(v) => up("host", v)} />
        <Field label="Shared space ID" placeholder="1001" value={cfg.sharedSpaceId ?? ""} onChange={(v) => up("sharedSpaceId", v)} />
        <Field label="Workspace ID" placeholder="1002" value={cfg.workspaceId ?? ""} onChange={(v) => up("workspaceId", v)} />
        <Field label="Client ID" value={cfg.clientId ?? ""} onChange={(v) => up("clientId", v)} />
        <Field label="Client secret" type="password" value={cfg.clientSecret ?? ""} onChange={(v) => up("clientSecret", v)} />
      </div>
    );
  } else if (kind === "github_issues") {
    body = (
      <div className="space-y-3">
        <Field label="Owner (user or org)" placeholder="acme" value={cfg.owner ?? ""} onChange={(v) => up("owner", v)} />
        <Field label="Repository name" placeholder="my-app" value={cfg.repo ?? ""} onChange={(v) => up("repo", v)} />
        <Field label="Personal access token" type="password" value={cfg.token ?? ""} onChange={(v) => up("token", v)} />
        <Field label="Bug label (optional)" placeholder="bug" value={cfg.labels ?? ""} onChange={(v) => up("labels", v)} />
      </div>
    );
  } else if (kind === "gitlab_issues") {
    body = (
      <div className="space-y-3">
        <Field label="GitLab host (optional)" placeholder="https://gitlab.com" value={cfg.host ?? ""} onChange={(v) => up("host", v)} />
        <Field label="Project ID" placeholder="278964" value={cfg.projectId ?? ""} onChange={(v) => up("projectId", v)} />
        <Field label="Personal access token" type="password" value={cfg.token ?? ""} onChange={(v) => up("token", v)} />
        <Field label="Bug label (optional)" placeholder="bug" value={cfg.labels ?? ""} onChange={(v) => up("labels", v)} />
      </div>
    );
  }

  // File-upload kinds handle their own submit flow.
  const showSubmit = kind !== "zip" && kind !== "folder" && kind !== "reqif" && kind !== "doors";

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <def.icon className="h-5 w-5" /> Connect {def.title}
          </DialogTitle>
          <DialogDescription>{def.blurb}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {showSubmit && <Field label="Label" placeholder={`My ${def.title}`} value={label} onChange={setLabel} />}
          {body}
        </div>
        {showSubmit && (
          <DialogFooter>
            <Button onClick={submit} disabled={busy}>{busy ? "Connecting…" : "Connect & sync"}</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <Label className="text-xs uppercase text-muted-foreground">{label}</Label>
      <Input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="mt-1" />
    </div>
  );
}

// ───────── Browse dialog (file tree + viewer) ─────────
function BrowseDialog({ source, onClose }: { source: ProjectSourceRow | null; onClose: () => void }) {
  const { data } = useSourceFiles(source?.id);
  const [selected, setSelected] = useState<string | null>(null);
  const fileQ = useSourceFileContent(source?.id, selected ?? undefined);

  if (!source) return null;
  const files = data?.files ?? [];

  return (
    <Dialog open onOpenChange={(o) => !o && (setSelected(null), onClose())}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Browse: {source.label}</DialogTitle>
          <DialogDescription>{data?.totals.count ?? 0} files · {bytesHuman(data?.totals.bytes ?? 0)}</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="files">
          <TabsList>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="config">Connection details</TabsTrigger>
          </TabsList>
          <TabsContent value="files" className="mt-3">
            <div className="grid grid-cols-12 gap-3 h-[60vh]">
              <div className="col-span-5 border rounded-md overflow-y-auto">
                {files.length === 0 && <div className="p-4 text-sm text-muted-foreground">No files indexed yet.</div>}
                {files.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelected(f.id)}
                    className={`w-full text-left text-xs px-2 py-1.5 border-b hover:bg-slate-50 truncate ${selected === f.id ? "bg-emerald-50 font-medium" : ""}`}
                    title={f.path}
                  >
                    {f.path} <span className="text-muted-foreground">({bytesHuman(f.size)})</span>
                  </button>
                ))}
              </div>
              <div className="col-span-7 border rounded-md overflow-auto bg-slate-950 text-slate-100 font-mono text-xs">
                {!selected && <div className="p-4 text-slate-400">Select a file to preview.</div>}
                {selected && fileQ.isLoading && <div className="p-4 text-slate-400">Loading…</div>}
                {selected && fileQ.data && (
                  <pre className="p-3 whitespace-pre-wrap break-words">
                    {fileQ.data.content ?? `(binary or large file — ${bytesHuman(fileQ.data.size)})`}
                  </pre>
                )}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="config" className="mt-3">
            <pre className="text-xs bg-slate-50 p-3 rounded-md border overflow-auto">{JSON.stringify(source.config, null, 2)}</pre>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ───────── Run Audit dialog (pick standard → generate report) ─────────
function RunAuditDialog({
  source,
  projectId,
  onClose,
}: {
  source: ProjectSourceRow | null;
  projectId: string | null;
  onClose: () => void;
}) {
  const { data: frameworks, isLoading: fwLoading, error: fwError } = useListComplianceFrameworks();
  const audit = useComplianceAudit();
  const { toast } = useToast();
  const [picked, setPicked] = useState<string | null>(null);
  const [result, setResult] = useState<ComplianceAuditResult | null>(null);
  const [hydratedRunAt, setHydratedRunAt] = useState<string | null>(null);
  // Re-load any prior run for this (source, framework) so the dialog can
  // show it instead of forcing a re-spend on the LLM.
  const latest = useLatestAuditRun<ComplianceAuditResult>(source?.id ?? null, "compliance", picked);
  useEffect(() => {
    if (latest.data && !result) {
      setResult(latest.data.result);
      setHydratedRunAt(latest.data.runAt);
    }
  }, [latest.data, result]);

  if (!source) return null;

  async function run() {
    if (!source || !picked) return;
    if (!projectId) {
      toast({
        title: "No project selected",
        description: "Pick a project in the top-left switcher before running an audit.",
        variant: "destructive",
      });
      return;
    }
    setResult(null);
    try {
      const r = await audit.mutateAsync({ projectId, frameworkId: picked, sourceIds: [source.id] });
      setResult(r);
    } catch (err: any) {
      toast({ title: "Audit failed", description: err.message ?? "Unknown error", variant: "destructive" });
    }
  }

  function reset() { setResult(null); setPicked(null); setHydratedRunAt(null); }
  function close() { reset(); onClose(); }

  function fileBase() {
    return `audit-${result!.framework.code.replace(/\s+/g, "-")}-${source!.label.replace(/\s+/g, "-")}`;
  }
  function downloadMarkdown() {
    if (!result) return;
    downloadBlob(renderAuditMarkdown(result, source!), "text/markdown", `${fileBase()}.md`);
  }
  function downloadCsv() {
    if (!result) return;
    downloadBlob(renderAuditCsv(result), "text/csv;charset=utf-8", `${fileBase()}.csv`);
  }
  function downloadPdf() {
    if (!result) return;
    openPrintWindow(renderAuditHtml(result, source!), `${fileBase()}.pdf`);
  }

  const verdictColor: Record<ComplianceAuditResult["overallVerdict"], string> = {
    strong: "bg-emerald-100 text-emerald-800 border-emerald-300",
    adequate: "bg-blue-100 text-blue-800 border-blue-300",
    weak: "bg-amber-100 text-amber-800 border-amber-300",
    failing: "bg-rose-100 text-rose-800 border-rose-300",
  };

  return (
    <Dialog open={!!source} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            Audit “{source.label}”
          </DialogTitle>
          <DialogDescription>
            Pick a standard. Auditee will analyse this source against every control in the framework and produce a grounded report.
          </DialogDescription>
        </DialogHeader>

        {!result && (
          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Standard / framework</Label>
              {fwLoading ? (
                <div className="text-sm text-muted-foreground py-3 flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading frameworks…
                </div>
              ) : fwError ? (
                <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-md p-3 mt-2">
                  Couldn't load frameworks. {String((fwError as any)?.message ?? "Please try again.")}
                </div>
              ) : !frameworks || frameworks.length === 0 ? (
                <div className="text-sm text-slate-600 bg-slate-50 border border-dashed rounded-md p-4 mt-2 text-center">
                  No compliance frameworks are configured. Ask an admin to seed standards before running audits.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {frameworks.map((fw: any) => {
                    const active = picked === fw.id;
                    return (
                      <button
                        key={fw.id}
                        onClick={() => setPicked(fw.id)}
                        className={`text-left border rounded-md p-3 transition ${
                          active ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500" : "hover:border-slate-400"
                        }`}
                      >
                        <div className="text-xs font-mono text-emerald-700">{fw.code}</div>
                        <div className="font-medium text-sm mt-0.5">{fw.name}</div>
                        {fw.category && (
                          <div className="text-xs text-muted-foreground mt-1">{fw.category}</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-slate-50 border rounded-md p-3 text-xs text-slate-600">
              <div className="flex items-center gap-2 mb-1 font-medium text-slate-800">
                <FileCode2 className="h-3.5 w-3.5" /> Evidence ingested
              </div>
              <div>{source.fileCount} files · {bytesHuman(source.byteCount)} indexed from <span className="font-mono">{source.kind}</span></div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={close}>Cancel</Button>
              <Button
                onClick={run}
                disabled={!picked || !projectId || audit.isPending}
                title={!projectId ? "Select a project first" : !picked ? "Pick a standard first" : "Run AI audit"}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {audit.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running audit…</>
                ) : (
                  <><Wand2 className="h-4 w-4 mr-2" /> Generate audit report</>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className={`border rounded-md p-4 ${verdictColor[result.overallVerdict]}`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wider opacity-80">Overall verdict — {result.framework.code}</div>
                  <div className="text-2xl font-semibold capitalize mt-0.5">{result.overallVerdict}</div>
                </div>
                <CompliancePctGauge
                  pct={result.compliancePercentage}
                  summary={result.controlSummary}
                />
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <Button variant="outline" size="sm" onClick={downloadMarkdown} className="bg-white" data-testid="audit-download-md">
                    <Download className="h-3.5 w-3.5 mr-1.5" /> .md
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadCsv} className="bg-white" data-testid="audit-download-csv">
                    <Download className="h-3.5 w-3.5 mr-1.5" /> .csv
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadPdf} className="bg-white" data-testid="audit-download-pdf">
                    <Download className="h-3.5 w-3.5 mr-1.5" /> .pdf
                  </Button>
                </div>
              </div>
              {hydratedRunAt && (
                <div className="mt-2 text-[11px] opacity-80 flex items-center gap-2 flex-wrap">
                  <span>Showing previous run from {new Date(hydratedRunAt).toLocaleString()}.</span>
                  <button
                    type="button"
                    className="underline hover:opacity-100 opacity-90"
                    onClick={() => { setResult(null); setHydratedRunAt(null); run(); }}
                    disabled={audit.isPending}
                  >
                    Re-run audit
                  </button>
                </div>
              )}
            </div>

            {result.nativeRating && (
              <div className="border rounded-md p-4 bg-white" data-testid="native-rating-block">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">{result.framework.code} native rating</div>
                    <div className="text-base font-semibold mt-0.5">{result.nativeRating.schemeName}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Based on {result.nativeRating.basedOn}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge className="bg-emerald-600 text-white text-base px-3 py-1.5" data-testid="native-rating-overall">
                      {result.nativeRating.overall.value}
                    </Badge>
                    <div className="text-xs text-slate-700 mt-1 max-w-xs">{result.nativeRating.overall.label}</div>
                  </div>
                </div>
                <div className="text-xs text-slate-600 mt-2">{result.nativeRating.overall.description}</div>
              </div>
            )}

            {result.evidenceTotals && (
              <div className="text-xs text-slate-600 bg-slate-50 border rounded-md p-2 px-3">
                Evidence: {result.evidenceTotals.sources} source(s) · {result.evidenceTotals.indexedFiles} files indexed · {result.evidenceTotals.citedFiles} file(s) cited
                {result.capasCreated ? <> · <span className="font-medium">{result.capasCreated} CAPA(s) auto-created</span></> : null}
              </div>
            )}

            {result.headlineFindings?.length > 0 && (
              <div>
                <div className="text-sm font-semibold mb-2">Headline findings</div>
                <ul className="space-y-1.5">
                  {result.headlineFindings.map((h, i) => (
                    <li key={i} className="text-sm text-slate-700 flex gap-2">
                      <span className="text-emerald-600 mt-0.5">•</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <div className="text-sm font-semibold mb-2">Per-control assessment</div>
              <div className="space-y-2">
                {result.controlAssessments.map((a, i) => {
                  const native = result.nativeRating?.perControl?.[a.controlCode];
                  return (
                  <div key={i} className="border rounded-md p-3 bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{a.controlCode}</span>
                        <Badge variant="outline" className={
                          a.verdict === "met" ? "bg-emerald-50 text-emerald-700 border-emerald-300" :
                          a.verdict === "partial" ? "bg-amber-50 text-amber-700 border-amber-300" :
                          "bg-rose-50 text-rose-700 border-rose-300"
                        }>{a.verdict}</Badge>
                        {native && (
                          <Badge
                            variant="outline"
                            title={`${native.label} — ${native.description}`}
                            className="bg-indigo-50 text-indigo-700 border-indigo-300 font-mono"
                            data-testid={`native-pc-${a.controlCode}`}
                          >
                            {native.value}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                      <EvidenceColumn
                        title="Required"
                        items={a.requiredEvidence}
                        emptyText="No requirements specified"
                        accent="slate"
                      />
                      <EvidenceColumn
                        title="Found"
                        items={a.foundEvidence}
                        emptyText="Nothing found"
                        accent="emerald"
                      />
                      <EvidenceColumn
                        title="Missing"
                        items={a.missingEvidence}
                        emptyText="No gaps"
                        accent="rose"
                      />
                    </div>
                    {a.evidenceFiles && a.evidenceFiles.length > 0 && (
                      <div className="mt-2 text-[11px] text-slate-500">
                        <span className="font-medium text-slate-600">Files cited: </span>
                        {a.evidenceFiles.slice(0, 6).map((p) => (
                          <span key={p} className="font-mono bg-slate-50 border px-1.5 py-0.5 rounded mr-1">{p}</span>
                        ))}
                        {a.evidenceFiles.length > 6 && <span>+{a.evidenceFiles.length - 6} more</span>}
                      </div>
                    )}
                    {a.recommendation && (
                      <div className="mt-2 text-xs text-slate-700 border-l-2 border-emerald-300 pl-2 italic">
                        {a.recommendation}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={reset}>Run another</Button>
              <Button onClick={close}>Done</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ───────── Small reusable widgets ─────────
function CompliancePctGauge({ pct, summary }: {
  pct?: number;
  summary?: { total: number; met: number; partial: number; gap: number };
}) {
  if (typeof pct !== "number") return null;
  const value = Math.max(0, Math.min(100, Math.round(pct)));
  const ringColor =
    value >= 80 ? "text-emerald-600" :
    value >= 50 ? "text-amber-600" :
    "text-rose-600";
  const r = 26;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  return (
    <div className="flex items-center gap-3 bg-white/70 border rounded-md p-2 px-3">
      <div className="relative h-16 w-16">
        <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
          <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-200" />
          <circle
            cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
            className={ringColor}
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center text-sm font-semibold ${ringColor}`}>{value}%</div>
      </div>
      {summary && (
        <div className="text-[11px] text-slate-700 leading-tight">
          <div><span className="font-semibold text-emerald-700">{summary.met}</span> met</div>
          <div><span className="font-semibold text-amber-700">{summary.partial}</span> partial</div>
          <div><span className="font-semibold text-rose-700">{summary.gap}</span> gap</div>
          <div className="text-slate-500">of {summary.total}</div>
        </div>
      )}
    </div>
  );
}

function EvidenceColumn({ title, items, emptyText, accent }: {
  title: string;
  items?: string[];
  emptyText: string;
  accent: "slate" | "emerald" | "rose";
}) {
  const colors = {
    slate: { head: "text-slate-700", chip: "bg-slate-50 border-slate-200" },
    emerald: { head: "text-emerald-700", chip: "bg-emerald-50 border-emerald-200" },
    rose: { head: "text-rose-700", chip: "bg-rose-50 border-rose-200" },
  }[accent];
  const list = items ?? [];
  return (
    <div>
      <div className={`text-[11px] uppercase tracking-wider font-semibold mb-1 ${colors.head}`}>{title}</div>
      {list.length === 0 ? (
        <div className="text-[11px] text-slate-400 italic">{emptyText}</div>
      ) : (
        <ul className="space-y-1">
          {list.map((it, i) => (
            <li key={i} className={`text-[11px] text-slate-700 border rounded px-1.5 py-1 ${colors.chip}`}>
              {it}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function mdCell(s: string | undefined | null): string {
  return String(s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ")
    .trim();
}

function mdList(items?: string[]): string {
  if (!items || items.length === 0) return "—";
  return items.map((i) => `• ${mdCell(i)}`).join("<br/>");
}

function renderAuditMarkdown(r: ComplianceAuditResult, source: ProjectSourceRow): string {
  const lines: string[] = [];
  lines.push(`# Compliance Audit — ${r.framework.name}`);
  lines.push(``);
  lines.push(`**Project:** ${r.project.name}  `);
  lines.push(`**Source:** ${source.label} (${source.kind}) — ${source.fileCount} files indexed  `);
  lines.push(`**Generated:** ${new Date().toLocaleString()}  `);
  lines.push(`**Overall verdict:** \`${r.overallVerdict}\`  `);
  if (typeof r.compliancePercentage === "number") {
    lines.push(`**Compliance:** **${Math.round(r.compliancePercentage)}%**` + (r.controlSummary ? ` (${r.controlSummary.met} met / ${r.controlSummary.partial} partial / ${r.controlSummary.gap} gap of ${r.controlSummary.total})` : ""));
  }
  if (r.nativeRating) {
    lines.push(`**${r.nativeRating.schemeName}:** \`${r.nativeRating.overall.value}\` — ${r.nativeRating.overall.label}  `);
    lines.push(`*Based on ${r.nativeRating.basedOn}*`);
  }
  lines.push(``);
  if (r.evidenceTotals) {
    lines.push(`> Evidence: ${r.evidenceTotals.sources} source(s) · ${r.evidenceTotals.indexedFiles} files indexed · ${r.evidenceTotals.citedFiles} file(s) cited` + (r.capasCreated ? ` · ${r.capasCreated} CAPA(s) auto-created` : ""));
    lines.push(``);
  }
  if (r.headlineFindings?.length) {
    lines.push(`## Headline findings`);
    r.headlineFindings.forEach((h) => lines.push(`- ${h}`));
    lines.push(``);
  }
  lines.push(`## Per-control assessment`);
  lines.push(``);
  lines.push(`| Control | Verdict | Native rating | Required evidence | Found evidence | Missing evidence | Files cited | Recommendation |`);
  lines.push(`|---|---|---|---|---|---|---|---|`);
  r.controlAssessments.forEach((a) => {
    const ev =
      (a.evidenceFiles ?? []).length === 0
        ? "—"
        : (a.evidenceFiles ?? []).map((p) => `\`${mdCell(p)}\``).join("<br/>");
    const native = r.nativeRating?.perControl?.[a.controlCode];
    const nativeCell = native ? `\`${mdCell(native.value)}\` — ${mdCell(native.label)}` : "—";
    lines.push(
      `| \`${mdCell(a.controlCode)}\` | ${mdCell(a.verdict)} | ${nativeCell} | ${mdList(a.requiredEvidence)} | ${mdList(a.foundEvidence)} | ${mdList(a.missingEvidence)} | ${ev} | ${mdCell(a.recommendation)} |`,
    );
  });
  return lines.join("\n");
}

// ───────── Traceability completeness audit dialog ─────────
function TraceabilityAuditDialog({
  source,
  projectId,
  onClose,
}: {
  source: ProjectSourceRow | null;
  projectId: string | null;
  onClose: () => void;
}) {
  const trace = useTraceabilityAudit();
  const { toast } = useToast();
  const [result, setResult] = useState<TraceabilityAuditResult | null>(null);
  const [started, setStarted] = useState(false);
  const [hydratedRunAt, setHydratedRunAt] = useState<string | null>(null);
  const latest = useLatestAuditRun<TraceabilityAuditResult>(source?.id ?? null, "traceability");
  useEffect(() => {
    if (latest.data && !result) {
      setResult(latest.data.result);
      setHydratedRunAt(latest.data.runAt);
      setStarted(true);
    }
  }, [latest.data, result]);

  if (!source) return null;

  async function run() {
    if (!source) return;
    if (!projectId) {
      toast({
        title: "No project selected",
        description: "Pick a project in the top-left switcher before checking completeness.",
        variant: "destructive",
      });
      return;
    }
    setStarted(true);
    setResult(null);
    try {
      const r = await trace.mutateAsync({ projectId, sourceIds: [source.id] });
      setResult(r);
    } catch (err: any) {
      toast({ title: "Completeness check failed", description: err.message ?? "Unknown error", variant: "destructive" });
    }
  }

  function close() {
    setResult(null);
    setStarted(false);
    setHydratedRunAt(null);
    onClose();
  }

  function traceFileBase() {
    return `traceability-${source!.label.replace(/\s+/g, "-")}`;
  }
  function downloadMarkdown() {
    if (!result) return;
    downloadBlob(renderTraceMarkdown(result, source!), "text/markdown", `${traceFileBase()}.md`);
  }
  function downloadCsv() {
    if (!result) return;
    downloadBlob(renderTraceCsv(result), "text/csv;charset=utf-8", `${traceFileBase()}.csv`);
  }
  function downloadPdf() {
    if (!result) return;
    openPrintWindow(renderTraceHtml(result, source!), `${traceFileBase()}.pdf`);
  }

  const verdictColor: Record<TraceabilityAuditResult["overallVerdict"], string> = {
    strong: "bg-emerald-100 text-emerald-800 border-emerald-300",
    adequate: "bg-blue-100 text-blue-800 border-blue-300",
    weak: "bg-amber-100 text-amber-800 border-amber-300",
    failing: "bg-rose-100 text-rose-800 border-rose-300",
  };

  return (
    <Dialog open={!!source} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            Traceability completeness — “{source.label}”
          </DialogTitle>
          <DialogDescription>
            For every requirement in the project, Auditee checks whether evidence exists across all 5 lifecycle stages — architecture, design, implementation, testing, and deployment — in this source.
          </DialogDescription>
        </DialogHeader>

        {!result && (
          <div className="space-y-4">
            <div className="bg-slate-50 border rounded-md p-3 text-xs text-slate-600">
              <div className="flex items-center gap-2 mb-1 font-medium text-slate-800">
                <FileCode2 className="h-3.5 w-3.5" /> Source under review
              </div>
              <div>
                {source.fileCount} files · {bytesHuman(source.byteCount)} indexed from <span className="font-mono">{source.kind}</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Files are bucketed into 5 lifecycle stages — architecture (design docs/ADRs), design (specs/UX), implementation (source code), testing (test suites/results), and deployment (release/runbook artifacts) — and assessed per requirement.
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={close}>Cancel</Button>
              <Button
                onClick={run}
                disabled={!projectId || trace.isPending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {trace.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Checking…</>
                ) : (
                  <><ShieldCheck className="h-4 w-4 mr-2" /> Run completeness check</>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {started && trace.isPending && !result && (
          <div className="py-8 flex flex-col items-center gap-2 text-slate-600">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            <div className="text-sm">Running traceability analysis…</div>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className={`border rounded-md p-4 ${verdictColor[result.overallVerdict]}`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wider opacity-80">Overall completeness</div>
                  <div className="text-2xl font-semibold capitalize mt-0.5">{result.overallVerdict}</div>
                  <div className="text-xs opacity-80 mt-0.5">{result.requirementsAudited} requirement(s) audited</div>
                </div>
                <CompliancePctGauge pct={result.completenessPercentage} />
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <Button variant="outline" size="sm" onClick={downloadMarkdown} className="bg-white" data-testid="trace-download-md">
                    <Download className="h-3.5 w-3.5 mr-1.5" /> .md
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadCsv} className="bg-white" data-testid="trace-download-csv">
                    <Download className="h-3.5 w-3.5 mr-1.5" /> .csv
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadPdf} className="bg-white" data-testid="trace-download-pdf">
                    <Download className="h-3.5 w-3.5 mr-1.5" /> .pdf
                  </Button>
                </div>
              </div>
              {hydratedRunAt && (
                <div className="mt-2 text-[11px] opacity-80 flex items-center gap-2 flex-wrap">
                  <span>Showing previous run from {new Date(hydratedRunAt).toLocaleString()}.</span>
                  <button
                    type="button"
                    className="underline hover:opacity-100 opacity-90"
                    onClick={() => { setResult(null); setHydratedRunAt(null); run(); }}
                    disabled={trace.isPending}
                  >
                    Re-run check
                  </button>
                </div>
              )}
            </div>

            {result.stagePercentages && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(["architecture", "design", "implementation", "testing", "deployment"] as const).map((stage) => {
                  const v = Math.round(result.stagePercentages[stage] ?? 0);
                  const tone: "emerald" | "amber" | "rose" = v >= 80 ? "emerald" : v >= 50 ? "amber" : "rose";
                  const cls = STAGE_TONE_CLASSES[tone];
                  return (
                    <div key={stage} className={`border rounded-md p-2.5 ${cls.box}`}>
                      <div className={`text-[11px] uppercase tracking-wider font-semibold ${cls.head}`}>{stage}</div>
                      <div className={`text-2xl font-bold ${cls.value}`}>{v}%</div>
                    </div>
                  );
                })}
              </div>
            )}

            {result.headlineFindings?.length > 0 && (
              <div>
                <div className="text-sm font-semibold mb-2">Headline findings</div>
                <ul className="space-y-1.5">
                  {result.headlineFindings.map((h, i) => (
                    <li key={i} className="text-sm text-slate-700 flex gap-2">
                      <span className="text-indigo-600 mt-0.5">•</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <div className="text-sm font-semibold mb-2">Per-requirement coverage</div>
              <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="text-left p-2 font-medium">Requirement</th>
                      <th className="text-left p-2 font-medium">Architecture</th>
                      <th className="text-left p-2 font-medium">Design</th>
                      <th className="text-left p-2 font-medium">Implementation</th>
                      <th className="text-left p-2 font-medium">Testing</th>
                      <th className="text-left p-2 font-medium">Deployment</th>
                      <th className="text-left p-2 font-medium">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.requirementCoverage.map((r, i) => (
                      <tr key={i} className="border-t align-top">
                        <td className="p-2 font-mono whitespace-nowrap">{r.requirementCode}</td>
                        <td className="p-2"><StageCell stage={r.architecture} /></td>
                        <td className="p-2"><StageCell stage={r.design} /></td>
                        <td className="p-2"><StageCell stage={r.implementation} /></td>
                        <td className="p-2"><StageCell stage={r.testing} /></td>
                        <td className="p-2"><StageCell stage={r.deployment} /></td>
                        <td className="p-2 text-slate-700">{r.recommendation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setResult(null); setStarted(false); }}>Run another</Button>
              <Button onClick={close}>Done</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Static tailwind class maps so JIT can extract them at build time.
const STAGE_TONE_CLASSES: Record<"emerald" | "amber" | "rose", { box: string; head: string; value: string; badge: string }> = {
  emerald: {
    box: "bg-emerald-50 border-emerald-200",
    head: "text-emerald-700",
    value: "text-emerald-800",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-300",
  },
  amber: {
    box: "bg-amber-50 border-amber-200",
    head: "text-amber-700",
    value: "text-amber-800",
    badge: "bg-amber-50 text-amber-700 border-amber-300",
  },
  rose: {
    box: "bg-rose-50 border-rose-200",
    head: "text-rose-700",
    value: "text-rose-800",
    badge: "bg-rose-50 text-rose-700 border-rose-300",
  },
};

const EMPTY_STAGE: CoverageStage = { status: "missing", artifacts: [], note: "" };

function StageCell({ stage }: { stage: CoverageStage | undefined }) {
  const s: CoverageStage = stage ?? EMPTY_STAGE;
  const tone: "emerald" | "amber" | "rose" =
    s.status === "covered" ? "emerald" :
    s.status === "partial" ? "amber" :
    "rose";
  const cls = STAGE_TONE_CLASSES[tone];
  return (
    <div className="space-y-1 min-w-[140px]">
      <Badge variant="outline" className={`${cls.badge} capitalize`}>
        {s.status}
      </Badge>
      {s.artifacts && s.artifacts.length > 0 && (
        <div className="space-y-0.5">
          {s.artifacts.slice(0, 3).map((a) => (
            <div key={a} className="font-mono text-[10px] text-slate-600 truncate" title={a}>{a}</div>
          ))}
          {s.artifacts.length > 3 && (
            <div className="text-[10px] text-slate-500">+{s.artifacts.length - 3} more</div>
          )}
        </div>
      )}
      {s.note && <div className="text-[10px] text-slate-500 italic">{s.note}</div>}
    </div>
  );
}

function renderTraceMarkdown(r: TraceabilityAuditResult, source: ProjectSourceRow): string {
  const lines: string[] = [];
  lines.push(`# Traceability Completeness Audit`);
  lines.push(``);
  lines.push(`**Project:** ${r.project.name}  `);
  lines.push(`**Source:** ${source.label} (${source.kind}) — ${source.fileCount} files indexed  `);
  lines.push(`**Generated:** ${new Date().toLocaleString()}  `);
  lines.push(`**Overall verdict:** \`${r.overallVerdict}\`  `);
  lines.push(`**Completeness:** **${Math.round(r.completenessPercentage)}%** across ${r.requirementsAudited} requirement(s)`);
  if (r.stagePercentages) {
    lines.push(``);
    lines.push(
      `**Stage completeness:** architecture ${Math.round(r.stagePercentages.architecture ?? 0)}% · ` +
      `design ${Math.round(r.stagePercentages.design ?? 0)}% · ` +
      `implementation ${Math.round(r.stagePercentages.implementation ?? 0)}% · ` +
      `testing ${Math.round(r.stagePercentages.testing ?? 0)}% · ` +
      `deployment ${Math.round(r.stagePercentages.deployment ?? 0)}%`
    );
  }
  lines.push(``);
  if (r.headlineFindings?.length) {
    lines.push(`## Headline findings`);
    r.headlineFindings.forEach((h) => lines.push(`- ${h}`));
    lines.push(``);
  }
  lines.push(`## Per-requirement coverage`);
  lines.push(``);
  lines.push(`| Requirement | Architecture | Design | Implementation | Testing | Deployment | Recommendation |`);
  lines.push(`|---|---|---|---|---|---|---|`);
  r.requirementCoverage.forEach((req) => {
    function cell(s: CoverageStage | undefined): string {
      const stage = s ?? EMPTY_STAGE;
      const a = (stage.artifacts ?? []).map((p) => `\`${mdCell(p)}\``).join("<br/>");
      return `${mdCell(stage.status)}${a ? "<br/>" + a : ""}${stage.note ? "<br/>_" + mdCell(stage.note) + "_" : ""}`;
    }
    lines.push(
      `| \`${mdCell(req.requirementCode)}\` | ${cell(req.architecture)} | ${cell(req.design)} | ${cell(req.implementation)} | ${cell(req.testing)} | ${cell(req.deployment)} | ${mdCell(req.recommendation)} |`,
    );
  });
  return lines.join("\n");
}

// ───────── Generic download / CSV / PDF (print) helpers ─────────
function downloadBlob(content: string, mime: string, filename: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvCell(v: unknown): string {
  let s = v == null ? "" : String(v);
  // CSV-injection guard: cells starting with =, +, -, @, tab, or CR could be
  // interpreted as formulas by Excel / Sheets. Prefix with a single quote so
  // the value is treated as text.
  if (/^[=+\-@\t\r]/.test(s)) {
    s = "'" + s;
  }
  // RFC 4180: quote if contains comma, quote, CR, or LF (also quote if we
  // just prepended a single quote so opening single-quote is preserved).
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
function csvRow(cols: unknown[]): string {
  return cols.map(csvCell).join(",");
}

function renderAuditCsv(r: ComplianceAuditResult): string {
  const rows: string[] = [];
  rows.push(csvRow([
    "Control",
    "Verdict",
    "Native rating",
    "Required evidence",
    "Found evidence",
    "Missing evidence",
    "Files cited",
    "Recommendation",
  ]));
  for (const a of r.controlAssessments) {
    const native = r.nativeRating?.perControl?.[a.controlCode];
    rows.push(csvRow([
      a.controlCode,
      a.verdict,
      native ? `${native.value} — ${native.label}` : "",
      (a.requiredEvidence ?? []).join(" | "),
      (a.foundEvidence ?? []).join(" | "),
      (a.missingEvidence ?? []).join(" | "),
      (a.evidenceFiles ?? []).join(" | "),
      a.recommendation ?? "",
    ]));
  }
  return rows.join("\r\n");
}

function renderTraceCsv(r: TraceabilityAuditResult): string {
  const rows: string[] = [];
  rows.push(csvRow([
    "Requirement",
    "Architecture status", "Architecture artifacts", "Architecture note",
    "Design status", "Design artifacts", "Design note",
    "Implementation status", "Implementation artifacts", "Implementation note",
    "Testing status", "Testing artifacts", "Testing note",
    "Deployment status", "Deployment artifacts", "Deployment note",
    "Recommendation",
  ]));
  for (const req of r.requirementCoverage) {
    const stage = (s: CoverageStage | undefined) => {
      const x = s ?? EMPTY_STAGE;
      return [x.status, (x.artifacts ?? []).join(" | "), x.note ?? ""];
    };
    rows.push(csvRow([
      req.requirementCode,
      ...stage(req.architecture),
      ...stage(req.design),
      ...stage(req.implementation),
      ...stage(req.testing),
      ...stage(req.deployment),
      req.recommendation ?? "",
    ]));
  }
  return rows.join("\r\n");
}

function escapeHtml(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pdfDocShell(title: string, body: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:Inter,Arial,sans-serif;color:#0f172a;margin:32px;font-size:11px;line-height:1.45}
  h1{font-size:20px;margin:0 0 4px 0}
  h2{font-size:14px;margin:18px 0 8px 0;border-bottom:1px solid #e2e8f0;padding-bottom:3px}
  .meta{color:#475569;font-size:11px;margin-bottom:8px}
  .verdict{display:inline-block;padding:2px 8px;border-radius:4px;font-weight:600;text-transform:capitalize}
  .v-strong{background:#d1fae5;color:#065f46}
  .v-adequate{background:#dbeafe;color:#1e40af}
  .v-weak{background:#fef3c7;color:#92400e}
  .v-failing{background:#fee2e2;color:#991b1b}
  table{border-collapse:collapse;width:100%;margin-top:6px;font-size:10px}
  th,td{border:1px solid #cbd5e1;padding:5px 6px;text-align:left;vertical-align:top}
  th{background:#f1f5f9;font-weight:600}
  .mono{font-family:ui-monospace,Menlo,monospace;font-size:9.5px}
  ul{margin:4px 0 0 16px;padding:0}
  li{margin:0}
  .pill{display:inline-block;padding:1px 6px;border-radius:3px;font-size:9.5px;font-weight:600;text-transform:capitalize}
  .p-met,.p-covered{background:#d1fae5;color:#065f46}
  .p-partial{background:#fef3c7;color:#92400e}
  .p-gap,.p-missing{background:#fee2e2;color:#991b1b}
  @media print{body{margin:18mm}}
</style></head><body>${body}
<script>window.addEventListener("load",function(){setTimeout(function(){window.focus();window.print();},250);});</script>
</body></html>`;
}

function verdictPillHtml(v: string): string {
  return `<span class="verdict v-${escapeHtml(v)}">${escapeHtml(v)}</span>`;
}
function statusPillHtml(s: string): string {
  return `<span class="pill p-${escapeHtml(s)}">${escapeHtml(s)}</span>`;
}

function renderAuditHtml(r: ComplianceAuditResult, source: ProjectSourceRow): string {
  const summary = r.controlSummary
    ? ` (${r.controlSummary.met} met / ${r.controlSummary.partial} partial / ${r.controlSummary.gap} gap of ${r.controlSummary.total})`
    : "";
  const headlines = (r.headlineFindings ?? []).map((h) => `<li>${escapeHtml(h)}</li>`).join("");
  const rows = r.controlAssessments.map((a) => {
    const native = r.nativeRating?.perControl?.[a.controlCode];
    const list = (xs?: string[]) => (xs && xs.length ? `<ul>${xs.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>` : "—");
    const files = (a.evidenceFiles ?? []).length
      ? `<ul>${(a.evidenceFiles ?? []).map((p) => `<li class="mono">${escapeHtml(p)}</li>`).join("")}</ul>`
      : "—";
    return `<tr>
      <td class="mono">${escapeHtml(a.controlCode)}</td>
      <td>${statusPillHtml(a.verdict)}</td>
      <td>${native ? `<span class="mono">${escapeHtml(native.value)}</span> — ${escapeHtml(native.label)}` : "—"}</td>
      <td>${list(a.requiredEvidence)}</td>
      <td>${list(a.foundEvidence)}</td>
      <td>${list(a.missingEvidence)}</td>
      <td>${files}</td>
      <td>${escapeHtml(a.recommendation ?? "")}</td>
    </tr>`;
  }).join("");
  const body = `
    <h1>Compliance Audit — ${escapeHtml(r.framework.name)}</h1>
    <div class="meta">
      <strong>Project:</strong> ${escapeHtml(r.project.name)} ·
      <strong>Source:</strong> ${escapeHtml(source.label)} (${escapeHtml(source.kind)}) — ${source.fileCount} files indexed ·
      <strong>Generated:</strong> ${escapeHtml(new Date().toLocaleString())}
    </div>
    <div><strong>Overall verdict:</strong> ${verdictPillHtml(r.overallVerdict)}
    ${typeof r.compliancePercentage === "number" ? ` · <strong>Compliance:</strong> ${Math.round(r.compliancePercentage)}%${escapeHtml(summary)}` : ""}
    ${r.nativeRating ? ` · <strong>${escapeHtml(r.nativeRating.schemeName)}:</strong> <span class="mono">${escapeHtml(r.nativeRating.overall.value)}</span> — ${escapeHtml(r.nativeRating.overall.label)}` : ""}
    </div>
    ${headlines ? `<h2>Headline findings</h2><ul>${headlines}</ul>` : ""}
    <h2>Per-control assessment</h2>
    <table>
      <thead><tr>
        <th>Control</th><th>Verdict</th><th>Native rating</th>
        <th>Required evidence</th><th>Found evidence</th><th>Missing evidence</th>
        <th>Files cited</th><th>Recommendation</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  return pdfDocShell(`Compliance Audit — ${r.framework.name}`, body);
}

function renderTraceHtml(r: TraceabilityAuditResult, source: ProjectSourceRow): string {
  const headlines = (r.headlineFindings ?? []).map((h) => `<li>${escapeHtml(h)}</li>`).join("");
  const stageCell = (s: CoverageStage | undefined) => {
    const x = s ?? EMPTY_STAGE;
    const arts = (x.artifacts ?? []).length
      ? `<ul>${(x.artifacts ?? []).map((p) => `<li class="mono">${escapeHtml(p)}</li>`).join("")}</ul>`
      : "";
    return `${statusPillHtml(x.status)}${arts}${x.note ? `<div style="color:#64748b;font-style:italic;margin-top:2px">${escapeHtml(x.note)}</div>` : ""}`;
  };
  const rows = r.requirementCoverage.map((req) => `<tr>
    <td class="mono">${escapeHtml(req.requirementCode)}</td>
    <td>${stageCell(req.architecture)}</td>
    <td>${stageCell(req.design)}</td>
    <td>${stageCell(req.implementation)}</td>
    <td>${stageCell(req.testing)}</td>
    <td>${stageCell(req.deployment)}</td>
    <td>${escapeHtml(req.recommendation ?? "")}</td>
  </tr>`).join("");
  const body = `
    <h1>Traceability Completeness Audit</h1>
    <div class="meta">
      <strong>Project:</strong> ${escapeHtml(r.project.name)} ·
      <strong>Source:</strong> ${escapeHtml(source.label)} (${escapeHtml(source.kind)}) — ${source.fileCount} files indexed ·
      <strong>Generated:</strong> ${escapeHtml(new Date().toLocaleString())}
    </div>
    <div><strong>Overall verdict:</strong> ${verdictPillHtml(r.overallVerdict)} ·
      <strong>Completeness:</strong> ${Math.round(r.completenessPercentage)}% across ${r.requirementsAudited} requirement(s)
    </div>
    ${r.stagePercentages ? `<div class="meta"><strong>Stage completeness:</strong>
      architecture ${Math.round(r.stagePercentages.architecture ?? 0)}% ·
      design ${Math.round(r.stagePercentages.design ?? 0)}% ·
      implementation ${Math.round(r.stagePercentages.implementation ?? 0)}% ·
      testing ${Math.round(r.stagePercentages.testing ?? 0)}% ·
      deployment ${Math.round(r.stagePercentages.deployment ?? 0)}%</div>` : ""}
    ${headlines ? `<h2>Headline findings</h2><ul>${headlines}</ul>` : ""}
    <h2>Per-requirement coverage</h2>
    <table>
      <thead><tr>
        <th>Requirement</th>
        <th>Architecture</th><th>Design</th><th>Implementation</th><th>Testing</th><th>Deployment</th>
        <th>Recommendation</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  return pdfDocShell("Traceability Completeness Audit", body);
}

/**
 * Open a new window with a self-contained HTML document, then trigger the
 * browser's print dialog. Users can choose "Save as PDF" — works in every
 * modern browser, no extra dependencies needed.
 */
function openPrintWindow(html: string, _suggestedName: string) {
  const w = window.open("", "_blank", "width=900,height=900");
  if (!w) {
    alert("Please allow pop-ups to download the PDF.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
