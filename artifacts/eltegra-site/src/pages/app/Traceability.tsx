import { useState } from "react";
import {
  useGetTraceabilityGraph,
  useListRequirements,
  useListComplianceFrameworks,
} from "@workspace/api-client-react";
import { useProjectContext } from "@/lib/project-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import { Network, Code2, Loader2 } from "lucide-react";
import { useAnalyzeCode } from "@/lib/ai-api";
import { useToast } from "@/hooks/use-toast";

const LANGUAGES = ["TypeScript", "JavaScript", "Python", "Go", "C#", "Java", "Rust", "SQL", "COBOL"];

const KIND_BADGE: Record<string, string> = {
  implements: "bg-emerald-50 text-emerald-700 border-emerald-200",
  tests: "bg-blue-50 text-blue-700 border-blue-200",
  violates: "bg-red-50 text-red-700 border-red-200",
};

const COLUMN_W = 280;
const NODE_H = 36;
const NODE_W = 240;
const ROW_GAP = 16;
const PAD_TOP = 40;

function kindColor(kind: string) {
  if (kind === "requirement") return { fill: "#00883A", stroke: "#016b2e", text: "#ffffff" };
  if (kind === "framework") return { fill: "#f59e0b", stroke: "#b45309", text: "#ffffff" };
  return { fill: "#0f172a", stroke: "#020617", text: "#ffffff" };
}

