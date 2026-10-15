"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { FALLBACK_ERROR, readError } from "@/lib/api-error";
import type { ProjectListItem } from "@/lib/projects";
import {
  createRoomId,
  createRoomIdSuffix,
  getWorkspacePath,
} from "@/lib/workspace";

export type ProjectDialogType = "create" | "rename" | "delete";

export interface ProjectActionsState {
  activeDialog: ProjectDialogType | null;
  targetProject: ProjectListItem | null;
  name: string;
  roomId: string;
  isLoading: boolean;
  error: string | null;
  setName: (name: string) => void;
  openCreateDialog: () => void;
  openRenameDialog: (project: ProjectListItem) => void;
  openDeleteDialog: (project: ProjectListItem) => void;
  closeDialog: () => void;
  submitCreate: () => Promise<void>;
  submitRename: () => Promise<void>;
  submitDelete: () => Promise<void>;
}

export function useProjectActions(): ProjectActionsState {
  const router = useRouter();
  const pathname = usePathname();

  const [activeDialog, setActiveDialog] = useState<ProjectDialogType | null>(
    null
  );
  // Kept after close so the dialog still has its content while it animates out.
  const [targetProject, setTargetProject] = useState<ProjectListItem | null>(
    null
  );
  const [name, setName] = useState("");
  // Generated once per create dialog so the previewed room ID is the one that gets created.
  const [suffix, setSuffix] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roomId = createRoomId(name, suffix);

  function openCreateDialog() {
    setName("");
    setSuffix(createRoomIdSuffix());
    setTargetProject(null);
    setError(null);
    setActiveDialog("create");
  }

  function openRenameDialog(project: ProjectListItem) {
    setName(project.name);
    setTargetProject(project);
    setError(null);
    setActiveDialog("rename");
  }

  function openDeleteDialog(project: ProjectListItem) {
    setTargetProject(project);
    setError(null);
    setActiveDialog("delete");
  }

  function closeDialog() {
    if (isLoading) return;
    setActiveDialog(null);
  }

  // Sends the request, then closes the dialog and runs `onSuccess`; failures stay in the dialog as `error`.
  async function runMutation(
    request: () => Promise<Response>,
    onSuccess: () => void
  ) {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await request();
      if (!response.ok) {
        setError(await readError(response));
        return;
      }
      setActiveDialog(null);
      onSuccess();
    } catch {
      setError(FALLBACK_ERROR);
    } finally {
      setIsLoading(false);
    }
  }

  async function submitCreate() {
    const trimmedName = name.trim();
    if (!trimmedName || !roomId) return;

    await runMutation(
      () =>
        fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: roomId, name: trimmedName }),
        }),
      () => router.push(getWorkspacePath(roomId))
    );
  }

  async function submitRename() {
    const trimmedName = name.trim();
    if (!trimmedName || !targetProject) return;

    await runMutation(
      () =>
        fetch(`/api/projects/${encodeURIComponent(targetProject.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmedName }),
        }),
      () => router.refresh()
    );
  }

  async function submitDelete() {
    if (!targetProject) return;

    await runMutation(
      () =>
        fetch(`/api/projects/${encodeURIComponent(targetProject.id)}`, {
          method: "DELETE",
        }),
      () => {
        // The active workspace no longer exists, so leave it instead of refreshing into a 404.
        if (pathname === getWorkspacePath(targetProject.id)) {
          router.replace("/editor");
        } else {
          router.refresh();
        }
      }
    );
  }

  return {
    activeDialog,
    targetProject,
    name,
    roomId,
    isLoading,
    error,
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
