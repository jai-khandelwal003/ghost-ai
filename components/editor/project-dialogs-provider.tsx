"use client";

import { createContext, useContext } from "react";

import { ProjectDialogs } from "@/components/editor/project-dialogs";
import {
  useProjectDialogs,
  type ProjectDialogsState,
} from "@/hooks/use-project-dialogs";

const ProjectDialogsContext = createContext<ProjectDialogsState | null>(null);

interface ProjectDialogsProviderProps {
  children: React.ReactNode;
}

export function ProjectDialogsProvider({
  children,
}: ProjectDialogsProviderProps) {
  const dialogs = useProjectDialogs();

  return (
    <ProjectDialogsContext value={dialogs}>
      {children}
      <ProjectDialogs dialogs={dialogs} />
    </ProjectDialogsContext>
  );
}

export function useProjectDialogsContext(): ProjectDialogsState {
  const dialogs = useContext(ProjectDialogsContext);
  if (!dialogs) {
    throw new Error(
      "useProjectDialogsContext must be used within ProjectDialogsProvider"
    );
  }
  return dialogs;
}
