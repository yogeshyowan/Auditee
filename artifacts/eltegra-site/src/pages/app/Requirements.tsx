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
import { Plus, Search, FileText } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

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

export default function RequirementsPage() {
  const { projectId } = useProjectContext();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Requirement | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const params = useMemo(() => {
    const p: Record<string, string> = {};
    if (projectId) p.projectId = projectId;
    if (statusFilter !== "all") p.status = statusFilter;
    if (typeFilter !== "all") p.type = typeFilter;
    if (search) p.search = search;
    return p as any;
  }, [projectId, statusFilter, typeFilter, search]);

  const { data: requirements, isLoading } = useListRequirements(params);
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
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Requirement
        </Button>
      </header>

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
        </div>
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
                  <TableCell className="font-medium text-slate-900">{req.title}</TableCell>
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
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="font-mono text-xs">{selected.code}</Badge>
                  <Badge variant="outline">{selected.type}</Badge>
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
