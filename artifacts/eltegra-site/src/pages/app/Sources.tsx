import { useState, useRef } from "react";
import { useProjectContext } from "@/lib/project-context";
import {
  useSources,
  useCreateSource,
  useSyncSource,
  useDeleteSource,
  useSourceFiles,
  useSourceFileContent,
  uploadZip,
  uploadFolder,
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
} from "lucide-react";

type Kind = ProjectSourceRow["kind"];

const KIND_DEFS: Array<{
  kind: Kind;
  title: string;
  blurb: string;
  icon: typeof Github;
  color: string;
  ingests: "code" | "metadata";
}> = [
  { kind: "github", title: "GitHub", blurb: "Pull source from any public or private repo by URL.", icon: Github, color: "bg-slate-900 text-white", ingests: "code" },
  { kind: "zip", title: "ZIP archive", blurb: "Upload a .zip of your project — files are extracted and indexed.", icon: FileArchive, color: "bg-amber-100 text-amber-800", ingests: "code" },
  { kind: "folder", title: "Project folder", blurb: "Drag a whole folder from your computer (browser permitting).", icon: FolderUp, color: "bg-emerald-100 text-emerald-800", ingests: "code" },
  { kind: "jira", title: "Jira", blurb: "Connect a Jira project — issues are pulled in as audit evidence.", icon: Briefcase, color: "bg-blue-100 text-blue-800", ingests: "metadata" },
  { kind: "alm", title: "ALM (Azure DevOps)", blurb: "Pull work items via WIQL from Azure DevOps Boards.", icon: Briefcase, color: "bg-sky-100 text-sky-800", ingests: "metadata" },
  { kind: "jenkins", title: "Jenkins", blurb: "Connect a Jenkins host or single job — recent builds are indexed.", icon: Hammer, color: "bg-rose-100 text-rose-800", ingests: "metadata" },
  { kind: "aws_s3", title: "AWS S3", blurb: "Index objects in an S3 bucket (read-only).", icon: Cloud, color: "bg-orange-100 text-orange-800", ingests: "metadata" },
  { kind: "gdrive", title: "Google Drive", blurb: "List files in a Drive folder by ID.", icon: HardDrive, color: "bg-yellow-100 text-yellow-800", ingests: "metadata" },
  { kind: "cloud_server", title: "Cloud server", blurb: "Probe a server URL and capture reachability evidence.", icon: Server, color: "bg-violet-100 text-violet-800", ingests: "metadata" },
  { kind: "url", title: "Public URL", blurb: "Probe an arbitrary URL for status + headers.", icon: Globe, color: "bg-cyan-100 text-cyan-800", ingests: "metadata" },
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
          <CardTitle className="text-base">Connect a new source</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {KIND_DEFS.map((d) => (
              <button
                key={d.kind}
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
            const def = KIND_DEFS.find((d) => d.kind === s.kind);
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
                <Button variant="outline" size="sm" onClick={() => setBrowsing(s)}>
                  <FileCode2 className="h-3 w-3 mr-1" /> Browse
                </Button>
                {s.kind !== "zip" && s.kind !== "folder" && (
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
      />

      <BrowseDialog source={browsing} onClose={() => setBrowsing(null)} />
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
}: {
  kind: Kind | null;
  onClose: () => void;
  projectId: string | undefined;
  onCreate: (kind: Kind, label: string, config: Record<string, any>) => Promise<void>;
  onZip: (file: File) => Promise<void>;
  onFolder: (files: FileList) => Promise<void>;
}) {
  const [label, setLabel] = useState("");
  const [cfg, setCfg] = useState<Record<string, any>>({});
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);

  if (!kind) return null;
  const def = KIND_DEFS.find((d) => d.kind === kind)!;

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
  }

  const showSubmit = kind !== "zip" && kind !== "folder";

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
