import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, Download, Trash2, AlertTriangle, CheckCircle2, FileBadge2 } from "lucide-react";

interface TemplateMeta {
  id: string;
  workspaceId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
}

interface WorkspaceMe {
  role: "owner" | "admin" | "editor" | "viewer";
  permissions: { canEditContent: boolean };
}

const PLACEHOLDERS: Array<{ token: string; description: string }> = [
  { token: "{title}", description: "Defaults to the selected report name (no 'Auditee' prefix)" },
  { token: "{subtitle}", description: "Defaults to the selected project name" },
  { token: "{date}", description: "Optional — generation date in YYYY-MM-DD. Delete the placeholder to omit." },
  { token: "{tone}", description: "Audience tone — executive | technical | regulator" },
  { token: "{generated_by}", description: "'Auditee' on free plans · empty on paid plans (white-label)" },
  { token: "{executive_summary}", description: "AI-written executive summary block" },
  { token: "{#sections}…{/sections}", description: "Loop — repeats once per section" },
  { token: "{heading}", description: "Inside the sections loop — section title" },
  { token: "{body}", description: "Inside the sections loop — section body text" },
  { token: "{citations}", description: "Inside the sections loop — comma-separated evidence IDs" },
  { token: "{#evidence}…{/evidence}", description: "Loop — repeats once per evidence row" },
  { token: "{id} / {label} / {source}", description: "Inside the evidence loop" },
];

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export default function Templates() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const meQ = useQuery<WorkspaceMe>({
    queryKey: ["/api/workspace/me"],
    queryFn: async () => {
      const r = await fetch("/api/workspace/me", { credentials: "include" });
      if (!r.ok) throw new Error("Failed to load workspace");
      return r.json();
    },
  });

  const tplQ = useQuery<{ template: TemplateMeta | null }>({
    queryKey: ["/api/workspace/template"],
    queryFn: async () => {
      const r = await fetch("/api/workspace/template", { credentials: "include" });
      if (!r.ok) throw new Error("Failed to load template");
      return r.json();
    },
  });

  const uploadMut = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/workspace/template", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `Upload failed (${r.status})`);
      }
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Template saved", description: "All future report exports will use this letterhead." });
      qc.invalidateQueries({ queryKey: ["/api/workspace/template"] });
    },
    onError: (err: Error) =>
      toast({ title: "Upload failed", description: err.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/workspace/template", {
        method: "DELETE",
        credentials: "include",
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `Delete failed (${r.status})`);
      }
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Template removed", description: "Reports will export with the default Auditee styling." });
      qc.invalidateQueries({ queryKey: ["/api/workspace/template"] });
    },
    onError: (err: Error) =>
      toast({ title: "Could not remove", description: err.message, variant: "destructive" }),
  });

  const role = meQ.data?.role ?? "viewer";
  const canManage = role === "owner" || role === "admin";
  const tpl = tplQ.data?.template ?? null;

  const onPickFile = () => fileRef.current?.click();
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".docx")) {
      toast({
        title: "Not a Word document",
        description: "Upload a .docx file with your company letterhead and the {placeholders} from the sample.",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }
    if (f.size > 15 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Templates must be under 15 MB.",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }
    setBusy(true);
    try {
      await uploadMut.mutateAsync(f);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  return (
    <div className="p-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileBadge2 className="h-6 w-6 text-primary" /> Company Template
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Upload a Word (.docx) letterhead and every PDLC report your team exports — Safety Plan, HARA,
          TARA, FMEA, PSAC, Test Plan, Compliance Audit, all 37 report kinds — comes out branded with
          your company's logo, header, footer, fonts and page styles.
        </p>
      </div>

      {tplQ.isLoading ? (
        <Card><CardContent className="py-8 text-center text-slate-500">Loading…</CardContent></Card>
      ) : tpl ? (
        <Card data-testid="current-template-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Active template
              </span>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                Applied to all DOCX exports
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <FileText className="h-8 w-8 text-blue-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900 truncate">{tpl.fileName}</div>
                <div className="text-xs text-slate-500">
                  {formatBytes(tpl.fileSize)} · uploaded {new Date(tpl.uploadedAt).toLocaleString()}
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href="/api/workspace/template/file" download data-testid="download-current-template">
                  <Download className="h-4 w-4 mr-1" /> Download
                </a>
              </Button>
            </div>
            {canManage ? (
              <div className="flex flex-wrap gap-2">
                <Button onClick={onPickFile} disabled={busy} data-testid="replace-template-btn">
                  <Upload className="h-4 w-4 mr-1" /> Replace template
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm("Remove the company template? Future reports will export with the default Auditee styling until you upload a new one.")) {
                      deleteMut.mutate();
                    }
                  }}
                  disabled={deleteMut.isPending}
                  data-testid="delete-template-btn"
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Remove
                </Button>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Only workspace owners and admins can replace or remove the template.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              No template uploaded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Reports are currently exporting with Auditee's default styling. Upload your company letterhead
              below to brand every PDLC document your team generates.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>How it works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <strong>Download the sample template.</strong> It's a regular .docx with the right
              placeholders already in place.
              <div className="mt-2">
                <Button variant="outline" size="sm" asChild>
                  <a href="/api/workspace/template/sample" download data-testid="download-sample-btn">
                    <Download className="h-4 w-4 mr-1" /> Download sample template
                  </a>
                </Button>
              </div>
            </li>
            <li>
              <strong>Open it in Microsoft Word</strong> (or LibreOffice / Google Docs Word export).
              Replace the placeholder logo line in the header with your company's logo image. Edit fonts,
              margins, page size, footer text, cover page colours — anything Word can do.
            </li>
            <li>
              <strong>Keep the {`{placeholders}`} intact.</strong> They are how Auditee injects the
              report content into your branded layout. Move them around freely; just don't delete them.
            </li>
            <li>
              <strong>Upload below.</strong> Every workspace member's next DOCX export of any report type
              will use your template — automatically, no extra clicks.
            </li>
          </ol>

          <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
            <p><strong>Headers &amp; footers are preserved.</strong> Auditee only fills in the {`{placeholders}`} inside the document body. Your branded header (logo, company name) and footer (page numbers, address line, confidentiality notice) come through your export byte-for-byte unchanged.</p>
            <p><strong>White-label on paid plans.</strong> The {`{generated_by}`} placeholder resolves to <em>Auditee</em> on free plans and to an empty string on any paid plan, so customer-facing exports don't advertise the underlying tool.</p>
          </div>

          {canManage && (
            <div className="mt-4 p-4 border-2 border-dashed border-slate-300 rounded-lg text-center bg-slate-50">
              <input
                ref={fileRef}
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={onFile}
                data-testid="template-file-input"
              />
              <Button onClick={onPickFile} disabled={busy} size="lg" data-testid="upload-template-btn">
                <Upload className="h-4 w-4 mr-2" />
                {busy ? "Uploading…" : tpl ? "Replace company template" : "Upload company template"}
              </Button>
              <p className="text-xs text-slate-500 mt-2">
                .docx only · max 15 MB · one template per workspace
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available placeholders</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-600 mb-3">
            Type these literally inside your template (curly braces included). Auditee replaces each one
            with the corresponding value at export time.
          </p>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Placeholder</th>
                  <th className="text-left px-3 py-2 font-medium">What it becomes</th>
                </tr>
              </thead>
              <tbody>
                {PLACEHOLDERS.map((p) => (
                  <tr key={p.token} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-mono text-xs text-blue-700 whitespace-nowrap">
                      {p.token}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Tip: if a placeholder is misspelled or removed, that part of the report will simply be blank
            in the export. Re-upload with the correct token to fix it.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
