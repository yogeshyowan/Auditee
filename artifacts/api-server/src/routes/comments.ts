import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db, commentsTable } from "@workspace/db";
import { requireProjectAccessInline } from "../lib/projectAccess";

const router: IRouter = Router();

router.get("/comments", async (req, res) => {
  const entityType = typeof req.query.entityType === "string" ? req.query.entityType : undefined;
  const entityId = typeof req.query.entityId === "string" ? req.query.entityId : undefined;
  const projectId = typeof req.query.projectId === "string" ? req.query.projectId : undefined;
  if (!entityType || !entityId) {
    res.status(400).json({ error: "entityType and entityId are required" });
    return;
  }
  // Comments are project-scoped — require an explicit projectId so we can
  // check at least auditor access on the owning project before returning
  // any data. Prevents cross-workspace enumeration via guessed entity ids.
  if (!projectId) {
    res.status(400).json({ error: "projectId is required" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, projectId, "auditor");
  if (access === false) return;
  const rows = await db
    .select()
    .from(commentsTable)
    .where(and(
      eq(commentsTable.entityType, entityType),
      eq(commentsTable.entityId, entityId),
      eq(commentsTable.projectId, projectId),
    ))
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
  // Comments must be scoped to a project so we can authorize them — block
  // unscoped writes outright.
  if (typeof projectId !== "string" || !projectId) {
    res.status(400).json({ error: "projectId is required" });
    return;
  }
  // Reviewers + Developers + Managers can comment; Auditors cannot.
  const access = await requireProjectAccessInline(req, res, projectId, "reviewer");
  if (access === false) return;
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
  const [target] = await db
    .select({ projectId: commentsTable.projectId })
    .from(commentsTable)
    .where(eq(commentsTable.id, req.params.id!))
    .limit(1);
  if (!target) {
    // Idempotent — already gone.
    res.status(204).end();
    return;
  }
  // Legacy comments without a projectId are not deletable through this
  // endpoint — they must be cleaned up by an admin path, not by anonymous
  // callers. Reject explicitly so we don't fall through to an unguarded
  // delete.
  if (!target.projectId) {
    res.status(403).json({ error: "Comment is not project-scoped and cannot be deleted via this endpoint" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, target.projectId, "reviewer");
  if (access === false) return;
  await db.delete(commentsTable).where(eq(commentsTable.id, req.params.id!));
  res.status(204).end();
});

export default router;
