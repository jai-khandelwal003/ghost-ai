"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { FolderOpen, Pencil, Plus, Trash2, Users, X } from "lucide-react";

import { useProjectDialogsContext } from "@/components/editor/project-dialogs-provider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProjectListItem } from "@/lib/projects";
import { cn } from "@/lib/utils";
import { getWorkspacePath } from "@/lib/workspace";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  ownedProjects: ProjectListItem[];
  sharedProjects: ProjectListItem[];
  // The project whose workspace is open, if any.
  activeProjectId?: string;
}

export function ProjectSidebar({
  isOpen,
  onClose,
  ownedProjects,
  sharedProjects,
  activeProjectId,
}: ProjectSidebarProps) {
  const { openCreateDialog, openRenameDialog, openDeleteDialog } =
    useProjectDialogsContext();
  // Open on the tab that holds the current project so its highlight is visible.
  const defaultTab = sharedProjects.some(
    (project) => project.id === activeProjectId,
  )
    ? "shared"
    : "my-projects";

  return (
    <>
      {/* Mobile-only scrim below the navbar; tapping it closes the sidebar. */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "fixed inset-x-0 top-12 bottom-0 z-30 bg-base/70 backdrop-blur-xs transition-opacity duration-200 ease-out md:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      {/* Fixed panel below the h-12 navbar; `EditorShell` pads the content beside it on large screens. */}
      <aside
        aria-label="Projects"
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={cn(
          "fixed top-15 bottom-3 left-3 z-40 flex w-72 flex-col rounded-2xl border border-surface-border bg-surface/90 backdrop-blur-md transition-transform duration-200 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-[calc(100%+1rem)]",
        )}
      >
        <div className="mb-3 flex items-center justify-between border-b border-surface-border px-4 py-3">
          <h2 className="text-sm font-medium text-copy-primary">Projects</h2>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-copy-muted hover:text-copy-primary"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue={defaultTab} className="min-h-0 flex-1 px-4">
          <TabsList className="w-full">
            <TabsTrigger value="my-projects">My Projects</TabsTrigger>
            <TabsTrigger value="shared">Shared</TabsTrigger>
          </TabsList>
          <TabsContent value="my-projects" className="flex min-h-0">
            {ownedProjects.length > 0 ? (
              <ProjectList
                projects={ownedProjects}
                activeProjectId={activeProjectId}
                onRename={openRenameDialog}
                onDelete={openDeleteDialog}
              />
            ) : (
              <EmptyState
                icon={FolderOpen}
                title="No projects yet"
                description="Projects you create will appear here."
              />
            )}
          </TabsContent>
          <TabsContent value="shared" className="flex min-h-0">
            {sharedProjects.length > 0 ? (
              <ProjectList
                projects={sharedProjects}
                activeProjectId={activeProjectId}
              />
            ) : (
              <EmptyState
                icon={Users}
                title="Nothing shared yet"
                description="Projects shared with you will appear here."
              />
            )}
          </TabsContent>
        </Tabs>

        <div className="border-t border-surface-border p-4">
          <Button className="w-full" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  );
}

interface ProjectListProps {
  projects: ProjectListItem[];
  activeProjectId?: string;
  // Actions are passed for owned projects only; shared projects render without them.
  onRename?: (project: ProjectListItem) => void;
  onDelete?: (project: ProjectListItem) => void;
}

function ProjectList({
  projects,
  activeProjectId,
  onRename,
  onDelete,
}: ProjectListProps) {
  return (
    <ul className="flex flex-1 flex-col gap-1 overflow-y-auto">
      {projects.map((project) => {
        const isActive = project.id === activeProjectId;

        return (
          <li
            key={project.id}
            className={cn(
              "group flex h-10 shrink-0 items-center gap-2 rounded-xl border border-transparent pr-1 pl-3 hover:bg-subtle",
              isActive && "border-brand/30 bg-accent-dim hover:bg-accent-dim",
            )}
          >
            {isActive && (
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
              />
            )}
            <Link
              href={getWorkspacePath(project.id)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "min-w-0 flex-1 truncate text-sm text-copy-secondary",
                isActive && "font-medium text-copy-primary",
              )}
            >
              {project.name}
            </Link>
            {onRename && onDelete && (
              <div className="flex items-center md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-copy-muted hover:text-copy-primary"
                  onClick={() => onRename(project)}
                  aria-label={`Rename ${project.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-copy-muted hover:text-error"
                  onClick={() => onDelete(project)}
                  aria-label={`Delete ${project.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
      <Icon className="h-8 w-8 text-copy-faint" />
      <p className="text-sm font-medium text-copy-secondary">{title}</p>
      <p className="text-xs text-copy-muted">{description}</p>
    </div>
  );
}
