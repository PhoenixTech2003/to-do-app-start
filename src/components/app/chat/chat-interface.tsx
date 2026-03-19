'use client'

import { Send } from 'lucide-react'
import { useForm } from '@tanstack/react-form'
import { useMutation } from 'convex/react'
import { useSmoothText, useUIMessages } from '@convex-dev/agent/react'
import { toast } from 'sonner'
import { motion } from 'motion/react'
import { useCallback, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { api } from 'convex/_generated/api'
import type { UIMessage } from '@convex-dev/agent/react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  const scrollRef = useRef<HTMLDivElement>(null)

  const form = useForm({
    defaultValues: { message: '' },
    validators: {
      onSubmit: ({ value }) =>
        !value.message.trim() ? 'Message is required' : undefined,
    },
    onSubmit: async ({ value }) => {
      const prompt = value.message.trim()
      if (!prompt) return
      try {
        await sendWebMessage({ threadId, prompt })
        form.reset()
      } catch {
        toast.error('Failed to send message')
      }
    },
  })

  const { results: messages } = useUIMessages(
    api.agents.agent.listWebMessages,
    { threadId },
    { initialNumItems: 10, stream: true },
  )

  const messageCount = messages.length
  const lastMessageText = messages[messageCount - 1]?.text ?? ''

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    })
  }, [messageCount, lastMessageText])

  const userInitials = session?.user
    ? session.user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?'

  const handleSuggestion = useCallback(
    async (text: string) => {
      try {
        await sendWebMessage({ threadId, prompt: text })
      } catch {
        toast.error('Failed to send message')
      }
    },
    [sendWebMessage, threadId],
  )

  const hasMessages = messageCount > 0

  return (
    <div
      className={cn(
        'flex w-full flex-1 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm',
        className,
      )}
    >
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
        <div className="mx-auto max-w-2xl w-full px-5 py-6">
          {!hasMessages ? (
            <EmptyState onSuggestion={handleSuggestion} />
          ) : (
            <div className="flex flex-col gap-1">
              {messages.map((message, index) => {
                const isUser = message.role === 'user'
                const prevRole =
                  index > 0 ? messages[index - 1]?.role : undefined
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
              })}
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
            className="flex items-end gap-2"
          >
            <form.Field
              name="message"
              children={(field) => (
                <Textarea
                  placeholder="Type a message…"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      form.handleSubmit()
                    }
                  }}
                  className="min-h-[44px] max-h-32 flex-1 resize-none rounded-xl border-border/60 bg-card py-3 text-sm shadow-xs focus-visible:ring-1"
                  rows={1}
                />
              )}
            />
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  size="icon"
                  className="size-11 shrink-0 rounded-xl"
                  aria-label="Send message"
                  disabled={!canSubmit || isSubmitting}
                >
                  <Send className="size-4" />
                </Button>
              )}
            </form.Subscribe>
          </form>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({
  message,
  isUser,
  isContinuation,
  index,
  userInitials,
  userImage,
  userName,
}: {
  message: UIMessage
  isUser: boolean
  isContinuation: boolean
  index: number
  userInitials: string
  userImage: string | undefined
  userName: string
}) {
  const [visibleText] = useSmoothText(message.text, {
    startStreaming: message.status === 'streaming',
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'flex gap-2.5',
        isUser && 'flex-row-reverse',
        !isContinuation && index > 0 && 'mt-4',
      )}
    >
      <div className={cn('w-7 shrink-0', isContinuation && 'invisible')}>
        <Avatar className="size-7 ring-1 ring-border/40">
          {isUser ? (
            <>
              {userImage && <AvatarImage src={userImage} alt={userName} />}
              <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
                {userInitials}
              </AvatarFallback>
            </>
          ) : (
            <>
              <AvatarImage src="/favicon.png" alt="TwoDo" />
              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                T
              </AvatarFallback>
            </>
          )}
        </Avatar>
      </div>

      <div className={cn('max-w-[80%] space-y-0.5', isUser && 'items-end')}>
        {!isContinuation && (
          <span
            className={cn(
              'block text-[11px] font-medium text-muted-foreground/60 px-1 mb-1',
              isUser && 'text-right',
            )}
          >
            {isUser ? 'You' : 'TwoDo'}
          </span>
        )}
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-md'
              : 'bg-card border border-border/80 rounded-tl-md',
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{visibleText}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-headings:my-2.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-pre:my-2 prose-pre:bg-muted prose-pre:text-foreground prose-code:text-primary prose-code:before:content-none prose-code:after:content-none prose-a:text-primary prose-a:underline-offset-2 prose-hr:my-3 prose-blockquote:border-primary/30">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {visibleText}
              </ReactMarkdown>
            </div>
          )}
        </div>
        <span
          className={cn(
            'block font-mono text-[10px] text-muted-foreground/40 px-1',
            isUser && 'text-right',
          )}
        >
          {new Date(message._creationTime).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </motion.div>
  )
}

const suggestions = ['Create a task', 'Create a workspace', 'Show my tasks']

function EmptyState({
  onSuggestion,
}: {
  onSuggestion: (text: string) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full min-h-[420px] flex-col items-center justify-center gap-6 text-center px-6"
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/8 blur-2xl scale-[2]" />
        <motion.img
          src="/favicon.png"
          alt="TwoDo"
          className="relative size-14 drop-shadow-md"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Hey, how can I help?
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
          Manage tasks, schedule focus sessions, or ask me anything about your
          workflow.
        </p>
      </div>

      <motion.div
        className="flex flex-wrap justify-center gap-2"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
      >
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSuggestion(s)}
            className="rounded-full border border-border/80 bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-xs hover:bg-muted/60 hover:text-foreground hover:border-border transition-all duration-200 cursor-pointer"
          >
            {s}
          </button>
        ))}
      </motion.div>
    </motion.div>
  )
}
