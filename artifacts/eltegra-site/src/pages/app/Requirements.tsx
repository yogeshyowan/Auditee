import { useState, useMemo } from "react";
import {
  useListRequirements,
  useCreateRequirement,
  useUpdateRequirement,
  RequirementStatus,
  RequirementType,
  RequirementPriority,
  type Requirement,
} from "@workspace/api-client-react";
import { useProjectContext } from "@/lib/project-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Search, FileText, Sparkles, Loader2, Code2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useGenerateRequirements } from "@/lib/ai-api";
import { Comments } from "@/components/Comments";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  in_review: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-blue-50 text-blue-700 border-blue-200",
  implemented: "bg-primary/10 text-primary border-primary/20",
  verified: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const PRIORITY_COLOR: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-50 text-blue-700",
  high: "bg-amber-50 text-amber-700",
  critical: "bg-red-50 text-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  in_review: "In Review",
  approved: "Approved",
  implemented: "Implemented",
  verified: "Verified",
};

const RM_SYSTEM_LABEL: Record<string, string> = {
  doors: "DOORS",
  doors_next: "DOORS Next",
  jama: "Jama",
  polarion: "Polarion",
  codebeamer: "codeBeamer",
  helix_rm: "Helix RM",
  visure: "Visure",
  azure_devops: "Azure DevOps",
  jira_reqs: "Jira",
  reqif: "ReqIF",
  auditee_ai: "Auditee AI",
};

// Defence-in-depth: only allow http(s) links to be rendered. Anything else
// (javascript:, data:, vbscript:, etc.) is dropped to a non-clickable badge.
function safeHttpUrl(u: string | null | undefined): string | null {
  if (!u) return null;
  try {
    const parsed = new URL(u);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.toString();
    return null;
  } catch {
    return null;
  }
}

function SourceBadge({ req }: { req: Requirement }) {
  // externalSystem / externalUrl / externalId may not yet be present in
  // the auto-generated TS type; the API still returns them on the row.
  const r = req as Requirement & { externalSystem?: string | null; externalUrl?: string | null; externalId?: string | null };
  if (!r.externalSystem) return null;
  const label = RM_SYSTEM_LABEL[r.externalSystem] ?? r.externalSystem;
  const text = r.externalId ? `${label} · ${r.externalId}` : label;
  const safeUrl = safeHttpUrl(r.externalUrl);
  if (safeUrl) {
    return (
      <a
        href={safeUrl}
        target="_blank"
        rel="noreferrer noopener"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:underline"
        title={`Open in ${label}`}
      >
        {text}
      </a>
    );
  }
  return (
    <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
      {text}
    </span>
  );
}

