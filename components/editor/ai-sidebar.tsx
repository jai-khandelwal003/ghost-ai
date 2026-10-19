"use client";

import { useState } from "react";
import { Bot, X } from "lucide-react";

import {
  AiChatPanel,
  type ChatMessage,
} from "@/components/editor/ai-chat-panel";
import { AiSpecsPanel } from "@/components/editor/ai-specs-panel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Active tab = AI accent; the `dark:` entries replace the shadcn trigger's dark-mode colors
// (`<html>` always carries `dark`).
const TAB_TRIGGER_CLASS =
  "rounded-lg text-copy-muted hover:text-copy-primary data-active:bg-ai/15 data-active:text-ai-text dark:text-copy-muted dark:hover:text-copy-primary dark:data-active:border-transparent dark:data-active:bg-ai/15 dark:data-active:text-ai-text";

// Open/close state belongs to `EditorShell`. Mirrors `ProjectSidebar`: a fixed panel below the
// h-12 navbar that slides in from the right.
export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  // Kept here rather than in the chat panel so switching tabs does not clear the conversation.
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");

  function handleSend(content: string) {
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", content },
    ]);
    setDraft("");
  }

  return (
    <aside
      aria-label="AI Workspace"
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={cn(
        "fixed top-15 right-3 bottom-3 z-40 flex w-80 max-w-[calc(100vw-1.5rem)] flex-col rounded-2xl border border-surface-border bg-base/95 shadow-2xl shadow-black/50 backdrop-blur-md transition-[translate,visibility] duration-200 ease-out",
        isOpen
          ? "visible translate-x-0"
          : "invisible translate-x-[calc(100%+3rem)]",
      )}
    >
      <div className="flex items-center gap-3 border-b border-surface-border px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ai/15">
          <Bot className="h-4 w-4 text-ai-text" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-medium text-copy-primary">
            AI Workspace
          </h2>
          <p className="text-xs text-copy-muted">Collaborate with Ghost AI</p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-copy-muted hover:text-copy-primary"
          onClick={onClose}
          aria-label="Close AI sidebar"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="architect" className="min-h-0 flex-1 pt-3">
        <TabsList className="mx-4 w-auto">
          <TabsTrigger value="architect" className={TAB_TRIGGER_CLASS}>
            AI Architect
          </TabsTrigger>
          <TabsTrigger value="specs" className={TAB_TRIGGER_CLASS}>
            Specs
          </TabsTrigger>
        </TabsList>
        <TabsContent value="architect" className="flex min-h-0 flex-col">
          <AiChatPanel
            messages={messages}
            draft={draft}
            onDraftChange={setDraft}
            onSend={handleSend}
          />
        </TabsContent>
        <TabsContent value="specs" className="flex min-h-0 flex-col">
          <AiSpecsPanel />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
