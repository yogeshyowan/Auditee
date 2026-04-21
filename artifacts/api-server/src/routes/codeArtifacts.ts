import { Router, type IRouter } from "express";
import { and, eq, count, inArray } from "drizzle-orm";
import { db, codeArtifactsTable, traceabilityLinksTable } from "@workspace/db";
import { ListCodeArtifactsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/code-artifacts", async (req, res) => {
  const params = ListCodeArtifactsQueryParams.parse(req.query);
  const conds = [];
  if (params.projectId) conds.push(eq(codeArtifactsTable.projectId, params.projectId));
  if (params.language) conds.push(eq(codeArtifactsTable.language, params.language));
  const rows = await db
    .select()
    .from(codeArtifactsTable)
    .where(conds.length ? and(...conds) : undefined);

  if (rows.length === 0) {
    res.json([]);
    return;
  }
  const ids = rows.map((r) => r.id);
  const counts = await db
    .select({
      codeArtifactId: traceabilityLinksTable.codeArtifactId,
      cnt: count(),
    })
    .from(traceabilityLinksTable)
    .where(inArray(traceabilityLinksTable.codeArtifactId, ids))
    .groupBy(traceabilityLinksTable.codeArtifactId);
  const map = new Map(counts.map((c) => [c.codeArtifactId, Number(c.cnt)]));
  res.json(rows.map((r) => ({ ...r, linkedRequirementCount: map.get(r.id) ?? 0 })));
});

export default router;
