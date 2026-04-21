import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  db,
  workflowsTable,
  workflowRunsTable,
  workflowStepRunsTable,
  activityEventsTable,
} from "@workspace/db";
import {
  evalExpr,
  nextStepId,
  checkBlockingPredicates,
  type WorkflowStep,
} from "../lib/workflow-engine.js";

const router: IRouter = Router();

// ---------------- Workflow definitions ----------------
router.get("/workflows", async (_req, res) => {
  const rows = await db
    .select()
    .from(workflowsTable)
    .orderBy(desc(workflowsTable.updatedAt));
  res.json({ workflows: rows });
});

router.get("/workflows/:id", async (req, res) => {
  const [row] = await db.select().from(workflowsTable).where(eq(workflowsTable.id, req.params.id!));
  if (!row) {
    res.status(404).json({ error: "workflow not found" });
    return;
  }
  res.json(row);
});

function validateDefinition(def: any): { ok: true; steps: WorkflowStep[] } | { ok: false; error: string } {
  if (!def || !Array.isArray(def.steps) || def.steps.length === 0) {
    return { ok: false, error: "definition.steps must be a non-empty array" };
  }
  const ids = new Set<string>();
  const steps: WorkflowStep[] = [];
  for (const raw of def.steps) {
    if (!raw || typeof raw.id !== "string" || typeof raw.name !== "string") {
      return { ok: false, error: "each step requires id and name" };
    }
    if (ids.has(raw.id)) return { ok: false, error: `duplicate step id: ${raw.id}` };
    ids.add(raw.id);
    if (!["task", "approval", "ai_action", "branch", "stop"].includes(raw.type)) {
      return { ok: false, error: `invalid step type: ${raw.type}` };
    }
    steps.push({
      id: raw.id,
      name: raw.name.slice(0, 240),
      type: raw.type,
      assignee: typeof raw.assignee === "string" ? raw.assignee : undefined,
      branches: Array.isArray(raw.branches)
        ? raw.branches
            .filter((b: any) => typeof b?.when === "string" && typeof b?.goto === "string")
            .map((b: any) => ({ when: b.when, goto: b.goto }))
        : undefined,
      blockedUntil: Array.isArray(raw.blockedUntil)
        ? raw.blockedUntil
            .filter((b: any) => typeof b?.expr === "string" && typeof b?.reason === "string")
            .map((b: any) => ({ expr: b.expr, reason: b.reason }))
        : undefined,
      aiPrompt: typeof raw.aiPrompt === "string" ? raw.aiPrompt : undefined,
      outputKey: typeof raw.outputKey === "string" ? raw.outputKey : undefined,
      dueOffsetDays: typeof raw.dueOffsetDays === "number" ? raw.dueOffsetDays : undefined,
    });
  }
  // Validate branch targets and try-evaluate predicates with empty context to catch syntax errors.
  for (const s of steps) {
    if (s.type === "branch" && s.branches) {
      for (const b of s.branches) {
        if (!ids.has(b.goto)) return { ok: false, error: `branch goto unknown step: ${b.goto}` };
        try {
          evalExpr(b.when, {});
        } catch (err: any) {
          return { ok: false, error: `branch expression invalid (${b.when}): ${err.message}` };
        }
      }
    }
    if (s.type === "stop" && s.blockedUntil) {
      for (const p of s.blockedUntil) {
        try {
          evalExpr(p.expr, {});
        } catch (err: any) {
          return { ok: false, error: `stop predicate invalid (${p.expr}): ${err.message}` };
        }
      }
    }
  }
  return { ok: true, steps };
}

router.post("/workflows", async (req, res) => {
  const b = req.body ?? {};
  if (typeof b.name !== "string" || b.name.trim().length === 0) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const v = validateDefinition(b.definition);
  if (!v.ok) {
    res.status(400).json({ error: v.error });
    return;
  }
  const [row] = await db
    .insert(workflowsTable)
    .values({
      id: randomUUID(),
      name: b.name.trim().slice(0, 240),
      description: typeof b.description === "string" ? b.description : "",
      version: 1,
      status: "active",
      trigger: typeof b.trigger === "string" ? b.trigger : "manual",
      definition: { steps: v.steps },
    })
    .returning();
  res.status(201).json(row);
});

router.patch("/workflows/:id", async (req, res) => {
  const b = req.body ?? {};
  const updates: Partial<typeof workflowsTable.$inferInsert> = { updatedAt: new Date() };
  if (typeof b.name === "string") updates.name = b.name.slice(0, 240);
  if (typeof b.description === "string") updates.description = b.description;
  if (typeof b.status === "string" && ["active", "archived"].includes(b.status)) updates.status = b.status;
  if (b.definition) {
    const v = validateDefinition(b.definition);
    if (!v.ok) {
      res.status(400).json({ error: v.error });
      return;
    }
    updates.definition = { steps: v.steps };
  }
  const [row] = await db.update(workflowsTable).set(updates).where(eq(workflowsTable.id, req.params.id!)).returning();
  if (!row) {
    res.status(404).json({ error: "workflow not found" });
    return;
  }
  res.json(row);
});

