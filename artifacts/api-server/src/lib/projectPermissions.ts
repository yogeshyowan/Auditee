import { PROJECT_ROLES, type ProjectRole } from "@workspace/db";

export { PROJECT_ROLES };
export type { ProjectRole };

/**
 * Per-project capability matrix.
 *
 * Hierarchy of write-power: manager > developer > reviewer > auditor.
 *
 * - manager   : full project control (settings, members, delete, write)
 * - developer : read + write content (requirements, sources, reports, AI)
 * - reviewer  : read + comment / approve, no edits to source content
 * - auditor   : read-only (audit-evidence access)
 *
 * Workspace owners and admins are auto-promoted to "manager" on every
 * project in their workspace; see effectiveProjectRole().
 */
export interface ProjectPermissions {
  canManageProject: boolean;
  canManageProjectMembers: boolean;
  canEditContent: boolean;
  canApprove: boolean;
  canViewContent: boolean;
}

const DENY: ProjectPermissions = {
  canManageProject: false,
  canManageProjectMembers: false,
  canEditContent: false,
  canApprove: false,
  canViewContent: false,
};

const PERMISSIONS_BY_ROLE: Record<ProjectRole, ProjectPermissions> = {
  manager: {
    canManageProject: true,
    canManageProjectMembers: true,
    canEditContent: true,
    canApprove: true,
    canViewContent: true,
  },
  developer: {
    canManageProject: false,
    canManageProjectMembers: false,
    canEditContent: true,
    canApprove: true,
    canViewContent: true,
  },
  reviewer: {
    canManageProject: false,
    canManageProjectMembers: false,
    canEditContent: false,
    canApprove: true,
    canViewContent: true,
  },
  auditor: {
    canManageProject: false,
    canManageProjectMembers: false,
    canEditContent: false,
    canApprove: false,
    canViewContent: true,
  },
};

export function projectPermissionsFor(role: ProjectRole | null | undefined): ProjectPermissions {
  if (!role) return DENY;
  return PERMISSIONS_BY_ROLE[role] ?? DENY;
}

export const PROJECT_ROLE_RANK: Record<ProjectRole, number> = {
  auditor: 1,
  reviewer: 2,
  developer: 3,
  manager: 4,
};

export function projectRoleAtLeast(role: ProjectRole | null | undefined, min: ProjectRole): boolean {
  if (!role) return false;
  return PROJECT_ROLE_RANK[role] >= PROJECT_ROLE_RANK[min];
}
