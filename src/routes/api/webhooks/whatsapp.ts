import { createFileRoute } from '@tanstack/react-router'
import bot from '@/lib/bot'

export const Route = createFileRoute('/api/webhooks/whatsapp')({
  server: {
    handlers: {
      POST: async ({ request }) =>
        bot.getAdapter('whatsapp').handleWebhook(request),
      GET: async ({ request }) =>
        bot.getAdapter('whatsapp').handleWebhook(request),
    },
  },
})