export default function Traceability() {
  const { projectId } = useProjectContext();
  const { toast } = useToast();
  const [analyzeOpen, setAnalyzeOpen] = useState(false);
  const [filePath, setFilePath] = useState("");
  const [symbol, setSymbol] = useState("");
  const [language, setLanguage] = useState("TypeScript");
  const [code, setCode] = useState("");
  const analyzeMut = useAnalyzeCode();
  const [frameworkId, setFrameworkId] = useState<string>("all");
  const { data: requirements } = useListRequirements(projectId ? ({ projectId } as any) : ({} as any));
  const { data: frameworks } = useListComplianceFrameworks();

  const { data: graph, isLoading } = useGetTraceabilityGraph(
    {
      projectId: projectId ?? "",
      ...(frameworkId !== "all" ? { frameworkId } : {}),
    } as any,
    { query: { enabled: !!projectId } as any }
  );

  const selectedFramework = (frameworks ?? []).find((f) => f.id === frameworkId);

  const reqByCode = new Map((requirements ?? []).map((r) => [r.code, r] as const));

  const resetAnalyze = () => {
    setFilePath("");
    setSymbol("");
    setLanguage("TypeScript");
    setCode("");
    analyzeMut.reset();
  };

  const analyzeDialog = (
    <Dialog
      open={analyzeOpen}
      onOpenChange={(open) => {
        if (!analyzeMut.isPending) {
          setAnalyzeOpen(open);
          if (!open) resetAnalyze();
        }
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-[Inter_Tight] text-2xl flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" /> Analyze code
          </DialogTitle>
          <DialogDescription>Montana links code to requirements in your project.</DialogDescription>
        </DialogHeader>

        {analyzeMut.isPending ? (
          <div className="py-12 flex flex-col items-center gap-3 text-slate-600">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Montana is analyzing your code...</p>
          </div>
        ) : analyzeMut.data ? (
          <div className="space-y-5">
            <div>
              <Label className="text-xs uppercase text-slate-500 tracking-wider">Summary</Label>
              <p className="mt-1 text-sm text-slate-700">{analyzeMut.data.summary}</p>
            </div>
            <div>
              <Label className="text-xs uppercase text-slate-500 tracking-wider">Matches</Label>
              {analyzeMut.data.matches.length === 0 ? (
                <p className="text-sm text-slate-500 mt-2">No high-confidence matches found.</p>
              ) : (
                <ul className="space-y-3 mt-2">
                  {analyzeMut.data.matches.map((m, i) => {
                    const req = reqByCode.get(m.requirementCode);
                    return (
                      <li key={i} className="border border-slate-200 rounded-lg p-3 bg-white">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="font-mono text-xs">{m.requirementCode}</Badge>
                          <Badge className={(KIND_BADGE[m.kind] ?? "bg-slate-100 text-slate-700") + " border"}>{m.kind}</Badge>
                          <span className="text-sm font-medium text-slate-900">{req?.title ?? ""}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <Progress value={Math.round(m.confidence * 100)} className="h-1.5 flex-1" />
                          <span className="text-xs text-slate-500 w-12 text-right">{Math.round(m.confidence * 100)}%</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-2">{m.rationale}</p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <DialogFooter className="flex sm:justify-between items-center">
              <span className="text-sm text-slate-600">Done — {analyzeMut.data.linksCreated} link(s) created</span>
              <Button onClick={() => { setAnalyzeOpen(false); resetAnalyze(); }}>Close</Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!projectId) return;
              analyzeMut.mutate(
                { projectId, filePath, symbol, language, code },
                {
                  onError: (err: Error) => {
                    toast({ title: "Analysis failed", description: err.message, variant: "destructive" });
                  },
                },
              );
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="filePath">File path</Label>
                <Input id="filePath" value={filePath} onChange={(e) => setFilePath(e.target.value)} placeholder="src/auth/login.ts" required className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="symbol">Symbol</Label>
                <Input id="symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="loginUser" required className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label>Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="code">Code</Label>
              <Textarea
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={12}
                required
                className="mt-1.5 font-mono text-xs resize-none"
                placeholder="Paste a function or module here..."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAnalyzeOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!projectId || code.length < 10 || !filePath || !symbol} className="gap-2">
                <Code2 className="h-4 w-4" /> Analyze
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );

  if (!projectId) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 font-[Inter_Tight]">Traceability Graph</h1>
            <p className="text-slate-500 mt-1">Select a project to view its traceability graph.</p>
          </div>
          <Button onClick={() => setAnalyzeOpen(true)} disabled className="gap-2">
            <Code2 className="h-4 w-4" /> Analyze code
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !graph) {
    return (
      <div className="p-6 space-y-4">
        {analyzeDialog}
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px] rounded-xl" />
      </div>
    );
  }

  const reqs = graph.nodes.filter(n => n.kind === "requirement");
  const codes = graph.nodes.filter(n => n.kind === "code");
  const fws = graph.nodes.filter(n => n.kind === "framework");

  const columns = [
    { title: "Requirements", nodes: reqs, x: 40 },
    { title: "Code", nodes: codes, x: 40 + COLUMN_W + 80 },
    { title: "Frameworks", nodes: fws, x: 40 + (COLUMN_W + 80) * 2 },
  ];

  const positions = new Map<string, { x: number; y: number; cx: number; cy: number }>();
  columns.forEach(col => {
    col.nodes.forEach((n, i) => {
      const y = PAD_TOP + i * (NODE_H + ROW_GAP);
      positions.set(n.id, { x: col.x, y, cx: col.x + NODE_W / 2, cy: y + NODE_H / 2 });
    });
  });

  const maxRows = Math.max(reqs.length, codes.length, fws.length, 1);
  const svgHeight = PAD_TOP + maxRows * (NODE_H + ROW_GAP) + 40;
  const svgWidth = 40 + (COLUMN_W + 80) * 2 + NODE_W + 40;

  // group edges by requirement
  const edgesByReq = new Map<string, typeof graph.edges>();
  graph.edges.forEach(e => {
    const reqId = reqs.find(r => r.id === e.from)?.id ?? reqs.find(r => r.id === e.to)?.id;
    if (!reqId) return;
    if (!edgesByReq.has(reqId)) edgesByReq.set(reqId, []);
    edgesByReq.get(reqId)!.push(e);
  });

  return (
    <div className="p-6 space-y-6">
      {analyzeDialog}
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 font-[Inter_Tight]">Traceability Graph</h1>
          <p className="text-slate-500 mt-1">
            {selectedFramework
              ? `Tracing requirements covered by ${selectedFramework.code} — ${selectedFramework.name}.`
              : "Live links between requirements, code, and compliance frameworks."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="min-w-[260px]">
            <Label className="text-xs uppercase text-slate-500 tracking-wider">Standard</Label>
            <Select value={frameworkId} onValueChange={setFrameworkId}>
              <SelectTrigger className="mt-1.5" data-testid="select-framework">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All frameworks</SelectItem>
                {(frameworks ?? []).map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.code} — {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setAnalyzeOpen(true)} className="gap-2 self-end" data-testid="button-analyze-code">
            <Code2 className="h-4 w-4" /> Analyze code
          </Button>
        </div>
      </header>

      {selectedFramework && reqs.length === 0 && (
        <Card className="rounded-xl border-amber-200 bg-amber-50">
          <CardContent className="py-4 text-sm text-amber-900">
            No requirements in this project are linked to{" "}
            <strong>{selectedFramework.code}</strong> yet. Tag a requirement
            with this framework on the Requirements page to see it here.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="rounded-xl border-slate-200 lg:col-span-2 overflow-hidden">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="font-[Inter_Tight] flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" /> Graph view
            </CardTitle>
            <div className="flex items-center gap-3 text-xs">
              <LegendDot color="#00883A" label="Requirement" />
              <LegendDot color="#0f172a" label="Code" />
              <LegendDot color="#f59e0b" label="Framework" />
            </div>
          </CardHeader>
          <CardContent>
            {graph.nodes.length === 0 ? (
              <div className="text-sm text-slate-500 py-12 text-center">No nodes in the graph yet.</div>
            ) : (
              <div className="overflow-auto border border-slate-200 rounded-lg bg-slate-50/40">
                <svg width={svgWidth} height={svgHeight}>
                  {columns.map((col, i) => (
                    <text key={i} x={col.x} y={24} fill="#64748b" fontSize={12} fontWeight={600} className="uppercase tracking-wider">
                      {col.title}
                    </text>
                  ))}

                  {graph.edges.map((e, i) => {
                    const a = positions.get(e.from);
                    const b = positions.get(e.to);
                    if (!a || !b) return null;
                    const x1 = a.x + NODE_W;
                    const y1 = a.cy;
                    const x2 = b.x;
                    const y2 = b.cy;
                    const mx = (x1 + x2) / 2;
                    return (
                      <path
                        key={i}
                        d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                        stroke="#cbd5e1"
                        strokeWidth={1.25}
                        fill="none"
                      />
                    );
                  })}

                  {graph.nodes.map(n => {
                    const p = positions.get(n.id);
                    if (!p) return null;
                    const c = kindColor(n.kind);
                    return (
                      <g key={n.id}>
                        <rect
                          x={p.x}
                          y={p.y}
                          width={NODE_W}
                          height={NODE_H}
                          rx={8}
                          fill={c.fill}
                          stroke={c.stroke}
                          strokeWidth={1}
                        />
                        <text
                          x={p.x + 12}
                          y={p.y + NODE_H / 2 + 4}
                          fill={c.text}
                          fontSize={12}
                          fontWeight={500}
                        >
                          {n.label.length > 32 ? n.label.slice(0, 30) + "…" : n.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-200">
          <CardHeader>
            <CardTitle className="font-[Inter_Tight]">Edges by requirement</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[560px] pr-4">
              {reqs.length === 0 ? (
                <div className="text-sm text-slate-500">No requirements found.</div>
              ) : (
                <ul className="space-y-4">
                  {reqs.map(req => {
                    const edges = edgesByReq.get(req.id) ?? [];
                    return (
                      <li key={req.id} className="border border-slate-200 rounded-lg p-3 bg-white">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-2 h-2 rounded-full bg-primary"></span>
                          <span className="text-sm font-medium text-slate-900">{req.label}</span>
                        </div>
                        {edges.length === 0 ? (
                          <p className="text-xs text-slate-400">No edges</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {edges.map((e, i) => {
                              const otherId = e.from === req.id ? e.to : e.from;
                              const other = graph.nodes.find(n => n.id === otherId);
                              return (
                                <li key={i} className="text-xs text-slate-600 flex items-center gap-2">
                                  <Badge variant="outline" className="text-[10px]">{e.kind}</Badge>
                                  <span className="truncate">{other?.label ?? otherId}</span>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-slate-600">
      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
