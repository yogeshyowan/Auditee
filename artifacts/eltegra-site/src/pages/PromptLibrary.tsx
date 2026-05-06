import { useMemo, useState } from "react";
import { PROMPT_LIBRARY, type LibraryPrompt, type PromptCategory } from "../data/promptLibrary";
import { SEO } from "@/components/SEO";

const CATEGORIES: PromptCategory[] = [
  "Discovery",
  "Gap Detection",
  "BRD / PRD Drafting",
  "Stakeholder Validation",
  "Compliance",
];

export default function PromptLibrary() {
  const [active, setActive] = useState<PromptCategory | "All">("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const visible = useMemo<LibraryPrompt[]>(
    () => (active === "All" ? PROMPT_LIBRARY : PROMPT_LIBRARY.filter((p) => p.category === active)),
    [active],
  );

  const copy = async (p: LibraryPrompt) => {
    try {
      await navigator.clipboard.writeText(p.prompt);
      setCopiedId(p.id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="AI Prompt Library for Business Analysts | Auditee"
        description="15 ready-to-run prompts for BAs covering discovery, gap detection, BRD/PRD drafting, stakeholder validation, and compliance."
        path="/prompt-library"
      />
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">For business analysts</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          AI Prompt Library
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-600">
          15 specialised prompts BAs can paste into Auditee or any LLM today. Covers discovery, gap detection,
          BRD/PRD drafting, stakeholder validation, and compliance.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          {(["All", ...CATEGORIES] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setActive(c)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                active === c
                  ? "border-purple-600 bg-purple-600 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-purple-300"
              }`}
              data-testid={`prompt-filter-${c.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {visible.map((p) => (
            <article
              key={p.id}
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              data-testid={`prompt-card-${p.id}`}
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                  {p.category}
                </span>
                <button
                  type="button"
                  onClick={() => copy(p)}
                  className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-purple-300 hover:text-purple-700"
                  data-testid={`prompt-copy-${p.id}`}
                >
                  {copiedId === p.id ? "Copied" : "Copy prompt"}
                </button>
              </div>
              <h2 className="text-lg font-semibold text-slate-900">{p.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{p.summary}</p>
              <pre className="mt-3 max-h-48 overflow-auto rounded-md bg-slate-50 p-3 text-xs text-slate-800 whitespace-pre-wrap break-words">
                {p.prompt}
              </pre>
              {p.variables.length > 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  Variables: {p.variables.map((v) => `{{${v}}}`).join(", ")}
                </p>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
