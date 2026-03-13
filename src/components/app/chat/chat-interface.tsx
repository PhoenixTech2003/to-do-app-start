'use client'

import * as React from 'react'
import { Bot, MessageCircle, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

/** Mock messages for UI design preview only - no functionality */
const MOCK_MESSAGES = [
  // {
  //   id: '1',
  //   role: 'user' as const,
  //   content:
  //     "Can you add a task to my Today list for reviewing the quarterly report? I'd like it due by Friday.",
  //   timestamp: '10:32',
  // },
  // {
  //   id: '2',
  //   role: 'assistant' as const,
  //   content:
  //     'I\'ve added that to your Today list. The task "Review quarterly report" is set for Friday. I can also schedule a Pomodoro block for it if you\'d like.',
  //   timestamp: '10:32',
  // },
  // {
  //   id: '3',
  //   role: 'user' as const,
  //   content:
  //     'Yes please, schedule a 45-minute focus block for tomorrow morning.',
  //   timestamp: '10:34',
  // },
  // {
  //   id: '4',
  //   role: 'assistant' as const,
  //   content:
  //     "Done. I've scheduled a 45-minute Pomodoro session for tomorrow at 9:00 AM. You'll get a reminder when it's time to start.",
  //   timestamp: '10:34',
  // },
]

export function ChatInterface({
  showMockMessages = true,
  className,
}: {
  showMockMessages?: boolean
  className?: string
}) {
  const [inputValue, setInputValue] = React.useState('')
  const messages = showMockMessages ? MOCK_MESSAGES : []

  return (
    <div
      className={cn(
        'flex w-full flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm',
        className,
      )}
    >
      {/* Messages area - min-h-0 allows flex child to shrink and scroll; pb-24 for fixed input clearance */}
      <ScrollArea className="min-h-0 flex-1 p-5 pb-24">
        {messages.length === 0 ? (
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
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' && 'flex-row-reverse',
                )}
              >
                {message.role === 'assistant' && (
                  <Avatar className="size-8 shrink-0 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                      <Bot className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'group relative max-w-[85%] rounded-xl px-4 py-3',
                    message.role === 'user'
                      ? 'bg-muted/80 text-foreground'
                      : 'border border-border bg-card shadow-xs',
                  )}
                >
                  {message.role === 'assistant' && (
                    <div
                      className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full bg-primary opacity-80"
                      aria-hidden
                    />
                  )}
                  <p
                    className={cn(
                      'text-sm leading-relaxed',
                      message.role === 'assistant' && 'pl-1',
                    )}
                  >
                    {message.content}
                  </p>
                  <span
                    className={cn(
                      'mt-2 block font-mono text-[10px] text-muted-foreground',
                      message.role === 'user' ? 'text-right' : 'pl-1',
                    )}
                  >
                    {message.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input area - fixed to bottom of viewport */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card p-4 md:left-[var(--sidebar-width,16rem)]">
        <div className="mx-auto flex max-w-3xl gap-2">
          <Textarea
            placeholder="Ask the assistant to manage tasks, schedule focus time, or connect integrations…"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="min-h-[44px] max-h-32 resize-none border-border/80 bg-background/50 py-3 pr-4"
            rows={2}
          />
          <Button
            size="icon"
            className="size-11 shrink-0 rounded-xl"
            aria-label="Send message"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
