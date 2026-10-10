"use client";

import { useState } from "react";

import { MOCK_PROJECTS, type Project } from "@/lib/mock-projects";
import { slugify } from "@/lib/slug";

export type ProjectDialogType = "create" | "rename" | "delete";

export interface ProjectDialogsState {
  projects: Project[];
  activeDialog: ProjectDialogType | null;
  targetProject: Project | null;
  name: string;
  slug: string;
  isLoading: boolean;
  setName: (name: string) => void;
  openCreateDialog: () => void;
  openRenameDialog: (project: Project) => void;
  openDeleteDialog: (project: Project) => void;
  closeDialog: () => void;
  submitCreate: () => Promise<void>;
  submitRename: () => Promise<void>;
  submitDelete: () => Promise<void>;
}

export function useProjectDialogs(): ProjectDialogsState {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [activeDialog, setActiveDialog] = useState<ProjectDialogType | null>(
    null
  );
  // Kept after close so the dialog still has its content while it animates out.
  const [targetProject, setTargetProject] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const slug = slugify(name);

  function openCreateDialog() {
    setName("");
    setTargetProject(null);
    setActiveDialog("create");
  }

  function openRenameDialog(project: Project) {
    setName(project.name);
    setTargetProject(project);
    setActiveDialog("rename");
  }

  function openDeleteDialog(project: Project) {
    setTargetProject(project);
    setActiveDialog("delete");
  }

  function closeDialog() {
    if (isLoading) return;
    setActiveDialog(null);
  }

  // Mutations only touch in-memory mock data; API calls will be awaited here later.
  async function runMutation(mutation: () => void | Promise<void>) {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await mutation();
      setActiveDialog(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function submitCreate() {
    const trimmedName = name.trim();
    if (!trimmedName || !slug) return;

    await runMutation(() => {
      setProjects((current) => [
        ...current,
        { id: crypto.randomUUID(), name: trimmedName, slug, role: "owner" },
      ]);
    });
  }

  async function submitRename() {
    const trimmedName = name.trim();
    if (!trimmedName || !targetProject) return;

    await runMutation(() => {
      setProjects((current) =>
        current.map((project) =>
          project.id === targetProject.id
            ? { ...project, name: trimmedName }
            : project
        )
      );
    });
  }

  async function submitDelete() {
    if (!targetProject) return;

    await runMutation(() => {
      setProjects((current) =>
        current.filter((project) => project.id !== targetProject.id)
      );
    });
  }

  return {
    projects,
    activeDialog,
    targetProject,
    name,
    slug,
    isLoading,
    setName,
    openCreateDialog,
    openRenameDialog,
    openDeleteDialog,
    closeDialog,
    submitCreate,
    submitRename,
    submitDelete,
  };
}
