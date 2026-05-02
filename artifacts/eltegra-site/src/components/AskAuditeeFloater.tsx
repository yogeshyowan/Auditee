import { useState } from "react";
import { Link } from "wouter";
import { useProjectContext } from "@/lib/project-context";
import { useAskAuditee, type AskResult } from "@/lib/ai-api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Sparkles, Loader2, Send, ExternalLink, X } from "lucide-react";

const CONFIDENCE_BADGE: Record<string, string> = {
  low: "bg-amber-50 text-amber-700 border-amber-200",
  medium: "bg-blue-50 text-blue-700 border-blue-200",
  high: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

type LocalTurn = {
  id: string;
  question: string;
  answer: AskResult | null;
  pending: boolean;
  error?: string;
};

let __turnSeq = 0;
function nextTurnId(): string {
  __turnSeq += 1;
  return `t-${Date.now()}-${__turnSeq}`;
}

export function AskAuditeeFloater() {
  const { projectId } = useProjectContext();
  const { toast } = useToast();
  const askMut = useAskAuditee();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<LocalTurn[]>([]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (q.length < 3) return;
    // Stable id per turn — async callbacks update by id, not by captured array
    // index, so a "Clear" mid-flight cannot revive a removed turn.
    const id = nextTurnId();
    setTurns((t) => [...t, { id, question: q, answer: null, pending: true }]);
    setQuestion("");
    askMut.mutate(
      { question: q, projectId: projectId ?? undefined },
      {
        onSuccess: (data) => {
          setTurns((t) => t.map((x) => (x.id === id ? { ...x, answer: data, pending: false } : x)));
        },
        onError: (err: Error) => {
          setTurns((t) =>
            t.map((x) => (x.id === id ? { ...x, answer: null, pending: false, error: err.message } : x)),
          );
          toast({ title: "Ask failed", description: err.message, variant: "destructive" });
        },
      },
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-30 group flex items-center gap-2 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all px-5 py-3 font-semibold text-sm"
        data-testid="ask-auditee-fab"
        data-tour="ask-auditee"
        aria-label="Ask Auditee"
      >
        <Sparkles className="h-5 w-5" />
        <span>Ask Auditee</span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col p-0 gap-0">
          <SheetHeader className="p-5 border-b border-slate-200">
            <SheetTitle className="flex items-center gap-2 font-[Inter_Tight] text-xl">
              <Sparkles className="h-5 w-5 text-primary" /> Ask Auditee
            </SheetTitle>
            <SheetDescription>
              Quick natural-language Q&amp;A across this project's requirements, frameworks, controls and code.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
            {turns.length === 0 && (
              <div className="text-center text-slate-500 text-sm py-8">
                <Sparkles className="h-8 w-8 mx-auto mb-3 text-slate-300" />
                <p>Ask anything about your project.</p>
                <p className="text-xs mt-1">For long, multi-turn research, open the full Ask Auditee page below.</p>
              </div>
            )}
            {turns.map((t, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-end">
                  <div className="max-w-[85%] bg-primary text-primary-foreground rounded-lg rounded-br-sm px-3 py-2 text-sm">
                    {t.question}
                  </div>
                </div>
                {t.pending && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Loader2 className="h-3 w-3 animate-spin" /> Auditee is reading your project...
                  </div>
                )}
                {t.error && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">{t.error}</div>
                )}
                {t.answer && (
                  <div className="bg-white border border-slate-200 rounded-lg rounded-bl-sm p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded border ${CONFIDENCE_BADGE[t.answer.confidence] ?? CONFIDENCE_BADGE.medium}`}
                      >
                        {t.answer.confidence} confidence
                      </span>
                    </div>
                    <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{t.answer.answer}</p>
                    {t.answer.citations && t.answer.citations.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-1">
                        <div className="text-[10px] uppercase tracking-wider text-slate-500">Citations</div>
                        {t.answer.citations.slice(0, 5).map((c, j) => (
                          <div key={j} className="text-xs text-slate-600 truncate">
                            • {c}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 p-4 bg-white space-y-3">
            <form onSubmit={submit} className="flex items-center gap-2">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about requirements, gaps, traceability..."
                disabled={askMut.isPending}
                data-testid="ask-floater-input"
                className="flex-1"
                autoFocus
              />
              <Button
                type="submit"
                disabled={askMut.isPending || question.trim().length < 3}
                className="gap-2"
                data-testid="ask-floater-submit"
              >
                {askMut.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
            <div className="flex items-center justify-between text-xs">
              <Link
                href="/app/ask"
                onClick={() => setOpen(false)}
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Open full Ask page <ExternalLink className="h-3 w-3" />
              </Link>
              {turns.length > 0 && (
                <button
                  onClick={() => setTurns([])}
                  className="text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"
                  data-testid="ask-floater-clear"
                >
                  <X className="h-3 w-3" /> Clear
                </button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
