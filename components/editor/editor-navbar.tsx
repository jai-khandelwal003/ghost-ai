"use client";

import { UserButton } from "@clerk/nextjs";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  title?: string;
  // Rendered in the right section, before the user button.
  actions?: React.ReactNode;
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  title,
  actions,
}: EditorNavbarProps) {
  const ToggleIcon = isSidebarOpen ? PanelLeftClose : PanelLeftOpen;

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-surface-border bg-base px-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-copy-secondary hover:bg-subtle hover:text-copy-primary"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-expanded={isSidebarOpen}
        >
          <ToggleIcon className="h-5 w-5" />
        </Button>
        {title && (
          <div className="min-w-0 leading-tight">
            <h1 className="truncate text-sm font-medium text-copy-primary">
              {title}
            </h1>
            <p className="text-xs text-copy-muted">Workspace</p>
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2">
        {actions}
        <UserButton />
      </div>
    </header>
  );
}
