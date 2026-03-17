import { createTool } from '@convex-dev/agent'
import { z } from 'zod'
import { api } from '../_generated/api'
import type { Id } from '../_generated/dataModel'

const getCurrentDate = createTool({
  description:
    'Returns the current real date and time. Use this whenever the user asks for today, the current date, current time, day of the week, or anything time-sensitive.',
  args: z.object({}),
  handler: async (): Promise<string> => {
    await Promise.resolve()
    const now = new Date()

    const humanReadable = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    }).format(now)

    return `Current date and time: ${humanReadable}. ISO: ${now.toISOString()}.`
  },
})

const getUsersWorkspaces = createTool({
  description:
    "Returns a list of all workspaces the user has access to. Use this when asked to list or show the user's workspaces.",
  args: z.object({}),
  handler: async (ctx): Promise<string> => {
    try {
      const workspaces = await ctx.runQuery(
        api.agents.workspaces.queries.getUserWorkspaces,
        { userId: ctx.userId!, accessToken: process.env.ACCESS_TOKEN! },
      )
      if (!workspaces.length) return 'The user has no workspaces yet.'
      return workspaces
        .map(
          (w: { _id: string; title: string }) =>
            `- "${w.title}" (id: ${w._id})`,
        )
        .join('\n')
    } catch {
      return 'Failed to fetch workspaces. Please try again.'
    }
  },
})

const createWorkspace = createTool({
  description:
    'Creates a new workspace for the user. Use this when asked to create a new workspace.',
  args: z.object({
    title: z.string().describe('The title for the new workspace'),
  }),
  handler: async (ctx, args): Promise<string> => {
    try {
      const workspaceId = await ctx.runMutation(
        api.agents.workspaces.mutations.createWorkspace,
        {
          userId: ctx.userId!,
          accessToken: process.env.ACCESS_TOKEN!,
          title: args.title,
        },
      )
      return `Created workspace "${args.title}" (id: ${workspaceId}).`
    } catch {
      return `Failed to create workspace "${args.title}". Please try again.`
    }
  },
})

const updateWorkspace = createTool({
  description:
    'Updates the title of a workspace. Use this when asked to rename or update a workspace.',
  args: z.object({
    workspaceId: z.string().describe('The ID of the workspace to update'),
    title: z.string().describe('The new title for the workspace'),
  }),
  handler: async (ctx, args): Promise<string> => {
    try {
      await ctx.runMutation(api.agents.workspaces.mutations.updateWorkspace, {
        userId: ctx.userId!,
        accessToken: process.env.ACCESS_TOKEN!,
        workspaceId: args.workspaceId as Id<'workspace'>,
        title: args.title,
      })
      return `Renamed workspace to "${args.title}".`
    } catch {
      return `Failed to rename workspace. Please try again.`
    }
  },
})

const getWorkspaceById = createTool({
  description:
    'Returns a workspace by its ID. Call getUsersWorkspaces first to discover workspace IDs.',
  args: z.object({
    workspaceId: z.string().describe('The ID of the workspace to retrieve'),
  }),
  handler: async (ctx, args): Promise<string> => {
    try {
      const workspace = await ctx.runQuery(
        api.agents.workspaces.queries.getWorkspaceById,
        {
          userId: ctx.userId!,
          accessToken: process.env.ACCESS_TOKEN!,
          workspaceId: args.workspaceId as Id<'workspace'>,
        },
      )
      if (!workspace) return 'Workspace not found.'
      return `Workspace: "${workspace.title}" (id: ${workspace._id})`
    } catch {
      return 'Failed to fetch workspace. Please try again.'
    }
  },
})

const createList = createTool({
  description:
    'Creates a new list inside a workspace. Call getUsersWorkspaces first to identify the workspace ID.',
  args: z.object({
    title: z.string().describe('The title for the new list'),
    workspaceId: z.string().describe('The workspace ID to create the list in'),
  }),
  handler: async (ctx, args): Promise<string> => {
    try {
      const listId = await ctx.runMutation(
        api.agents.lists.mutations.createList,
        {
          userId: ctx.userId!,
          accessToken: process.env.ACCESS_TOKEN!,
          workspaceId: args.workspaceId as Id<'workspace'>,
          title: args.title,
        },
      )
      return `Created list "${args.title}" (id: ${listId}).`
    } catch {
      return `Failed to create list "${args.title}". Please try again.`
    }
  },
})

const updateList = createTool({
  description:
    'Updates the title of a list. Call getLists first to identify the list ID.',
  args: z.object({
    listId: z.string().describe('The ID of the list to update'),
    title: z.string().describe('The new title for the list'),
  }),
  handler: async (ctx, args): Promise<string> => {
    try {
      await ctx.runMutation(api.agents.lists.mutations.updateList, {
        userId: ctx.userId!,
        accessToken: process.env.ACCESS_TOKEN!,
        listId: args.listId as Id<'lists'>,
        title: args.title,
      })
      return `Renamed list to "${args.title}".`
    } catch {
      return `Failed to rename list. Please try again.`
    }
  },
})

