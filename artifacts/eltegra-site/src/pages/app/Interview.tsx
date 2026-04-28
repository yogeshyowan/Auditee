import { useState } from "react";
import { useLocation } from "wouter";
import { useProjectContext } from "@/lib/project-context";
import { useInterviewQuestions, useGenerateRequirements, type InterviewQuestion } from "@/lib/ai-api";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StandardsMultiSelect } from "@/components/StandardsMultiSelect";
import { useToast } from "@/hooks/use-toast";
import {
  MessagesSquare,
  Sparkles,
  Loader2,
  ArrowRight,
  CheckCircle2,
  Users,
  Zap,
  Database,
  Plug,
  Gauge,
  ShieldCheck,
  AlertTriangle,
  Target,
  RotateCcw,
} from "lucide-react";

const CATEGORY_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  users: { label: "Users & scope", icon: Users, color: "bg-blue-50 text-blue-700 border-blue-200" },
  functional: { label: "Functional", icon: Zap, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  data: { label: "Data", icon: Database, color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  integration: { label: "Integration", icon: Plug, color: "bg-violet-50 text-violet-700 border-violet-200" },
  non_functional: { label: "Non-functional", icon: Gauge, color: "bg-amber-50 text-amber-700 border-amber-200" },
  compliance: { label: "Compliance", icon: ShieldCheck, color: "bg-rose-50 text-rose-700 border-rose-200" },
  constraints: { label: "Constraints", icon: AlertTriangle, color: "bg-orange-50 text-orange-700 border-orange-200" },
  success: { label: "Success criteria", icon: Target, color: "bg-pink-50 text-pink-700 border-pink-200" },
};

function categoryMeta(c: string) {
  return CATEGORY_META[c] ?? { label: c, icon: MessagesSquare, color: "bg-slate-50 text-slate-700 border-slate-200" };
}

type Stage = "brief" | "questions" | "extracting" | "done";

// Derive a friendly project name from the first sentence / first ~6 words of
// the brief. Used when the user starts an interview without having created a
// project yet — we auto-create one so the flow doesn't dead-end.
function deriveProjectName(brief: string): string {
  const firstSentence = brief.split(/[.!?\n]/)[0] ?? brief;
  const words = firstSentence.trim().split(/\s+/).slice(0, 6).join(" ");
  const cleaned = words.replace(/[^A-Za-z0-9 \-]/g, "").trim();
  if (cleaned.length >= 2) return cleaned.slice(0, 60);
  // Fallback: timestamped name so creation never fails on length.
  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  return `New project ${stamp}`;
}

export default function InterviewPage() {
  const { projectId, allProjects, setProjectId } = useProjectContext();
  const currentProject = allProjects.find((p) => p.id === projectId);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const qc = useQueryClient();

  const [stage, setStage] = useState<Stage>("brief");
  const [brief, setBrief] = useState("");
  const [frameworkIds, setFrameworkIds] = useState<string[]>([]);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [createdCount, setCreatedCount] = useState(0);
  const [creatingProject, setCreatingProject] = useState(false);

  const questionsMut = useInterviewQuestions();
  const generateMut = useGenerateRequirements();

  // Auto-create a project from the brief if one isn't selected yet, so a
  // first-time user can go from "I've typed a brief" → "I'm answering AI
  // questions" without first having to visit the Projects page.
  async function ensureProjectId(): Promise<string | null> {
    if (projectId) return projectId;
    setCreatingProject(true);
    try {
      const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";
      const r = await fetch(`${apiBase}/projects`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: deriveProjectName(brief),
          description: brief.trim().slice(0, 2000),
        }),
      });
      if (!r.ok) {
        const text = await r.text();
        let msg = text || `Failed to create project (${r.status})`;
        try { msg = JSON.parse(text).error ?? msg; } catch { /* not JSON */ }
        if (r.status === 401) {
          msg = "Sign in first so we can save your project.";
        } else if (r.status === 403) {
          msg = "Your account can read projects but not create them — ask an admin to grant Editor access.";
        }
        toast({ title: "Couldn't start the interview", description: msg, variant: "destructive" });
        return null;
      }
      const created = await r.json();
      const newId: string = created.id;
      setProjectId(newId);
      // Invalidate the projects list so the switcher and project context pick
      // up the new row immediately (otherwise the next render still shows it
      // missing and the context's auto-select effect could race).
      await qc.invalidateQueries({ queryKey: ["projects"] });
      return newId;
    } catch (err: any) {
      toast({
        title: "Couldn't start the interview",
        description: err?.message ?? "Network error",
        variant: "destructive",
      });
      return null;
    } finally {
      setCreatingProject(false);
    }
  }

  const startInterview = async () => {
    if (brief.trim().length < 20) {
      toast({
        title: "Brief too short",
        description: "Describe the project in at least 20 characters so Auditee has something to work with.",
        variant: "destructive",
      });
      return;
    }
    const pid = await ensureProjectId();
    if (!pid) return;
    questionsMut.mutate(
      { projectId: pid, brief: brief.trim(), applicableFrameworkIds: frameworkIds },
      {
        onSuccess: (r) => {
          setQuestions(r.questions);
          setAnswers(Object.fromEntries(r.questions.map((q) => [q.id, ""])));
          setStage("questions");
        },
        onError: (err: any) => {
          toast({
            title: "Could not generate interview",
            description: err?.message || "Unknown error",
            variant: "destructive",
          });
        },
      },
    );
  };

  const extractRequirements = () => {
    if (!projectId) return;
    const answered = questions.filter((q) => (answers[q.id] ?? "").trim().length > 0);
    if (answered.length === 0) {
      toast({
        title: "Answer at least one question",
        description: "Auditee needs answers to extract requirements.",
        variant: "destructive",
      });
      return;
    }
    // Build an enriched brief that combines the original brief + every Q&A pair.
    // Re-using /ai/generate-requirements means we get the same validated output
    // shape (categorisation, framework links, draft status, activity log) for free.
    const transcript = questions
      .map((q) => {
        const a = (answers[q.id] ?? "").trim();
        return `Q: ${q.prompt}\nA: ${a || "(no answer)"}`;
      })
      .join("\n\n");
    const enriched = `Original brief:\n${brief}\n\nDiscovery interview transcript:\n${transcript}`;

    setStage("extracting");
    generateMut.mutate(
      { projectId, brief: enriched.slice(0, 7900), applicableFrameworkIds: frameworkIds },
      {
        onSuccess: (r) => {
          setCreatedCount(r.count);
          setStage("done");
          toast({
            title: `Generated ${r.count} requirements`,
            description: "View them in the Requirements page.",
          });
        },
        onError: (err: any) => {
          setStage("questions");
          toast({
            title: "Extraction failed",
            description: err?.message || "Unknown error",
            variant: "destructive",
          });
        },
      },
    );
  };

  const reset = () => {
    setStage("brief");
    setBrief("");
    setFrameworkIds([]);
    setQuestions([]);
    setAnswers({});
    setCreatedCount(0);
  };

  const answeredCount = questions.filter((q) => (answers[q.id] ?? "").trim().length > 0).length;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-display font-bold text-slate-950 flex items-center gap-2">
          <MessagesSquare className="text-primary" />
          Smart Interview
        </h1>
        <p className="text-slate-600 mt-2 max-w-2xl">
          Auditee runs a structured discovery interview — describe your project in plain
          English, answer 5-7 tailored questions, and get a complete, draft-ready
          requirements set in one shot. Far better coverage than a one-shot brief.
        </p>
      </header>

      {/* Stage indicator */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className={stage === "brief" ? "font-medium text-slate-900" : ""}>1. Brief</span>
        <ArrowRight className="w-3 h-3" />
        <span className={stage === "questions" || stage === "extracting" ? "font-medium text-slate-900" : ""}>
          2. Questions
        </span>
        <ArrowRight className="w-3 h-3" />
        <span className={stage === "done" ? "font-medium text-slate-900" : ""}>3. Requirements</span>
        {currentProject && (
          <span className="ml-auto text-xs">
            Project: <span className="font-medium text-slate-700">{currentProject.name}</span>
          </span>
        )}
      </div>

      {stage === "brief" && (
        <Card className="p-6">
          <Label htmlFor="interview-brief" className="text-base font-semibold text-slate-900">
            Describe your project
          </Label>
          <p className="text-sm text-slate-500 mt-1 mb-3">
            One short paragraph — the goal, who it's for, and the rough scope. Auditee will
            ask the right follow-up questions.
          </p>
          <Textarea
            id="interview-brief"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="e.g. A patient-onboarding portal for a hospital network. Patients fill out medical history, upload insurance cards, and book their first appointment. Must be HIPAA-compliant and accessible from a mobile browser."
            rows={8}
            className="resize-none"
            data-testid="textarea-interview-brief"
          />
          <div className="mt-4">
            <StandardsMultiSelect
              value={frameworkIds}
              onChange={setFrameworkIds}
              helper="Auditee will tailor every interview question and the final requirements to satisfy each selected standard."
            />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-slate-500">{brief.length} characters</span>
              {!projectId && brief.length >= 20 && (
                <span className="text-xs text-slate-500">
                  No project selected — we'll create one from your brief.
                </span>
              )}
            </div>
            <Button
              onClick={startInterview}
              disabled={brief.length < 20 || questionsMut.isPending || creatingProject}
              className="gap-2"
              data-testid="button-start-interview"
            >
              {creatingProject ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating project…
                </>
              ) : questionsMut.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Preparing questions…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Start interview
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {(stage === "questions" || stage === "extracting") && (
        <>
          <Card className="p-5 bg-slate-50 border-slate-200">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Original brief
            </h3>
            <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{brief}</p>
          </Card>

          <div className="space-y-4">
            {questions.map((q, idx) => {
              const meta = categoryMeta(q.category);
              const Icon = meta.icon;
              return (
                <Card key={q.id} className="p-5" data-testid={`interview-q-${idx}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant="outline" className={`${meta.color} gap-1`}>
                          <Icon className="w-3 h-3" />
                          {meta.label}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-slate-900">{q.prompt}</h4>
                      <p className="text-xs text-slate-500 italic mt-1">{q.hint}</p>
                      <Textarea
                        value={answers[q.id] ?? ""}
                        onChange={(e) =>
                          setAnswers((s) => ({ ...s, [q.id]: e.target.value }))
                        }
                        placeholder="Your answer…"
                        rows={3}
                        className="mt-3 resize-none"
                        disabled={stage === "extracting"}
                        data-testid={`textarea-answer-${idx}`}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="p-4 bg-white border-slate-200 sticky bottom-4 shadow-md flex items-center justify-between gap-4 flex-wrap">
            <span className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{answeredCount}</span> of{" "}
              {questions.length} answered
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={reset} disabled={stage === "extracting"} className="gap-1.5">
                <RotateCcw className="w-4 h-4" />
                Restart
              </Button>
              <Button
                onClick={extractRequirements}
                disabled={answeredCount === 0 || stage === "extracting"}
                className="gap-2"
                data-testid="button-extract-requirements"
              >
                {stage === "extracting" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Extracting requirements…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Extract requirements
                  </>
                )}
              </Button>
            </div>
          </Card>
        </>
      )}

      {stage === "done" && (
        <Card className="p-12 text-center border-emerald-200 bg-emerald-50/50">
          <CheckCircle2 className="w-14 h-14 mx-auto text-emerald-600" />
          <h3 className="mt-4 text-2xl font-display font-bold text-slate-950">
            {createdCount} requirements drafted
          </h3>
          <p className="text-slate-600 mt-2 max-w-md mx-auto">
            Auditee turned your interview into {createdCount} draft requirements with
            categorisation, priority and framework links — ready for review.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button onClick={() => navigate("/app/requirements")} className="gap-2">
              View requirements <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={reset} className="gap-1.5">
              <RotateCcw className="w-4 h-4" />
              New interview
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
