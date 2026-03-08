'use node'

import { ToolLoopAgent } from 'ai'
import { v } from 'convex/values'
import { internalAction } from '../_generated/server'
import { testPrompt } from './prompts'

export const T = internalAction({
  args: {
    messageBody: v.string(),
    usersName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agent = new ToolLoopAgent({
      model: 'google/gemma-3n-e4b-it',
      instructions: testPrompt(),
    })
    const { text } = await agent.generate({ prompt: args.messageBody })

    return text
  },
})
