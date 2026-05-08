import { Router, type IRouter } from "express";
import { eq, and, inArray, count } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db, pdlcStagesTable, requirementsTable } from "@workspace/db";
import { GetPdlcStagesQueryParams } from "@workspace/api-zod";

const stageStatusMap: Record<string, string[]> = {
  ideation: ["draft"],
  design: ["in_review"],
  development: ["approved"],
  testing: ["implemented"],
  launch: ["verified"],
  governance: ["verified"],
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

  const out = await Promise.all(
    stages.map(async (s) => {
      const statuses = stageStatusMap[s.stage] ?? [];
      let requirementCount = 0;
      if (statuses.length) {
        const [{ value }] = await db
          .select({ value: count() })
          .from(requirementsTable)
          .where(
            and(
              eq(requirementsTable.projectId, params.projectId),
              inArray(requirementsTable.status, statuses),
            ),
          );
        requirementCount = Number(value);
      }
      return {
        id: s.id,
        projectId: s.projectId,
        stage: s.stage,
        title: s.title,
        completion: s.completion,
        blockers: s.blockers,
        requirementCount,
      };
    }),
  );
  res.json(out);
});

export default router;
