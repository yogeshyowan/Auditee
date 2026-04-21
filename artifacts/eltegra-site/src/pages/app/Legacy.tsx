import { useListLegacySystems } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Database } from "lucide-react";

function riskClass(risk: number) {
  if (risk < 50) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (risk <= 75) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-red-50 text-red-700 border-red-200";
}

export default function Legacy() {
  const { data: systems, isLoading } = useListLegacySystems();

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
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <Badge variant="secondary" className="text-xs">{sys.modernizationStatus}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
