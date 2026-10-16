"use client";

import { useState } from "react";
import { LayoutTemplate, Sparkles } from "lucide-react";

import { AiSidebar } from "@/components/editor/ai-sidebar";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { ShareDialog } from "@/components/editor/share-dialog";
import { StarterTemplatesProvider } from "@/components/editor/starter-templates-context";
import { Button } from "@/components/ui/button";
import type { ProjectListItem, SidebarProjects } from "@/lib/projects";

interface EditorShellProps extends SidebarProjects {
  // Set on a project workspace; adds the project name, navbar actions and the AI sidebar.
  project?: ProjectListItem;
  children: React.ReactNode;
}

export function EditorShell({
  ownedProjects,
  sharedProjects,
  project,
  children,
}: EditorShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

  return (
    <StarterTemplatesProvider
      value={{ isOpen: isTemplatesOpen, setIsOpen: setIsTemplatesOpen }}
    >
      <div className="flex h-screen flex-col overflow-hidden bg-base">
        <EditorNavbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
          title={project?.name}
          actions={
            project && (
              <>
                {/* Opens the modal the canvas renders inside the room (see `Canvas`). */}
                <Button
                  variant="outline"
                  className="border-surface-border bg-base text-copy-secondary hover:bg-subtle hover:text-copy-primary"
                  onClick={() => setIsTemplatesOpen(true)}
                >
                  <LayoutTemplate className="h-4 w-4" />
                  Templates
                </Button>
                {/* Keyed so the dialog state resets when the workspace changes. */}
                <ShareDialog
                  key={project.id}
                  project={project}
                  isOwner={ownedProjects.some(
                    (owned) => owned.id === project.id,
                  )}
                />
                <Button
                  onClick={() => setIsAiSidebarOpen((open) => !open)}
                  aria-label={
                    isAiSidebarOpen ? "Close AI sidebar" : "Open AI sidebar"
                  }
                  aria-expanded={isAiSidebarOpen}
                >
                  <Sparkles className="h-4 w-4" />
                  AI
                </Button>
              </>
            )
          }
        />
        <ProjectSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
          activeProjectId={project?.id}
        />
        {/* The sidebars float over the content, so it always fills the area below the navbar. */}
        <main className="relative min-h-0 flex-1 overflow-hidden">{children}</main>
        {project && <AiSidebar isOpen={isAiSidebarOpen} />}
      </div>
    </StarterTemplatesProvider>
  );
}
