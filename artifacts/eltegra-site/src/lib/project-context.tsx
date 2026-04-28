import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";
import { useListProjects, useGetProject } from "@workspace/api-client-react";

export type ProjectRole = "manager" | "developer" | "reviewer" | "auditor";

export const PROJECT_ROLE_RANK: Record<ProjectRole, number> = {
  auditor: 0,
  reviewer: 1,
  developer: 2,
  manager: 3,
};

export function projectRoleAtLeast(role: ProjectRole | null | undefined, min: ProjectRole): boolean {
  if (!role) return false;
  return PROJECT_ROLE_RANK[role] >= PROJECT_ROLE_RANK[min];
}

export interface ConnectedProject {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  owner?: string | null;
  complianceScore?: number | null;
  requirementCount?: number;
  sourceCount: number;
  readySourceCount: number;
  effectiveRole?: ProjectRole | null;
}

interface ProjectContextType {
  projectId: string | null;
  setProjectId: (id: string | null) => void;
  /** Only projects the user has connected (≥1 source). */
  connectedProjects: ConnectedProject[];
  /** All projects regardless of connection status — useful for admin/empty-state UX. */
  allProjects: ConnectedProject[];
  isLoading: boolean;
  /** Effective project role for the currently selected project. */
  effectiveRole: ProjectRole | null;
  /** Helper: returns true when current user can edit project content. */
  canEditContent: boolean;
  /** Helper: returns true when current user can manage project members. */
  canManageMembers: boolean;
}

const ProjectContext = createContext<ProjectContextType>({
  projectId: null,
  setProjectId: () => {},
  connectedProjects: [],
  allProjects: [],
  isLoading: false,
  effectiveRole: null,
  canEditContent: false,
  canManageMembers: false,
});

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const { data: projects, isLoading } = useListProjects();

  // The generated client typing doesn't yet know about sourceCount/readySourceCount/effectiveRole
  // (those fields are added by the API and surfaced via cast). Keep the cast tight.
  const allProjects: ConnectedProject[] = useMemo(
    () =>
      (projects ?? []).map((p: any) => ({
        id: String(p.id),
        name: String(p.name ?? "Untitled project"),
        slug: p.slug ?? null,
        description: p.description ?? null,
        owner: p.owner ?? null,
        complianceScore: typeof p.complianceScore === "number" ? p.complianceScore : null,
        requirementCount: typeof p.requirementCount === "number" ? p.requirementCount : 0,
        sourceCount: typeof p.sourceCount === "number" ? p.sourceCount : 0,
        readySourceCount: typeof p.readySourceCount === "number" ? p.readySourceCount : 0,
        effectiveRole: (p.effectiveRole ?? null) as ProjectRole | null,
      })),
    [projects],
  );

  const connectedProjects = useMemo(
    () => allProjects.filter((p) => p.sourceCount > 0),
    [allProjects],
  );

  // Fetch the currently selected project for an authoritative effectiveRole
  // (the list response also returns it, but a fresh GET is the source of truth
  // and updates immediately after a member-role change).
  const { data: currentProject } = useGetProject(projectId ?? "", {
    query: { enabled: Boolean(projectId) },
  });
  const effectiveRole: ProjectRole | null =
    ((currentProject as any)?.effectiveRole as ProjectRole | null | undefined) ??
    allProjects.find((p) => p.id === projectId)?.effectiveRole ??
    null;

  // Auto-select a sensible default project. Rules:
  // - If the currently-selected project still exists in `allProjects` (whether
  //   connected or not — a freshly-created project starts with 0 sources and
  //   should remain selectable), keep it.
  // - Otherwise fall back to the first *connected* project, or null if there
  //   are no projects at all.
  useEffect(() => {
    if (allProjects.length === 0) {
      if (projectId !== null) setProjectId(null);
      return;
    }
    const stillExists = allProjects.some((p) => p.id === projectId);
    if (stillExists) return;
    if (connectedProjects.length > 0) {
      setProjectId(connectedProjects[0].id);
    } else {
      setProjectId(allProjects[0].id);
    }
  }, [allProjects, connectedProjects, projectId]);

  const canEditContent = projectRoleAtLeast(effectiveRole, "developer");
  const canManageMembers = effectiveRole === "manager";

  return (
    <ProjectContext.Provider
      value={{
        projectId,
        setProjectId,
        connectedProjects,
        allProjects,
        isLoading,
        effectiveRole,
        canEditContent,
        canManageMembers,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  return useContext(ProjectContext);
}

export function useEffectiveProjectRole(): ProjectRole | null {
  return useContext(ProjectContext).effectiveRole;
}
