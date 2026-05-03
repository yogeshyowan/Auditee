import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { and, eq, count, inArray } from "drizzle-orm";
import {
  db,
  projectsTable,
  requirementsTable,
  projectSourcesTable,
  projectMembersTable,
  PROJECT_ROLES,
  type ProjectRole,
} from "@workspace/db";
import { z } from "zod";
import { requireAuth, requireWorkspace, canonicalRole } from "../lib/authContext";
import { permissionsFor } from "../lib/permissions";
import {
  loadProjectAccess,
  requireProjectAccess,
  type ProjectScopedRequest,
} from "../lib/projectAccess";
import { auditLog } from "../lib/auditLog";

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

router.post("/projects", requireAuth, requireWorkspace, async (req, res) => {
  const ws = (req as ProjectScopedRequest).ws_ctx!;
  const wsRole = canonicalRole(ws.role);
  // Editors and above (i.e. anyone except viewers) may create projects.
  if (!permissionsFor(wsRole).canEditContent) {
    res.status(403).json({ error: "You don't have permission to create projects." });
    return;
  }

  let body: z.infer<typeof CreateProjectBody>;
  try {
    body = CreateProjectBody.parse(req.body);
  } catch (err: any) {
    res.status(400).json({ error: err?.issues?.[0]?.message ?? "Invalid project payload" });
    return;
  }

  const baseSlug = slugify(body.name) || "project";
  const MAX_ATTEMPTS = 50;
  for (let n = 1; n <= MAX_ATTEMPTS; n++) {
    const slug = n === 1 ? baseSlug : `${baseSlug}-${n}`;
    const id = `proj-${slug}`;
    try {
      const [row] = await db
        .insert(projectsTable)
        .values({
          id,
          workspaceId: ws.workspace.id,
          name: body.name,
          slug,
          description: body.description ?? "",
          owner: body.owner ?? null,
        })
        .returning();

      // If the creator is not auto-managed via workspace owner/admin, add them
      // as a project Manager so they can administer the project they created.
      if (wsRole !== "owner" && wsRole !== "admin") {
        await db
          .insert(projectMembersTable)
          .values({
            id: randomUUID(),
            projectId: row.id,
            userId: ws.userId,
            email: ws.email,
            role: "manager",
            addedBy: ws.userId,
          })
          .onConflictDoNothing();
      }

      await auditLog(req, ws.workspace.id, ws.userId, ws.email, {
        action: "project.created",
        resourceType: "project",
        resourceId: row.id,
        metadata: { name: row.name, slug: row.slug },
      });

      res.status(201).json({
        ...row,
        requirementCount: 0,
        sourceCount: 0,
        readySourceCount: 0,
        effectiveRole: "manager" as ProjectRole,
      });
      return;
    } catch (err: any) {
      if (err?.code === "23505" || err?.cause?.code === "23505") continue;
      res.status(500).json({ error: err?.message ?? "Failed to create project" });
      return;
    }
  }
  res.status(409).json({ error: "Could not allocate unique slug — choose a different name" });
});

