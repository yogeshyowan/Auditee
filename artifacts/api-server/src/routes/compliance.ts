import { Router, type IRouter } from "express";
import { and, count, eq } from "drizzle-orm";
import {
  db,
  complianceFrameworksTable,
  complianceControlsTable,
} from "@workspace/db";
import { GetComplianceFrameworkParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/compliance/frameworks", async (_req, res) => {
  const frameworks = await db.select().from(complianceFrameworksTable);
  const out = await Promise.all(
    frameworks.map(async (f) => {
      const [{ value: met }] = await db
        .select({ value: count() })
        .from(complianceControlsTable)
        .where(
          and(
            eq(complianceControlsTable.frameworkId, f.id),
            eq(complianceControlsTable.status, "met"),
          ),
        );
      return { ...f, controlsMet: Number(met) };
    }),
  );
  res.json(out);
});

router.get("/compliance/frameworks/:frameworkId", async (req, res) => {
  const params = GetComplianceFrameworkParams.parse(req.params);
  const [framework] = await db
    .select()
    .from(complianceFrameworksTable)
    .where(eq(complianceFrameworksTable.id, params.frameworkId));
  if (!framework) {
    res.status(404).json({ error: "Framework not found" });
    return;
  }
  const controls = await db
    .select()
    .from(complianceControlsTable)
    .where(eq(complianceControlsTable.frameworkId, framework.id));
  const [{ value: met }] = await db
    .select({ value: count() })
    .from(complianceControlsTable)
    .where(
      and(
        eq(complianceControlsTable.frameworkId, framework.id),
        eq(complianceControlsTable.status, "met"),
      ),
    );
  res.json({
    ...framework,
    controlsMet: Number(met),
    controls: controls.map((c) => ({ ...c, linkedRequirementCount: 0 })),
  });
});

export default router;
