import {
  Agent,
  listUIMessages,
  syncStreams,
  vStreamArgs,
} from '@convex-dev/agent'
import { v } from 'convex/values'
import { paginationOptsValidator } from 'convex/server'
import {
  action,
  internalAction,
  internalQuery,
  mutation,
  query,
} from '../_generated/server'
import { components, internal } from '../_generated/api'
import { authComponent } from '../auth'
import { tools } from './tools'
import { systemPrompt } from './system_prompt'

function getAgent({ platform }: { platform: 'web' | 'whatsapp' | 'telegram' }) {
  return new Agent(components.agent, {
    name: 'T',
    languageModel: 'deepseek/deepseek-v3.2',
    maxSteps: 20,
    tools,
    instructions: systemPrompt(platform),
  })
}

export const createAgentThread = mutation({
  args: {
    userIntegrationId: v.optional(v.string()),
    platform: v.union(
      v.literal('web'),
      v.literal('whatsapp'),
      v.literal('telegram'),
    ),
  },
  handler: async (ctx, args) => {
    let userId: string
    if (args.userIntegrationId && args.platform !== 'web') {
      const userIntegrationId = args.userIntegrationId
      const integration = await ctx.db
        .query('integrations')
        .withIndex('by_userIntegrationId', (q) =>
          q.eq('userIntegrationId', userIntegrationId),
        )
        .first()

      if (!integration) {
        return { success: false as const, reason: 'integration_not_found' }
      }
      userId = integration.userId

      const existingThread = await ctx.db
        .query('integrationDMThreads')
        .withIndex('by_userId', (q) => q.eq('userId', userId))
        .first()

      if (existingThread) {
        return {
          success: true as const,
          threadId: existingThread.agentThreadId,
        }
      }
    } else {
      const user = await authComponent.getAuthUser(ctx)
      userId = user._id

      const existingThread = await ctx.db
        .query('integrationDMThreads')
        .withIndex('by_userId', (q) => q.eq('userId', userId))
        .first()

      if (existingThread) {
        return {
          success: true as const,
          threadId: existingThread.agentThreadId,
        }
      }
    }

    const { threadId } = await getAgent({
      platform: args.platform,
    }).createThread(ctx, {
      userId,
    })

    await ctx.db.insert('integrationDMThreads', {
      userId,
      agentThreadId: threadId,
      platform: args.platform,
    })

    return { success: true as const, threadId }
  },
})

const platformValidator = v.union(
  v.literal('web'),
  v.literal('whatsapp'),
  v.literal('telegram'),
)

/**
 * Bot-only: used by WhatsApp / Telegram integrations.
 * Returns the generated text so the bot adapter can relay it.
 */
export const sendBotMessage = action({
  args: {
    threadId: v.string(),
    prompt: v.string(),
    platform: platformValidator,
  },
  handler: async (ctx, args) => {
    const { thread } = await getAgent({
      platform: args.platform,
    }).continueThread(ctx, {
      threadId: args.threadId,
    })
    const promptArgs = {
      prompt: args.prompt,
      contextOptions: {
        excludeToolMessages: true,
      },
    } as unknown as Parameters<typeof thread.generateText>[0]
    const result = await thread.generateText(promptArgs)
    return result.text
  },
})

export const verifyThreadOwner = internalQuery({
  args: { threadId: v.string() },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    const thread = await ctx.db
      .query('integrationDMThreads')
      .withIndex('by_agentThreadId', (q) =>
        q.eq('agentThreadId', args.threadId),
      )
      .first()
    if (thread?.userId !== user._id) {
      throw new Error('You are not the owner of this thread')
    }
  },
})

/**
 * Web-only: streams the response with saveStreamDeltas so the client
 * receives live updates via the reactive listWebMessages query.
 */
export const sendWebMessageSync = action({
  args: {
    threadId: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.runQuery(internal.agents.agent.verifyThreadOwner, {
      threadId: args.threadId,
    })
    const agent = getAgent({ platform: 'web' })
    const { thread } = await agent.continueThread(ctx, {
      threadId: args.threadId,
    })
    const promptArgs = {
      prompt: args.prompt,
      contextOptions: {
        excludeToolMessages: true,
      },
    } as unknown as Parameters<typeof agent.streamText>[2]
    await thread.streamText(promptArgs)
  },
})

export const sendWebMessage = mutation({
  args: { prompt: v.string(), threadId: v.string() },
  handler: async (ctx, { prompt, threadId }) => {
    await ctx.runQuery(internal.agents.agent.verifyThreadOwner, {
      threadId,
    })
    const agent = getAgent({ platform: 'web' })
    const { messageId } = await agent.saveMessage(ctx, {
      threadId,
      prompt,
      // we're in a mutation, so skip embeddings for now. They'll be generated
      // lazily when streaming text.
      skipEmbeddings: true,
    })
    await ctx.scheduler.runAfter(0, internal.agents.agent.streamAsync, {
      threadId,
      promptMessageId: messageId,
    })
  },
})

export const streamAsync = internalAction({
  args: { promptMessageId: v.string(), threadId: v.string() },
  handler: async (ctx, { promptMessageId, threadId }) => {
    const agent = getAgent({ platform: 'web' })
    const result = await agent.streamText(
      ctx,
      { threadId },
      { promptMessageId } as unknown as Parameters<typeof agent.streamText>[2],
      // more custom delta options (`true` uses defaults)
      { saveStreamDeltas: { chunking: 'word', throttleMs: 100 } },
    )
    // We need to make sure the stream finishes - by awaiting each chunk
    // or using this call to consume it all.
    await result.consumeStream()
  },
})

/**
 * Web-only: returns UIMessages (richer than raw MessageDocs) plus
 * streaming deltas — designed for useUIMessages on the client.
 */
export const listWebMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  handler: async (ctx, args) => {
    const loggedInUser = await authComponent.getAuthUser(ctx)
    const integrationDMThread = await ctx.db
      .query('integrationDMThreads')
      .withIndex('by_agentThreadId', (q) =>
        q.eq('agentThreadId', args.threadId),
      )
      .first()
    if (integrationDMThread?.userId !== loggedInUser._id) {
      throw new Error('You are not the owner of the thread')
    }

    const paginated = await listUIMessages(ctx, components.agent, {
      threadId: args.threadId,
      paginationOpts: args.paginationOpts,
    })

    const streams = await syncStreams(ctx, components.agent, {
      threadId: args.threadId,
      streamArgs: args.streamArgs,
    })

    return { ...paginated, streams }
  },
})

export const getUserWebThread = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx)
    const thread = await ctx.db
      .query('integrationDMThreads')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .first()
    return thread ? { threadId: thread.agentThreadId } : null
  },
})
