import { Chat, ConsoleLogger } from 'chat'
import { createWhatsAppAdapter } from '@chat-adapter/whatsapp'
import { createPostgresState } from '@chat-adapter/state-pg'

const bot = new Chat({
  userName: 'T',
  adapters: {
    whatsapp: createWhatsAppAdapter({
      apiVersion: 'v22.0', // use default; v22.0 may have compatibility issues
      logger: new ConsoleLogger('error'), // surface adapter activity and errors
    }),
  },
  state: createPostgresState(),
}).registerSingleton()

bot.onNewMention(async (thread, message) => {
  try {
    // Post first; subscribe after (per Chat SDK WhatsApp docs example)
    await thread.subscribe()
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
  try {
    await thread.post(`You said: ${message.text}`)
  } catch (error) {
    console.error('[bot] onSubscribedMessage error:', error)
  }
})

export default bot