router.delete("/workflows/:id", async (req, res) => {
  await db.delete(workflowsTable).where(eq(workflowsTable.id, req.params.id!));
  res.status(204).end();
});

// ---------------- Runs ----------------
router.get("/workflow-runs", async (req, res) => {
  const conds = [];
  if (typeof req.query.workflowId === "string") conds.push(eq(workflowRunsTable.workflowId, req.query.workflowId));
  if (typeof req.query.projectId === "string") conds.push(eq(workflowRunsTable.projectId, req.query.projectId));
  if (typeof req.query.status === "string") conds.push(eq(workflowRunsTable.status, req.query.status));
  const rows = await db
    .select()
    .from(workflowRunsTable)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(workflowRunsTable.startedAt));
  res.json({ runs: rows });
});

router.get("/workflow-runs/:id", async (req, res) => {
  const [run] = await db.select().from(workflowRunsTable).where(eq(workflowRunsTable.id, req.params.id!));
  if (!run) {
    res.status(404).json({ error: "run not found" });
    return;
  }
  const stepRuns = await db
    .select()
    .from(workflowStepRunsTable)
    .where(eq(workflowStepRunsTable.runId, run.id))
    .orderBy(workflowStepRunsTable.startedAt);
  const [wf] = await db.select().from(workflowsTable).where(eq(workflowsTable.id, run.workflowId));
  res.json({ run, stepRuns, workflow: wf ?? null });
});

async function instantiateStep(runId: string, step: WorkflowStep, context: Record<string, unknown>): Promise<{ status: string; blockedReason: string | null }> {
  let status: string = "in_progress";
  let blockedReason: string | null = null;
  if (step.type === "stop") {
    blockedReason = checkBlockingPredicates(step, context);
    status = blockedReason ? "blocked" : "done";
  } else if (step.type === "branch") {
    // Branch steps are decision points — record them as done immediately;
    // advanceRun's nextStepId() will evaluate the predicates to pick the goto.
    status = "done";
  }
  const dueAt = step.dueOffsetDays ? new Date(Date.now() + step.dueOffsetDays * 86400_000) : null;
  await db.insert(workflowStepRunsTable).values({
    id: randomUUID(),
    runId,
    stepId: step.id,
    stepName: step.name,
    stepType: step.type,
    status,
    assignee: step.assignee ?? null,
    blockedReason,
    dueAt,
    completedAt: status === "done" ? new Date() : null,
  });
  return { status, blockedReason };
}

router.post("/workflows/:id/runs", async (req, res) => {
  const [wf] = await db.select().from(workflowsTable).where(eq(workflowsTable.id, req.params.id!));
  if (!wf) {
    res.status(404).json({ error: "workflow not found" });
    return;
  }
  const steps = wf.definition.steps as WorkflowStep[];
  if (!steps?.length) {
    res.status(400).json({ error: "workflow has no steps" });
    return;
  }
  const b = req.body ?? {};
  const context: Record<string, unknown> = (b.context && typeof b.context === "object") ? { ...b.context } : {};
  const runId = randomUUID();
  const first = steps[0]!;
  const result = await instantiateStep(runId, first, context);
  const runStatus = result.status === "blocked" ? "blocked" : "running";
  const [run] = await db
    .insert(workflowRunsTable)
    .values({
      id: runId,
      workflowId: wf.id,
      projectId: typeof b.projectId === "string" ? b.projectId : null,
      status: runStatus,
      currentStepId: first.id,
      blockedReason: result.blockedReason,
      context,
      startedBy: typeof b.startedBy === "string" ? b.startedBy : "system",
    })
    .returning();
  await db.insert(activityEventsTable).values({
    id: randomUUID(),
    kind: "workflow",
    message: `Run started: ${wf.name}`,
    actor: run.startedBy,
    entityCode: wf.name,
  });
  // If the first step auto-completed (stop with no blockers), advance immediately.
  if (result.status === "done") {
    const advanced = await advanceRun(runId);
    res.status(201).json(advanced);
    return;
  }
  res.status(201).json({ run, currentStep: first });
});

