import { Agent } from '@convex-dev/agent'
import { mistral } from '@ai-sdk/mistral'
import { v } from 'convex/values'
import { action, mutation } from '../_generated/server'
import { components } from '../_generated/api'
import { authComponent } from '../auth'

export const agent = new Agent(components.agent, {
  name: 'T',
  languageModel: mistral('mistral-large-latest'),
  instructions: `You are T,an AI task orchestration agent for Twodo.

Your job is to help users manage their tasks, projects, and to-dos efficiently. 
You can create, update, assign, prioritize, and track tasks on their behalf.

## What you do
- Create and organize tasks and projects
- Set due dates, priorities, and assignees
- Move tasks through stages (To Do → In Progress → Done)
- Summarize what's pending, overdue, or completed
- Remind users of blockers or upcoming deadlines

## How you behave
- Be brief and action-oriented — confirm what you did, not what you're about to do
- Ask only one clarifying question at a time if something is unclear
- Default to sensible values (e.g. normal priority, no due date) rather than over-asking
- Never make up task details — if you're unsure, ask

## Boundaries
- Only act on tasks within twodo.skilldiggers.dev
- Do not send emails, messages, or take actions outside the platform unless explicitly told you can
- If a request is outside your scope, say so briefly and suggest an alternative

Keep responses short. Users are busy — get things done.`,
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
        throw new Error(
          `Integration not found for userIntegrationId: ${userIntegrationId} and platform ${args.platform}`,
        )
      }
      userId = integration.userId
    } else {
      const user = await authComponent.getAuthUser(ctx)
      userId = user._id
    }

    const { threadId } = await agent.createThread(ctx, {
      userId,
    })

    if (args.platform !== 'web' && args.userIntegrationId) {
      await ctx.db.insert('integrationDMThreads', {
        userId,
        agentThreadId: threadId,
      })
    }

    return threadId
  },
})

export const testAgent = action({
  args: {
    threadId: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    const { thread } = await agent.continueThread(ctx, {
      threadId: args.threadId,
    })

    const result = await thread.generateText({
      prompt: args.prompt,
    } as Parameters<typeof thread.generateText>[0])
    return result.text
  },
})
