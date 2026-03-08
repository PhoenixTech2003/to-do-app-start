'use node'

import { ToolLoopAgent } from 'ai'
import { v } from 'convex/values'
import { google } from '@ai-sdk/google'
import { internalAction } from '../_generated/server'
import { systemPrompt } from './prompts'
import { tools } from './tools'

export const T = internalAction({
  args: {
    messageBody: v.string(),
    usersName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agent = new ToolLoopAgent({
      model: google('gemma-3n-e4b-it'),
      instructions: systemPrompt(),
      tools: tools,
    })
    const { text } = await agent.generate({ prompt: args.messageBody })

    return text
  },
})
