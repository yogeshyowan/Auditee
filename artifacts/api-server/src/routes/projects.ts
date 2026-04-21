import { Router, type IRouter } from "express";
import { eq, count, sql } from "drizzle-orm";
import { db, projectsTable, requirementsTable } from "@workspace/db";
import { GetProjectParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/projects", async (_req, res) => {
  const rows = await db
    .select({
      id: projectsTable.id,
      name: projectsTable.name,
      slug: projectsTable.slug,
      description: projectsTable.description,
      owner: projectsTable.owner,
      complianceScore: projectsTable.complianceScore,
      createdAt: projectsTable.createdAt,
      requirementCount: sql<number>`(
        SELECT COUNT(*)::int FROM ${requirementsTable} WHERE ${requirementsTable.projectId} = ${projectsTable.id}
      )`,
    })
    .from(projectsTable)
    .orderBy(projectsTable.createdAt);
  res.json(rows);
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
