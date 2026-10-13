"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

import { AiSidebar } from "@/components/editor/ai-sidebar";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { ShareDialog } from "@/components/editor/share-dialog";
import { Button } from "@/components/ui/button";
import type { ProjectListItem, SidebarProjects } from "@/lib/projects";
import { cn } from "@/lib/utils";

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

  return (
    <div className="flex h-screen flex-col bg-base">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        title={project?.name}
        actions={
          project && (
            <>
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
      {/* On large screens the open sidebars sit beside the content instead of over it. */}
      <main
        className={cn(
          "relative min-h-0 flex-1 p-3 transition-[padding] duration-200 ease-out",
          isSidebarOpen && "lg:pl-78",
          project && isAiSidebarOpen && "lg:pr-86",
        )}
      >
        {children}
      </main>
      {project && <AiSidebar isOpen={isAiSidebarOpen} />}
    </div>
  );
}
