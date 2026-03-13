import { Chat } from 'chat'
import { createMemoryState } from '@chat-adapter/state-memory'
import { createWhatsAppAdapter } from '@chat-adapter/whatsapp'

const bot = new Chat({
  userName: 'T',
  adapters: {
    whatsapp: createWhatsAppAdapter({
      apiVersion: 'v22.0',
    }),
  },
  state: createMemoryState(),
}).registerSingleton()

bot.onNewMention(async (thread, message) => {
  try {
    await thread.subscribe()
    if (thread.isDM) {
      console.log(message)
      await thread.post('Hello T v2 launched')
    }
  } catch (error) {
    console.error('error in new mention', error)
  }
})

export default bot
