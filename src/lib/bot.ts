import { Chat, ConsoleLogger } from 'chat'
import { createWhatsAppAdapter } from '@chat-adapter/whatsapp'
import { createTelegramAdapter } from '@chat-adapter/telegram'
import { createPostgresState } from '@chat-adapter/state-pg'
import { api } from 'convex/_generated/api'
import { convex } from './convex-http'

const INTEGRATION_MISSING_MESSAGE =
  'Please connect your Twodo account first. Visit https://twodo.skilldiggers.dev/integrations to link your account.'

const TELEGRAM_LINK_SUCCESS_MESSAGE =
  'Your Telegram account has been linked to Twodo successfully! You can now manage your tasks from here.'

const TELEGRAM_LINK_ERROR_MESSAGE =
  'Invalid or expired link token. Please generate a new one at https://twodo.skilldiggers.dev/integrations'

/** Regex to detect /link <token> command for account linking */
const LINK_COMMAND_REGEX = /^\s*\/link\s+(\S+)\s*$/

async function handleTelegramLinkCommand(
  thread: { post: (msg: string) => Promise<unknown> },
  messageText: string,
  telegramUserId: string,
): Promise<boolean> {
  const match = messageText.trim().match(LINK_COMMAND_REGEX)
  if (!match) return false

  const token = match[1].trim()
  try {
    await convex.mutation(api.integrations.mutations.linkTelegramWithToken, {
      token,
      telegramUserId,
    })
    await thread.post(TELEGRAM_LINK_SUCCESS_MESSAGE)
  } catch {
    await thread.post(TELEGRAM_LINK_ERROR_MESSAGE)
  }
  return true
}

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

    if (platform === 'telegram') {
      const handled = await handleTelegramLinkCommand(
        thread,
        message.text,
        message.author.userId,
      )
      if (handled) return
    }

    const result = await convex.mutation(api.agents.agent.createAgentThread, {
      platform,
      userIntegrationId: message.author.userId,
    })

    if (!result.success) {
      await thread.post(INTEGRATION_MISSING_MESSAGE)
      return
    }

    const agentResponse = await convex.action(api.agents.agent.testAgent, {
      threadId: result.threadId,
      prompt: message.text,
      platform,
    })
    if (agentResponse) await thread.post(agentResponse)
  } catch (error) {
    console.error('[bot] onNewMention error:', error)
    if (error instanceof Error) {
      console.error('[bot] error stack:', error.stack)
      console.error('[bot] error cause:', error.cause)
    }
    throw error
  }
})

bot.onSubscribedMessage(async (thread, message) => {
  thread.subscribe()

  try {
    const platform = thread.adapter.name as 'whatsapp' | 'telegram' | 'web'

    if (platform === 'telegram') {
      const handled = await handleTelegramLinkCommand(
        thread,
        message.text,
        message.author.userId,
      )
      if (handled) return
    }

    const result = await convex.mutation(api.agents.agent.createAgentThread, {
      platform,
      userIntegrationId: message.author.userId,
    })

    if (!result.success) {
      await thread.post(INTEGRATION_MISSING_MESSAGE)
      return
    }

    const agentResponse = await convex.action(api.agents.agent.testAgent, {
      threadId: result.threadId,
      prompt: message.text,
      platform,
    })
    if (agentResponse) await thread.post(agentResponse)
  } catch (error) {
    console.error('[bot] onSubscribedMessage error:', error)
    if (error instanceof Error) {
      console.error('[bot] error stack:', error.stack)
      console.error('[bot] error cause:', error.cause)
    }
    throw error
  }
})

export default bot