// Advance the run: mark current step done with output/contextPatch, then move to next.
async function advanceRun(runId: string, opts: { contextPatch?: Record<string, unknown>; output?: Record<string, unknown> } = {}): Promise<any> {
  const [run] = await db.select().from(workflowRunsTable).where(eq(workflowRunsTable.id, runId));
  if (!run) throw new Error("run not found");
  if (run.status === "completed" || run.status === "cancelled") return { run };
  const [wf] = await db.select().from(workflowsTable).where(eq(workflowsTable.id, run.workflowId));
  const steps = (wf?.definition.steps ?? []) as WorkflowStep[];
  const context: Record<string, unknown> = { ...(run.context ?? {}), ...(opts.contextPatch ?? {}) };

  // Mark the current step done (idempotent — only if currently in_progress).
  if (run.currentStepId) {
    await db
      .update(workflowStepRunsTable)
      .set({ status: "done", output: opts.output ?? {}, completedAt: new Date() })
      .where(and(eq(workflowStepRunsTable.runId, runId), eq(workflowStepRunsTable.stepId, run.currentStepId), eq(workflowStepRunsTable.status, "in_progress")));
  }

  // Walk forward, skipping any auto-resolving stop steps.
  let cursor: string | null = run.currentStepId ? nextStepId(steps, run.currentStepId, context) : steps[0]?.id ?? null;
  while (cursor) {
    const step = steps.find((s) => s.id === cursor)!;
    const result = await instantiateStep(runId, step, context);
    if (result.status === "blocked") {
      const [updated] = await db
        .update(workflowRunsTable)
        .set({ status: "blocked", currentStepId: step.id, blockedReason: result.blockedReason, context })
        .where(eq(workflowRunsTable.id, runId))
        .returning();
      return { run: updated, currentStep: step, blockedReason: result.blockedReason };
    }
    if (result.status === "in_progress") {
      const [updated] = await db
        .update(workflowRunsTable)
        .set({ status: "running", currentStepId: step.id, blockedReason: null, context })
        .where(eq(workflowRunsTable.id, runId))
        .returning();
      return { run: updated, currentStep: step };
    }
    // result.status === "done" (auto-resolved stop) — advance further.
    cursor = nextStepId(steps, step.id, context);
  }

  // No more steps — complete.
  const [completed] = await db
    .update(workflowRunsTable)
    .set({ status: "completed", currentStepId: null, blockedReason: null, context, completedAt: new Date() })
    .where(eq(workflowRunsTable.id, runId))
    .returning();
  await db.insert(activityEventsTable).values({
    id: randomUUID(),
    kind: "workflow",
    message: `Run completed: ${wf?.name ?? run.workflowId}`,
    actor: run.startedBy,
    entityCode: wf?.name ?? "",
  });
  return { run: completed };
}

router.post("/workflow-runs/:id/advance", async (req, res) => {
  try {
    const result = await advanceRun(req.params.id!, {
      contextPatch: req.body?.contextPatch && typeof req.body.contextPatch === "object" ? req.body.contextPatch : undefined,
      output: req.body?.output && typeof req.body.output === "object" ? req.body.output : undefined,
    });
    res.json(result);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

router.post("/workflow-runs/:id/recheck", async (req, res) => {
  // Re-evaluate blockers for a blocked run (e.g. after context update).
  const [run] = await db.select().from(workflowRunsTable).where(eq(workflowRunsTable.id, req.params.id!));
  if (!run) {
    res.status(404).json({ error: "run not found" });
    return;
  }
  if (run.status !== "blocked" || !run.currentStepId) {
    res.json({ run });
    return;
  }
  const [wf] = await db.select().from(workflowsTable).where(eq(workflowsTable.id, run.workflowId));
  const steps = (wf?.definition.steps ?? []) as WorkflowStep[];
  const step = steps.find((s) => s.id === run.currentStepId);
  if (!step) {
    res.status(400).json({ error: "current step missing from definition" });
    return;
  }
  const context: Record<string, unknown> = { ...(run.context ?? {}), ...((req.body?.contextPatch && typeof req.body.contextPatch === "object") ? req.body.contextPatch : {}) };
  const blockedReason = checkBlockingPredicates(step, context);
  if (blockedReason) {
    const [updated] = await db
      .update(workflowRunsTable)
      .set({ blockedReason, context })
      .where(eq(workflowRunsTable.id, run.id))
      .returning();
    res.json({ run: updated, currentStep: step, blockedReason });
    return;
  }
  // Unblock — mark current stop step done and advance.
  await db
    .update(workflowStepRunsTable)
    .set({ status: "done", blockedReason: null, completedAt: new Date() })
    .where(and(eq(workflowStepRunsTable.runId, run.id), eq(workflowStepRunsTable.stepId, step.id), eq(workflowStepRunsTable.status, "blocked")));
  await db.update(workflowRunsTable).set({ status: "running", blockedReason: null, context }).where(eq(workflowRunsTable.id, run.id));
  const advanced = await advanceRun(run.id, {});
  res.json(advanced);
});

router.post("/workflow-runs/:id/cancel", async (req, res) => {
  const [row] = await db
    .update(workflowRunsTable)
    .set({ status: "cancelled", completedAt: new Date() })
    .where(eq(workflowRunsTable.id, req.params.id!))
    .returning();
  if (!row) {
    res.status(404).json({ error: "run not found" });
    return;
  }
  res.json(row);
});

export default router;
