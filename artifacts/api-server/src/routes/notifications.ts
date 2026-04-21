import { Router, type IRouter } from "express";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/notifications", async (req, res) => {
  const recipient = typeof req.query.recipient === "string" ? req.query.recipient : undefined;
  const unreadOnly = req.query.unread === "true";
  const conds = [];
  if (recipient) conds.push(eq(notificationsTable.recipient, recipient));
  if (unreadOnly) conds.push(isNull(notificationsTable.readAt));
  const rows = await db
    .select()
    .from(notificationsTable)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(notificationsTable.createdAt))
    .limit(100);
  res.json({ notifications: rows });
});

router.post("/notifications/:id/read", async (req, res) => {
  const [row] = await db
    .update(notificationsTable)
    .set({ readAt: new Date() })
    .where(eq(notificationsTable.id, req.params.id!))
    .returning();
  if (!row) {
    res.status(404).json({ error: "notification not found" });
    return;
  }
  res.json(row);
});

router.post("/notifications/mark-all-read", async (req, res) => {
  const recipient = typeof req.body?.recipient === "string" ? req.body.recipient : null;
  if (!recipient) {
    res.status(400).json({ error: "recipient required" });
    return;
  }
  await db
    .update(notificationsTable)
    .set({ readAt: new Date() })
    .where(and(eq(notificationsTable.recipient, recipient), isNull(notificationsTable.readAt)));
  res.json({ ok: true });
});

export default router;
