import type { Request, Response, NextFunction } from "express";
import { and, eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import {
  db,
  projectsTable,
  projectMembersTable,
  type Project,
  type ProjectRole,
} from "@workspace/db";
import {
  canonicalRole,
  getOrCreateWorkspace,
  type AuthedRequest,
  type WorkspaceCtx,
} from "./authContext";
import { permissionsFor } from "./permissions";
import { PROJECT_ROLES, projectPermissionsFor, projectRoleAtLeast } from "./projectPermissions";

export interface ProjectAccess {
  project: Project;
  effectiveRole: ProjectRole;
  /** True iff effective role came from workspace owner/admin auto-promotion. */
  fromWorkspace: boolean;
}

export type ProjectScopedRequest = AuthedRequest & { project_ctx?: ProjectAccess };

function isProjectRole(value: unknown): value is ProjectRole {
  return typeof value === "string" && (PROJECT_ROLES as readonly string[]).includes(value);
}

/**
 * Compute the user's effective project role:
 *
 * 1. Workspace owner or admin → manager (auto-membership).
 * 2. Otherwise look up the project_members row by (projectId, userId).
 * 3. Otherwise no access.
 *
 * Also enforces workspace isolation — a project owned by another workspace
 * is treated as not-found (404), never as 403, to avoid leaking project IDs.
 */
export async function loadProjectAccess(
  ws: WorkspaceCtx,
  projectId: string,
): Promise<{ project: Project; effectiveRole: ProjectRole; fromWorkspace: boolean } | null> {
  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId))
    .limit(1);
  if (!project) return null;
  if (project.workspaceId !== ws.workspace.id) return null;

  const wsRole = canonicalRole(ws.role);
  if (wsRole === "owner" || wsRole === "admin") {
    return { project, effectiveRole: "manager", fromWorkspace: true };
  }

  const [membership] = await db
    .select()
    .from(projectMembersTable)
    .where(and(eq(projectMembersTable.projectId, projectId), eq(projectMembersTable.userId, ws.userId)))
    .limit(1);
  if (!membership || !isProjectRole(membership.role)) return null;
  return { project, effectiveRole: membership.role, fromWorkspace: false };
}

/**
 * Express middleware factory: requires authenticated user with a project
 * membership of at least `minRole`. Project ID is read from req.params,
 * req.body, or req.query (in that order).
 *
 * Must be chained after `requireAuth, requireWorkspace`.
 */
export function requireProjectAccess(minRole: ProjectRole) {
  return async function (req: Request, res: Response, next: NextFunction) {
    const ws = (req as AuthedRequest).ws_ctx;
    if (!ws) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const projectId =
      (req.params?.projectId as string | undefined) ??
      (typeof req.body?.projectId === "string" ? req.body.projectId : undefined) ??
      (typeof req.query?.projectId === "string" ? (req.query.projectId as string) : undefined);

    if (!projectId) {
      res.status(400).json({ error: "projectId is required" });
      return;
    }

    const access = await loadProjectAccess(ws, projectId);
    if (!access) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    if (!projectRoleAtLeast(access.effectiveRole, minRole)) {
      res.status(403).json({
        error: `Your project role (${access.effectiveRole}) is not allowed to perform this action. Requires ${minRole} or higher.`,
        effectiveRole: access.effectiveRole,
        requiredRole: minRole,
      });
      return;
    }

    (req as ProjectScopedRequest).project_ctx = access;
    next();
  };
}

/**
 * Inline assertion for routes that don't fit the middleware pattern (e.g.
 * AI handlers wrapped in credit-consumption middleware that already runs).
 *
 * **For AI / trial endpoints only.** Returns `null` for unauthenticated callers
 * so the existing anonymous-trial flow is preserved. Content routes
 * (requirements/sources/reports/comments) MUST use {@link requireProjectAccessInline}
 * which blocks anonymous callers with a 401.
 *
 * For authenticated users: loads workspace, resolves project access, and
 * either returns the access struct or writes a 4xx response and returns
 * `false`. Caller must `if (access === false) return;`.
 */
export async function assertProjectAccessIfAuthed(
  req: Request,
  res: Response,
  projectId: string | null | undefined,
  minRole: ProjectRole,
): Promise<ProjectAccess | null | false> {
  const { userId } = getAuth(req);
  if (!userId) return null; // anonymous trial path
  return resolveProjectAccess(req, res, userId, projectId, minRole);
}

/**
 * Strict inline assertion: like {@link assertProjectAccessIfAuthed} but
 * unauthenticated callers receive 401 and the helper returns `false`.
 * Use this on every content route that mutates or reads project-scoped data
 * outside the AI trial flow.
 *
 * Caller must `if (access === false) return;`.
 */
export async function requireProjectAccessInline(
  req: Request,
  res: Response,
  projectId: string | null | undefined,
  minRole: ProjectRole,
): Promise<ProjectAccess | false> {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  const result = await resolveProjectAccess(req, res, userId, projectId, minRole);
  // resolveProjectAccess returns null only for the anon path, which we just
  // ruled out — so result here is ProjectAccess | false.
  return result === null ? false : result;
}

async function resolveProjectAccess(
  req: Request,
  res: Response,
  userId: string,
  projectId: string | null | undefined,
  minRole: ProjectRole,
): Promise<ProjectAccess | false | null> {
  if (!projectId) {
    res.status(400).json({ error: "projectId is required" });
    return false;
  }

  // Resolve workspace ctx (may have been set by an earlier middleware).
  let ws = (req as AuthedRequest).ws_ctx;
  if (!ws) {
    let email: string | null = null;
    try {
      const { clerkClient } = await import("@clerk/express");
      const user = await clerkClient.users.getUser(userId);
      email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null;
    } catch {
      /* noop */
    }
    const { workspace, role } = await getOrCreateWorkspace(userId, email);
    ws = { userId, email, workspace, role };
    (req as AuthedRequest).auth_ctx = { userId, email };
    (req as AuthedRequest).ws_ctx = ws;
  }

  const access = await loadProjectAccess(ws, projectId);
  if (!access) {
    res.status(404).json({ error: "Project not found" });
    return false;
  }
  if (!projectRoleAtLeast(access.effectiveRole, minRole)) {
    res.status(403).json({
      error: `Your project role (${access.effectiveRole}) is not allowed to perform this action. Requires ${minRole} or higher.`,
      effectiveRole: access.effectiveRole,
      requiredRole: minRole,
    });
    return false;
  }
  (req as ProjectScopedRequest).project_ctx = access;
  return access;
}

export { projectPermissionsFor, projectRoleAtLeast, PROJECT_ROLES };
