import { useRef, useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  FileText,
  Trash2,
  ShieldCheck,
  Loader2,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import {
  listUploadedStandards,
  uploadStandard,
  deleteStandard,
  type UploadedStandard,
} from "@/lib/wave1-api";
import { SEO } from "@/components/SEO";

const ACCEPTED_EXTENSIONS = ".pdf,.docx,.doc,.txt,.md";
const MAX_BYTES = 25 * 1024 * 1024;

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function CustomStandards() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<string>("");

  const standardsQuery = useQuery({
    queryKey: ["custom-standards"],
    queryFn: listUploadedStandards,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteStandard(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-standards"] });
      qc.invalidateQueries({ queryKey: ["compliance-frameworks"] });
      qc.invalidateQueries({
        // The generated OpenAPI hook uses this key — invalidate so the
        // standards picker drops the deleted entry immediately.
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "/compliance/frameworks",
      });
      toast({ title: "Standard removed" });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Could not delete the standard.";
      toast({ title: "Delete failed", description: msg, variant: "destructive" });
    },
  });

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so the same file can be re-picked
    if (!file) return;

    if (file.size > MAX_BYTES) {
      toast({
        title: "File too large",
        description: `Max upload size is 25 MB. "${file.name}" is ${formatBytes(file.size)}.`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadStage("Reading file…");
    try {
      setUploadStage("Extracting text and asking AI to identify clauses (this can take 20–60s)…");
      const result = await uploadStandard(file);
      qc.invalidateQueries({ queryKey: ["custom-standards"] });
      qc.invalidateQueries({ queryKey: ["compliance-frameworks"] });
      qc.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "/compliance/frameworks",
      });
      toast({
        title: "Standard added",
        description: `Extracted ${result.controlsTotal} clauses from "${result.name}". It's now available everywhere you pick standards.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed.";
      toast({ title: "Upload failed", description: msg, variant: "destructive" });
    } finally {
      setUploading(false);
      setUploadStage("");
    }
  };

  const standards: UploadedStandard[] = standardsQuery.data?.standards ?? [];

  return (
    <div className="space-y-6">
      <SEO title="Custom Standards · Auditee" />

      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          Custom Standards
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Upload your own regulatory standard, customer compliance contract, or company SOP.
          Auditee extracts every clause with AI and adds it to the standards picker, so audits,
          AI reports, requirements generation, and gap analysis can all use it the same way they
          use built-in standards like ISO 27001 or IEC 62443.
        </p>
      </div>

      <Card data-testid="card-upload-standard">
        <CardHeader>
          <CardTitle className="text-base">Upload a standard</CardTitle>
          <CardDescription>
            PDF, DOCX, or plain-text files up to 25 MB. Scanned PDFs without OCR are not supported.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            onChange={handleFileChange}
            className="hidden"
            data-testid="input-standard-file"
          />
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg p-8 bg-slate-50/50">
            {uploading ? (
              <div className="text-center space-y-2" data-testid="upload-progress">
                <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin" />
                <p className="text-sm font-medium text-slate-900">Processing your standard…</p>
                <p className="text-xs text-slate-600 max-w-md">{uploadStage}</p>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-slate-400 mb-3" />
                <p className="text-sm text-slate-700 mb-3">
                  Drop a standard document here — or
                </p>
                <Button onClick={handlePickFile} data-testid="button-upload-standard">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose file
                </Button>
                <p className="text-[11px] text-slate-500 mt-3">
                  Accepted: .pdf, .docx, .doc, .txt, .md · Max 25 MB
                </p>
              </>
            )}
          </div>
          <div className="mt-4 flex items-start gap-2 text-xs text-slate-600 bg-amber-50 border border-amber-200 rounded-md p-3">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-900">How extraction works:</strong> the file is
              parsed in-memory (never written to disk), the text is sent to the configured AI
              provider with a strict prompt that asks it to return clauses as structured JSON,
              and the result is saved to your workspace. Source text is not stored — only the
              extracted clause list. Uploads are scoped to your workspace and never shared.
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-uploaded-standards">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base">Your uploaded standards</CardTitle>
              <CardDescription>
                These appear in every standards picker across the app — Compliance audits, AI Reports,
                Requirements generation, and Smart Interview.
              </CardDescription>
            </div>
            {standards.length > 0 && (
              <Badge variant="secondary">{standards.length} uploaded</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {standardsQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : standards.length === 0 ? (
            <div className="text-center py-10 text-sm text-slate-500">
              No custom standards yet. Upload your first one above.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {standards.map((s) => (
                <div
                  key={s.id}
                  className="py-3 flex items-start gap-3"
                  data-testid={`standard-row-${s.id}`}
                >
                  <FileText className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">{s.code}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {s.category || "Other"}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {s.controlsTotal} clauses
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-700 truncate mt-0.5">{s.name}</p>
                    {s.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{s.description}</p>
                    )}
                    <p className="text-[11px] text-slate-400 mt-1">
                      {s.originalFilename ?? "uploaded"} · {formatDate(s.uploadedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Link href={`/app/compliance/${s.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={`button-open-standard-${s.id}`}
                      >
                        <ExternalLink className="h-4 w-4 mr-1.5" />
                        Open
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Delete "${s.name}"? Audits and reports already linked to it will keep their references but won't be re-runnable against this standard.`,
                          )
                        ) {
                          deleteMutation.mutate(s.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-standard-${s.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-rose-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
