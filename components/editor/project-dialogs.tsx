"use client";

import { useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ProjectDialogsState } from "@/hooks/use-project-dialogs";

interface ProjectDialogsProps {
  dialogs: ProjectDialogsState;
}

const CONTENT_CLASS = "rounded-3xl";
const FOOTER_CLASS = "rounded-b-3xl";

export function ProjectDialogs({ dialogs }: ProjectDialogsProps) {
  return (
    <>
      <CreateProjectDialog dialogs={dialogs} />
      <RenameProjectDialog dialogs={dialogs} />
      <DeleteProjectDialog dialogs={dialogs} />
    </>
  );
}

function CreateProjectDialog({ dialogs }: ProjectDialogsProps) {
  const { name, slug, isLoading, setName, closeDialog, submitCreate } = dialogs;

  return (
    <Dialog
      open={dialogs.activeDialog === "create"}
      onOpenChange={(open) => {
        if (!open) closeDialog();
      }}
    >
      <DialogContent className={CONTENT_CLASS}>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submitCreate();
          }}
        >
          <DialogHeader>
            <DialogTitle>Create project</DialogTitle>
            <DialogDescription>
              Name your new architecture workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <label
              htmlFor="create-project-name"
              className="text-xs font-medium text-copy-secondary"
            >
              Project name
            </label>
            <Input
              id="create-project-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="My project"
              autoComplete="off"
              disabled={isLoading}
            />
            <p className="text-xs text-copy-muted" aria-live="polite">
              Slug:{" "}
              <span className="font-mono text-copy-secondary">
                {slug || "—"}
              </span>
            </p>
          </div>
          <DialogFooter className={FOOTER_CLASS}>
            <Button
              type="button"
              variant="outline"
              onClick={closeDialog}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!slug || isLoading}>
              {isLoading ? "Creating…" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RenameProjectDialog({ dialogs }: ProjectDialogsProps) {
  const { name, targetProject, isLoading, setName, closeDialog, submitRename } =
    dialogs;
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Dialog
      open={dialogs.activeDialog === "rename"}
      onOpenChange={(open) => {
        if (!open) closeDialog();
      }}
    >
      <DialogContent className={CONTENT_CLASS} initialFocus={inputRef}>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submitRename();
          }}
        >
          <DialogHeader>
            <DialogTitle>Rename project</DialogTitle>
            <DialogDescription>
              Enter a new name for{" "}
              <span className="font-medium text-copy-primary">
                {targetProject?.name}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <label
              htmlFor="rename-project-name"
              className="text-xs font-medium text-copy-secondary"
            >
              Project name
            </label>
            <Input
              ref={inputRef}
              id="rename-project-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="off"
              disabled={isLoading}
            />
          </div>
          <DialogFooter className={FOOTER_CLASS}>
            <Button
              type="button"
              variant="outline"
              onClick={closeDialog}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isLoading}>
              {isLoading ? "Renaming…" : "Rename"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteProjectDialog({ dialogs }: ProjectDialogsProps) {
  const { targetProject, isLoading, closeDialog, submitDelete } = dialogs;

  return (
    <Dialog
      open={dialogs.activeDialog === "delete"}
      onOpenChange={(open) => {
        if (!open) closeDialog();
      }}
    >
      <DialogContent className={CONTENT_CLASS}>
        <DialogHeader>
          <DialogTitle>Delete project</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium text-copy-primary">
              {targetProject?.name}
            </span>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className={FOOTER_CLASS}>
          <Button
            type="button"
            variant="outline"
            onClick={closeDialog}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void submitDelete()}
            disabled={isLoading}
          >
            {isLoading ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