router.get("/projects", requireAuth, requireWorkspace, async (req, res) => {
  const ws = (req as ProjectScopedRequest).ws_ctx!;
  const wsRole = canonicalRole(ws.role);

  // Workspace owners and admins see every project in the workspace; other
  // workspace members see only the projects they've been added to (via
  // project_members) within this workspace.
  let allowedProjectIds: string[] | null = null;
  if (wsRole !== "owner" && wsRole !== "admin") {
    const memberships = await db
      .select({ projectId: projectMembersTable.projectId, role: projectMembersTable.role })
      .from(projectMembersTable)
      .where(eq(projectMembersTable.userId, ws.userId));
    allowedProjectIds = memberships.map((m) => m.projectId);
  }

  // Fetch workspace-owned projects and demo projects in parallel.
  const wsConds = [
    eq(projectsTable.workspaceId, ws.workspace.id),
    eq(projectsTable.isDemo, false),
  ];
  if (allowedProjectIds) wsConds.push(inArray(projectsTable.id, allowedProjectIds));

  const projectCols = {
    id: projectsTable.id,
    name: projectsTable.name,
    slug: projectsTable.slug,
    description: projectsTable.description,
    owner: projectsTable.owner,
    complianceScore: projectsTable.complianceScore,
    isDemo: projectsTable.isDemo,
    createdAt: projectsTable.createdAt,
  };

  const [wsRows, demoRows] = await Promise.all([
    db.select(projectCols).from(projectsTable).where(and(...wsConds)).orderBy(projectsTable.createdAt),
    db.select(projectCols).from(projectsTable).where(eq(projectsTable.isDemo, true)).orderBy(projectsTable.name),
  ]);

  const rows = [...wsRows, ...demoRows];

  if (rows.length === 0) {
    res.json([]);
    return;
  }

  const ids = rows.map((r) => r.id);
  const [reqCounts, allSrcCounts, readySrcCounts, memberRoles] = await Promise.all([
    db
      .select({ projectId: requirementsTable.projectId, n: count() })
      .from(requirementsTable)
      .where(inArray(requirementsTable.projectId, ids))
      .groupBy(requirementsTable.projectId),
    db
      .select({ projectId: projectSourcesTable.projectId, n: count() })
      .from(projectSourcesTable)
      .where(inArray(projectSourcesTable.projectId, ids))
      .groupBy(projectSourcesTable.projectId),
    db
      .select({ projectId: projectSourcesTable.projectId, n: count() })
      .from(projectSourcesTable)
      .where(and(inArray(projectSourcesTable.projectId, ids), eq(projectSourcesTable.status, "ready")))
      .groupBy(projectSourcesTable.projectId),
    wsRole === "owner" || wsRole === "admin"
      ? Promise.resolve([] as { projectId: string; role: string }[])
      : db
          .select({ projectId: projectMembersTable.projectId, role: projectMembersTable.role })
          .from(projectMembersTable)
          .where(and(eq(projectMembersTable.userId, ws.userId), inArray(projectMembersTable.projectId, ids))),
  ]);

  const reqMap = new Map(reqCounts.map((r) => [r.projectId, Number(r.n)]));
  const srcMap = new Map(allSrcCounts.map((r) => [r.projectId, Number(r.n)]));
  const readyMap = new Map(readySrcCounts.map((r) => [r.projectId, Number(r.n)]));
  const roleMap = new Map(memberRoles.map((m) => [m.projectId, m.role as ProjectRole]));

  res.json(
    rows.map((r) => ({
      ...r,
      requirementCount: reqMap.get(r.id) ?? 0,
      sourceCount: srcMap.get(r.id) ?? 0,
      readySourceCount: readyMap.get(r.id) ?? 0,
      effectiveRole: r.isDemo
        ? ("auditor" as ProjectRole)
        : wsRole === "owner" || wsRole === "admin"
          ? ("manager" as ProjectRole)
          : roleMap.get(r.id) ?? null,
    })),
  );
});

