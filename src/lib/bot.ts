import { Chat, ConsoleLogger } from 'chat'
import { createWhatsAppAdapter } from '@chat-adapter/whatsapp'
import { createTelegramAdapter } from '@chat-adapter/telegram'
import { createRedisState } from '@chat-adapter/state-redis'

const bot = new Chat({
  userName: 'T',
  adapters: {
    whatsapp: createWhatsAppAdapter({
      logger: new ConsoleLogger('error'), // surface adapter activity and errors
    }),
    telegram: createTelegramAdapter({
      logger: new ConsoleLogger('error'), // surface adapter activity and errors
    }),
  },
  state: createRedisState(),
}).registerSingleton()

bot.onNewMention(async (thread, message) => {
  thread.subscribe()
  console.log('Fired new mention')
  try {
    await thread.post('Hello from T!')
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
  console.log('Fired subscribed message')
  try {
    await thread.post(`You said: ${message.text}`)
  } catch (error) {
    console.error('[bot] onSubscribedMessage error:', error)
  }
})

export default bot
