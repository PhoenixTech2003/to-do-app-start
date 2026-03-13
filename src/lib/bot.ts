import { Chat } from 'chat'
import { createMemoryState } from '@chat-adapter/state-memory'
import { createWhatsAppAdapter } from '@chat-adapter/whatsapp'

export const bot = new Chat({
  userName: 'T',
  adapters: {
    whatsapp: createWhatsAppAdapter(),
  },
  state: createMemoryState(),
})

bot.onNewMention(async (thread) => {
  await thread.subscribe()
  await thread.post('Hello bot v2 launched')
})
