import { Router, type IRouter } from "express";
import { and, desc, eq, count } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db, capaActionsTable, projectsTable, activityEventsTable } from "@workspace/db";

const router: IRouter = Router();

async function nextCapaCode(projectId: string): Promise<string> {
  const [proj] = await db.select({ slug: projectsTable.slug }).from(projectsTable).where(eq(projectsTable.id, projectId));
  const prefix = (proj?.slug ?? "PRJ").toUpperCase().slice(0, 4);
  const [{ value }] = await db.select({ value: count() }).from(capaActionsTable).where(eq(capaActionsTable.projectId, projectId));
  return `CAPA-${prefix}-${String(Number(value) + 1).padStart(4, "0")}`;
}

router.get("/capa", async (req, res) => {
  const projectId = typeof req.query.projectId === "string" ? req.query.projectId : undefined;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const conds = [];
  if (projectId) conds.push(eq(capaActionsTable.projectId, projectId));
  if (status) conds.push(eq(capaActionsTable.status, status));
  const rows = await db
    .select()
    .from(capaActionsTable)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(capaActionsTable.updatedAt));
  res.json({ actions: rows });
});

router.post("/capa", async (req, res) => {
  const b = req.body ?? {};
  if (typeof b.projectId !== "string" || typeof b.title !== "string" || b.title.trim().length === 0) {
    res.status(400).json({ error: "projectId and title are required" });
    return;
  }
  const code = await nextCapaCode(b.projectId);
  const [row] = await db
    .insert(capaActionsTable)
    .values({
      id: randomUUID(),
      code,
      projectId: b.projectId,
      frameworkId: typeof b.frameworkId === "string" ? b.frameworkId : null,
      controlId: typeof b.controlId === "string" ? b.controlId : null,
      controlCode: typeof b.controlCode === "string" ? b.controlCode : null,
      title: b.title.trim().slice(0, 240),
      description: typeof b.description === "string" ? b.description : "",
      severity: ["low", "medium", "high", "critical"].includes(b.severity) ? b.severity : "medium",
      status: ["open", "in_progress", "blocked", "done", "cancelled"].includes(b.status) ? b.status : "open",
      owner: typeof b.owner === "string" && b.owner.length > 0 ? b.owner : "Unassigned",
      source: typeof b.source === "string" ? b.source : "manual",
      tags: Array.isArray(b.tags) ? b.tags.filter((t: unknown) => typeof t === "string") : [],
      dueAt: b.dueAt ? new Date(b.dueAt) : null,
    })
    .returning();
  await db.insert(activityEventsTable).values({
    id: randomUUID(),
    kind: "capa",
    message: `CAPA opened: ${row.title}`,
    actor: row.owner,
    entityCode: row.code,
  });
  res.status(201).json(row);
});

router.patch("/capa/:id", async (req, res) => {
  const b = req.body ?? {};
  const updates: Partial<typeof capaActionsTable.$inferInsert> = { updatedAt: new Date() };
  for (const k of ["title", "description", "owner", "severity"]) {
    if (typeof b[k] === "string") (updates as any)[k] = b[k];
  }
  if (typeof b.status === "string" && ["open", "in_progress", "blocked", "done", "cancelled"].includes(b.status)) {
    updates.status = b.status;
    if (b.status === "done" || b.status === "cancelled") updates.closedAt = new Date();
  }
  if (b.dueAt !== undefined) updates.dueAt = b.dueAt ? new Date(b.dueAt) : null;
  if (Array.isArray(b.tags)) updates.tags = b.tags.filter((t: unknown) => typeof t === "string");
  const [row] = await db.update(capaActionsTable).set(updates).where(eq(capaActionsTable.id, req.params.id!)).returning();
  if (!row) {
    res.status(404).json({ error: "CAPA not found" });
    return;
  }
  await db.insert(activityEventsTable).values({
    id: randomUUID(),
    kind: "capa",
    message: `CAPA updated: ${row.title} → ${row.status}`,
    actor: row.owner,
    entityCode: row.code,
  });
  res.json(row);
});

router.delete("/capa/:id", async (req, res) => {
  await db.delete(capaActionsTable).where(eq(capaActionsTable.id, req.params.id!));
  res.status(204).end();
});

export default router;
