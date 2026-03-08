'use node'

import { ToolLoopAgent } from 'ai'
import { v } from 'convex/values'
import { mistral } from '@ai-sdk/mistral'
import { internalAction } from '../_generated/server'
import { systemPrompt, userPrompt } from './prompts'
import { tools } from './tools'

export const T = internalAction({
  args: {
    messageBody: v.string(),
    usersName: v.optional(v.string()),
    userIntegrationId: v.string(),
  },
  handler: async (ctx, args) => {
    const agent = new ToolLoopAgent({
      model: mistral('mistral-large-latest'),
      instructions: systemPrompt(),
      tools: tools,
    })
    const { text } = await agent.generate({
      prompt: userPrompt(args.messageBody, args.userIntegrationId),
    })

    return text
  },
})
