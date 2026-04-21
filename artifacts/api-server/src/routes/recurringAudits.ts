import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db, recurringAuditsTable } from "@workspace/db";

const router: IRouter = Router();

const CADENCES = ["daily", "weekly", "monthly", "quarterly"];

export function nextOccurrence(cadence: string, hourUtc: number, from: Date = new Date()): Date {
  const d = new Date(from);
  d.setUTCMinutes(0, 0, 0);
  d.setUTCHours(hourUtc);
  // Walk forward until d > from, by cadence increment.
  if (d <= from) {
    if (cadence === "daily") d.setUTCDate(d.getUTCDate() + 1);
    else if (cadence === "weekly") d.setUTCDate(d.getUTCDate() + 7);
    else if (cadence === "monthly") d.setUTCMonth(d.getUTCMonth() + 1);
    else if (cadence === "quarterly") d.setUTCMonth(d.getUTCMonth() + 3);
    else d.setUTCDate(d.getUTCDate() + 7);
  }
  return d;
}

router.get("/recurring-audits", async (req, res) => {
  const projectId = typeof req.query.projectId === "string" ? req.query.projectId : undefined;
  const conds = [];
  if (projectId) conds.push(eq(recurringAuditsTable.projectId, projectId));
  const rows = await db
    .select()
    .from(recurringAuditsTable)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(recurringAuditsTable.updatedAt));
  res.json({ schedules: rows });
});

router.post("/recurring-audits", async (req, res) => {
  const b = req.body ?? {};
  if (typeof b.projectId !== "string" || typeof b.frameworkId !== "string") {
    res.status(400).json({ error: "projectId and frameworkId are required" });
    return;
  }
  const cadence = CADENCES.includes(b.cadence) ? b.cadence : "weekly";
  const hourUtc = Number.isFinite(b.hourUtc) ? Math.max(0, Math.min(23, Math.floor(b.hourUtc))) : 13;
  const [row] = await db
    .insert(recurringAuditsTable)
    .values({
      id: randomUUID(),
      projectId: b.projectId,
      frameworkId: b.frameworkId,
      cadence,
      hourUtc,
      notifyTo: typeof b.notifyTo === "string" ? b.notifyTo : "",
      active: b.active !== false,
      nextRunAt: nextOccurrence(cadence, hourUtc),
    })
    .returning();
  res.status(201).json(row);
});

router.patch("/recurring-audits/:id", async (req, res) => {
  const b = req.body ?? {};
  const updates: Partial<typeof recurringAuditsTable.$inferInsert> = { updatedAt: new Date() };
  if (typeof b.cadence === "string" && CADENCES.includes(b.cadence)) updates.cadence = b.cadence;
  if (Number.isFinite(b.hourUtc)) updates.hourUtc = Math.max(0, Math.min(23, Math.floor(b.hourUtc)));
  if (typeof b.notifyTo === "string") updates.notifyTo = b.notifyTo;
  if (typeof b.active === "boolean") updates.active = b.active;
  if (b.nextRunAt) updates.nextRunAt = new Date(b.nextRunAt);
  const [row] = await db
    .update(recurringAuditsTable)
    .set(updates)
    .where(eq(recurringAuditsTable.id, req.params.id!))
    .returning();
  if (!row) {
    res.status(404).json({ error: "schedule not found" });
    return;
  }
  res.json(row);
});

router.delete("/recurring-audits/:id", async (req, res) => {
  await db.delete(recurringAuditsTable).where(eq(recurringAuditsTable.id, req.params.id!));
  res.status(204).end();
});

export default router;
