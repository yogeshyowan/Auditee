// Tiny safe expression evaluator for workflow conditions.
// Supports: context.<key>[.<sub>], comparators (===, !==, ==, !=, <, <=, >, >=),
// logical && ||, parens, string/number/bool literals, "in" check via .includes.
// Only context paths and literals — no function calls, no side effects.

export function evalExpr(expr: string, context: Record<string, unknown>): boolean {
  if (!expr || !expr.trim()) return true;
  const sanitized = expr.trim();
  // Allow only safe characters — letters, digits, dots, brackets, quotes, ops, parens, spaces.
  if (!/^[\w.\s'"()<>=!&|+\-*/[\]?:,]+$/.test(sanitized)) {
    throw new Error(`Unsafe expression: ${expr}`);
  }
  // Disallow access to dangerous globals.
  if (/\b(process|global|require|import|eval|Function|window|document|constructor|__proto__|prototype)\b/.test(sanitized)) {
    throw new Error(`Forbidden identifier in expression: ${expr}`);
  }
  try {
    // Build a Function with `context` as the only binding.
    const fn = new Function("context", `"use strict"; return (${sanitized});`);
    const result = fn(context);
    return Boolean(result);
  } catch (err: any) {
    throw new Error(`Expression evaluation failed: ${err?.message ?? String(err)}`);
  }
}

export type WorkflowStep = {
  id: string;
  name: string;
  type: "task" | "approval" | "ai_action" | "branch" | "stop";
  assignee?: string;
  branches?: Array<{ when: string; goto: string }>;
  blockedUntil?: Array<{ expr: string; reason: string }>;
  aiPrompt?: string;
  outputKey?: string;
  dueOffsetDays?: number;
};

// Returns the next step id after `currentId` finishes. For branch steps, evaluates
// each `when` predicate in order and returns the first match's `goto`. For other
// steps, falls through to the next step in the sequence. Returns null when the
// run has reached the end.
export function nextStepId(
  steps: WorkflowStep[],
  currentId: string,
  context: Record<string, unknown>,
): string | null {
  const idx = steps.findIndex((s) => s.id === currentId);
  if (idx < 0) return null;
  const cur = steps[idx];
  if (cur.type === "branch" && cur.branches?.length) {
    for (const b of cur.branches) {
      if (evalExpr(b.when, context)) return b.goto;
    }
  }
  return idx + 1 < steps.length ? steps[idx + 1].id : null;
}

// Evaluate stop-task predicates. Returns first failing reason, or null if all pass.
export function checkBlockingPredicates(
  step: WorkflowStep,
  context: Record<string, unknown>,
): string | null {
  if (step.type !== "stop" || !step.blockedUntil?.length) return null;
  for (const p of step.blockedUntil) {
    let ok = false;
    try {
      ok = evalExpr(p.expr, context);
    } catch {
      ok = false;
    }
    if (!ok) return p.reason;
  }
  return null;
}
