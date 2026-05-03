import { Router, type IRouter } from "express";
import { and, eq, ilike, or, inArray, desc, count, isNull } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  db,
  requirementsTable,
  traceabilityLinksTable,
  codeArtifactsTable,
  activityEventsTable,
  projectsTable,
} from "@workspace/db";
import {
  ListRequirementsQueryParams,
  CreateRequirementBody,
  GetRequirementParams,
  UpdateRequirementParams,
  UpdateRequirementBody,
  DeleteRequirementParams,
} from "@workspace/api-zod";
import { requireProjectAccessInline } from "../lib/projectAccess";
import { auditLog } from "../lib/auditLog";
import type { AuthedRequest } from "../lib/authContext";

const router: IRouter = Router();

async function projectPrefix(projectId: string): Promise<string> {
  const [row] = await db
    .select({ slug: projectsTable.slug })
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId));
  return (row?.slug ?? "REQ").toUpperCase().slice(0, 4);
}

async function withCounts(rows: typeof requirementsTable.$inferSelect[]) {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const counts = await db
    .select({
      requirementId: traceabilityLinksTable.requirementId,
      cnt: count(),
    })
    .from(traceabilityLinksTable)
    .where(inArray(traceabilityLinksTable.requirementId, ids))
    .groupBy(traceabilityLinksTable.requirementId);
  const map = new Map(counts.map((c) => [c.requirementId, Number(c.cnt)]));
  return rows.map((r) => ({ ...r, linkedCodeCount: map.get(r.id) ?? 0 }));
}

