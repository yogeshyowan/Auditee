import { Router, type IRouter } from "express";
import { count, eq, sql } from "drizzle-orm";
import {
  db,
  requirementsTable,
  traceabilityLinksTable,
  complianceFrameworksTable,
} from "@workspace/db";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res) => {
  const [{ value: totalRequirements }] = await db
    .select({ value: count() })
    .from(requirementsTable);

  const byStatusRows = await db
    .select({ status: requirementsTable.status, cnt: count() })
    .from(requirementsTable)
    .groupBy(requirementsTable.status);

  const byTypeRows = await db
    .select({ type: requirementsTable.type, cnt: count() })
    .from(requirementsTable)
    .groupBy(requirementsTable.type);

  const implementedRequirements = byStatusRows
    .filter((r) => r.status === "implemented" || r.status === "verified")
    .reduce((acc, r) => acc + Number(r.cnt), 0);

  const openGaps = byStatusRows
    .filter((r) => r.status === "draft" || r.status === "in_review")
    .reduce((acc, r) => acc + Number(r.cnt), 0);

  const frameworks = await db.select().from(complianceFrameworksTable);
  const complianceAdherence = frameworks.length
    ? Math.round(
        frameworks.reduce((acc, f) => acc + f.score, 0) / frameworks.length,
      )
    : 0;

  const [{ value: linkedReqCount }] = await db
    .select({
      value: sql<number>`COUNT(DISTINCT ${traceabilityLinksTable.requirementId})::int`,
    })
    .from(traceabilityLinksTable);
  const traceabilityCoverage = Number(totalRequirements) > 0
    ? Math.round((Number(linkedReqCount) / Number(totalRequirements)) * 100)
    : 0;

  const velocityIndex = Math.min(
    100,
    Math.round(
      ((implementedRequirements + 1) / (Number(totalRequirements) + 1)) * 100,
    ),
  );

  res.json({
    totalRequirements: Number(totalRequirements),
    implementedRequirements,
    openGaps,
    complianceAdherence,
    traceabilityCoverage,
    velocityIndex,
    savings: {
      estimatedAnnualUsd: 412000,
      hoursSaved: 8400,
    },
    byStatus: byStatusRows.map((r) => ({ status: r.status, count: Number(r.cnt) })),
    byType: byTypeRows.map((r) => ({ type: r.type, count: Number(r.cnt) })),
  });
});

export default router;
