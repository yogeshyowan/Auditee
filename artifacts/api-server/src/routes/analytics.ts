import { Router, type IRouter } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  db,
  workflowsTable,
  workflowRunsTable,
  workflowStepRunsTable,
} from "@workspace/db";

const router: IRouter = Router();

// Workflow analytics: throughput, cycle time, blocker frequency by step, completion rate.
router.get("/analytics/workflows", async (req, res) => {
  const projectId = typeof req.query.projectId === "string" ? req.query.projectId : undefined;
  const conds = [];
  if (projectId) conds.push(eq(workflowRunsTable.projectId, projectId));

  const allRuns = await db
    .select()
    .from(workflowRunsTable)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(workflowRunsTable.startedAt));

  const wfs = await db.select().from(workflowsTable);
  const wfById = new Map(wfs.map((w) => [w.id, w]));

  // Aggregate per-workflow stats.
  type WfStat = {
    workflowId: string;
    workflowName: string;
    total: number;
    running: number;
    blocked: number;
    completed: number;
    cancelled: number;
    completionRate: number;
    avgCycleTimeMinutes: number | null;
  };
  const byWf = new Map<string, WfStat>();
  for (const r of allRuns) {
    const wf = wfById.get(r.workflowId);
    if (!byWf.has(r.workflowId)) {
      byWf.set(r.workflowId, {
        workflowId: r.workflowId,
        workflowName: wf?.name ?? r.workflowId.slice(0, 8),
        total: 0,
        running: 0,
        blocked: 0,
        completed: 0,
        cancelled: 0,
        completionRate: 0,
        avgCycleTimeMinutes: null,
      });
    }
    const s = byWf.get(r.workflowId)!;
    s.total++;
    if (r.status === "running") s.running++;
    if (r.status === "blocked") s.blocked++;
    if (r.status === "completed") s.completed++;
    if (r.status === "cancelled") s.cancelled++;
  }
  // Cycle time per workflow (avg minutes from startedAt -> completedAt across completed runs).
  const cycle = await db
    .select({
      workflowId: workflowRunsTable.workflowId,
      avgMinutes: sql<number>`avg(extract(epoch from (${workflowRunsTable.completedAt} - ${workflowRunsTable.startedAt})) / 60)`,
    })
    .from(workflowRunsTable)
    .where(and(eq(workflowRunsTable.status, "completed"), ...(projectId ? [eq(workflowRunsTable.projectId, projectId)] : [])))
    .groupBy(workflowRunsTable.workflowId);
  for (const c of cycle) {
    const s = byWf.get(c.workflowId);
    if (s) s.avgCycleTimeMinutes = c.avgMinutes ? Math.round(Number(c.avgMinutes)) : null;
  }
  for (const s of byWf.values()) {
    s.completionRate = s.total ? Math.round((s.completed / s.total) * 100) : 0;
  }

  // Blocker frequency: which step names cause the most blocked status across all step runs.
  // Joined to workflow_runs so we can apply the same projectId scope as the rest of analytics.
  const blockerRows = await db
    .select({
      stepName: workflowStepRunsTable.stepName,
      stepType: workflowStepRunsTable.stepType,
      blockedReason: workflowStepRunsTable.blockedReason,
      count: sql<number>`count(*)`,
    })
    .from(workflowStepRunsTable)
    .innerJoin(workflowRunsTable, eq(workflowStepRunsTable.runId, workflowRunsTable.id))
    .where(
      and(
        eq(workflowStepRunsTable.status, "blocked"),
        ...(projectId ? [eq(workflowRunsTable.projectId, projectId)] : []),
      ),
    )
    .groupBy(workflowStepRunsTable.stepName, workflowStepRunsTable.stepType, workflowStepRunsTable.blockedReason)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  // Throughput: runs started per day for the last 14 days.
  const throughputRows = await db
    .select({
      day: sql<string>`to_char(${workflowRunsTable.startedAt}::date, 'YYYY-MM-DD')`,
      starts: sql<number>`count(*)`,
      completions: sql<number>`sum(case when ${workflowRunsTable.status} = 'completed' then 1 else 0 end)`,
    })
    .from(workflowRunsTable)
    .where(
      and(
        sql`${workflowRunsTable.startedAt} >= now() - interval '14 days'`,
        ...(projectId ? [eq(workflowRunsTable.projectId, projectId)] : []),
      ),
    )
    .groupBy(sql`${workflowRunsTable.startedAt}::date`)
    .orderBy(sql`${workflowRunsTable.startedAt}::date`);

  res.json({
    workflows: Array.from(byWf.values()).sort((a, b) => b.total - a.total),
    blockers: blockerRows.map((b) => ({
      stepName: b.stepName,
      stepType: b.stepType,
      reason: b.blockedReason ?? "(no reason)",
      count: Number(b.count),
    })),
    throughput: throughputRows.map((t) => ({
      day: t.day,
      starts: Number(t.starts),
      completions: Number(t.completions ?? 0),
    })),
    totals: {
      runs: allRuns.length,
      completed: allRuns.filter((r) => r.status === "completed").length,
      blocked: allRuns.filter((r) => r.status === "blocked").length,
      running: allRuns.filter((r) => r.status === "running").length,
    },
  });
});

export default router;
