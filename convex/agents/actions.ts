'use node'

import { ToolLoopAgent } from 'ai'
import { v } from 'convex/values'
import { createMem0 } from '@mem0/vercel-ai-provider'
import { internalAction } from '../_generated/server'
import { api } from '../_generated/api'
import { systemPrompt, userPrompt } from './prompts'
import { tools } from './tools'
import type { Doc } from '../_generated/dataModel'

export const processMessage = internalAction({
  args: {
    messageBody: v.string(),
    usersName: v.optional(v.string()),
    userIntegrationId: v.string(),
  },
  handler: async (ctx, args): Promise<string> => {
    const integration: Doc<'integrations'> | null = await ctx.runQuery(
      api.integrations.queries.getIntegration,
      {
        userIntegrationId: args.userIntegrationId,
        accessToken: process.env.ACCESS_TOKEN!,
      },
    )
    if (!integration) {
      return 'This integration is not available. Please activate it in your dashboard at https://twodo.skilldiggers.dev/integrations to start using this feature.'
    }
    const mem0 = createMem0({
      provider: 'mistral',
      mem0ApiKey: process.env.MEM0_API_KEY,
      apiKey: process.env.MISTRAL_API_KEY,
    })
    const agent = new ToolLoopAgent({
      model: mem0('mistral-medium-latest', { user_id: integration.userId }),
      instructions: systemPrompt(),
      tools,
    })
    const result = await agent.generate({
      prompt: userPrompt(args.messageBody, args.userIntegrationId),
    })
    return result.text
  },
})
