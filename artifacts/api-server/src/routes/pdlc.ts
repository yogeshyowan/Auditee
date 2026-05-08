import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db, pdlcStagesTable, requirementsTable } from "@workspace/db";
import { GetPdlcStagesQueryParams } from "@workspace/api-zod";

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
// completion = count(reqs with status in passedStatuses) / total * 100
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

const router: IRouter = Router();

router.get("/pdlc/stages", async (req, res) => {
  const params = GetPdlcStagesQueryParams.parse(req.query);

  // Ensure stages exist for this project (lazy seed)
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

  // Single query: count requirements grouped by status for this project
  const statusCounts = await db
    .select({
      status: requirementsTable.status,
      cnt: sql<number>`cast(count(*) as int)`,
    })
    .from(requirementsTable)
    .where(eq(requirementsTable.projectId, params.projectId))
    .groupBy(requirementsTable.status);

  const byStatus: Record<string, number> = {};
  let totalReqs = 0;
  for (const row of statusCounts) {
    byStatus[row.status] = row.cnt;
    totalReqs += row.cnt;
  }

  const out = stages.map((s) => {
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
  });

  res.json(out);
});

export default router;
