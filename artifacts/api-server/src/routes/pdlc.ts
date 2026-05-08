import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db, pdlcStagesTable, requirementsTable } from "@workspace/db";
import {
  GetPdlcStagesQueryParams,
  PatchPdlcStagePathParams,
  PatchPdlcStageBody,
} from "@workspace/api-zod";

// Which requirement status "belongs" at this stage (drives requirementCount)
const STAGE_CURRENT_STATUS: Record<string, string> = {
  ideation:    "draft",
  design:      "in_review",
  development: "approved",
  testing:     "implemented",
  launch:      "verified",
  governance:  "verified",
};

// Statuses that mean a requirement has "passed through" a stage (drives completion %)
const STAGE_PASSED_STATUSES: Record<string, string[]> = {
  ideation:    ["in_review", "approved", "implemented", "verified"],
  design:      ["approved", "implemented", "verified"],
  development: ["implemented", "verified"],
  testing:     ["verified"],
  launch:      ["verified"],
  governance:  ["verified"],
};

const DEFAULT_STAGES: Array<{ stage: string; title: string; sortOrder: number }> = [
  { stage: "ideation",    title: "Ideation",    sortOrder: 0 },
  { stage: "design",      title: "Design",      sortOrder: 1 },
  { stage: "development", title: "Development", sortOrder: 2 },
  { stage: "testing",     title: "Testing",     sortOrder: 3 },
  { stage: "launch",      title: "Launch",      sortOrder: 4 },
  { stage: "governance",  title: "Governance",  sortOrder: 5 },
];

async function buildStageOutput(
  s: typeof pdlcStagesTable.$inferSelect,
  byStatus: Record<string, number>,
  totalReqs: number,
) {
  const currentStatus = STAGE_CURRENT_STATUS[s.stage] ?? "";
  const requirementCount = byStatus[currentStatus] ?? 0;
  const passedStatuses = STAGE_PASSED_STATUSES[s.stage] ?? [];
  const passedCount = passedStatuses.reduce((sum, st) => sum + (byStatus[st] ?? 0), 0);
  const completion = totalReqs > 0 ? Math.round((passedCount / totalReqs) * 100) : 0;
  return {
    id: s.id,
    projectId: s.projectId,
    stage: s.stage,
    title: s.title,
    completion,
    blockers: s.blockers,
    requirementCount,
  };
}

async function getStatusCounts(projectId: string) {
  const rows = await db
    .select({
      status: requirementsTable.status,
      cnt: sql<number>`cast(count(*) as int)`,
    })
    .from(requirementsTable)
    .where(eq(requirementsTable.projectId, projectId))
    .groupBy(requirementsTable.status);

  const byStatus: Record<string, number> = {};
  let totalReqs = 0;
  for (const row of rows) {
    byStatus[row.status] = row.cnt;
    totalReqs += row.cnt;
  }
  return { byStatus, totalReqs };
}

const router: IRouter = Router();

router.get("/pdlc/stages", async (req, res) => {
  const params = GetPdlcStagesQueryParams.parse(req.query);

  let stages = await db
    .select()
    .from(pdlcStagesTable)
    .where(eq(pdlcStagesTable.projectId, params.projectId))
    .orderBy(pdlcStagesTable.sortOrder);

  if (stages.length === 0) {
    const rows = DEFAULT_STAGES.map((s) => ({
      id: randomUUID(),
      projectId: params.projectId,
      stage: s.stage,
      title: s.title,
      completion: 0,
      blockers: 0,
      sortOrder: s.sortOrder,
    }));
    await db.insert(pdlcStagesTable).values(rows).onConflictDoNothing();
    stages = rows;
  }

  const { byStatus, totalReqs } = await getStatusCounts(params.projectId);
  const out = await Promise.all(stages.map((s) => buildStageOutput(s, byStatus, totalReqs)));
  res.json(out);
});

router.patch("/pdlc/stages/:id", async (req, res) => {
  const { id } = PatchPdlcStagePathParams.parse(req.params);
  const body = PatchPdlcStageBody.parse(req.body);

  const updates: Partial<typeof pdlcStagesTable.$inferInsert> = {};
  if (body.blockers !== undefined) updates.blockers = body.blockers;
  if (body.completion !== undefined) updates.completion = body.completion;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  const [updated] = await db
    .update(pdlcStagesTable)
    .set(updates)
    .where(eq(pdlcStagesTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Stage not found" });
    return;
  }

  const { byStatus, totalReqs } = await getStatusCounts(updated.projectId);
  const out = await buildStageOutput(updated, byStatus, totalReqs);
  res.json(out);
});

export default router;
