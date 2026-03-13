import { createFileRoute } from '@tanstack/react-router'
import { ChatInterface } from '@/components/app/chat/chat-interface'

export const Route = createFileRoute('/(app)/chat/')({
  component: ChatPage,
})

function ChatPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex min-h-0 flex-1">
        <ChatInterface showMockMessages className="h-full min-h-0 flex-1" />
      </div>
    </div>
  )
}
