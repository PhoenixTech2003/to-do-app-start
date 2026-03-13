import { Chat, ConsoleLogger } from 'chat'
import { createMemoryState } from '@chat-adapter/state-memory'
import { createWhatsAppAdapter } from '@chat-adapter/whatsapp'

const bot = new Chat({
  userName: 'T',
  adapters: {
    whatsapp: createWhatsAppAdapter({
      apiVersion: 'v21.0', // use default; v22.0 may have compatibility issues
      logger: new ConsoleLogger('debug'), // surface adapter activity and errors
    }),
  },
  state: createMemoryState(),
}).registerSingleton()

bot.onNewMention(async (thread, message) => {
  try {
    // Post first; subscribe after (per Chat SDK WhatsApp docs example)
    await thread.post('Hello from T!')
    await thread.subscribe()
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
