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

bot.onNewMention(async (thread, message) => {
  thread.subscribe()

  try {
    const platform = thread.adapter.name as 'whatsapp' | 'telegram' | 'web'
    const threadId = await convex.mutation(api.agents.agent.createAgentThread, {
      platform,
      userIntegrationId: message.author.userId,
    })
    const agentResponse = await convex.action(api.agents.agent.testAgent, {
      threadId,
      prompt: message.text,
    })
    await thread.post(agentResponse)
  } catch (error) {
    console.error('[bot] onNewMention error:', error)
    if (error instanceof Error) {
      console.error('[bot] error stack:', error.stack)
      console.error('[bot] error cause:', error.cause)
    }
    throw error // rethrow so adapter can surface it
  }
})

bot.onSubscribedMessage(async (thread, message) => {
  try {
    await thread.post(`You said: ${message.text}`)
  } catch (error) {
    console.error('[bot] onSubscribedMessage error:', error)
  }
})

export default bot
