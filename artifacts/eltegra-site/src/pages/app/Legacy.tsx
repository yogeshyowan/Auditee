import { useState } from "react";
import { useListLegacySystems, useListProjects } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Database, FileSearch, Loader2 } from "lucide-react";
import { useLegacyExtract } from "@/lib/ai-api";
import { useToast } from "@/hooks/use-toast";

const PRIORITY_BADGE: Record<string, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-blue-50 text-blue-700",
  high: "bg-amber-50 text-amber-700",
  critical: "bg-red-50 text-red-700",
};

const RISK_BORDER: Record<string, string> = {
  low: "border-emerald-200 bg-emerald-50/50",
  medium: "border-amber-200 bg-amber-50/50",
  high: "border-red-200 bg-red-50/50",
};

const RISK_BADGE: Record<string, string> = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-red-50 text-red-700 border-red-200",
};

function riskClass(risk: number) {
  if (risk < 50) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (risk <= 75) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-red-50 text-red-700 border-red-200";
}

const NONE_VALUE = "__none__";

export default function Legacy() {
  const { data: systems, isLoading } = useListLegacySystems();
  const { data: projects } = useListProjects();
  const { toast } = useToast();

  const [openSystemId, setOpenSystemId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [targetProjectId, setTargetProjectId] = useState<string>(NONE_VALUE);
  const extractMut = useLegacyExtract();

  const openSystem = systems?.find((s) => s.id === openSystemId);
  const targetProject = projects?.find((p) => p.id === targetProjectId);

  const closeDialog = () => {
    if (extractMut.isPending) return;
    setOpenSystemId(null);
    setCode("");
    setTargetProjectId(NONE_VALUE);
    extractMut.reset();
  };

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 font-[Inter_Tight]">Legacy Modernization</h1>
        <p className="text-slate-500 mt-1">Systems being scanned, mapped, and modernized via the knowledge graph.</p>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      ) : !systems || systems.length === 0 ? (
        <div className="p-12 text-center text-slate-500">No legacy systems registered yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {systems.map(sys => (
            <Card key={sys.id} className="rounded-xl border-slate-200 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                      <Database className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 font-[Inter_Tight] tracking-tight">{sys.name}</div>
                      <Badge variant="outline" className="mt-1 text-[10px]">{sys.language}</Badge>
                    </div>
                  </div>
                  <Badge className={riskClass(sys.riskScore) + " border"}>Risk {sys.riskScore}</Badge>
                </div>

                {sys.description && (
                  <p className="text-sm text-slate-600 mb-4 line-clamp-3">{sys.description}</p>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-100">
                  <div>
                    <div className="text-slate-500">LOC scanned</div>
                    <div className="text-base font-semibold text-slate-900 mt-0.5">{sys.locScanned.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Reqs extracted</div>
                    <div className="text-base font-semibold text-slate-900 mt-0.5">{sys.requirementsExtracted.toLocaleString()}</div>
                  </div>
                </div>

                {sys.modernizationStatus && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="text-xs">{sys.modernizationStatus}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-primary hover:text-primary"
                      onClick={() => { setOpenSystemId(sys.id); }}
                      data-testid={`button-extract-${sys.id}`}
                    >
                      <FileSearch className="h-4 w-4" /> Extract requirements
                    </Button>
                  </div>
                )}
                {!sys.modernizationStatus && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-primary hover:text-primary"
                      onClick={() => { setOpenSystemId(sys.id); }}
                    >
                      <FileSearch className="h-4 w-4" /> Extract requirements
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!openSystemId} onOpenChange={(o) => { if (!o) closeDialog(); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-[Inter_Tight] text-2xl flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-primary" /> Extract requirements
            </DialogTitle>
            <DialogDescription>
              {openSystem ? `Montana will read ${openSystem.name} code and extract implicit requirements + risks.` : ""}
            </DialogDescription>
          </DialogHeader>

          {extractMut.isPending ? (
            <div className="py-12 flex flex-col items-center gap-3 text-slate-600">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Montana is reading the legacy code...</p>
            </div>
          ) : extractMut.data ? (
            <div className="space-y-5">
              <div>
                <Label className="text-xs uppercase text-slate-500 tracking-wider">Summary</Label>
                <p className="mt-1 text-sm text-slate-700">{extractMut.data.summary}</p>
              </div>

              <div>
                <Label className="text-xs uppercase text-slate-500 tracking-wider">Requirements ({extractMut.data.requirements.length})</Label>
                <div className="mt-2 space-y-2">
                  {extractMut.data.requirements.map((r, i) => (
                    <Card key={i} className="rounded-lg border-slate-200">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px]">{r.type}</Badge>
                          <span className={"text-[10px] px-2 py-0.5 rounded font-medium " + (PRIORITY_BADGE[r.priority] ?? "bg-slate-100 text-slate-700")}>{r.priority}</span>
                          <span className="font-medium text-sm text-slate-900">{r.title}</span>
                        </div>
                        <p className="text-xs text-slate-600">{r.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {extractMut.data.risks.length > 0 && (
                <div>
                  <Label className="text-xs uppercase text-slate-500 tracking-wider">Risks ({extractMut.data.risks.length})</Label>
                  <div className="mt-2 space-y-2">
                    {extractMut.data.risks.map((risk, i) => (
                      <Card key={i} className={"rounded-lg border " + (RISK_BORDER[risk.severity] ?? "")}>
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={(RISK_BADGE[risk.severity] ?? "bg-slate-100 text-slate-700") + " border text-[10px]"}>{risk.severity}</Badge>
                            <span className="font-medium text-sm text-slate-900">{risk.title}</span>
                          </div>
                          <p className="text-xs text-slate-700">{risk.detail}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {extractMut.data.modernizationNotes && (
                <div>
                  <Label className="text-xs uppercase text-slate-500 tracking-wider">Modernization notes</Label>
                  <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{extractMut.data.modernizationNotes}</p>
                </div>
              )}

              <DialogFooter className="flex sm:justify-between items-center">
                <span className="text-sm text-slate-600">
                  {extractMut.data.createdRequirementCount > 0 && targetProject
                    ? `Saved ${extractMut.data.createdRequirementCount} to ${targetProject.name}`
                    : "Preview only"}
                </span>
                <Button onClick={closeDialog}>Close</Button>
              </DialogFooter>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!openSystemId || code.length < 20) return;
                extractMut.mutate(
                  {
                    legacySystemId: openSystemId,
                    code,
                    projectId: targetProjectId === NONE_VALUE ? undefined : targetProjectId,
                  },
                  {
                    onError: (err: Error) =>
                      toast({ title: "Extraction failed", description: err.message, variant: "destructive" }),
                  },
                );
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="legacy-code">Legacy code</Label>
                <Textarea
                  id="legacy-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  rows={12}
                  required
                  className="mt-1.5 font-mono text-xs resize-none"
                  placeholder="Paste a representative excerpt of the legacy code..."
                />
              </div>
              <div>
                <Label>Save extracted requirements to project</Label>
                <Select value={targetProjectId} onValueChange={setTargetProjectId}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Preview only" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>Preview only (don't save)</SelectItem>
                    {projects?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                <Button type="submit" disabled={code.length < 20} className="gap-2">
                  <FileSearch className="h-4 w-4" /> Extract
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
