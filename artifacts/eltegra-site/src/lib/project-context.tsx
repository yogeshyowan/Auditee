import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useListProjects } from "@workspace/api-client-react";

interface ProjectContextType {
  projectId: string | null;
  setProjectId: (id: string | null) => void;
}

const ProjectContext = createContext<ProjectContextType>({
  projectId: null,
  setProjectId: () => {},
});

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const { data: projects } = useListProjects();

  useEffect(() => {
    if (projects && projects.length > 0 && !projectId) {
      setProjectId(projects[0].id);
    }
  }, [projects, projectId]);

  return (
    <ProjectContext.Provider value={{ projectId, setProjectId }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  return useContext(ProjectContext);
}
