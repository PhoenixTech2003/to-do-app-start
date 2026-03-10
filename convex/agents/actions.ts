'use node'

import { ToolLoopAgent } from 'ai'
import { v } from 'convex/values'
import { mistral } from '@ai-sdk/mistral'
import { supermemoryTools } from '@supermemory/tools/ai-sdk'
import { internalAction } from '../_generated/server'
import { api } from '../_generated/api'
import { systemPrompt, userPrompt } from './prompts'
import { tools } from './tools'
import type { Doc } from '../_generated/dataModel'
import type { ToolSet } from 'ai'

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

    const agentTools: ToolSet = {
      ...tools,
      ...(supermemoryTools(process.env.SUPERMEMORY_API_KEY!, {
        containerTags: [integration.userId],
      }) as ToolSet),
    }
    const agent = new ToolLoopAgent({
      model: mistral('mistral-medium-latest'),
      instructions: systemPrompt(),
      tools: agentTools,
    })
    const result = await agent.generate({
      prompt: userPrompt(args.messageBody, args.userIntegrationId),
    })
    return result.text
  },
})
