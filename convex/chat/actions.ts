import { v } from 'convex/values'
import { api, internal } from '../_generated/api'
import { action } from '../_generated/server'
import { processIncomingChatMessage } from './router'
import type { Id } from '../_generated/dataModel'
import type { BotResponse, ChatCommandServices, ChatPlatform } from './types'

const INTEGRATION_MISSING_MESSAGE =
  'Please connect your Twodo account first. Visit https://twodo.skilldiggers.dev/integrations to link your account.'

const platformValidator = v.union(v.literal('whatsapp'), v.literal('telegram'))

export const handleBotMessage = action({
  args: {
    platform: platformValidator,
    userIntegrationId: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    const threadResult = await ctx.runMutation(
      api.agents.agent.createAgentThread,
      {
        platform: args.platform,
        userIntegrationId: args.userIntegrationId,
      },
    )

    if (!threadResult.success) {
      return {
        format: 'text' as const,
        body: INTEGRATION_MISSING_MESSAGE,
      }
    }

    const userId = threadResult.userId
    const threadId = threadResult.threadId

    const services: ChatCommandServices = {
      getSessionContext: async () =>
        await ctx.runQuery(internal.chat.queries.getSessionContext, {
          userId,
          platform: args.platform,
        }),
      saveSessionContext: async (update) => {
        const payload: {
          userId: string
          platform: ChatPlatform
          activeWorkspaceId?: Id<'workspace'> | null
          activeListId?: Id<'lists'> | null
          todos?: Array<{
            id: string
            name: string
            due: string | null
            priority: 'high' | 'medium' | 'low' | null
            completed: boolean
          }>
        } = {
          userId,
          platform: args.platform,
        }

        if ('activeWorkspaceId' in update) {
          payload.activeWorkspaceId =
            update.activeWorkspaceId as Id<'workspace'> | null
        }
        if ('activeListId' in update) {
          payload.activeListId = update.activeListId as Id<'lists'> | null
        }
        if (update.todos) {
          payload.todos = update.todos
        }

        await ctx.runMutation(
          internal.chat.mutations.saveSessionContext,
          payload,
        )
      },
      listWorkspaces: async () =>
        await ctx.runQuery(internal.chat.queries.listWorkspaces, { userId }),
      findLists: async (workspaceId) =>
        await ctx.runQuery(internal.chat.queries.listLists, {
          userId,
          workspaceId: workspaceId
            ? (workspaceId as Id<'workspace'>)
            : undefined,
        }),
      listTodos: async (filters) =>
        await ctx.runQuery(internal.chat.queries.listTodos, {
          userId,
          listId: filters.listId ? (filters.listId as Id<'lists'>) : undefined,
          workspaceId: filters.workspaceId
            ? (filters.workspaceId as Id<'workspace'>)
            : undefined,
          due: filters.due ?? undefined,
          dueBefore: filters.dueBefore ?? undefined,
          priority: filters.priority ?? undefined,
          completed: filters.completed,
        }),
      getTodoById: async (todoId) =>
        await ctx.runQuery(internal.chat.queries.getTodoById, {
          userId,
          todoId: todoId as Id<'todos'>,
        }),
      createWorkspace: async (name) =>
        await ctx.runMutation(internal.chat.mutations.createWorkspace, {
          userId,
          name,
        }),
      createList: async (input) =>
        await ctx.runMutation(internal.chat.mutations.createList, {
          userId,
          name: input.name,
          workspaceId: input.workspaceId as Id<'workspace'>,
        }),
      createTodo: async (input) =>
        await ctx.runMutation(internal.chat.mutations.createTodo, {
          userId,
          name: input.name,
          due: input.due ?? undefined,
          priority: input.priority,
          listId: input.listId ? (input.listId as Id<'lists'>) : null,
        }),
      updateTodo: async (input) =>
        await ctx.runMutation(internal.chat.mutations.updateTodo, {
          userId,
          todoId: input.todoId as Id<'todos'>,
          name: input.name,
          due: input.due,
          priority: input.priority,
          listId:
            'listId' in input
              ? input.listId
                ? (input.listId as Id<'lists'>)
                : null
              : undefined,
        }),
      setTodoStatus: async (input) =>
        await ctx.runMutation(internal.chat.mutations.setTodoStatus, {
          userId,
          todoId: input.todoId as Id<'todos'>,
          status: input.status,
        }),
      deleteTodo: async (todoId) =>
        await ctx.runMutation(internal.chat.mutations.deleteTodo, {
          userId,
          todoId: todoId as Id<'todos'>,
        }),
      linkTelegram: async (token) => {
        try {
          await ctx.runMutation(
            api.integrations.mutations.linkTelegramWithToken,
            {
              token,
              telegramUserId: args.userIntegrationId,
            },
          )
          return true
        } catch {
          return false
        }
      },
      aiFallback: async (prompt): Promise<BotResponse> => ({
        format: 'markdown',
        body: await ctx.runAction(api.agents.agent.sendBotMessage, {
          threadId,
          prompt,
          platform: args.platform,
        }),
      }),
    }

    const result = await processIncomingChatMessage({
      prompt: args.prompt,
      platform: args.platform,
      services,
    })

    return result.response
  },
})
