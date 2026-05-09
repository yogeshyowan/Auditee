import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Send } from "lucide-react";

type Vendor = "jira" | "ado" | "confluence" | "sharepoint";
type Target = { id: string; kind: string; label: string; vendor: Vendor };

type WorkItemPayload = {
  type: "workitem";
  title: string;
  description: string;
  workItemType?: string;
  priority?: "critical" | "high" | "medium" | "low";
  labels?: string[];
};

type DocumentPayload = {
  type: "document";
  title: string;
  markdown: string;
};

type Props = {
  projectId: string;
  payload: WorkItemPayload | DocumentPayload;
  buttonLabel?: string;
  buttonSize?: "sm" | "default" | "icon";
  buttonVariant?: "default" | "outline" | "ghost" | "secondary";
  testid?: string;
};

async function jfetch<T>(
  path: string,
  init: RequestInit | undefined,
  getToken: () => Promise<string | null>,
): Promise<T> {
  const token = await getToken().catch(() => null);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init?.headers ?? {}) as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(`/api${path}`, { ...init, headers });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    let msg = txt;
    try {
      msg = (JSON.parse(txt) as { error?: string }).error ?? txt;
    } catch {
      // not json
    }
    throw new Error(msg || `HTTP ${r.status}`);
  }
  return (await r.json()) as T;
}

export function PushToConnectorButton({
  projectId,
  payload,
  buttonLabel,
  buttonSize = "sm",
  buttonVariant = "outline",
  testid,
}: Props) {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [targets, setTargets] = useState<Target[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [pushing, setPushing] = useState(false);

  const targetType: "workitem" | "document" = payload.type;
  const defaultLabel = targetType === "workitem" ? "Create issue" : "Publish to…";

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    jfetch<{ targets: Target[] }>(
      `/connector-push/targets?projectId=${encodeURIComponent(projectId)}&type=${targetType}`,
      undefined,
      getToken,
    )
      .then((r) => {
        setTargets(r.targets);
        if (r.targets[0] && !selectedId) setSelectedId(r.targets[0].id);
      })
      .catch((err) => {
        toast({
          title: "Couldn't load targets",
          description: err.message,
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectId, targetType]);

  const onPush = async () => {
    const target = targets.find((t) => t.id === selectedId);
    if (!target) return;
    setPushing(true);
    try {
      const body =
        payload.type === "workitem"
          ? {
              sourceId: target.id,
              title: payload.title,
              description: payload.description,
              type: payload.workItemType,
              priority: payload.priority,
              labels: payload.labels,
            }
          : {
              sourceId: target.id,
              title: payload.title,
              markdown: payload.markdown,
            };
      const path =
        payload.type === "workitem" ? "/connector-push/work-item" : "/connector-push/document";
      const result = await jfetch<{ url: string; externalId: string; vendor: Vendor }>(
        path,
        { method: "POST", body: JSON.stringify(body) },
        getToken,
      );
      toast({
        title:
          payload.type === "workitem"
            ? `Created ${result.externalId} in ${target.label}`
            : `Published to ${target.label}`,
        description: (
          <a href={result.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">
            Open in {result.vendor} <ExternalLink className="h-3 w-3" />
          </a>
        ) as any,
      });
      setOpen(false);
    } catch (err: any) {
      toast({
        title: "Push failed",
        description: err.message ?? "Please check the source credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setPushing(false);
    }
  };

  return (
    <>
      <Button
        variant={buttonVariant}
        size={buttonSize}
        onClick={() => setOpen(true)}
        data-testid={testid}
      >
        <Send className="h-3.5 w-3.5 mr-1" />
        {buttonLabel ?? defaultLabel}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {payload.type === "workitem" ? "Create work item" : "Publish report"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="text-slate-700">
              <span className="text-slate-500">Title:</span> {payload.title}
            </div>
            {loading && <div className="text-muted-foreground">Loading targets…</div>}
            {!loading && targets.length === 0 && (
              <div className="text-muted-foreground border rounded-md p-3">
                No connected{" "}
                {payload.type === "workitem" ? "Jira/Azure DevOps" : "Confluence/SharePoint"}{" "}
                sources for this project. Add one on the Sources page first.
              </div>
            )}
            {!loading && targets.length > 0 && (
              <>
                <label className="block text-xs text-muted-foreground">Target</label>
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {targets.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.label} <span className="text-muted-foreground text-xs">· {t.vendor}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={onPush}
              disabled={!selectedId || pushing || targets.length === 0}
              data-testid="connector-push-confirm"
            >
              {pushing ? "Pushing…" : payload.type === "workitem" ? "Create" : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
