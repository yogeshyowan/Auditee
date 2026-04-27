import { useState, useRef } from "react";
import { useProjectContext } from "@/lib/project-context";
import { useListComplianceFrameworks } from "@workspace/api-client-react";
import {
  useComplianceAudit,
  useTraceabilityAudit,
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

const ALL_KIND_DEFS: KindDef[] = [...KIND_DEFS, ...RM_KIND_DEFS];

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

  const sources = data?.sources ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Project Sources</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Bring your project into Eltegra so the AI can audit it. Pull source from GitHub, upload a ZIP or folder, or
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
            const canSync = s.kind !== "zip" && s.kind !== "folder" && s.kind !== "reqif" && s.kind !== "doors";
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
                  title={s.status !== "ready" ? "Source must be in 'ready' state to check completeness" : "Audit traceability completeness across design → code → tests → reports"}
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

// ───────── Connect dialog (per-kind form) ─────────
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
        <Field label="Personal access token (only for private repos)" type="password" value={cfg.token ?? ""} onChange={(v) => up("token", v)} />
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

  function reset() { setResult(null); setPicked(null); }
  function close() { reset(); onClose(); }

  function downloadMarkdown() {
    if (!result) return;
    const md = renderAuditMarkdown(result, source!);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-${result.framework.code.replace(/\s+/g, "-")}-${source!.label.replace(/\s+/g, "-")}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
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
            Pick a standard. Eltegra will analyse this source against every control in the framework and produce a grounded report.
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
                <Button variant="outline" size="sm" onClick={downloadMarkdown} className="bg-white">
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Download .md
                </Button>
              </div>
            </div>

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
                {result.controlAssessments.map((a, i) => (
                  <div key={i} className="border rounded-md p-3 bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{a.controlCode}</span>
                        <Badge variant="outline" className={
                          a.verdict === "met" ? "bg-emerald-50 text-emerald-700 border-emerald-300" :
                          a.verdict === "partial" ? "bg-amber-50 text-amber-700 border-amber-300" :
                          "bg-rose-50 text-rose-700 border-rose-300"
                        }>{a.verdict}</Badge>
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
                ))}
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
  lines.push(`| Control | Verdict | Required evidence | Found evidence | Missing evidence | Files cited | Recommendation |`);
  lines.push(`|---|---|---|---|---|---|---|`);
  r.controlAssessments.forEach((a) => {
    const ev =
      (a.evidenceFiles ?? []).length === 0
        ? "—"
        : (a.evidenceFiles ?? []).map((p) => `\`${mdCell(p)}\``).join("<br/>");
    lines.push(
      `| \`${mdCell(a.controlCode)}\` | ${mdCell(a.verdict)} | ${mdList(a.requiredEvidence)} | ${mdList(a.foundEvidence)} | ${mdList(a.missingEvidence)} | ${ev} | ${mdCell(a.recommendation)} |`,
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
    onClose();
  }

  function downloadMarkdown() {
    if (!result) return;
    const md = renderTraceMarkdown(result, source!);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `traceability-${source!.label.replace(/\s+/g, "-")}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
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
            For every requirement in the project, Eltegra checks whether design, code, tests, and test reports exist in this source.
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
                Files are bucketed into 4 stages — design (architecture/specs), code (source files), tests (test files), reports (build/test reports) — and assessed per requirement.
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
                <Button variant="outline" size="sm" onClick={downloadMarkdown} className="bg-white">
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Download .md
                </Button>
              </div>
            </div>

            {result.stagePercentages && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(["design", "code", "tests", "reports"] as const).map((stage) => {
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
                      <th className="text-left p-2 font-medium">Design</th>
                      <th className="text-left p-2 font-medium">Code</th>
                      <th className="text-left p-2 font-medium">Tests</th>
                      <th className="text-left p-2 font-medium">Reports</th>
                      <th className="text-left p-2 font-medium">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.requirementCoverage.map((r, i) => (
                      <tr key={i} className="border-t align-top">
                        <td className="p-2 font-mono whitespace-nowrap">{r.requirementCode}</td>
                        <td className="p-2"><StageCell stage={r.design} /></td>
                        <td className="p-2"><StageCell stage={r.code} /></td>
                        <td className="p-2"><StageCell stage={r.tests} /></td>
                        <td className="p-2"><StageCell stage={r.reports} /></td>
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

function StageCell({ stage }: { stage: CoverageStage }) {
  const tone: "emerald" | "amber" | "rose" =
    stage.status === "covered" ? "emerald" :
    stage.status === "partial" ? "amber" :
    "rose";
  const cls = STAGE_TONE_CLASSES[tone];
  return (
    <div className="space-y-1 min-w-[140px]">
      <Badge variant="outline" className={`${cls.badge} capitalize`}>
        {stage.status}
      </Badge>
      {stage.artifacts && stage.artifacts.length > 0 && (
        <div className="space-y-0.5">
          {stage.artifacts.slice(0, 3).map((a) => (
            <div key={a} className="font-mono text-[10px] text-slate-600 truncate" title={a}>{a}</div>
          ))}
          {stage.artifacts.length > 3 && (
            <div className="text-[10px] text-slate-500">+{stage.artifacts.length - 3} more</div>
          )}
        </div>
      )}
      {stage.note && <div className="text-[10px] text-slate-500 italic">{stage.note}</div>}
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
    lines.push(`**Stage completeness:** design ${Math.round(r.stagePercentages.design)}% · code ${Math.round(r.stagePercentages.code)}% · tests ${Math.round(r.stagePercentages.tests)}% · reports ${Math.round(r.stagePercentages.reports)}%`);
  }
  lines.push(``);
  if (r.headlineFindings?.length) {
    lines.push(`## Headline findings`);
    r.headlineFindings.forEach((h) => lines.push(`- ${h}`));
    lines.push(``);
  }
  lines.push(`## Per-requirement coverage`);
  lines.push(``);
  lines.push(`| Requirement | Design | Code | Tests | Reports | Recommendation |`);
  lines.push(`|---|---|---|---|---|---|`);
  r.requirementCoverage.forEach((req) => {
    function cell(s: CoverageStage): string {
      const a = (s.artifacts ?? []).map((p) => `\`${mdCell(p)}\``).join("<br/>");
      return `${mdCell(s.status)}${a ? "<br/>" + a : ""}${s.note ? "<br/>_" + mdCell(s.note) + "_" : ""}`;
    }
    lines.push(
      `| \`${mdCell(req.requirementCode)}\` | ${cell(req.design)} | ${cell(req.code)} | ${cell(req.tests)} | ${cell(req.reports)} | ${mdCell(req.recommendation)} |`,
    );
  });
  return lines.join("\n");
}