export default function RequirementsPage() {
  const { projectId } = useProjectContext();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Requirement | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [brief, setBrief] = useState("");
  const [generateCodeOpen, setGenerateCodeOpen] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("");
  const { toast } = useToast();
  const generateMut = useGenerateRequirements();

  // The source-filter dropdown narrows the API request. We always also fetch the
  // unfiltered set (per project) so we can populate the dropdown with the actual
  // sources/origins present in this project.
  const params = useMemo(() => {
    const p: Record<string, string> = {};
    if (projectId) p.projectId = projectId;
    if (statusFilter !== "all") p.status = statusFilter;
    if (typeFilter !== "all") p.type = typeFilter;
    if (search) p.search = search;
    if (sourceFilter === "manual") {
      p.origin = "manual";
    } else if (sourceFilter !== "all" && sourceFilter !== "__other_imported__") {
      // Source-filter values that are not "all"/"manual"/"__other_imported__"
      // are externalSystem codes (doors/jama/azure_devops/...).
      p.externalSystem = sourceFilter;
    }
    // "__other_imported__" has no usable backend predicate yet — fall through
    // to the project-only filter; the count chip still shows the actual size.
    return p as any;
  }, [projectId, statusFilter, typeFilter, search, sourceFilter]);

  const { data: requirements, isLoading } = useListRequirements(params);

  // Unfiltered project requirements — used solely to compute which sources to
  // show in the filter dropdown and the source-counter chips.
  const projectAllParams = useMemo(() => (projectId ? ({ projectId } as any) : ({} as any)), [projectId]);
  const { data: allProjectReqs } = useListRequirements(projectAllParams);

  // Build a list of source options for the dropdown from the unfiltered set:
  //   {value: "manual", label: "Manual entries", count: N}
  //   {value: "doors",  label: "DOORS",         count: N}
  //   ...
  const sourceOptions = useMemo(() => {
    // Canonical discriminator: a requirement is "manual" iff sourceId is null.
    // This matches the backend `origin=manual` filter (which uses isNull(sourceId))
    // so dropdown counts and filtered results stay consistent even if an imported
    // row is missing an externalSystem label.
    const counts = new Map<string, number>();
    let manualCount = 0;
    let importedNoSystem = 0;
    (allProjectReqs ?? []).forEach((r) => {
      const x = r as Requirement & { externalSystem?: string | null; sourceId?: string | null };
      if (!x.sourceId) {
        manualCount++;
        return;
      }
      if (x.externalSystem) {
        counts.set(x.externalSystem, (counts.get(x.externalSystem) ?? 0) + 1);
      } else {
        importedNoSystem++;
      }
    });
    const items: Array<{ value: string; label: string; count: number }> = [];
    if (manualCount > 0) items.push({ value: "manual", label: "Manual entries", count: manualCount });
    Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([sys, n]) => {
        items.push({ value: sys, label: RM_SYSTEM_LABEL[sys] ?? sys, count: n });
      });
    if (importedNoSystem > 0) {
      items.push({ value: "__other_imported__", label: "Other connected source", count: importedNoSystem });
    }
    return items;
  }, [allProjectReqs]);
  const queryClient = useQueryClient();
  const updateMut = useUpdateRequirement({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/requirements"] });
      },
    },
  });
  const createMut = useCreateRequirement({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/requirements"] });
        setCreateOpen(false);
      },
    },
  });

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 font-[Inter_Tight]">Requirements</h1>
          <p className="text-slate-500 mt-1">Browse, filter, and manage every requirement in the knowledge graph.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setGenerateOpen(true)}
            className="gap-2"
            disabled={!projectId}
            data-testid="button-generate-from-brief"
          >
            <Sparkles className="h-4 w-4" /> Generate from brief
          </Button>
          <Button
            onClick={() => setGenerateCodeOpen(true)}
            variant="outline"
            className="gap-2"
            disabled={!projectId}
            data-testid="button-generate-from-code"
          >
            <Code2 className="h-4 w-4" /> Generate from code
          </Button>
          <Button onClick={() => setCreateOpen(true)} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> New Requirement
          </Button>
        </div>
      </header>

      <Dialog open={generateOpen} onOpenChange={(open) => { if (!generateMut.isPending) setGenerateOpen(open); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-[Inter_Tight] text-2xl flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Generate from brief
            </DialogTitle>
            <DialogDescription>Auditee will draft a small set of well-formed requirements.</DialogDescription>
          </DialogHeader>
          {generateMut.isPending ? (
            <div className="py-10 flex flex-col items-center gap-3 text-slate-600">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Auditee is drafting requirements...</p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!projectId || brief.length < 20) return;
                generateMut.mutate(
                  { projectId, brief },
                  {
                    onSuccess: (data) => {
                      toast({ title: `Generated ${data.count} requirements` });
                      setBrief("");
                      setGenerateOpen(false);
                    },
                    onError: (err: Error) => {
                      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
                    },
                  },
                );
              }}
              className="space-y-4"
            >
              <Textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                rows={8}
                placeholder="Describe what you're building. Auditee will draft requirements covering business, product, functional, and non-functional aspects."
                className="resize-none"
                data-testid="textarea-brief"
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setGenerateOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={brief.length < 20 || !projectId} className="gap-2">
                  <Sparkles className="h-4 w-4" /> Generate
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={generateCodeOpen} onOpenChange={(open) => { if (!generateMut.isPending) setGenerateCodeOpen(open); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-[Inter_Tight] text-2xl flex items-center gap-2">
              <Code2 className="h-5 w-5 text-primary" /> Generate from code
            </DialogTitle>
            <DialogDescription>
              No requirements management tool connected? Paste source code (a route, function, class, or stored procedure) and Auditee will reverse-engineer structured requirements with full fields — same shape as a DOORS or Jama import.
            </DialogDescription>
          </DialogHeader>
          {generateMut.isPending ? (
            <div className="py-10 flex flex-col items-center gap-3 text-slate-600">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Auditee is reading the code and drafting requirements...</p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!projectId || codeInput.trim().length < 20) return;
                generateMut.mutate(
                  { projectId, code: codeInput, language: codeLanguage || undefined },
                  {
                    onSuccess: (data) => {
                      toast({ title: `Generated ${data.count} requirements from code` });
                      setCodeInput("");
                      setCodeLanguage("");
                      setGenerateCodeOpen(false);
                    },
                    onError: (err: Error) => {
                      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
                    },
                  },
                );
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="code-language">Language (optional)</Label>
                <Input
                  id="code-language"
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value)}
                  placeholder="e.g. typescript, python, java, cobol, sql"
                  data-testid="input-code-language"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code-input">Source code</Label>
                <Textarea
                  id="code-input"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  rows={14}
                  placeholder="// Paste the function, route, class, or stored procedure you want to derive requirements from."
                  className="resize-none font-mono text-xs"
                  data-testid="textarea-code"
                />
                <p className="text-xs text-slate-500">{codeInput.length} / 30000 characters</p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setGenerateCodeOpen(false)}>Cancel</Button>
                <Button
                  type="submit"
                  disabled={codeInput.trim().length < 20 || !projectId}
                  className="gap-2"
                  data-testid="button-submit-code"
                >
                  <Code2 className="h-4 w-4" /> Generate
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Card className="rounded-xl border-slate-200 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search requirements..."
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.values(RequirementStatus).map(s => (
                <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {Object.values(RequirementType).map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[220px]" data-testid="requirements-source-filter">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources ({(allProjectReqs ?? []).length})</SelectItem>
              {sourceOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label} ({opt.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {sourceOptions.length > 1 && (
          <div className="mt-3 flex items-center gap-2 flex-wrap text-xs text-slate-500">
            <span>Sources contributing to this project:</span>
            {sourceOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSourceFilter(opt.value === sourceFilter ? "all" : opt.value)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] transition-colors ${
                  sourceFilter === opt.value
                    ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
                data-testid={`requirements-source-chip-${opt.value}`}
              >
                <span>{opt.label}</span>
                <span className="font-medium">{opt.count}</span>
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card className="rounded-xl border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
          </div>
        ) : !requirements || requirements.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            No requirements match your filters.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="w-28">Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="w-20">Type</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-24">Priority</TableHead>
                <TableHead className="w-40">Owner</TableHead>
                <TableHead>Frameworks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requirements.map(req => (
                <TableRow
                  key={req.id}
                  onClick={() => setSelected(req)}
                  className="cursor-pointer hover:bg-slate-50"
                >
                  <TableCell className="font-mono text-xs text-slate-600">{req.code}</TableCell>
                  <TableCell className="font-medium text-slate-900">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>{req.title}</span>
                      <SourceBadge req={req} />
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{req.type}</Badge></TableCell>
                  <TableCell><Badge className={STATUS_COLOR[req.status] + " border"}>{STATUS_LABEL[req.status]}</Badge></TableCell>
                  <TableCell><span className={"text-xs px-2 py-0.5 rounded font-medium " + PRIORITY_COLOR[req.priority]}>{req.priority}</span></TableCell>
                  <TableCell className="text-sm text-slate-600">{req.owner}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {(req.linkedFrameworks ?? []).slice(0, 3).map(fw => (
                        <Badge key={fw} variant="secondary" className="text-[10px]">{fw}</Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Sheet open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant="outline" className="font-mono text-xs">{selected.code}</Badge>
                  <Badge variant="outline">{selected.type}</Badge>
                  <SourceBadge req={selected} />
                </div>
                <SheetTitle className="font-[Inter_Tight] text-2xl">{selected.title}</SheetTitle>
                <SheetDescription>Owner: {selected.owner}</SheetDescription>
              </SheetHeader>
              <div className="space-y-5 py-6">
                {selected.description && (
                  <div>
                    <Label className="text-xs uppercase text-slate-500 tracking-wider">Description</Label>
                    <p className="mt-1 text-sm text-slate-700 leading-relaxed">{selected.description}</p>
                  </div>
                )}
                <div>
                  <Label className="text-xs uppercase text-slate-500 tracking-wider">Status</Label>
                  <Select
                    value={selected.status}
                    onValueChange={v => {
                      updateMut.mutate({ requirementId: selected.id, data: { status: v as any } });
                      setSelected({ ...selected, status: v as any });
                    }}
                  >
                    <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.values(RequirementStatus).map(s => (
                        <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs uppercase text-slate-500 tracking-wider">Priority</Label>
                    <div className="mt-2"><span className={"text-xs px-2 py-1 rounded font-medium " + PRIORITY_COLOR[selected.priority]}>{selected.priority}</span></div>
                  </div>
                  <div>
                    <Label className="text-xs uppercase text-slate-500 tracking-wider">Linked code</Label>
                    <div className="mt-2 text-sm text-slate-700">{selected.linkedCodeCount ?? 0} artifacts</div>
                  </div>
                </div>
                {selected.linkedFrameworks && selected.linkedFrameworks.length > 0 && (
                  <div>
                    <Label className="text-xs uppercase text-slate-500 tracking-wider">Frameworks</Label>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selected.linkedFrameworks.map(fw => <Badge key={fw} variant="secondary">{fw}</Badge>)}
                    </div>
                  </div>
                )}
                {selected.tags && selected.tags.length > 0 && (
                  <div>
                    <Label className="text-xs uppercase text-slate-500 tracking-wider">Tags</Label>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selected.tags.map(t => <Badge key={t} variant="outline">{t}</Badge>)}
                    </div>
                  </div>
                )}
                <Comments entityType="requirement" entityId={selected.id} projectId={selected.projectId} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <CreateRequirementDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projectId={projectId}
        onSubmit={(values) => createMut.mutate({ data: values })}
        isPending={createMut.isPending}
      />
    </div>
  );
}

function CreateRequirementDialog({
  open,
  onOpenChange,
  projectId,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | null;
  onSubmit: (values: any) => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>(RequirementType.PRD);
  const [priority, setPriority] = useState<string>(RequirementPriority.medium);
  const [owner, setOwner] = useState("");

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !title) return;
    onSubmit({ projectId, title, description: description || undefined, type, priority, owner: owner || undefined });
    setTitle(""); setDescription(""); setOwner("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-[Inter_Tight] text-2xl">New requirement</DialogTitle>
          <DialogDescription>Capture a new BRD, PRD, FRD or NFR for the active project.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handle} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} className="mt-1.5 resize-none" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(RequirementType).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(RequirementPriority).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="owner">Owner</Label>
            <Input id="owner" value={owner} onChange={e => setOwner(e.target.value)} placeholder="e.g. Avery Kim" className="mt-1.5" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending || !projectId || !title}>
              {isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
