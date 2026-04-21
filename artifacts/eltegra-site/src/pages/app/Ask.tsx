import { useState } from "react";
import { useListProjects } from "@workspace/api-client-react";
import { useProjectContext } from "@/lib/project-context";
import { useAskEltegra, type AskResult } from "@/lib/ai-api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2, MessageSquare } from "lucide-react";

const CONFIDENCE_BADGE: Record<string, string> = {
  low: "bg-amber-50 text-amber-700 border-amber-200",
  medium: "bg-blue-50 text-blue-700 border-blue-200",
  high: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

type QA = { question: string; result: AskResult };

export default function Ask() {
  const { projectId } = useProjectContext();
  const { data: projects } = useListProjects();
  const currentProject = projects?.find((p) => p.id === projectId);
  const { toast } = useToast();
  const askMut = useAskEltegra();

  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<QA[]>([]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim().length < 3) return;
    const q = question.trim();
    askMut.mutate(
      { question: q, projectId: projectId ?? undefined },
      {
        onSuccess: (result) => {
          setHistory((h) => [{ question: q, result }, ...h]);
          setQuestion("");
        },
        onError: (err: Error) => {
          toast({ title: "Ask failed", description: err.message, variant: "destructive" });
        },
      },
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <header>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 font-[Inter_Tight]">Ask Eltegra</h1>
          {currentProject && (
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" /> Asking about: {currentProject.name}
            </Badge>
          )}
        </div>
        <p className="text-slate-500 mt-1">Natural-language Q&amp;A across requirements, frameworks, controls, and legacy systems.</p>
      </header>

      <Card className="rounded-xl border-slate-200">
        <CardContent className="p-4">
          <form onSubmit={submit} className="flex items-center gap-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything about your projects, requirements, compliance posture..."
              disabled={askMut.isPending}
              data-testid="input-question"
              className="flex-1"
            />
            <Button type="submit" disabled={askMut.isPending || question.trim().length < 3} className="gap-2">
              {askMut.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Asking...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Ask</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {askMut.isPending && (
        <Card className="rounded-xl border-slate-200">
          <CardContent className="p-6 flex items-center gap-3 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm">EltegraAI is reading your project context...</span>
          </CardContent>
        </Card>
      )}

      {history.length === 0 && !askMut.isPending ? (
        <Card className="rounded-xl border-slate-200 border-dashed">
          <CardContent className="p-10 text-center text-slate-500">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            Ask a question to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {history.map((qa, i) => (
            <Card key={i} className="rounded-xl border-slate-200" data-testid={`qa-${i}`}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 text-slate-400 mt-1 flex-shrink-0" />
                  <p className="text-sm font-medium text-slate-900">{qa.question}</p>
                </div>
                <div className="pl-6 space-y-3">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{qa.result.answer}</p>
                  {qa.result.citations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {qa.result.citations.map((c, j) => (
                        <Badge key={j} variant="outline" className="font-mono text-[10px]">{c}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-slate-500">Confidence:</span>
                    <Badge className={(CONFIDENCE_BADGE[qa.result.confidence] ?? "bg-slate-100 text-slate-700") + " border text-[10px]"}>
                      {qa.result.confidence}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
