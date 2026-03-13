import { createFileRoute } from '@tanstack/react-router'
import { bot } from '@/lib/bot'

export const Route = createFileRoute('/api/webhooks/whatsapp')({
  server: {
    handlers: {
      POST: ({ request }) => bot.getAdapter('whatsapp').handleWebhook(request),
      GET: ({ request }) => bot.getAdapter('whatsapp').handleWebhook(request),
    },
  },
})
