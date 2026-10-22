"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { AlertCircle, Bot, Loader2, SendHorizontal, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import type { AiChatFeedMessage } from "@/hooks/use-ai-chat";
import { cn } from "@/lib/utils";
import { AI_CHAT_MESSAGE_MAX_LENGTH } from "@/types/tasks";

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
];

const TEXTAREA_MIN_HEIGHT = 72;
const TEXTAREA_MAX_HEIGHT = 160;

const TIME_FORMAT = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});
const DATE_TIME_FORMAT = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

// Time only for today's messages, date and time for older ones.
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const isToday = date.toDateString() === new Date().toDateString();
  return (isToday ? TIME_FORMAT : DATE_TIME_FORMAT).format(date);
}

interface AiChatPanelProps {
  // "architect": prompts for Ghost AI (`ai-chat`). "team": people-only room chat (`team-chat`).
  variant?: "architect" | "team";
  // The panel's feed, oldest first.
  messages: AiChatFeedMessage[];
  isLoading: boolean;
  // Messages from this user are right-aligned and labelled "You".
  selfId: string | null;
  draft: string;
  onDraftChange: (draft: string) => void;
  onSend: (content: string) => void;
  // A design run is active (started here, or anywhere in the room): the input and send button
  // are disabled and the status strip shows.
  isGenerating: boolean;
  // Latest line from `ai-status-feed` for the strip; a generic line when `null`.
  statusText: string | null;
  // A message is on its way to the feed.
  isSending: boolean;
  // Shown under the input when the last send failed.
  sendError: string | null;
}

// Room chat: everyone in the room sees and sends the same messages. In the architect variant,
// sending also starts a design run; its result arrives as a Ghost AI message.
export function AiChatPanel({
  variant = "architect",
  messages,
  isLoading,
  selfId,
  draft,
  onDraftChange,
  onSend,
  isGenerating,
  statusText,
  isSending,
  sendError,
}: AiChatPanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const isTeam = variant === "team";
  const errorId = `${variant}-chat-send-error`;
  const isBusy = isGenerating || isSending;
  const canSend = draft.trim().length > 0 && !isBusy;

  // Grow with the text between the min and max height, then scroll inside the textarea.
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const border = textarea.offsetHeight - textarea.clientHeight;
    textarea.style.height = "auto";
    const height = Math.min(
      Math.max(textarea.scrollHeight + border, TEXTAREA_MIN_HEIGHT),
      TEXTAREA_MAX_HEIGHT,
    );
    textarea.style.height = `${height}px`;
  }, [draft]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  function submit() {
    const content = draft.trim();
    if (!content || isBusy) return;
    onSend(content);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends, Shift+Enter falls through to a new line; ignore Enter while an IME is composing.
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      submit();
    }
  }

  function handleStarterPrompt(prompt: string) {
    onDraftChange(prompt);
    textareaRef.current?.focus();
  }

  return (
    <>
      <ScrollArea className="min-h-0 flex-1">
        <div className="px-4 py-3">
          {messages.length === 0 && isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-copy-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading chat…
            </div>
          ) : messages.length === 0 && isTeam ? (
            <div className="flex flex-col items-center gap-3 px-2 py-8 text-center">
              <div className="flex items-center justify-center rounded-2xl bg-accent-green/15 p-3">
                <Users className="h-8 w-8 text-accent-green" />
              </div>
              <p className="text-sm font-medium text-copy-primary">
                No messages yet
              </p>
              <p className="text-xs text-copy-muted">
                Chat with everyone in this project. Messages here are not sent
                to Ghost AI.
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-2 py-8 text-center">
              <div className="flex items-center justify-center rounded-2xl bg-ai/15 p-3">
                <Bot className="h-8 w-8 text-ai-text" />
              </div>
              <p className="text-sm font-medium text-copy-primary">
                What are we building?
              </p>
              <p className="text-xs text-copy-muted">
                Describe a system and Ghost AI will help you design its
                architecture on the canvas.
              </p>
              <div className="mt-1 flex flex-wrap justify-center gap-2">
                {STARTER_PROMPTS.map((prompt) => (
                  <Button
                    key={prompt}
                    variant="secondary"
                    size="sm"
                    className="rounded-full bg-subtle px-3 text-xs text-ai-text hover:bg-ai/15"
                    onClick={() => handleStarterPrompt(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {messages.map((message) => {
                const isOwn = message.sender.id === selfId;
                return (
                  <li
                    key={message.id}
                    className={cn(
                      "flex max-w-[85%] flex-col gap-1",
                      isOwn ? "items-end self-end" : "items-start self-start",
                    )}
                  >
                    <div className="flex items-baseline gap-1.5 px-1 text-[0.65rem]">
                      <span
                        className={cn(
                          "font-medium",
                          message.role === "assistant"
                            ? "text-ai-text"
                            : "text-copy-secondary",
                        )}
                      >
                        {isOwn ? "You" : message.sender.name}
                      </span>
                      <time
                        dateTime={new Date(message.timestamp).toISOString()}
                        className="text-copy-faint"
                      >
                        {formatTimestamp(message.timestamp)}
                      </time>
                    </div>
                    <div
                      className={cn(
                        "rounded-xl px-3 py-2 text-sm wrap-break-word whitespace-pre-wrap",
                        message.role === "assistant"
                          ? "border border-surface-border bg-elevated text-copy-primary"
                          : "bg-accent-green text-accent-green-foreground",
                      )}
                    >
                      {message.content}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      <form
        className="border-t border-surface-border p-3"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        {isGenerating && (
          <div
            role="status"
            aria-live="polite"
            className="mb-2 flex items-center gap-2 rounded-xl border border-accent-green/30 bg-base px-3 py-1.5 text-xs text-copy-secondary"
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-green opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-green" />
            </span>
            <span
              className="min-w-0 truncate"
              title={statusText ?? undefined}
            >
              {statusText ?? "Ghost AI is working…"}
            </span>
          </div>
        )}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
            readOnly={isSending}
            placeholder={
              isGenerating
                ? "Ghost AI is working…"
                : isTeam
                  ? "Message your team…"
                  : "Describe your architecture…"
            }
            aria-label={isTeam ? "Message your team" : "Message Ghost AI"}
            aria-invalid={sendError ? true : undefined}
            aria-describedby={sendError ? errorId : undefined}
            maxLength={AI_CHAT_MESSAGE_MAX_LENGTH}
            rows={1}
            className="field-sizing-fixed max-h-40 min-h-18 resize-none overflow-y-auto rounded-xl border-surface-border bg-elevated pr-11 text-sm text-copy-primary placeholder:text-copy-faint dark:bg-elevated"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!canSend}
            aria-busy={isBusy}
            className="absolute right-2 bottom-2 bg-accent-green text-accent-green-foreground hover:bg-accent-green/80 disabled:opacity-40"
            aria-label={
              isGenerating
                ? "Ghost AI is working"
                : isSending
                  ? "Sending message"
                  : "Send message"
            }
          >
            {isBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SendHorizontal className="h-4 w-4" />
            )}
          </Button>
        </div>
        {sendError && (
          <p
            id={errorId}
            role="alert"
            className="mt-2 flex items-center gap-1.5 text-xs text-error"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {sendError}
          </p>
        )}
        <p className="mt-2 text-[0.65rem] text-copy-faint">
          Enter to send · Shift+Enter for a new line
        </p>
      </form>
    </>
  );
}
