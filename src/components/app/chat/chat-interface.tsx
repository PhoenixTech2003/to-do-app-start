'use client'

import { useMutation } from 'convex/react'
import { useUIMessages } from '@convex-dev/agent/react'
import { toast } from 'sonner'
import { useCallback, useState } from 'react'
import { api } from 'convex/_generated/api'
import { ChatInput } from './chat-input'
import { EmptyState } from './empty-state'
import { MessageBubble } from './message-bubble'
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import { cn } from '@/lib/utils'
import { authClient } from '@/lib/auth-client'

export function ChatInterface({
  className,
  threadId,
}: {
  className?: string
  threadId: string
}) {
  const { data: session } = authClient.useSession()
  const sendWebMessage = useMutation(api.agents.agent.sendWebMessage)
  const [text, setText] = useState('')
  const [isSending, setIsSending] = useState(false)

  const { results: messages } = useUIMessages(
    api.agents.agent.listWebMessages,
    { threadId },
    { initialNumItems: 10, stream: true },
  )

  const messageCount = messages.length
  const lastStatus = messages[messageCount - 1]?.status

  const userInitials = session?.user
    ? session.user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?'

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      const prompt = message.text.trim()
      if (!prompt) return

      setIsSending(true)
      setText('')
      try {
        await sendWebMessage({ threadId, prompt })
      } catch {
        toast.error('Failed to send message')
      } finally {
        setIsSending(false)
      }
    },
    [sendWebMessage, threadId],
  )

  const handleSuggestion = useCallback(
    async (prompt: string) => {
      setIsSending(true)
      try {
        await sendWebMessage({ threadId, prompt })
      } catch {
        toast.error('Failed to send message')
      } finally {
        setIsSending(false)
      }
    },
    [sendWebMessage, threadId],
  )

  const chatStatus = isSending
    ? 'submitted'
    : lastStatus === 'streaming'
      ? 'streaming'
      : undefined

  const hasMessages = messageCount > 0

  return (
    <div
      className={cn(
        'flex w-full flex-1 flex-col overflow-hidden bg-card/40 backdrop-blur-sm sm:rounded-2xl sm:border sm:border-border/60',
        className,
      )}
    >
      <Conversation className="flex-1 min-h-0" resize="auto">
        <ConversationContent className="mx-auto max-w-3xl w-full px-3 py-4 sm:px-6 sm:py-6 gap-1.5">
          {!hasMessages ? (
            <EmptyState onSuggestion={handleSuggestion} />
          ) : (
            messages.map((message, index) => {
              const isUser = message.role === 'user'
              const prevRole = index > 0 ? messages[index - 1]?.role : undefined
              const isContinuation =
                index > 0 && isUser === (prevRole === 'user')

              return (
                <MessageBubble
                  key={message.key}
                  message={message}
                  isUser={isUser}
                  isContinuation={isContinuation}
                  index={index}
                  userInitials={userInitials}
                  userImage={session?.user.image ?? undefined}
                  userName={session?.user.name ?? 'You'}
                />
              )
            })
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <ChatInput
        text={text}
        setText={setText}
        onSubmit={handleSubmit}
        chatStatus={chatStatus}
      />
    </div>
  )
}
