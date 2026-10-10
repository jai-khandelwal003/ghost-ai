"use client";

import { Plus } from "lucide-react";

import { useProjectDialogsContext } from "@/components/editor/project-dialogs-provider";
import { Button } from "@/components/ui/button";

export function EditorHome() {
  const { openCreateDialog } = useProjectDialogsContext();

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-base px-6 text-center">
      <h1 className="text-lg font-medium text-copy-primary">
        Create a project or open an existing one.
      </h1>
      <p className="max-w-md text-sm text-copy-muted">
        Start a new architecture workspace or choose a project from the sidebar.
      </p>
      <Button className="mt-2" onClick={openCreateDialog}>
        <Plus className="h-4 w-4" />
        New project
      </Button>
    </div>
  );
}
