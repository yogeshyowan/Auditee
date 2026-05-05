import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

type Step = "idle" | "form" | "sending" | "done";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && step === "idle") setStep("form");
    if (!open) {
      setTimeout(() => {
        if (step === "done") {
          setStep("idle");
          setName("");
          setEmail("");
          setMessage("");
          setError("");
        }
      }, 400);
    }
  }, [open]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("All fields are required.");
      return;
    }
    setStep("sending");
    try {
      const r = await fetch(`${apiBase}/chat-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });
      if (!r.ok) throw new Error("Send failed");
      setStep("done");
    } catch {
      setError("Couldn't send — please try again.");
      setStep("form");
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div
          ref={panelRef}
          className="w-80 rounded-2xl shadow-2xl border border-slate-200 bg-white overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
        >
          <div className="bg-primary px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-white font-semibold text-sm">Chat with Auditee</p>
              <p className="text-primary-foreground/70 text-xs">We typically reply within 1 business day</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white transition-colors"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4">
            {step === "done" ? (
              <div className="py-6 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <Check className="h-6 w-6" />
                </div>
                <p className="font-semibold text-slate-900 text-sm mb-1">Message sent!</p>
                <p className="text-slate-500 text-xs">We'll reply to {email} soon.</p>
                <button
                  onClick={() => {
                    setStep("form");
                    setName("");
                    setEmail("");
                    setMessage("");
                    setError("");
                  }}
                  className="mt-4 text-xs text-primary hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <div>
                  <Input
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-sm h-9"
                    disabled={step === "sending"}
                    data-testid="chat-name"
                  />
                </div>
                <div>
                  <Input
                    type="email"
                    placeholder="Your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-sm h-9"
                    disabled={step === "sending"}
                    data-testid="chat-email"
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="How can we help?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className="text-sm resize-none"
                    disabled={step === "sending"}
                    data-testid="chat-message"
                  />
                </div>
                {error && <p className="text-xs text-red-600">{error}</p>}
                <Button
                  type="submit"
                  size="sm"
                  className="w-full rounded-full"
                  disabled={step === "sending"}
                  data-testid="chat-submit"
                >
                  {step === "sending" ? (
                    <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Sending…</>
                  ) : (
                    <><Send className="h-3.5 w-3.5 mr-1.5" />Send message</>
                  )}
                </Button>
                <p className="text-[11px] text-slate-400 text-center">
                  We'll email you back — no login needed.
                </p>
              </form>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
        data-testid="chat-toggle"
        className="w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center"
      >
        {open ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>
    </div>
  );
}
