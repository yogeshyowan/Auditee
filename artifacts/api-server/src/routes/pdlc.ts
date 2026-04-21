import { Router, type IRouter } from "express";
import { eq, and, inArray, count } from "drizzle-orm";
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

const router: IRouter = Router();

router.get("/pdlc/stages", async (req, res) => {
  const params = GetPdlcStagesQueryParams.parse(req.query);
  const stages = await db
    .select()
    .from(pdlcStagesTable)
    .where(eq(pdlcStagesTable.projectId, params.projectId))
    .orderBy(pdlcStagesTable.sortOrder);
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
