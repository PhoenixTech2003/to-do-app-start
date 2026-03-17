import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { ChatInterface } from '@/components/app/chat/chat-interface'

export const Route = createFileRoute('/(app)/chat/')({
  component: ChatPage,
})

function ChatPage() {
  const threadResult = useQuery(api.agents.agent.getUserWebThread)
  const createThread = useMutation(api.agents.agent.createAgentThread)

  useEffect(() => {
    if (threadResult === null) {
      createThread({ platform: 'web' })
    }
  }, [threadResult, createThread])

  const threadId = threadResult?.threadId

  if (threadId === undefined) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading chat…</p>
      </div>
    )
  }

  return <ChatInterface threadId={threadId} className="min-h-0 flex-1" />
}
