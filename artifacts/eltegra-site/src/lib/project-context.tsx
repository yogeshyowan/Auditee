import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";
import { useListProjects } from "@workspace/api-client-react";

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
}

interface ProjectContextType {
  projectId: string | null;
  setProjectId: (id: string | null) => void;
  /** Only projects the user has connected (≥1 source). */
  connectedProjects: ConnectedProject[];
  /** All projects regardless of connection status — useful for admin/empty-state UX. */
  allProjects: ConnectedProject[];
  isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType>({
  projectId: null,
  setProjectId: () => {},
  connectedProjects: [],
  allProjects: [],
  isLoading: false,
});

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const { data: projects, isLoading } = useListProjects();

  // The generated client typing doesn't yet know about sourceCount/readySourceCount
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
      })),
    [projects],
  );

  const connectedProjects = useMemo(
    () => allProjects.filter((p) => p.sourceCount > 0),
    [allProjects],
  );

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

  return (
    <ProjectContext.Provider
      value={{ projectId, setProjectId, connectedProjects, allProjects, isLoading }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  return useContext(ProjectContext);
}
