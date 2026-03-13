import { Chat } from 'chat'
import { createMemoryState } from '@chat-adapter/state-memory'
import { createWhatsAppAdapter } from '@chat-adapter/whatsapp'

const bot = new Chat({
  userName: 'T',
  adapters: {
    whatsapp: createWhatsAppAdapter(),
  },
  state: createMemoryState(),
}).registerSingleton()

bot.onNewMention(async (thread, message) => {
  console.log('new mention', thread)
  try {
    await thread.subscribe()
    if (thread.isDM) {
      const dmThread = await bot.openDM(message.author.userId)
      await dmThread.post('Hello T v2 launched')
    }
  } catch (error) {
    console.error('error in new mention', error)
  }
})

export default bot
