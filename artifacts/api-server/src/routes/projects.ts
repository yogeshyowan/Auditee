import { Router, type IRouter } from "express";
import { eq, count, sql } from "drizzle-orm";
import { db, projectsTable, requirementsTable, projectSourcesTable } from "@workspace/db";
import { GetProjectParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/projects", async (_req, res) => {
  // Fetch project rows + counts. We use 3 small lookup queries instead of correlated
  // subqueries because Drizzle's `${columnRef}` interpolation inside subquery `sql`
  // templates was returning 0 in some shapes (parameter binding swallowed the column).
  const rows = await db
    .select({
      id: projectsTable.id,
      name: projectsTable.name,
      slug: projectsTable.slug,
      description: projectsTable.description,
      owner: projectsTable.owner,
      complianceScore: projectsTable.complianceScore,
      createdAt: projectsTable.createdAt,
    })
    .from(projectsTable)
    .orderBy(projectsTable.createdAt);

  const reqCounts = await db
    .select({ projectId: requirementsTable.projectId, n: count() })
    .from(requirementsTable)
    .groupBy(requirementsTable.projectId);
  const allSrcCounts = await db
    .select({ projectId: projectSourcesTable.projectId, n: count() })
    .from(projectSourcesTable)
    .groupBy(projectSourcesTable.projectId);
  const readySrcCounts = await db
    .select({ projectId: projectSourcesTable.projectId, n: count() })
    .from(projectSourcesTable)
    .where(eq(projectSourcesTable.status, "ready"))
    .groupBy(projectSourcesTable.projectId);

  const reqMap = new Map(reqCounts.map((r) => [r.projectId, Number(r.n)]));
  const srcMap = new Map(allSrcCounts.map((r) => [r.projectId, Number(r.n)]));
  const readyMap = new Map(readySrcCounts.map((r) => [r.projectId, Number(r.n)]));

  res.json(
    rows.map((r) => ({
      ...r,
      requirementCount: reqMap.get(r.id) ?? 0,
      sourceCount: srcMap.get(r.id) ?? 0,
      readySourceCount: readyMap.get(r.id) ?? 0,
    })),
  );
});

router.get("/projects/:projectId", async (req, res) => {
  const params = GetProjectParams.parse(req.params);
  const [row] = await db
    .select({
      id: projectsTable.id,
      name: projectsTable.name,
      slug: projectsTable.slug,
      description: projectsTable.description,
      owner: projectsTable.owner,
      complianceScore: projectsTable.complianceScore,
      createdAt: projectsTable.createdAt,
    })
    .from(projectsTable)
    .where(eq(projectsTable.id, params.projectId));
  if (!row) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const [{ value: requirementCount }] = await db
    .select({ value: count() })
    .from(requirementsTable)
    .where(eq(requirementsTable.projectId, row.id));
  res.json({ ...row, requirementCount });
});

export default router;