router.get("/requirements", async (req, res) => {
  const params = ListRequirementsQueryParams.parse(req.query);
  if (!params.projectId) {
    res.status(400).json({ error: "projectId is required" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, params.projectId, "auditor");
  if (access === false) return;
  const sourceId = typeof req.query.sourceId === "string" ? req.query.sourceId : undefined;
  const externalSystem = typeof req.query.externalSystem === "string" ? req.query.externalSystem : undefined;
  const origin = typeof req.query.origin === "string" ? req.query.origin : undefined;
  const conds = [];
  if (params.projectId) conds.push(eq(requirementsTable.projectId, params.projectId));
  if (params.type) conds.push(eq(requirementsTable.type, params.type));
  if (params.status) conds.push(eq(requirementsTable.status, params.status));
  if (params.search) {
    const s = `%${params.search}%`;
    conds.push(or(ilike(requirementsTable.title, s), ilike(requirementsTable.code, s))!);
  }
  if (sourceId) conds.push(eq(requirementsTable.sourceId, sourceId));
  if (externalSystem) conds.push(eq(requirementsTable.externalSystem, externalSystem));
  if (origin === "manual") {
    conds.push(isNull(requirementsTable.sourceId));
  }
  const where = conds.length ? and(...conds) : undefined;
  const rows = await db
    .select()
    .from(requirementsTable)
    .where(where)
    .orderBy(desc(requirementsTable.updatedAt));
  res.json(await withCounts(rows));
});

router.get("/requirements/:requirementId", async (req, res) => {
  const params = GetRequirementParams.parse(req.params);
  const [row] = await db
    .select()
    .from(requirementsTable)
    .where(eq(requirementsTable.id, params.requirementId));
  if (!row) {
    res.status(404).json({ error: "Requirement not found" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, row.projectId, "auditor");
  if (access === false) return;
  const linkedCodeRows = await db
    .select({
      id: codeArtifactsTable.id,
      projectId: codeArtifactsTable.projectId,
      filePath: codeArtifactsTable.filePath,
      language: codeArtifactsTable.language,
      symbol: codeArtifactsTable.symbol,
      kind: codeArtifactsTable.kind,
      repoUrl: codeArtifactsTable.repoUrl,
    })
    .from(traceabilityLinksTable)
    .innerJoin(codeArtifactsTable, eq(codeArtifactsTable.id, traceabilityLinksTable.codeArtifactId))
    .where(eq(traceabilityLinksTable.requirementId, row.id));

  const [{ value: linkedCodeCount }] = await db
    .select({ value: count() })
    .from(traceabilityLinksTable)
    .where(eq(traceabilityLinksTable.requirementId, row.id));

  res.json({
    ...row,
    linkedCodeCount,
    linkedCode: linkedCodeRows.map((c) => ({ ...c, linkedRequirementCount: 0 })),
    children: [],
  });
});

router.post("/requirements", async (req, res) => {
  const body = CreateRequirementBody.parse(req.body);
  const access = await requireProjectAccessInline(req, res, body.projectId, "developer");
  if (access === false) return;

  const ws = (req as AuthedRequest).ws_ctx!;
  const id = randomUUID();
  const prefix = await projectPrefix(body.projectId);
  const [{ value: existingCount }] = await db
    .select({ value: count() })
    .from(requirementsTable)
    .where(eq(requirementsTable.projectId, body.projectId));
  const code = `${prefix}-${String(Number(existingCount) + 1).padStart(4, "0")}`;
  const now = new Date();
  const [row] = await db
    .insert(requirementsTable)
    .values({
      id,
      projectId: body.projectId,
      code,
      title: body.title,
      description: body.description ?? "",
      type: body.type,
      status: body.status ?? "draft",
      priority: body.priority ?? "medium",
      owner: body.owner ?? "Unassigned",
      tags: body.tags ?? [],
      linkedFrameworks: [],
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  await Promise.all([
    db.insert(activityEventsTable).values({
      id: randomUUID(),
      kind: "requirement",
      message: `New requirement created: ${row.title}`,
      actor: row.owner,
      entityCode: row.code,
      createdAt: now,
    }),
    auditLog(req, ws.workspace.id, ws.userId, ws.email, {
      action: "requirement.created",
      resourceType: "requirement",
      resourceId: row.id,
      metadata: {
        code: row.code,
        title: row.title,
        type: row.type,
        status: row.status,
        priority: row.priority,
        projectId: row.projectId,
      },
    }),
  ]);

  res.status(201).json({ ...row, linkedCodeCount: 0 });
});

router.patch("/requirements/:requirementId", async (req, res) => {
  const params = UpdateRequirementParams.parse(req.params);
  const body = UpdateRequirementBody.parse(req.body);
  const [target] = await db
    .select({ projectId: requirementsTable.projectId, title: requirementsTable.title, code: requirementsTable.code })
    .from(requirementsTable)
    .where(eq(requirementsTable.id, params.requirementId))
    .limit(1);
  if (!target) {
    res.status(404).json({ error: "Requirement not found" });
    return;
  }
  const access = await requireProjectAccessInline(req, res, target.projectId, "developer");
  if (access === false) return;

  const ws = (req as AuthedRequest).ws_ctx!;
  const updates: Partial<typeof requirementsTable.$inferInsert> = { updatedAt: new Date() };
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.status !== undefined) updates.status = body.status;
  if (body.priority !== undefined) updates.priority = body.priority;
  if (body.owner !== undefined) updates.owner = body.owner;
  if (body.tags !== undefined) updates.tags = body.tags;
  const [row] = await db
    .update(requirementsTable)
    .set(updates)
    .where(eq(requirementsTable.id, params.requirementId))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Requirement not found" });
    return;
  }
  await Promise.all([
    db.insert(activityEventsTable).values({
      id: randomUUID(),
      kind: "requirement",
      message: `Updated requirement: ${row.title}`,
      actor: row.owner,
      entityCode: row.code,
    }),
    auditLog(req, ws.workspace.id, ws.userId, ws.email, {
      action: "requirement.updated",
      resourceType: "requirement",
      resourceId: row.id,
      metadata: {
        code: row.code,
        title: row.title,
        changes: Object.keys(updates).filter((k) => k !== "updatedAt"),
        projectId: row.projectId,
      },
    }),
  ]);

  const [{ value: linkedCodeCount }] = await db
    .select({ value: count() })
    .from(traceabilityLinksTable)
    .where(eq(traceabilityLinksTable.requirementId, row.id));
  res.json({ ...row, linkedCodeCount });
});

router.delete("/requirements/:requirementId", async (req, res) => {
  const params = DeleteRequirementParams.parse(req.params);
  const [target] = await db
    .select({ projectId: requirementsTable.projectId, title: requirementsTable.title, code: requirementsTable.code })
    .from(requirementsTable)
    .where(eq(requirementsTable.id, params.requirementId))
    .limit(1);
  if (!target) {
    // Already gone — treat as success for idempotency.
    res.status(204).end();
    return;
  }
  const access = await requireProjectAccessInline(req, res, target.projectId, "developer");
  if (access === false) return;

  const ws = (req as AuthedRequest).ws_ctx!;
  await db
    .delete(traceabilityLinksTable)
    .where(eq(traceabilityLinksTable.requirementId, params.requirementId));
  await db.delete(requirementsTable).where(eq(requirementsTable.id, params.requirementId));

  // Fire-and-forget audit entry after the delete so the row ID is still
  // captured even though the requirement record is gone.
  void auditLog(req, ws.workspace.id, ws.userId, ws.email, {
    action: "requirement.deleted",
    resourceType: "requirement",
    resourceId: params.requirementId,
    metadata: {
      code: target.code,
      title: target.title,
      projectId: target.projectId,
    },
  });

  res.status(204).end();
});

export default router;
