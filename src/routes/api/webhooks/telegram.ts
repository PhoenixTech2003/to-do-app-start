import { createFileRoute } from '@tanstack/react-router'
import { waitUntil } from '@vercel/functions'
import bot from '@/lib/bot'

export const Route = createFileRoute('/api/webhooks/telegram')({
  server: {
    handlers: {
      POST: async ({ request }) =>
        bot.webhooks.telegram(request, {
          waitUntil: (task) => waitUntil(task),
        }),
      GET: async ({ request }) =>
        bot.webhooks.telegram(request, {
          waitUntil: (task) => waitUntil(task),
        }),
    },
  },
})
