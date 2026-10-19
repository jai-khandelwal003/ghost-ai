"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { Bot, SendHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
];

const TEXTAREA_MIN_HEIGHT = 72;
const TEXTAREA_MAX_HEIGHT = 160;

interface AiChatPanelProps {
  messages: ChatMessage[];
  draft: string;
  onDraftChange: (draft: string) => void;
  onSend: (content: string) => void;
}

// UI only: sending appends the user's message; no assistant replies are generated yet.
export function AiChatPanel({
  messages,
  draft,
  onDraftChange,
  onSend,
}: AiChatPanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const canSend = draft.trim().length > 0;

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
    if (!content) return;
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
          {messages.length === 0 ? (
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
              {messages.map((message) => (
                <li
                  key={message.id}
                  className={cn(
                    "max-w-[85%] rounded-xl px-3 py-2 text-sm wrap-break-word whitespace-pre-wrap",
                    message.role === "user"
                      ? "self-end border-2 border-brand/50 bg-accent-dim text-copy-primary"
                      : "self-start border border-surface-border bg-elevated text-ai-text",
                  )}
                >
                  {message.content}
                </li>
              ))}
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
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your architecture…"
            aria-label="Message Ghost AI"
            rows={1}
            className="field-sizing-fixed max-h-40 min-h-18 resize-none overflow-y-auto rounded-xl border-surface-border bg-elevated pr-11 text-sm text-copy-primary placeholder:text-copy-faint dark:bg-elevated"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!canSend}
            className="absolute right-2 bottom-2 bg-ai text-copy-primary hover:bg-ai/80"
            aria-label="Send message"
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-[0.65rem] text-copy-faint">
          Enter to send · Shift+Enter for a new line
        </p>
      </form>
    </>
  );
}
