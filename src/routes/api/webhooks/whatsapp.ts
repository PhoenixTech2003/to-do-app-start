import { createFileRoute } from '@tanstack/react-router'
import bot from '@/lib/bot'

export const Route = createFileRoute('/api/webhooks/whatsapp')({
  server: {
    handlers: {
      POST: async ({ request }) => bot.webhooks.whatsapp(request),
      GET: async ({ request }) => bot.webhooks.whatsapp(request),
    },
  },
})