router.get(
  "/projects/:projectId",
  requireAuth,
  requireWorkspace,
  requireProjectAccess("auditor"),
  async (req, res) => {
    const ctx = (req as ProjectScopedRequest).project_ctx!;
    const [{ value: requirementCount }] = await db
      .select({ value: count() })
      .from(requirementsTable)
      .where(eq(requirementsTable.projectId, ctx.project.id));
    res.json({
      id: ctx.project.id,
      name: ctx.project.name,
      slug: ctx.project.slug,
      description: ctx.project.description,
      owner: ctx.project.owner,
      complianceScore: ctx.project.complianceScore,
      createdAt: ctx.project.createdAt,
      requirementCount,
      effectiveRole: ctx.effectiveRole,
      fromWorkspace: ctx.fromWorkspace,
    });
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Project members CRUD
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  "/projects/:projectId/members",
  requireAuth,
  requireWorkspace,
  requireProjectAccess("auditor"),
  async (req, res) => {
    const ctx = (req as ProjectScopedRequest).project_ctx!;
    const rows = await db
      .select()
      .from(projectMembersTable)
      .where(eq(projectMembersTable.projectId, ctx.project.id))
      .orderBy(projectMembersTable.createdAt);
    res.json({ members: rows, effectiveRole: ctx.effectiveRole });
  },
);

const AddMemberBody = z.object({
  userId: z.string().trim().min(1).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  role: z.enum(PROJECT_ROLES),
});

router.post(
  "/projects/:projectId/members",
  requireAuth,
  requireWorkspace,
  requireProjectAccess("manager"),
  async (req, res) => {
    const ctx = (req as ProjectScopedRequest).project_ctx!;
    const ws = (req as ProjectScopedRequest).ws_ctx!;
    const parsed = AddMemberBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" });
      return;
    }
    const { userId, email, role } = parsed.data;
    if (!userId && !email) {
      res.status(400).json({ error: "userId or email is required." });
      return;
    }

    const memberUserId = userId ?? `pending:${email!.toLowerCase()}`;

    try {
      const [row] = await db
        .insert(projectMembersTable)
        .values({
          id: randomUUID(),
          projectId: ctx.project.id,
          userId: memberUserId,
          email: email ?? null,
          role,
          addedBy: ws.userId,
        })
        .returning();

      await auditLog(req, ws.workspace.id, ws.userId, ws.email, {
        action: "project.member.added",
        resourceType: "project_member",
        resourceId: row.id,
        metadata: { projectId: ctx.project.id, role, addedUserId: memberUserId, email },
      });

      res.status(201).json({ member: row });
    } catch (err: any) {
      if (err?.code === "23505" || err?.cause?.code === "23505") {
        res.status(409).json({ error: "This user is already a member of the project." });
        return;
      }
      res.status(500).json({ error: err?.message ?? "Failed to add member" });
    }
  },
);

const PatchMemberBody = z.object({ role: z.enum(PROJECT_ROLES) });

router.patch(
  "/projects/:projectId/members/:memberId",
  requireAuth,
  requireWorkspace,
  requireProjectAccess("manager"),
  async (req, res) => {
    const ctx = (req as ProjectScopedRequest).project_ctx!;
    const ws = (req as ProjectScopedRequest).ws_ctx!;
    const parsed = PatchMemberBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" });
      return;
    }

    const memberId = String(req.params.memberId);
    const [updated] = await db
      .update(projectMembersTable)
      .set({ role: parsed.data.role })
      .where(
        and(
          eq(projectMembersTable.id, memberId),
          eq(projectMembersTable.projectId, ctx.project.id),
        ),
      )
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Project member not found." });
      return;
    }
    await auditLog(req, ws.workspace.id, ws.userId, ws.email, {
      action: "project.member.role_changed",
      resourceType: "project_member",
      resourceId: updated.id,
      metadata: { projectId: ctx.project.id, role: parsed.data.role, targetUserId: updated.userId },
    });
    res.json({ member: updated });
  },
);

router.delete(
  "/projects/:projectId/members/:memberId",
  requireAuth,
  requireWorkspace,
  requireProjectAccess("manager"),
  async (req, res) => {
    const ctx = (req as ProjectScopedRequest).project_ctx!;
    const ws = (req as ProjectScopedRequest).ws_ctx!;
    const memberId = String(req.params.memberId);
    const [deleted] = await db
      .delete(projectMembersTable)
      .where(
        and(
          eq(projectMembersTable.id, memberId),
          eq(projectMembersTable.projectId, ctx.project.id),
        ),
      )
      .returning();
    if (!deleted) {
      res.status(404).json({ error: "Project member not found." });
      return;
    }
    await auditLog(req, ws.workspace.id, ws.userId, ws.email, {
      action: "project.member.removed",
      resourceType: "project_member",
      resourceId: deleted.id,
      metadata: { projectId: ctx.project.id, targetUserId: deleted.userId },
    });
    res.json({ ok: true });
  },
);

export default router;

// Re-export so other route modules can call `loadProjectAccess` if needed.
export { loadProjectAccess };
