import type { WorkspaceRole, PlanTier } from "@workspace/db";

/**
 * Single source of truth for what each workspace role can do.
 *
 * Hierarchy: owner > admin > editor > viewer
 *
 *   - owner   : everything, including plan/SSO changes and ownership transfer
 *   - admin   : member management, audit log access, content edit
 *   - editor  : content edit (create/update requirements, runs AI generations)
 *   - viewer  : read-only
 */
export interface Permissions {
  canManageBilling: boolean;
  canManageMembers: boolean;
  canChangeRoles: boolean;
  canManageSso: boolean;
  canViewAuditLog: boolean;
  canEditContent: boolean;
  canViewContent: boolean;
}

const NONE: Permissions = {
  canManageBilling: false,
  canManageMembers: false,
  canChangeRoles: false,
  canManageSso: false,
  canViewAuditLog: false,
  canEditContent: false,
  canViewContent: false,
};

const PERMISSIONS_BY_ROLE: Record<WorkspaceRole, Permissions> = {
  owner: {
    canManageBilling: true,
    canManageMembers: true,
    canChangeRoles: true,
    canManageSso: true,
    canViewAuditLog: true,
    canEditContent: true,
    canViewContent: true,
  },
  admin: {
    canManageBilling: false,
    canManageMembers: true,
    canChangeRoles: true,
    canManageSso: false,
    canViewAuditLog: true,
    canEditContent: true,
    canViewContent: true,
  },
  editor: {
    canManageBilling: false,
    canManageMembers: false,
    canChangeRoles: false,
    canManageSso: false,
    canViewAuditLog: false,
    canEditContent: true,
    canViewContent: true,
  },
  viewer: {
    canManageBilling: false,
    canManageMembers: false,
    canChangeRoles: false,
    canManageSso: false,
    canViewAuditLog: false,
    canEditContent: false,
    canViewContent: true,
  },
};

export function permissionsFor(role: string | null | undefined): Permissions {
  if (!role) return NONE;
  return PERMISSIONS_BY_ROLE[role as WorkspaceRole] ?? NONE;
}

/**
 * Plan-gate: which features require the Enterprise tier?
 *
 * Audit logs and SSO are Enterprise-only. Free and Professional get a clear
 * 402-style upgrade prompt instead of silent failure.
 */
const ENTERPRISE_ONLY_FEATURES = [
  "audit_log",
  "sso",
  "saml",
  "scim",
  "siem",
  "byo_llm",
  "mfa_policy",
  "data_residency",
  "cmk",
] as const;
export type EnterpriseFeature = (typeof ENTERPRISE_ONLY_FEATURES)[number];

export function planAllows(plan: PlanTier, feature: EnterpriseFeature): boolean {
  if (ENTERPRISE_ONLY_FEATURES.includes(feature)) return plan === "enterprise";
  return true;
}

export const ROLE_RANK: Record<WorkspaceRole, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
  owner: 4,
};

export function isAtLeast(role: string | null | undefined, min: WorkspaceRole): boolean {
  if (!role) return false;
  const r = ROLE_RANK[role as WorkspaceRole];
  return typeof r === "number" && r >= ROLE_RANK[min];
}
