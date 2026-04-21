import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db, commentsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/comments", async (req, res) => {
  const entityType = typeof req.query.entityType === "string" ? req.query.entityType : undefined;
  const entityId = typeof req.query.entityId === "string" ? req.query.entityId : undefined;
  if (!entityType || !entityId) {
    res.status(400).json({ error: "entityType and entityId are required" });
    return;
  }
  const rows = await db
    .select()
    .from(commentsTable)
    .where(and(eq(commentsTable.entityType, entityType), eq(commentsTable.entityId, entityId)))
    .orderBy(desc(commentsTable.createdAt));
  res.json({ comments: rows });
});

router.post("/comments", async (req, res) => {
  const { entityType, entityId, projectId, author, body } = req.body ?? {};
  if (typeof entityType !== "string" || typeof entityId !== "string" || typeof body !== "string" || body.trim().length === 0) {
    res.status(400).json({ error: "entityType, entityId, and body are required" });
    return;
  }
  if (body.length > 4000) {
    res.status(400).json({ error: "comment body must be <= 4000 chars" });
    return;
  }
  const mentions = Array.from(new Set((body.match(/@[\w.-]+/g) ?? []).map((m: string) => m.slice(1)))).slice(0, 20);
  const [row] = await db
    .insert(commentsTable)
    .values({
      id: randomUUID(),
      entityType,
      entityId,
      projectId: typeof projectId === "string" ? projectId : null,
      author: typeof author === "string" && author.length > 0 ? author : "You",
      body: body.trim(),
      mentions,
    })
    .returning();
  res.status(201).json(row);
});

router.delete("/comments/:id", async (req, res) => {
  await db.delete(commentsTable).where(eq(commentsTable.id, req.params.id!));
  res.status(204).end();
});

export default router;