const getLists = createTool({
  description:
    'Returns all lists in a workspace. Call getUsersWorkspaces first to identify the workspace ID.',
  args: z.object({
    workspaceId: z.string().describe('The workspace ID to list lists for'),
  }),
  handler: async (ctx, args): Promise<string> => {
    try {
      const lists = await ctx.runQuery(api.agents.lists.queries.getLists, {
        userId: ctx.userId!,
        accessToken: process.env.ACCESS_TOKEN!,
        workspaceId: args.workspaceId as Id<'workspace'>,
      })
      if (!lists.length) return 'This workspace has no lists yet.'
      return lists
        .map(
          (l: { _id: string; title: string }) =>
            `- "${l.title}" (id: ${l._id})`,
        )
        .join('\n')
    } catch {
      return 'Failed to fetch lists. Please try again.'
    }
  },
})

const getListById = createTool({
  description:
    'Returns a list by its ID. Call getLists first to discover list IDs.',
  args: z.object({
    listId: z.string().describe('The ID of the list to retrieve'),
  }),
  handler: async (ctx, args): Promise<string> => {
    try {
      const list = await ctx.runQuery(api.agents.lists.queries.getListById, {
        userId: ctx.userId!,
        accessToken: process.env.ACCESS_TOKEN!,
        listId: args.listId as Id<'lists'>,
      })
      return `List: "${list.title}" (id: ${list._id})`
    } catch {
      return 'Failed to fetch list. Please try again.'
    }
  },
})

const getTodos = createTool({
  description:
    'Returns all todos in a list. Call getLists first to identify the list ID.',
  args: z.object({
    listId: z.string().describe('The list ID to get todos for'),
  }),
  handler: async (ctx, args): Promise<string> => {
    try {
      const todos = await ctx.runQuery(api.agents.todos.queries.getTodos, {
        userId: ctx.userId!,
        accessToken: process.env.ACCESS_TOKEN!,
        listId: args.listId as Id<'lists'>,
      })
      if (!todos.length) return 'This list has no todos yet.'
      return todos
        .map(
          (t: {
            _id: string
            title: string
            status: string
            priority: string
            dueDate?: string
            description?: string
          }) => {
            const parts = [`- "${t.title}"`]
            parts.push(`[${t.status}]`)
            if (t.priority !== 'none') parts.push(`priority: ${t.priority}`)
            if (t.dueDate) parts.push(`due: ${t.dueDate}`)
            parts.push(`(id: ${t._id})`)
            return parts.join(' ')
          },
        )
        .join('\n')
    } catch {
      return 'Failed to fetch todos. Please try again.'
    }
  },
})

const createTodoTool = createTool({
  description:
    'Creates a new todo in a list. Call getLists first to identify the list ID.',
  args: z.object({
    listId: z.string().describe('The list ID to create the todo in'),
    title: z.string().describe('The title of the todo'),
    description: z.string().optional().describe('Optional description'),
    dueDate: z.string().optional().describe('Optional due date as ISO string'),
    priority: z
      .enum(['high', 'medium', 'low', 'none'])
      .describe('Priority level'),
    scheduledFuntionRunTime: z
      .number()
      .optional()
      .describe('Optional timestamp for overdue scheduling'),
  }),
  handler: async (ctx, args): Promise<string> => {
    try {
      const todoId = await ctx.runMutation(
        api.agents.todos.mutations.createTodo,
        {
          userId: ctx.userId!,
          accessToken: process.env.ACCESS_TOKEN!,
          listId: args.listId as Id<'lists'>,
          title: args.title,
          description: args.description,
          dueDate: args.dueDate,
          priority: args.priority,
          scheduledFuntionRunTime: args.scheduledFuntionRunTime,
        },
      )
      const details = [`Created todo "${args.title}" (id: ${todoId})`]
      if (args.priority !== 'none') details.push(`priority: ${args.priority}`)
      if (args.dueDate) details.push(`due: ${args.dueDate}`)
      return details.join(', ') + '.'
    } catch {
      return `Failed to create todo "${args.title}". Please try again.`
    }
  },
})

const updateTodoTool = createTool({
  description:
    'Updates an existing todo. Call getTodos first to identify the todo ID.',
  args: z.object({
    todoId: z.string().describe('The ID of the todo to update'),
    title: z.string().describe('The new title'),
    description: z.string().optional().describe('Optional new description'),
    dueDate: z
      .string()
      .optional()
      .describe('Optional new due date as ISO string'),
    priority: z
      .enum(['high', 'medium', 'low', 'none'])
      .describe('Priority level'),
    scheduledFuntionRunTime: z
      .number()
      .optional()
      .describe('Optional timestamp for overdue scheduling'),
  }),
  handler: async (ctx, args): Promise<string> => {
    try {
      await ctx.runMutation(api.agents.todos.mutations.updateTodo, {
        userId: ctx.userId!,
        accessToken: process.env.ACCESS_TOKEN!,
        todoId: args.todoId as Id<'todos'>,
        title: args.title,
        description: args.description,
        dueDate: args.dueDate,
        priority: args.priority,
        scheduledFunctionRunTime: args.scheduledFuntionRunTime,
      })
      return `Updated todo to "${args.title}".`
    } catch {
      return `Failed to update todo. Please try again.`
    }
  },
})

export const tools = {
  getCurrentDate,
  getUsersWorkspaces,
  createWorkspace,
  updateWorkspace,
  getWorkspaceById,
  createList,
  getLists,
  updateList,
  getListById,
  getTodos,
  createTodo: createTodoTool,
  updateTodo: updateTodoTool,
}
