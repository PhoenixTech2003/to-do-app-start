import { Chat, ConsoleLogger } from 'chat'
import { createWhatsAppAdapter } from '@chat-adapter/whatsapp'
import { createTelegramAdapter } from '@chat-adapter/telegram'
import { createPostgresState } from '@chat-adapter/state-pg'
import { api } from 'convex/_generated/api'
import { convex } from './convex-http'

const bot = new Chat({
  userName: 'T',
  adapters: {
    whatsapp: createWhatsAppAdapter({
      apiVersion: 'v25.0',
      logger: new ConsoleLogger('error'), // surface adapter activity and errors
    }),
    telegram: createTelegramAdapter({
      logger: new ConsoleLogger('error'), // surface adapter activity and errors
    }),
  },
  state: createPostgresState(),
}).registerSingleton()

async function handleIncomingChatMessage(
  thread: {
    adapter: { name: string }
    subscribe: () => void
    post: (message: string | { markdown: string }) => Promise<unknown>
  },
  message: {
    text: string
    author: { userId: string }
  },
) {
  thread.subscribe()

  try {
    const platform = thread.adapter.name as 'whatsapp' | 'telegram'
    const result = await convex.action(api.chat.actions.handleBotMessage, {
      platform,
      userIntegrationId: message.author.userId,
      prompt: message.text,
    })

    if (!result.body) return
    if (result.format === 'markdown') {
      await thread.post({ markdown: result.body })
      return
    }
    await thread.post(result.body)
  } catch (error) {
    console.error('[bot] incoming message error:', error)
    if (error instanceof Error) {
      console.error('[bot] error stack:', error.stack)
      console.error('[bot] error cause:', error.cause)
    }
    throw error
  }
}

bot.onNewMention(async (thread, message) => {
  await handleIncomingChatMessage(thread, message)
})

bot.onSubscribedMessage(async (thread, message) => {
  await handleIncomingChatMessage(thread, message)
})

export default bot
