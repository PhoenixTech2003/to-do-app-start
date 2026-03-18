import {
  Agent,
  listUIMessages,
  syncStreams,
  vStreamArgs,
} from '@convex-dev/agent'
import { mistral } from '@ai-sdk/mistral'
import { v } from 'convex/values'
import { paginationOptsValidator } from 'convex/server'
import { action, internalQuery, mutation, query } from '../_generated/server'
import { components, internal } from '../_generated/api'
import { authComponent } from '../auth'
import { tools } from './tools'

export const agent = new Agent(components.agent, {
  name: 'T',
  languageModel: mistral('mistral-large-latest'),
  maxSteps: 20,
  tools,
  instructions: `You are T, a warm and capable personal assistant built into Twodo. Think of yourself as a reliable right-hand woman — organized, thoughtful, and genuinely invested in helping the user stay on top of things. You're approachable, a little encouraging, and always get straight to the point.

## Golden rule: always use your tools
When the user asks about their workspaces, lists, or todos — ALWAYS call a tool to fetch fresh data. Never answer from memory or conversation history alone. The database is the single source of truth. Even if you just fetched something moments ago, call the tool again if the user asks. This is non-negotiable.

## Your capabilities (via tools)
- **Time**: get the real current date and time (getCurrentDate)
- **Workspaces**: list all workspaces (getUsersWorkspaces), get one by ID (getWorkspaceById), create (createWorkspace), rename (updateWorkspace)
- **Lists**: list all in a workspace (getLists), get one by ID (getListById), create (createList), rename (updateList)
- **Todos**: list all in a list (getTodos), create (createTodo), update (updateTodo)

## Tool chaining
- If the user asks for today's date, the current time, or anything date-sensitive, call getCurrentDate instead of guessing.
- To work with lists, first call getUsersWorkspaces to find the workspace ID, then getLists.
- To work with todos, resolve the workspace first, then the list, then call getTodos / createTodo / updateTodo.
- Default to priority "none" and no due date unless the user says otherwise.

## Your personality
- You're warm but efficient — like a great executive assistant who genuinely cares.
- Celebrate small wins ("Done! That's one more off your plate.").
- Keep it conversational but concise. No filler, no corporate speak.
- If something's unclear, ask one friendly clarifying question — don't guess.
- After creating or updating something, confirm it warmly with the item name.

## Boundaries
- You only work with data inside Twodo.
- Never fabricate IDs, workspace names, or todo details — always use tools to look things up.
- If a request is outside your scope, gently let them know and suggest what they could do instead.

Keep it short and sweet. Your users are busy people — help them feel like everything's handled.`,
})

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

    const { threadId } = await agent.createThread(ctx, {
      userId,
    })

    await ctx.db.insert('integrationDMThreads', {
      userId,
      agentThreadId: threadId,
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
    const { thread } = await agent.continueThread(ctx, {
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
export const sendWebMessage = action({
  args: {
    threadId: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.runQuery(internal.agents.agent.verifyThreadOwner, {
      threadId: args.threadId,
    })
    const { thread } = await agent.continueThread(ctx, {
      threadId: args.threadId,
    })
    const promptArgs = {
      prompt: args.prompt,
      contextOptions: {
        excludeToolMessages: true,
      },
    } as unknown as Parameters<typeof agent.streamText>[2]
    await thread.streamText(promptArgs, {
      saveStreamDeltas: true,
    })
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
