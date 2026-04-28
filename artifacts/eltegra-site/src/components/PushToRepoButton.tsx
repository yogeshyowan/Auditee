import { useState, useMemo, useEffect } from "react";
import { GitBranch, Loader2, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { usePushTargets, usePushReport, usePushTestBundle, type PushResult } from "@/lib/repo-push-api";

type Props = {
  projectId: string | null;
  /** "report" pushes a single report; "test-bundle" pushes the entire test bundle. */
  kind: "report" | "test-bundle";
  /** Required when kind="report". */
  reportId?: string;
  /** Pre-fill commit message (default sensible per kind). */
  defaultCommitMessage?: string;
  /** Pre-fill subdir under the repo root (default: "auditee/reports" for report, "auditee" for bundle). */
  defaultSubdir?: string;
  /** Visual style. */
  size?: "sm" | "default" | "icon";
  variant?: "default" | "outline" | "ghost" | "secondary";
  className?: string;
  label?: string;
  testid?: string;
};

export function PushToRepoButton({
  projectId,
  kind,
  reportId,
  defaultCommitMessage,
  defaultSubdir,
  size = "sm",
  variant = "outline",
  className,
  label = "Push to repo",
  testid,
}: Props) {
  const [open, setOpen] = useState(false);
  const { data: targets, isLoading } = usePushTargets(open ? projectId : null);
  const pushReport = usePushReport();
  const pushBundle = usePushTestBundle();
  const { toast } = useToast();

  const sources = targets?.sources ?? [];
  const [sourceId, setSourceId] = useState<string>("");
  const [branch, setBranch] = useState("");
  const [subdir, setSubdir] = useState(defaultSubdir ?? (kind === "report" ? "auditee/reports" : "auditee"));
  const [commitMessage, setCommitMessage] = useState(defaultCommitMessage ?? "");
  const [result, setResult] = useState<PushResult | null>(null);

  // Auto-pick the most recent source when the dialog opens.
  useEffect(() => {
    if (open && sources.length > 0 && !sourceId) {
      setSourceId(sources[0]!.id);
      if (sources[0]!.branch) setBranch(sources[0]!.branch);
    }
  }, [open, sources, sourceId]);

  const picked = useMemo(() => sources.find((s) => s.id === sourceId), [sources, sourceId]);
  const pending = pushReport.isPending || pushBundle.isPending;
  const blockingMsg = !projectId
    ? "Select a project first."
    : sources.length === 0
      ? "No GitHub source connected. Add one in the Sources tab."
      : picked && !picked.hasToken
        ? "This source has no token. Re-add it with a personal-access-token (repo scope)."
        : null;

  const onPush = async () => {
    if (!projectId) return;
    try {
      let res: PushResult;
      if (kind === "report") {
        if (!reportId) return;
        res = await pushReport.mutateAsync({
          projectId,
          reportId,
          sourceId: sourceId || undefined,
          branch: branch.trim() || undefined,
          subdir: subdir.trim() || undefined,
          commitMessage: commitMessage.trim() || undefined,
        });
      } else {
        res = await pushBundle.mutateAsync({
          projectId,
          sourceId: sourceId || undefined,
          branch: branch.trim() || undefined,
          subdir: subdir.trim() || undefined,
          commitMessage: commitMessage.trim() || undefined,
        });
      }
      setResult(res);
      toast({
        title: "Pushed to GitHub",
        description: `${res.fileCount} file(s) committed to ${res.branch} (${res.commitSha.slice(0, 7)})`,
      });
    } catch (e) {
      toast({ title: "Push failed", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setResult(null); }}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          disabled={!projectId}
          data-testid={testid ?? `push-${kind}`}
        >
          <GitBranch className="h-3.5 w-3.5 mr-1" /> {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" /> Push to GitHub
          </DialogTitle>
          <DialogDescription>
            {kind === "report"
              ? "Commit this report as a Markdown file into your connected GitHub repository — your compliance pipeline can then re-run against it."
              : "Commit the entire test-case suite (per-case Markdown, JSON manifest, latest execution report) into your connected GitHub repository in one atomic commit."}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-sm text-slate-500 py-4 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading targets…
          </div>
        ) : blockingMsg ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 text-amber-900 text-sm p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>{blockingMsg}</div>
          </div>
        ) : result ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 text-emerald-900 text-sm p-3 space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-4 w-4" /> Commit pushed
            </div>
            <div className="text-xs">
              <div><b>Branch:</b> <code>{result.branch}</code></div>
              <div><b>Files:</b> {result.fileCount}</div>
              <div><b>Commit:</b> <code>{result.commitSha.slice(0, 12)}</code></div>
              {result.path && <div><b>Path:</b> <code>{result.path}</code></div>}
            </div>
            <a
              href={result.commitUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-emerald-800 hover:underline text-xs font-medium"
            >
              View commit on GitHub <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">Repository</label>
              <Select value={sourceId} onValueChange={setSourceId}>
                <SelectTrigger data-testid="push-target-select"><SelectValue placeholder="Pick a repo…" /></SelectTrigger>
                <SelectContent>
                  {sources.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label} {s.repoUrl ? `— ${s.repoUrl.replace(/^https?:\/\/github\.com\//, "")}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Branch</label>
                <Input
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder={picked?.branch ?? "default branch"}
                  data-testid="push-branch"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Subfolder</label>
                <Input
                  value={subdir}
                  onChange={(e) => setSubdir(e.target.value)}
                  data-testid="push-subdir"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">Commit message</label>
              <Textarea
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder={kind === "report" ? "chore(auditee): add report" : "chore(auditee): sync test cases"}
                rows={2}
                data-testid="push-commit-message"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
          {!result && !blockingMsg && (
            <Button
              onClick={onPush}
              disabled={pending || (kind === "report" && !reportId)}
              data-testid="push-confirm"
              className="gap-2"
            >
              {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Pushing…</> : <><GitBranch className="h-4 w-4" /> Push commit</>}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
