import { Router, type IRouter } from "express";
import { eq, count, sql } from "drizzle-orm";
import { db, projectsTable, requirementsTable, projectSourcesTable } from "@workspace/db";
import { GetProjectParams } from "@workspace/api-zod";
import { z } from "zod";

const router: IRouter = Router();

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

const CreateProjectBody = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  description: z.string().trim().max(2000).optional().default(""),
  owner: z.string().trim().max(120).optional(),
});

router.post("/projects", async (req, res) => {
  let body: z.infer<typeof CreateProjectBody>;
  try {
    body = CreateProjectBody.parse(req.body);
  } catch (err: any) {
    res.status(400).json({ error: err?.issues?.[0]?.message ?? "Invalid project payload" });
    return;
  }

  const baseSlug = slugify(body.name) || "project";
  // Try the natural slug first, then -2, -3, ... up to 50. We prefer
  // *insert + catch unique-violation* over check-then-insert because two
  // concurrent requests with the same name would otherwise both pick the
  // same slug and one would 500. PG error code 23505 = unique_violation.
  const MAX_ATTEMPTS = 50;
  for (let n = 1; n <= MAX_ATTEMPTS; n++) {
    const slug = n === 1 ? baseSlug : `${baseSlug}-${n}`;
    const id = `proj-${slug}`;
    try {
      const [row] = await db
        .insert(projectsTable)
        .values({
          id,
          name: body.name,
          slug,
          description: body.description ?? "",
          owner: body.owner ?? null,
        })
        .returning();
      res.status(201).json({
        ...row,
        requirementCount: 0,
        sourceCount: 0,
        readySourceCount: 0,
      });
      return;
    } catch (err: any) {
      // 23505 = unique_violation (slug or id collision) → try the next suffix.
      if (err?.code === "23505" || err?.cause?.code === "23505") continue;
      res.status(500).json({ error: err?.message ?? "Failed to create project" });
      return;
    }
  }
  res.status(409).json({ error: "Could not allocate unique slug — choose a different name" });
});

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
