import { Chat } from 'chat'
import { createMemoryState } from '@chat-adapter/state-memory'
import { createWhatsAppAdapter } from '@chat-adapter/whatsapp'

export const bot = new Chat({
  userName: 'T',
  adapters: {
    whatsapp: createWhatsAppAdapter(),
  },
  state: createMemoryState(),
}).registerSingleton()

bot.onNewMention(async (thread) => {
  await thread.subscribe()
  await thread.post('Hello T v2 launched')
})
