import { createFileRoute } from '@tanstack/react-router'
import bot from '@/lib/bot'

export const Route = createFileRoute('/api/webhooks/telegram')({
  server: {
    handlers: {
      POST: async ({ request }) => bot.webhooks.telegram(request),
      GET: async ({ request }) => bot.webhooks.telegram(request),
    },
  },
})
