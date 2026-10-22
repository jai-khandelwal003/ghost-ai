"use client";

import { useCallback, useState } from "react";
import { Bot, X } from "lucide-react";

import { AiChatPanel } from "@/components/editor/ai-chat-panel";
import { AiSpecsPanel } from "@/components/editor/ai-specs-panel";
import { DesignRunWatcher } from "@/components/editor/design-run-watcher";
import { SpecRunWatcher } from "@/components/editor/spec-run-watcher";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAiChat } from "@/hooks/use-ai-chat";
import { useAiStatus } from "@/hooks/use-ai-status";
import { useDesignAgent } from "@/hooks/use-design-agent";
import { useSpecGeneration } from "@/hooks/use-spec-generation";
import { TEAM_CHAT_FEED_ID } from "@/lib/ai-status";
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
// h-12 navbar that slides in from the right. Must be rendered inside `WorkspaceRoom`.
export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  // Kept here rather than in the chat panel so switching tabs does not clear the draft.
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  // Room chat from the `ai-chat` feed; the conversation itself lives in Liveblocks.
  const { messages, isLoading, selfId, send, sendAssistant } = useAiChat();
  // Shared with everyone in the room; only the chat input reacts, the rest stays usable.
  const { isGenerating, status } = useAiStatus();
  // The run this client started. Other clients see it through `isGenerating` (agent presence).
  const designAgent = useDesignAgent(sendAssistant);
  const isRunActive = isGenerating || designAgent.isRunning;
  // Team chat: people only, never starts a run, stays usable while one is active.
  const teamChat = useAiChat(TEAM_CHAT_FEED_ID);
  const [teamDraft, setTeamDraft] = useState("");
  const [isTeamSending, setIsTeamSending] = useState(false);
  const [teamSendError, setTeamSendError] = useState<string | null>(null);
  // Spec runs live here, not in the Specs panel, which unmounts when another tab is open.
  const specGeneration = useSpecGeneration();
  const [specStatus, setSpecStatus] = useState<string | null>(null);
  // Bumped when a spec run ends, so an open Specs list reloads.
  const [specsVersion, setSpecsVersion] = useState(0);
  const { finish: finishSpecRun } = specGeneration;

  const handleSpecRunFinish = useCallback(
    (error: string | null) => {
      finishSpecRun(error);
      setSpecStatus(null);
      setSpecsVersion((version) => version + 1);
    },
    [finishSpecRun],
  );

  function handleTeamDraftChange(value: string) {
    setTeamDraft(value);
    setTeamSendError(null);
  }

  async function handleTeamSend(content: string) {
    if (isTeamSending) return;
    setIsTeamSending(true);
    setTeamSendError(null);
    try {
      await teamChat.send(content);
      setTeamDraft("");
    } catch (error) {
      console.error("Sending a team chat message failed", error);
      setTeamSendError("Message not sent. Try again.");
    } finally {
      setIsTeamSending(false);
    }
  }

  function handleDraftChange(value: string) {
    setDraft(value);
    setSendError(null);
  }

  async function handleSend(content: string) {
    if (isRunActive || isSending) return;
    setIsSending(true);
    setSendError(null);
    try {
      await send(content);
      // Cleared only after Liveblocks confirms; on failure the text stays for a retry.
      setDraft("");
    } catch (error) {
      console.error("Sending a chat message failed", error);
      setSendError("Message not sent. Try again.");
      return;
    } finally {
      setIsSending(false);
    }
    // Errors from here on are posted to the chat by the hook.
    await designAgent.start(content);
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

      {designAgent.run && (
        <DesignRunWatcher
          key={designAgent.run.runId}
          runId={designAgent.run.runId}
          publicToken={designAgent.run.publicToken}
          onFinish={designAgent.finish}
        />
      )}
      {specGeneration.run && (
        <SpecRunWatcher
          key={specGeneration.run.runId}
          runId={specGeneration.run.runId}
          publicToken={specGeneration.run.publicToken}
          onStatus={setSpecStatus}
          onFinish={handleSpecRunFinish}
        />
      )}

      <Tabs defaultValue="architect" className="min-h-0 flex-1 pt-3">
        <TabsList className="mx-4 w-auto">
          <TabsTrigger value="architect" className={TAB_TRIGGER_CLASS}>
            AI Architect
          </TabsTrigger>
          <TabsTrigger value="chat" className={TAB_TRIGGER_CLASS}>
            Chat
          </TabsTrigger>
          <TabsTrigger value="specs" className={TAB_TRIGGER_CLASS}>
            Specs
          </TabsTrigger>
        </TabsList>
        <TabsContent value="architect" className="flex min-h-0 flex-col">
          <AiChatPanel
            messages={messages}
            isLoading={isLoading}
            selfId={selfId}
            draft={draft}
            onDraftChange={handleDraftChange}
            onSend={handleSend}
            isGenerating={isRunActive}
            // Only during a run; a finished run's result is the last chat message.
            statusText={isRunActive ? (status?.text ?? null) : null}
            isSending={isSending}
            sendError={sendError}
          />
        </TabsContent>
        <TabsContent value="chat" className="flex min-h-0 flex-col">
          <AiChatPanel
            variant="team"
            messages={teamChat.messages}
            isLoading={teamChat.isLoading}
            selfId={teamChat.selfId}
            draft={teamDraft}
            onDraftChange={handleTeamDraftChange}
            onSend={handleTeamSend}
            isGenerating={false}
            statusText={null}
            isSending={isTeamSending}
            sendError={teamSendError}
          />
        </TabsContent>
        <TabsContent value="specs" className="flex min-h-0 flex-col">
          <AiSpecsPanel
            specsVersion={specsVersion}
            isGenerating={specGeneration.isRunning}
            generationStatus={specStatus}
            generationError={specGeneration.error}
            onGenerate={() => void specGeneration.start(messages)}
          />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
