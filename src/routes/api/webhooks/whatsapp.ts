import { createFileRoute } from '@tanstack/react-router'
import { bot } from '@/lib/bot'

export const Route = createFileRoute('/api/webhooks/whatsapp')({
  server: {
    handlers: {
      POST: ({ request }) => bot.webhooks.whatsapp(request),
      GET: ({ request }) => bot.webhooks.whatsapp(request),
    },
  },
})
