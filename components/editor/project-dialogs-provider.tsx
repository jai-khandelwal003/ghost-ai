"use client";

import { createContext, useContext } from "react";

import { ProjectDialogs } from "@/components/editor/project-dialogs";
import {
  useProjectActions,
  type ProjectActionsState,
} from "@/hooks/use-project-actions";

const ProjectDialogsContext = createContext<ProjectActionsState | null>(null);

interface ProjectDialogsProviderProps {
  children: React.ReactNode;
}

export function ProjectDialogsProvider({
  children,
}: ProjectDialogsProviderProps) {
  const dialogs = useProjectActions();

  return (
    <ProjectDialogsContext value={dialogs}>
      {children}
      <ProjectDialogs dialogs={dialogs} />
    </ProjectDialogsContext>
  );
}

export function useProjectDialogsContext(): ProjectActionsState {
  const dialogs = useContext(ProjectDialogsContext);
  if (!dialogs) {
    throw new Error(
      "useProjectDialogsContext must be used within ProjectDialogsProvider"
    );
  }
  return dialogs;
}
