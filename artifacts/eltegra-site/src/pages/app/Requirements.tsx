import { useState, useMemo, useRef, useEffect } from "react";
import {
  useListRequirements,
  useCreateRequirement,
  useUpdateRequirement,
  useListComplianceFrameworks,
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
import { Plus, Search, FileText, Sparkles, Loader2, Code2, Github, Upload, FolderOpen, ChevronDown, FileType, FileCog, TestTube2, Clock, AlertCircle, Download } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { useGenerateRequirements, useFetchCodeUrl, useEstimateEffort, useLatestEffortEstimate, type EffortEstimateResult } from "@/lib/ai-api";
import { useGenerateTestCases, useTestCases } from "@/lib/test-cases-api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSources, useSourceFiles, useSourceFileContent, useGenerateReport } from "@/lib/wave1-api";
import { Comments } from "@/components/Comments";
import { StandardsMultiSelect } from "@/components/StandardsMultiSelect";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

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
  const [briefFrameworkIds, setBriefFrameworkIds] = useState<string[]>([]);
  const [generateCodeOpen, setGenerateCodeOpen] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("");
  const [codeFrameworkIds, setCodeFrameworkIds] = useState<string[]>([]);
  const [codeTab, setCodeTab] = useState("paste");
  const [codeSourceLabel, setCodeSourceLabel] = useState<string>(""); // shows "loaded from foo.ts"
  const [githubUrl, setGithubUrl] = useState("");
  const [pickedSourceId, setPickedSourceId] = useState<string>("");
  const [pickedFileId, setPickedFileId] = useState<string>("");
  const { toast } = useToast();
  const generateMut = useGenerateRequirements();
  const fetchUrlMut = useFetchCodeUrl();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sourcesQuery = useSources(projectId);
  const sourceFilesQuery = useSourceFiles(pickedSourceId || undefined);
  const sourceFileContent = useSourceFileContent(
    pickedSourceId || undefined,
    pickedFileId || undefined,
  );

  // When the user picks a source file, copy its content into codeInput.
  useEffect(() => {
    const data = sourceFileContent.data;
    if (data && pickedFileId) {
      if (data.content) {
        const truncated = data.content.length > 30000;
        setCodeInput(truncated ? data.content.slice(0, 30000) : data.content);
        setCodeLanguage(data.language ?? "");
        setCodeSourceLabel(`${data.path}${truncated ? " (truncated to 30k chars)" : ""}`);
      } else {
        toast({ title: "File has no readable content", variant: "destructive" });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceFileContent.data, pickedFileId]);

  function resetCodeDialog() {
    setCodeInput("");
    setCodeLanguage("");
    setCodeSourceLabel("");
    setCodeTab("paste");
    setGithubUrl("");
    setPickedSourceId("");
    setPickedFileId("");
    fetchUrlMut.reset();
  }

  async function handleLocalFile(file: File) {
    if (file.size > 600_000) {
      toast({ title: "File too large", description: "Pick a file under 600 KB.", variant: "destructive" });
      return;
    }
    const text = await file.text();
    const truncated = text.length > 30000;
    setCodeInput(truncated ? text.slice(0, 30000) : text);
    const ext = (file.name.split(".").pop() ?? "").toLowerCase();
    const langGuess: Record<string, string> = {
      ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
      py: "python", java: "java", go: "go", rs: "rust", rb: "ruby", php: "php",
      cs: "csharp", cpp: "cpp", c: "c", swift: "swift", kt: "kotlin",
      cbl: "cobol", cob: "cobol", sql: "sql", sh: "bash",
    };
    setCodeLanguage(langGuess[ext] ?? "");
    setCodeSourceLabel(`${file.name}${truncated ? " (truncated to 30k chars)" : ""}`);
  }

  function handleFetchGithub() {
    if (!githubUrl.trim()) return;
    fetchUrlMut.mutate(
      { url: githubUrl.trim() },
      {
        onSuccess: (data) => {
          const sliced = data.code.length > 30000;
          setCodeInput(sliced ? data.code.slice(0, 30000) : data.code);
          setCodeLanguage(data.language);
          setCodeSourceLabel(`${data.label}${data.truncated || sliced ? " (truncated to 30k chars)" : ""}`);
        },
        onError: (err: Error) => {
          toast({ title: "Could not fetch", description: err.message, variant: "destructive" });
        },
      },
    );
  }

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
  const { data: allFrameworksData } = useListComplianceFrameworks();
  const fwById = useMemo(
    () => new Map((allFrameworksData ?? []).map((f) => [f.id, f.code] as const)),
    [allFrameworksData],
  );

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
  const [, navigate] = useLocation();
  const generateDoc = useGenerateReport();
  const estimateEffort = useEstimateEffort();
  const [estimateOpen, setEstimateOpen] = useState(false);
  const [estimateData, setEstimateData] = useState<EffortEstimateResult | null>(null);
  // Always-on latest estimate so the table can render Hours per requirement.
  // Falls back to nothing if no estimate has been run.
  const latestEstimateQ = useLatestEffortEstimate(projectId, true);
  // All test cases for this project — used to render a Tests count per row.
  const allTestCasesQ = useTestCases(projectId);

  // Map requirementCode -> {hours, complexity} from the latest effort estimate.
  const effortByCode = useMemo(() => {
    const m = new Map<string, { hours: number; complexity: string }>();
    const estimates = latestEstimateQ.data?.estimates ?? [];
    for (const e of estimates) {
      m.set(e.requirementCode, { hours: e.hours, complexity: e.complexity });
    }
    return m;
  }, [latestEstimateQ.data]);

  // Map requirementId -> testCase count (for the table column).
  const testCountByReqId = useMemo(() => {
    const m = new Map<string, number>();
    for (const tc of allTestCasesQ.data?.testCases ?? []) {
      if (!tc.requirementId) continue;
      m.set(tc.requirementId, (m.get(tc.requirementId) ?? 0) + 1);
    }
    return m;
  }, [allTestCasesQ.data]);

  // When the sheet opens (or the project changes while open), surface the
  // last persisted run so the user doesn't lose work on refresh.
  useEffect(() => {
    if (!estimateOpen) return;
    if (estimateEffort.isPending) return;
    if (latestEstimateQ.data && !estimateData) {
      setEstimateData(latestEstimateQ.data);
    }
  }, [estimateOpen, latestEstimateQ.data, estimateData, estimateEffort.isPending]);

  const handleEstimateEffort = () => {
    if (!projectId || estimateEffort.isPending) return;
    const reqs = allProjectReqs ?? [];
    if (reqs.length === 0) {
      toast({
        title: "No requirements yet",
        description: "Generate or import at least a few requirements first — effort estimation needs source material.",
        variant: "destructive",
      });
      return;
    }
    setEstimateOpen(true);
    setEstimateData(null);
    estimateEffort.mutate(
      { projectId },
      {
        onSuccess: (data) => {
          setEstimateData(data);
          queryClient.invalidateQueries({ queryKey: ["effort-estimate-latest", projectId] });
        },
        onError: (err: Error) => {
          toast({ title: "Estimation failed", description: err.message, variant: "destructive" });
          setEstimateOpen(false);
        },
      },
    );
  };

  const handleOpenEstimateSheet = () => {
    if (!projectId) return;
    setEstimateOpen(true);
  };

  const downloadEstimate = (format: "csv" | "json") => {
    if (!estimateData) return;
    const projName = (estimateData.project?.name ?? "project").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    const stamp = new Date().toISOString().slice(0, 10);
    let blob: Blob;
    let filename: string;
    if (format === "json") {
      blob = new Blob([JSON.stringify(estimateData, null, 2)], { type: "application/json" });
      filename = `effort-estimate-${projName}-${stamp}.json`;
    } else {
      const escape = (v: unknown) => {
        const s = v === null || v === undefined ? "" : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const titleByCode = new Map((allProjectReqs ?? []).map((r) => [r.code, r.title]));
      const header = ["Requirement Code", "Title", "Complexity", "Hours", "Rationale", "Risks"];
      const rows = estimateData.estimates.map((e) =>
        [
          e.requirementCode,
          titleByCode.get(e.requirementCode) ?? "",
          e.complexity,
          e.hours,
          e.rationale,
          (e.risks ?? []).join(" | "),
        ].map(escape).join(","),
      );
      const summary = [
        "",
        "Summary",
        `Project,${escape(estimateData.project?.name ?? "")}`,
        `Run at,${escape(estimateData.runAt)}`,
        `Total hours,${Math.round(estimateData.totals.hours)}`,
        `Weeks at 1 FTE,${estimateData.totals.weeksAtOneFte.toFixed(1)}`,
        `Requirement count,${estimateData.requirementCount}`,
      ].join("\n");
      const csv = [header.join(","), ...rows].join("\n") + "\n" + summary + "\n";
      blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      filename = `effort-estimate-${projName}-${stamp}.csv`;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  type DocKind = { kind: "brd" | "prd" | "frd" | "test_cases"; label: string; tone: "executive" | "technical"; instructions: string };
  const DOC_KINDS: DocKind[] = [
    { kind: "brd", label: "Business Requirements Document (BRD)", tone: "executive", instructions: "Compose a complete, signature-ready Business Requirements Document. Be specific about scope and acceptance." },
    { kind: "prd", label: "Product Requirements Document (PRD)", tone: "executive", instructions: "Compose a complete PRD aimed at the engineering and design teams who will build the product. Be specific about user stories, acceptance criteria and release plan." },
    { kind: "frd", label: "Functional Requirements Document (FRD)", tone: "technical", instructions: "Compose a complete FRD as the implementation contract between product and engineering. Be precise about data model, interfaces and edge cases." },
    { kind: "test_cases", label: "Test Case Suite", tone: "technical", instructions: "Generate a comprehensive Test Case Suite linked to every functional and non-functional requirement. Use the structured TC format with preconditions, steps, expected results and traceability." },
  ];

  const handleGenerateDoc = (doc: DocKind) => {
    if (!projectId || generateDoc.isPending) return;
    const reqs = allProjectReqs ?? [];
    if (reqs.length === 0) {
      toast({
        title: "No requirements yet",
        description: `Generate or import at least a few requirements first — a ${doc.kind.toUpperCase()} needs source material.`,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: `Generating ${doc.kind.toUpperCase()}…`,
      description: `Auditee is composing your ${doc.label}. You'll be taken to the report when it's ready.`,
    });
    generateDoc.mutate(
      { projectId, kind: doc.kind, tone: doc.tone, instructions: doc.instructions },
      {
        onSuccess: () => {
          toast({ title: `${doc.kind.toUpperCase()} generated`, description: "Opening in the Reports library." });
          navigate("/app/reports");
        },
        onError: (err: Error) => {
          toast({ title: `${doc.kind.toUpperCase()} generation failed`, description: err.message, variant: "destructive" });
        },
      },
    );
  };

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 font-[Inter_Tight]">Requirements</h1>
          <p className="text-slate-500 mt-1">Browse, filter, and manage every requirement in the knowledge graph.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 border-primary/40 text-primary hover:bg-primary/5"
                disabled={!projectId || generateDoc.isPending}
                data-testid="button-generate-ai-doc"
              >
                {generateDoc.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                {generateDoc.isPending ? "Composing…" : "Generate AI document"}
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuItem onClick={() => handleGenerateDoc(DOC_KINDS[0]!)} data-testid="menu-generate-brd">
                <FileText className="h-4 w-4 mr-2 text-primary" />
                <div className="flex flex-col">
                  <span className="font-medium">Generate BRD</span>
                  <span className="text-xs text-slate-500">Signature-ready business spec</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleGenerateDoc(DOC_KINDS[1]!)} data-testid="menu-generate-prd">
                <FileType className="h-4 w-4 mr-2 text-primary" />
                <div className="flex flex-col">
                  <span className="font-medium">Generate PRD</span>
                  <span className="text-xs text-slate-500">Product spec with user stories</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleGenerateDoc(DOC_KINDS[2]!)} data-testid="menu-generate-frd">
                <FileCog className="h-4 w-4 mr-2 text-primary" />
                <div className="flex flex-col">
                  <span className="font-medium">Generate FRD</span>
                  <span className="text-xs text-slate-500">Engineering implementation contract</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleGenerateDoc(DOC_KINDS[3]!)} data-testid="menu-generate-tests">
                <TestTube2 className="h-4 w-4 mr-2 text-primary" />
                <div className="flex flex-col">
                  <span className="font-medium">Generate Test Cases</span>
                  <span className="text-xs text-slate-500">TC suite linked to every requirement</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={handleOpenEstimateSheet}
            variant="outline"
            className="gap-2"
            disabled={!projectId || estimateEffort.isPending}
            data-testid="button-estimate-effort"
          >
            {estimateEffort.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
            {estimateEffort.isPending ? "Estimating…" : "Estimate effort"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="gap-2"
                disabled={!projectId}
                data-testid="button-export-requirements"
              >
                <Download className="h-4 w-4" /> Export
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuItem
                onClick={() => {
                  if (!projectId) return;
                  window.open(`/api/requirements/export?projectId=${encodeURIComponent(projectId)}&format=reqif`, "_blank");
                }}
                data-testid="menu-export-reqif"
              >
                <FileCog className="h-4 w-4 mr-2 text-primary" />
                <div className="flex flex-col">
                  <span className="font-medium">ReqIF (.reqif)</span>
                  <span className="text-xs text-slate-500">DOORS, Jama, Polarion, codeBeamer…</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (!projectId) return;
                  window.open(`/api/requirements/export?projectId=${encodeURIComponent(projectId)}&format=csv`, "_blank");
                }}
                data-testid="menu-export-csv"
              >
                <FileText className="h-4 w-4 mr-2 text-primary" />
                <div className="flex flex-col">
                  <span className="font-medium">CSV (.csv)</span>
                  <span className="text-xs text-slate-500">Universal · Excel, Sheets, any RM tool</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (!projectId) return;
                  window.open(`/api/requirements/export?projectId=${encodeURIComponent(projectId)}&format=json`, "_blank");
                }}
                data-testid="menu-export-json"
              >
                <FileType className="h-4 w-4 mr-2 text-primary" />
                <div className="flex flex-col">
                  <span className="font-medium">JSON (.json)</span>
                  <span className="text-xs text-slate-500">Custom integrations / scripts</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setCreateOpen(true)} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> New Requirement
          </Button>
        </div>
      </header>

      <Sheet open={estimateOpen} onOpenChange={setEstimateOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-[Inter_Tight] text-2xl flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> Effort Estimation
            </SheetTitle>
            <SheetDescription>
              AI-generated implementation effort across every requirement in this project.
              Estimates assume one mid-level engineer; adjust your team size accordingly.
            </SheetDescription>
          </SheetHeader>

          {estimateEffort.isPending ? (
            <div className="py-16 flex flex-col items-center gap-3 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Auditee is sizing each requirement…</p>
            </div>
          ) : latestEstimateQ.isLoading && !estimateData ? (
            <div className="py-16 flex flex-col items-center gap-3 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Loading saved estimate…</p>
            </div>
          ) : !estimateData ? (
            <div className="py-12 flex flex-col items-center gap-4 text-center">
              <Clock className="h-10 w-10 text-slate-300" />
              <div>
                <p className="font-medium text-slate-900">No effort estimate yet</p>
                <p className="text-sm text-slate-500 mt-1 max-w-sm">
                  Run an estimation to size every requirement in this project. Results are saved automatically and you can re-run any time.
                </p>
              </div>
              <Button
                onClick={handleEstimateEffort}
                className="gap-2"
                disabled={!projectId}
                data-testid="button-run-estimate-effort"
              >
                <Clock className="h-4 w-4" /> Run estimation
              </Button>
            </div>
          ) : (
            <div className="space-y-5 mt-6">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="text-xs text-slate-500" data-testid="estimate-run-at">
                  Last run: {new Date(estimateData.runAt).toLocaleString()}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => downloadEstimate("csv")}
                    data-testid="button-download-estimate-csv"
                    className="gap-1.5"
                  >
                    <FileText className="h-3.5 w-3.5" /> CSV
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => downloadEstimate("json")}
                    data-testid="button-download-estimate-json"
                    className="gap-1.5"
                  >
                    <FileText className="h-3.5 w-3.5" /> JSON
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleEstimateEffort}
                    disabled={estimateEffort.isPending}
                    data-testid="button-rerun-estimate-effort"
                    className="gap-1.5"
                  >
                    <Clock className="h-3.5 w-3.5" /> Re-run
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Card className="p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Total hours</div>
                  <div className="mt-1 text-3xl font-bold text-slate-900" data-testid="stat-total-hours">
                    {Math.round(estimateData.totals.hours)}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Weeks @ 1 FTE</div>
                  <div className="mt-1 text-3xl font-bold text-slate-900">
                    {estimateData.totals.weeksAtOneFte.toFixed(1)}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Requirements</div>
                  <div className="mt-1 text-3xl font-bold text-slate-900">
                    {estimateData.estimates.length}
                  </div>
                </Card>
              </div>

              <Card className="p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Complexity breakdown</div>
                <div className="flex items-center gap-2 flex-wrap">
                  {(["trivial", "small", "medium", "large", "epic"] as const).map((c) => {
                    const count = estimateData.totals.complexityBreakdown?.[c] ?? 0;
                    if (!count) return null;
                    const colorMap: Record<typeof c, string> = {
                      trivial: "bg-emerald-50 text-emerald-700 border-emerald-200",
                      small: "bg-sky-50 text-sky-700 border-sky-200",
                      medium: "bg-amber-50 text-amber-700 border-amber-200",
                      large: "bg-orange-50 text-orange-700 border-orange-200",
                      epic: "bg-rose-50 text-rose-700 border-rose-200",
                    };
                    return (
                      <Badge key={c} variant="outline" className={`gap-1 ${colorMap[c]}`}>
                        {c} · {count}
                      </Badge>
                    );
                  })}
                </div>
              </Card>

              {estimateData.assumptions?.length > 0 && (
                <Card className="p-4 bg-amber-50/40 border-amber-200">
                  <div className="text-xs uppercase tracking-wide text-amber-800 mb-2 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" /> Assumptions
                  </div>
                  <ul className="space-y-1 text-sm text-slate-700 list-disc list-inside">
                    {estimateData.assumptions.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </Card>
              )}

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Per-requirement estimates</h4>
                <div className="space-y-2">
                  {estimateData.estimates.map((e) => {
                    const matched = (allProjectReqs ?? []).find((r) => r.code === e.requirementCode);
                    const title = matched?.title ?? "(requirement removed)";
                    return (
                      <Card key={e.requirementCode} className="p-3" data-testid={`estimate-row-${e.requirementCode}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs text-slate-500">{e.requirementCode}</span>
                              <Badge variant="outline" className="text-xs capitalize">
                                {e.complexity}
                              </Badge>
                            </div>
                            <div className="font-medium text-sm text-slate-900 mt-0.5 truncate">{title}</div>
                            {e.rationale && (
                              <div className="text-xs text-slate-600 mt-1">{e.rationale}</div>
                            )}
                            {e.risks?.length > 0 && (
                              <div className="text-xs text-rose-700 mt-1">
                                <span className="font-semibold">Risks:</span> {e.risks.join("; ")}
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-lg font-bold text-slate-900">{e.hours}h</div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

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
                  { projectId, brief, applicableFrameworkIds: briefFrameworkIds },
                  {
                    onSuccess: (data) => {
                      const skipped = data.skippedCount ?? 0;
                      toast({
                        title: `Generated ${data.count} requirements`,
                        description: skipped > 0
                          ? `Skipped ${skipped} that duplicated existing requirements (${(data.skipped ?? []).slice(0, 3).map((s) => s.duplicateOfCode).join(", ")}${skipped > 3 ? "…" : ""}).`
                          : undefined,
                      });
                      setBrief("");
                      setBriefFrameworkIds([]);
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
              <StandardsMultiSelect
                value={briefFrameworkIds}
                onChange={setBriefFrameworkIds}
                helper="Auditee will draft requirements that satisfy each selected standard's structure and language."
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

      <Dialog
        open={generateCodeOpen}
        onOpenChange={(open) => {
          if (generateMut.isPending) return;
          if (!open) resetCodeDialog();
          setGenerateCodeOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-[Inter_Tight] text-2xl flex items-center gap-2">
              <Code2 className="h-5 w-5 text-primary" /> Generate from code
            </DialogTitle>
            <DialogDescription>
              No requirements management tool connected? Pull source code from any of the inputs below and Auditee will reverse-engineer structured requirements with full fields — same shape as a DOORS or Jama import.
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
                  {
                    projectId,
                    code: codeInput,
                    language: codeLanguage || undefined,
                    applicableFrameworkIds: codeFrameworkIds,
                  },
                  {
                    onSuccess: (data) => {
                      const skipped = data.skippedCount ?? 0;
                      toast({
                        title: `Generated ${data.count} requirements from code`,
                        description: skipped > 0
                          ? `Skipped ${skipped} that duplicated existing requirements (${(data.skipped ?? []).slice(0, 3).map((s) => s.duplicateOfCode).join(", ")}${skipped > 3 ? "…" : ""}).`
                          : undefined,
                      });
                      resetCodeDialog();
                      setCodeFrameworkIds([]);
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
              <Tabs value={codeTab} onValueChange={setCodeTab}>
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="paste" data-testid="tab-paste">
                    <Code2 className="h-3.5 w-3.5 mr-1" /> Paste
                  </TabsTrigger>
                  <TabsTrigger value="upload" data-testid="tab-upload">
                    <Upload className="h-3.5 w-3.5 mr-1" /> Local file
                  </TabsTrigger>
                  <TabsTrigger value="github" data-testid="tab-github">
                    <Github className="h-3.5 w-3.5 mr-1" /> Repo URL
                  </TabsTrigger>
                  <TabsTrigger value="source" data-testid="tab-source">
                    <FolderOpen className="h-3.5 w-3.5 mr-1" /> Project source
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="paste" className="space-y-2 pt-3">
                  <Textarea
                    value={codeInput}
                    onChange={(e) => { setCodeInput(e.target.value); setCodeSourceLabel(""); }}
                    rows={12}
                    placeholder="// Paste the function, route, class, or stored procedure you want to derive requirements from."
                    className="resize-none font-mono text-xs"
                    data-testid="textarea-code"
                  />
                </TabsContent>

                <TabsContent value="upload" className="space-y-3 pt-3">
                  <p className="text-sm text-slate-600">
                    Pick a single text-based source file from your computer (under 600 KB).
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    accept=".ts,.tsx,.js,.jsx,.py,.java,.kt,.go,.rs,.rb,.php,.cs,.cpp,.c,.h,.hpp,.swift,.scala,.m,.cbl,.cob,.sql,.sh,.yml,.yaml,.json,.html,.css,.txt"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) await handleLocalFile(f);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    data-testid="input-file"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                    data-testid="button-pick-file"
                  >
                    <Upload className="h-4 w-4" /> Choose file
                  </Button>
                  {codeSourceLabel && codeTab === "upload" && (
                    <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1.5">
                      Loaded: {codeSourceLabel}
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="github" className="space-y-3 pt-3">
                  <p className="text-sm text-slate-600">
                    Paste a public repo, folder, or single-file URL from <strong>GitHub</strong>, <strong>GitLab</strong>, <strong>Bitbucket Cloud</strong>, <strong>Azure DevOps</strong>, or a self-hosted <strong>Gitea/Forgejo</strong> server (operator must allowlist the host). For repo and folder URLs, Auditee scans up to 40 source files and packs them into one prompt. For private repos, connect a source on the Project Sources page first, then use the "Project source" tab.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/owner/repo  •  gitlab.com/group/proj  •  bitbucket.org/ws/repo  •  dev.azure.com/org/proj/_git/repo"
                      data-testid="input-github-url"
                    />
                    <Button
                      type="button"
                      onClick={handleFetchGithub}
                      disabled={!githubUrl.trim() || fetchUrlMut.isPending}
                      className="gap-2"
                      data-testid="button-fetch-github"
                    >
                      {fetchUrlMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />}
                      Fetch
                    </Button>
                  </div>
                  {codeSourceLabel && codeTab === "github" && (
                    <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1.5">
                      Loaded: {codeSourceLabel}
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="source" className="space-y-3 pt-3">
                  <p className="text-sm text-slate-600">
                    Pick a file from any source already imported on the Project Sources page (GitHub, ZIP, folder, Google Drive, etc.).
                  </p>
                  <div className="space-y-2">
                    <Label>Source</Label>
                    <Select
                      value={pickedSourceId}
                      onValueChange={(v) => { setPickedSourceId(v); setPickedFileId(""); setCodeSourceLabel(""); }}
                    >
                      <SelectTrigger data-testid="select-source"><SelectValue placeholder={sourcesQuery.isLoading ? "Loading..." : "Select a source"} /></SelectTrigger>
                      <SelectContent>
                        {(sourcesQuery.data?.sources ?? [])
                          .filter((s) => s.fileCount > 0)
                          .map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.label} <span className="text-slate-400">({s.kind} · {s.fileCount} files)</span>
                            </SelectItem>
                          ))}
                        {(sourcesQuery.data?.sources ?? []).filter((s) => s.fileCount > 0).length === 0 && !sourcesQuery.isLoading && (
                          <div className="px-2 py-1.5 text-sm text-slate-500">No sources with files in this project. Add one from Project Sources.</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {pickedSourceId && (
                    <div className="space-y-2">
                      <Label>File</Label>
                      <Select
                        value={pickedFileId}
                        onValueChange={setPickedFileId}
                      >
                        <SelectTrigger data-testid="select-source-file"><SelectValue placeholder={sourceFilesQuery.isLoading ? "Loading files..." : "Select a file"} /></SelectTrigger>
                        <SelectContent className="max-h-72">
                          {(sourceFilesQuery.data?.files ?? [])
                            .filter((f) => f.isBinary !== "true")
                            .slice(0, 500)
                            .map((f) => (
                              <SelectItem key={f.id} value={f.id}>
                                {f.path} <span className="text-slate-400">({Math.round(f.size / 1024)} KB)</span>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {sourceFileContent.isLoading && pickedFileId && (
                    <p className="text-xs text-slate-500 flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Loading file contents...</p>
                  )}
                  {codeSourceLabel && codeTab === "source" && (
                    <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1.5">
                      Loaded: {codeSourceLabel}
                    </p>
                  )}
                </TabsContent>
              </Tabs>

              <div className="space-y-2">
                <Label htmlFor="code-language">Language (auto-detected — edit if wrong)</Label>
                <Input
                  id="code-language"
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value)}
                  placeholder="e.g. typescript, python, java, cobol, sql"
                  data-testid="input-code-language"
                />
              </div>

              <StandardsMultiSelect
                value={codeFrameworkIds}
                onChange={setCodeFrameworkIds}
                helper="Auditee will draft requirements from the code that satisfy each selected standard's structure and citation rules."
              />

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span data-testid="text-code-char-count">{codeInput.length} / 30000 characters loaded</span>
                {codeInput.length >= 20 && <span className="text-emerald-700">Ready to generate</span>}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { resetCodeDialog(); setGenerateCodeOpen(false); }}>Cancel</Button>
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
                <TableHead className="w-20 text-right">Tests</TableHead>
                <TableHead className="w-24 text-right">Effort</TableHead>
                <TableHead className="w-40">Owner</TableHead>
                <TableHead>Frameworks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requirements.map(req => {
                const tests = testCountByReqId.get(req.id) ?? 0;
                const effort = effortByCode.get(req.code);
                return (
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
                  <TableCell className="text-right" data-testid={`cell-tests-${req.code}`}>
                    {tests > 0 ? (
                      <Badge variant="secondary" className="font-mono text-[11px]">
                        <TestTube2 className="h-3 w-3 mr-1" />{tests}
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right" data-testid={`cell-effort-${req.code}`}>
                    {effort ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-sm font-semibold text-slate-900">{effort.hours}h</span>
                        <Badge variant="outline" className="text-[10px] capitalize">{effort.complexity}</Badge>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">{req.owner}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {(req.linkedFrameworks ?? []).slice(0, 3).map(fw => (
                        <Badge key={fw} variant="secondary" className="text-[10px]">{fwById.get(fw) ?? fw}</Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
                );
              })}
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
                {(() => {
                  const eff = effortByCode.get(selected.code);
                  if (!eff) return null;
                  const full = (latestEstimateQ.data?.estimates ?? []).find((e) => e.requirementCode === selected.code);
                  return (
                    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3" data-testid="sheet-effort-section">
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" /> Effort estimate
                        </Label>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-slate-900">{eff.hours}h</span>
                          <Badge variant="outline" className="text-[10px] capitalize">{eff.complexity}</Badge>
                        </div>
                      </div>
                      {full?.rationale && (
                        <p className="mt-2 text-xs text-slate-600 leading-relaxed">{full.rationale}</p>
                      )}
                      {full?.risks && full.risks.length > 0 && (
                        <p className="mt-1.5 text-xs text-rose-700">
                          <span className="font-semibold">Risks:</span> {full.risks.join("; ")}
                        </p>
                      )}
                    </div>
                  );
                })()}
                <div>
                  <StandardsMultiSelect
                    label="Linked standards"
                    helper="Requirements tagged with a standard appear in the Traceability Graph when that standard is selected."
                    value={selected.linkedFrameworks ?? []}
                    onChange={(ids) => {
                      updateMut.mutate({ requirementId: selected.id, data: { linkedFrameworks: ids } as any });
                      setSelected({ ...selected, linkedFrameworks: ids });
                    }}
                    disabled={updateMut.isPending}
                  />
                </div>
                {selected.tags && selected.tags.length > 0 && (
                  <div>
                    <Label className="text-xs uppercase text-slate-500 tracking-wider">Tags</Label>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selected.tags.map(t => <Badge key={t} variant="outline">{t}</Badge>)}
                    </div>
                  </div>
                )}
                <RequirementTestCasesPanel requirement={selected} />
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

function RequirementTestCasesPanel({ requirement }: { requirement: Requirement }) {
  const [, setLocation] = useLocation();
  const { data, isLoading } = useTestCases(requirement.projectId, requirement.id);
  const generateMut = useGenerateTestCases(requirement.projectId);
  const { toast } = useToast();
  const tests = data?.testCases ?? [];
  const summary = {
    total: tests.length,
    passing: tests.filter((t) => t.status === "passing").length,
    failing: tests.filter((t) => t.status === "failing").length,
  };
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
          <TestTube2 className="h-3.5 w-3.5" /> Test cases
        </Label>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1"
          onClick={() =>
            generateMut.mutate(requirement.id, {
              onSuccess: (d) => toast({ title: `Generated ${d.count} test case(s)` }),
              onError: (e: Error) => toast({ title: "Generation failed", description: e.message, variant: "destructive" }),
            })
          }
          disabled={generateMut.isPending}
          data-testid="button-generate-test-cases-for-req"
        >
          {generateMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          Generate
        </Button>
      </div>
      <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
        {isLoading ? (
          <span className="text-slate-400">Loading…</span>
        ) : tests.length === 0 ? (
          <span className="text-slate-500">No test cases yet. Click Generate to draft a suite.</span>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="font-mono">{summary.total} total</span>
              <span className="text-emerald-700">{summary.passing} passing</span>
              <span className="text-rose-700">{summary.failing} failing</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-[11px]"
              onClick={() => setLocation("/app/tests")}
            >
              Open all →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
