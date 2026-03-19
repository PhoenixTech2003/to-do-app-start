'use client'

import type { ChatStatus } from 'ai'
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input'
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from '@/components/ai-elements/prompt-input'

export function ChatInput({
  text,
  setText,
  onSubmit,
  chatStatus,
}: {
  text: string
  setText: (value: string) => void
  onSubmit: (message: PromptInputMessage) => void | Promise<void>
  chatStatus: ChatStatus | undefined
}) {
  return (
    <div className="shrink-0 border-t border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto max-w-3xl px-3 py-2.5 sm:px-5 sm:py-3">
        <PromptInput
          onSubmit={onSubmit}
          className="rounded-xl border-border/60 bg-card shadow-xs"
        >
          <PromptInputBody>
            <PromptInputTextarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message…"
              className="min-h-[44px] max-h-32 text-sm"
            />
          </PromptInputBody>
          <PromptInputFooter>
            <div />
            <PromptInputSubmit
              status={chatStatus}
              disabled={!text.trim() && !chatStatus}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  )
}
