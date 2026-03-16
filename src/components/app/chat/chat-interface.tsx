'use client'

import { Bot, Send } from 'lucide-react'
import { useForm } from '@tanstack/react-form'
import { useAction } from 'convex/react'
import { useThreadMessages } from '@convex-dev/agent/react'
import { toast } from 'sonner'
import { api } from 'convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export function ChatInterface({
  className,
  threadId,
}: {
  className?: string
  threadId: string
}) {
  const testAgentAction = useAction(api.agents.agent.testAgent)
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
        await testAgentAction({ threadId, prompt, platform: 'web' })
        form.reset()
      } catch (error) {
        toast.error('Failed to send message')
      }
    },
  })
  const messagesResults = useThreadMessages(
    api.agents.agent.getThreadMessages,
    { threadId },
    { initialNumItems: 10, stream:true },
  )

  return (
    <div
      className={cn(
        'flex w-full flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm',
        className,
      )}
    >
      {/* Messages area - min-h-0 allows flex child to shrink and scroll; pb-24 for fixed input clearance */}
      <ScrollArea className="min-h-0 flex-1 p-5 pb-24">
        {messagesResults.results.length === 0 ? (
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-4 text-center">
            <span className="text-7xl font-bold tracking-tight text-primary">
              T
            </span>
            <div className="space-y-1">
              <p className="text-lg font-medium text-foreground">
                Hi, how can I help you today?
              </p>
              <p className="text-sm text-muted-foreground">
                I can manage tasks, schedule Pomodoro sessions, or connect your
                integrations.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {messagesResults.results.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.message?.role === 'user' && 'flex-row-reverse',
                )}
              >
                {message.message?.role === 'assistant' && (
                  <Avatar className="size-8 shrink-0 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                      <Bot className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'group relative max-w-[85%] rounded-xl px-4 py-3',
                    message.message?.role === 'user'
                      ? 'bg-muted/80 text-foreground'
                      : 'border border-border bg-card shadow-xs',
                  )}
                >
                  {message.message?.role === 'assistant' && (
                    <div
                      className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full bg-primary opacity-80"
                      aria-hidden
                    />
                  )}
                  <p
                    className={cn(
                      'text-sm leading-relaxed',
                      message.message?.role === 'assistant' && 'pl-1',
                    )}
                  >
                    {message.text}
                  </p>
                  <span
                    className={cn(
                      'mt-2 block font-mono text-[10px] text-muted-foreground',
                      message.message?.role === 'user' ? 'text-right' : 'pl-1',
                    )}
                  >
                    {new Date(message._creationTime).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input area - fixed to bottom of viewport */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card p-4 md:left-[var(--sidebar-width,16rem)]">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="mx-auto flex max-w-3xl gap-2"
        >
          <form.Field
            name="message"
            children={(field) => (
              <Textarea
                placeholder="Ask the assistant to manage tasks, schedule focus time, or connect integrations…"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="min-h-[44px] max-h-32 flex-1 resize-none border-border/80 bg-background/50 py-3 pr-4"
                rows={2}
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
  )
}
