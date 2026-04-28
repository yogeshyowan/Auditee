import { Router, type IRouter } from "express";
import { and, desc, eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  db,
  testCasesTable,
  requirementsTable,
  projectsTable,
} from "@workspace/db";
import { requireProjectAccessInline } from "../lib/projectAccess";
import { logActivity } from "../lib/activityLog";

const router: IRouter = Router();

const VALID_TYPES = new Set(["functional", "negative", "non_functional", "acceptance"]);
const VALID_STATUS = new Set(["draft", "passing", "failing", "blocked"]);
const VALID_PRIORITY = new Set(["low", "medium", "high", "critical"]);

function clampString(s: unknown, max: number, fallback = ""): string {
  if (typeof s !== "string") return fallback;
  return s.slice(0, max);
}

// =============================================================
// GET /api/test-cases?projectId=&requirementId=
// =============================================================
router.get("/test-cases", async (req, res) => {
  const projectId = String(req.query.projectId ?? "");
  if (!projectId) {
    res.status(400).json({ error: "projectId required" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, projectId, "viewer");
  if (!access) return;
  const requirementId = typeof req.query.requirementId === "string" ? req.query.requirementId : null;
  const rows = await db
    .select()
    .from(testCasesTable)
    .where(
      requirementId
        ? and(eq(testCasesTable.projectId, projectId), eq(testCasesTable.requirementId, requirementId))
        : eq(testCasesTable.projectId, projectId),
    )
    .orderBy(desc(testCasesTable.updatedAt));
  res.json({ testCases: rows });
});

// =============================================================
// POST /api/test-cases
// =============================================================
router.post("/test-cases", async (req, res) => {
  const projectId = String(req.body?.projectId ?? "");
  if (!projectId) {
    res.status(400).json({ error: "projectId required" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, projectId, "developer");
  if (access === false) return;
  const title = clampString(req.body?.title, 240).trim();
  if (title.length < 3) {
    res.status(400).json({ error: "title must be 3-240 chars" });
    return;
  }
  const type = VALID_TYPES.has(req.body?.type) ? req.body.type : "functional";
  const status = VALID_STATUS.has(req.body?.status) ? req.body.status : "draft";
  const priority = VALID_PRIORITY.has(req.body?.priority) ? req.body.priority : "medium";
  const steps = Array.isArray(req.body?.steps)
    ? (req.body.steps as unknown[])
        .filter((s): s is string => typeof s === "string")
        .map((s) => s.slice(0, 600))
        .slice(0, 50)
    : [];
  const expected = clampString(req.body?.expected, 2000);
  const requirementId = typeof req.body?.requirementId === "string" ? req.body.requirementId : null;
  const tags = Array.isArray(req.body?.tags)
    ? (req.body.tags as unknown[]).filter((s): s is string => typeof s === "string").slice(0, 16)
    : [];

  const [row] = await db
    .insert(testCasesTable)
    .values({
      id: randomUUID(),
      projectId,
      requirementId,
      title,
      type,
      status,
      priority,
      steps,
      expected,
      tags,
      createdBy: "User",
    })
    .returning();
  res.status(201).json({ testCase: row });
});

// =============================================================
// PATCH /api/test-cases/:id
// =============================================================
router.patch("/test-cases/:id", async (req, res) => {
  const id = String(req.params.id ?? "");
  const [existing] = await db.select().from(testCasesTable).where(eq(testCasesTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Test case not found" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, existing.projectId, "developer");
  if (access === false) return;

  const patch: Partial<typeof testCasesTable.$inferInsert> = { updatedAt: new Date() };
  if (typeof req.body?.title === "string") patch.title = clampString(req.body.title, 240);
  if (typeof req.body?.type === "string" && VALID_TYPES.has(req.body.type)) patch.type = req.body.type;
  if (typeof req.body?.status === "string" && VALID_STATUS.has(req.body.status)) patch.status = req.body.status;
  if (typeof req.body?.priority === "string" && VALID_PRIORITY.has(req.body.priority)) patch.priority = req.body.priority;
  if (Array.isArray(req.body?.steps)) {
    patch.steps = (req.body.steps as unknown[])
      .filter((s): s is string => typeof s === "string")
      .map((s) => s.slice(0, 600))
      .slice(0, 50);
  }
  if (typeof req.body?.expected === "string") patch.expected = clampString(req.body.expected, 2000);
  if (Array.isArray(req.body?.tags)) {
    patch.tags = (req.body.tags as unknown[]).filter((s): s is string => typeof s === "string").slice(0, 16);
  }

  const [row] = await db.update(testCasesTable).set(patch).where(eq(testCasesTable.id, id)).returning();
  res.json({ testCase: row });
});

// =============================================================
// DELETE /api/test-cases/:id
// =============================================================
router.delete("/test-cases/:id", async (req, res) => {
  const id = String(req.params.id ?? "");
  const [existing] = await db.select().from(testCasesTable).where(eq(testCasesTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Test case not found" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, existing.projectId, "developer");
  if (access === false) return;
  await db.delete(testCasesTable).where(eq(testCasesTable.id, id));
  res.status(204).send();
});

// =============================================================
// POST /api/test-cases/:id/run  body: { status, note? }
// =============================================================
router.post("/test-cases/:id/run", async (req, res) => {
  const id = String(req.params.id ?? "");
  const [existing] = await db.select().from(testCasesTable).where(eq(testCasesTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Test case not found" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, existing.projectId, "developer");
  if (access === false) return;
  const status = String(req.body?.status ?? "");
  if (!VALID_STATUS.has(status) || status === "draft") {
    res.status(400).json({ error: "status must be passing|failing|blocked" });
    return;
  }
  const note = clampString(req.body?.note, 1000);
  const [row] = await db
    .update(testCasesTable)
    .set({ status, lastRunAt: new Date(), lastRunNote: note, updatedAt: new Date() })
    .where(eq(testCasesTable.id, id))
    .returning();
  await logActivity("test_case", `${row.title.slice(0, 80)} → ${status}`, "User");
  res.json({ testCase: row });
});

// =============================================================
// POST /api/test-cases/bulk-by-requirement
// Convenience for the per-requirement table view.
// =============================================================
router.post("/test-cases/bulk-by-requirement", async (req, res) => {
  const requirementIds = Array.isArray(req.body?.requirementIds)
    ? (req.body.requirementIds as unknown[]).filter((s): s is string => typeof s === "string").slice(0, 200)
    : [];
  const projectId = String(req.body?.projectId ?? "");
  if (!projectId || requirementIds.length === 0) {
    res.json({ counts: {} });
    return;
  }
  const access = await requireProjectAccessInline(req, res, projectId, "viewer");
  if (!access) return;
  const rows = await db
    .select({ requirementId: testCasesTable.requirementId, status: testCasesTable.status })
    .from(testCasesTable)
    .where(
      and(
        eq(testCasesTable.projectId, projectId),
        inArray(testCasesTable.requirementId, requirementIds),
      ),
    );
  const counts: Record<string, { total: number; passing: number; failing: number; blocked: number; draft: number }> = {};
  for (const r of rows) {
    if (!r.requirementId) continue;
    const c = counts[r.requirementId] ?? { total: 0, passing: 0, failing: 0, blocked: 0, draft: 0 };
    c.total++;
    if (r.status === "passing") c.passing++;
    else if (r.status === "failing") c.failing++;
    else if (r.status === "blocked") c.blocked++;
    else c.draft++;
    counts[r.requirementId] = c;
  }
  res.json({ counts });
});

// projectsTable is referenced indirectly to satisfy lint when linked endpoints
// expand in future iterations.
void projectsTable;
void requirementsTable;

export default router;
