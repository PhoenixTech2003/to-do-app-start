'use client'

import { motion } from 'motion/react'
import type { UIMessage } from '@convex-dev/agent/react'
import { MessageResponse } from '@/components/ai-elements/message'
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { isToolPart } from './types'

export function MessageBubble({
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
  const toolParts = isUser
    ? []
    : (message.parts as Array<{ type: string }>).filter(isToolPart)

  const isStreaming = message.status === 'streaming'

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

      <div
        className={cn(
          'max-w-[88%] sm:max-w-[80%] space-y-2',
          isUser && 'items-end',
        )}
      >
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

        {toolParts.length > 0 && (
          <div className="space-y-2">
            {toolParts.map((part) => (
              <Tool
                key={part.toolCallId}
                defaultOpen={part.state === 'output-error'}
              >
                <ToolHeader
                  type={part.type as `tool-${string}`}
                  state={part.state}
                />
                <ToolContent>
                  {part.input != null && <ToolInput input={part.input} />}
                  {(part.output != null || part.errorText) && (
                    <ToolOutput
                      output={part.output}
                      errorText={part.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
            ))}
          </div>
        )}

        {(isUser || message.text) && (
          <div
            className={cn(
              'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
              isUser
                ? 'bg-primary text-primary-foreground rounded-tr-md'
                : 'bg-card border border-border/80 rounded-tl-md',
            )}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.text}</p>
            ) : (
              <MessageResponse isAnimating={isStreaming} className="text-sm">
                {message.text}
              </MessageResponse>
            )}
          </div>
        )}

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
