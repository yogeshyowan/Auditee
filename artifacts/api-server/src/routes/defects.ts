import { Router, type IRouter } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, defectsTable, projectSourcesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/defects", async (req, res) => {
  const projectId = typeof req.query.projectId === "string" ? req.query.projectId : undefined;
  if (!projectId) {
    res.status(400).json({ error: "projectId query parameter is required" });
    return;
  }
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const severity = typeof req.query.severity === "string" ? req.query.severity : undefined;
  const sourceId = typeof req.query.sourceId === "string" ? req.query.sourceId : undefined;
  const externalSystem = typeof req.query.externalSystem === "string" ? req.query.externalSystem : undefined;

  const conds = [eq(defectsTable.projectId, projectId)];
  if (status) conds.push(eq(defectsTable.status, status));
  if (severity) conds.push(eq(defectsTable.severity, severity));
  if (sourceId) conds.push(eq(defectsTable.sourceId, sourceId));
  if (externalSystem) conds.push(eq(defectsTable.externalSystem, externalSystem));

  const rows = await db
    .select({
      id: defectsTable.id,
      projectId: defectsTable.projectId,
      sourceId: defectsTable.sourceId,
      externalId: defectsTable.externalId,
      externalUrl: defectsTable.externalUrl,
      externalSystem: defectsTable.externalSystem,
      key: defectsTable.key,
      title: defectsTable.title,
      description: defectsTable.description,
      status: defectsTable.status,
      severity: defectsTable.severity,
      priority: defectsTable.priority,
      component: defectsTable.component,
      raisedAt: defectsTable.raisedAt,
      resolvedAt: defectsTable.resolvedAt,
      createdAt: defectsTable.createdAt,
      updatedAt: defectsTable.updatedAt,
      sourceName: projectSourcesTable.label,
    })
    .from(defectsTable)
    .leftJoin(projectSourcesTable, eq(projectSourcesTable.id, defectsTable.sourceId))
    .where(conds.length === 1 ? conds[0] : and(...conds))
    .orderBy(desc(defectsTable.raisedAt));

  res.json({ defects: rows });
});

router.get("/defects/summary", async (req, res) => {
  const projectId = typeof req.query.projectId === "string" ? req.query.projectId : undefined;
  if (!projectId) {
    res.status(400).json({ error: "projectId query parameter is required" });
    return;
  }
  const all = await db.select().from(defectsTable).where(eq(defectsTable.projectId, projectId));
  const total = all.length;
  const open = all.filter((d) => d.status !== "closed" && d.status !== "resolved" && d.status !== "done").length;
  const critical = all.filter((d) => d.severity === "critical" || d.severity === "blocker").length;
  const bySeverity: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const bySystem: Record<string, number> = {};
  for (const d of all) {
    bySeverity[d.severity] = (bySeverity[d.severity] ?? 0) + 1;
    byStatus[d.status] = (byStatus[d.status] ?? 0) + 1;
    bySystem[d.externalSystem] = (bySystem[d.externalSystem] ?? 0) + 1;
  }
  res.json({ total, open, critical, bySeverity, byStatus, bySystem });
});

export default router;
