import { useGetTraceabilityGraph } from "@workspace/api-client-react";
import { useProjectContext } from "@/lib/project-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Network } from "lucide-react";

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
  const { data: graph, isLoading } = useGetTraceabilityGraph(
    { projectId: projectId ?? "" },
    { query: { enabled: !!projectId } as any }
  );

  if (!projectId) {
    return <div className="p-6 text-slate-500">Select a project to view its traceability graph.</div>;
  }

  if (isLoading || !graph) {
    return (
      <div className="p-6 space-y-4">
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
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 font-[Inter_Tight]">Traceability Graph</h1>
        <p className="text-slate-500 mt-1">Live links between requirements, code, and compliance frameworks.</p>
      </header>

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
