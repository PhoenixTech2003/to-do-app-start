import { tool } from 'ai'
import { z } from 'zod'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../_generated/api'
import type { ToolSet } from 'ai'
import type { Id } from '../_generated/dataModel'

const convex = new ConvexHttpClient(process.env.CONVEX_DEPLOYMENT_URL!)

const verifyIntegration = tool({
  description: `Verifies whether the interface or platform the user is currently 
operating on has been connected and configured to support T's actions. Use this tool before 
carrying out any operation that depends on an external integration to confirm access is 
available before proceeding, extract the userIntegrationId from the input.`,
  inputSchema: z.object({ userIntegrationId: z.string() }),
  execute: async ({ userIntegrationId }) => {
    const accessToken = process.env.ACCESS_TOKEN!
    const integration = await convex.query(
      api.integrations.queries.getIntegration,
      { userIntegrationId, accessToken },
    )
    if (!integration) {
      return {
        success: false,
        data: null,
        message:
          'Integration not found please activate in the dashboard at https://twodo.skilldiggers.dev',
      }
    }
    return {
      success: true,
      data: null,
      message: null,
    }
  },
})

const getUsersWorkspaces = tool({
  description: `Returns a list of all workspaces the user has access to. use this when asked to list the users' workspaces`,
  inputSchema: z.object({ userIntegrationId: z.string() }),
  execute: async ({ userIntegrationId }) => {
    const accessToken = process.env.ACCESS_TOKEN!
    const integration = await convex.query(
      api.integrations.queries.getIntegration,
      { userIntegrationId, accessToken },
    )
    if (!integration) {
      return {
        success: false,
        data: [],
        message:
          'Integration not found please activate in the dashboard at https://twodo.skilldiggers.dev/integrations',
      }
    }

    const workspaces = await convex.query(
      api.agents.workspaces.queries.getUserWorkspaces,
      {
        accessToken,
        userId: integration.userId,
      },
    )

    return {
      success: true,
      data: workspaces.map((workspace) => ({
        ...workspace,
        _creationTime: new Date(workspace._creationTime),
      })),
      message: null,
    }
  },
})

const createWorkspace = tool({
  description: `Creates a new workspace for the user. use this when asked to create a new workspace`,
  inputSchema: z.object({ userIntegrationId: z.string(), title: z.string() }),
  execute: async ({ userIntegrationId, title }) => {
    const accessToken = process.env.ACCESS_TOKEN!
    const integration = await convex.query(
      api.integrations.queries.getIntegration,
      { userIntegrationId, accessToken },
    )
    if (!integration) {
      return {
        success: false,
        data: null,
        message:
          'Integration not found please activate in the dashboard at https://twodo.skilldiggers.dev/integrations',
      }
    }
    const workspace = await convex.mutation(
      api.agents.workspaces.mutations.createWorkspace,
      {
        accessToken,
        userId: integration.userId,
        title: title,
      },
    )
    return {
      success: true,
      data: workspace,
      message: null,
    }
  },
})

const updateWorkspace = tool({
  description: `Updates the title of a workspace. use this when asked to update the title of a workspace`,
  inputSchema: z.object({
    userIntegrationId: z.string(),
    workspaceId: z.string(),
    title: z.string(),
  }),
  execute: async ({ userIntegrationId, workspaceId, title }) => {
    const accessToken = process.env.ACCESS_TOKEN!
    const integration = await convex.query(
      api.integrations.queries.getIntegration,
      { userIntegrationId, accessToken },
    )
    if (!integration) {
      return {
        success: false,
        data: null,
        message:
          'Integration not found please activate in the dashboard at https://twodo.skilldiggers.dev/integrations',
      }
    }
    const workspace = await convex.mutation(
      api.agents.workspaces.mutations.updateWorkspace,
      {
        accessToken,
        userId: integration.userId,
        workspaceId: workspaceId as Id<'workspace'>,
        title: title,
      },
    )
    return {
      success: true,
      data: workspace,
      message: null,
    }
  },
})

const getWorkspaceById = tool({
  description: `Returns a workspace by its id ONLY CALL THIS AFTER IDENTIFYING THE WORKSPACE ID BY CALLING THE getUsersWorkspaces tool. use this when asked to get a workspace by its id or to do any mutation operations on a workspace`,
  inputSchema: z.object({
    userIntegrationId: z.string(),
    workspaceId: z.string(),
  }),
  execute: async ({ userIntegrationId, workspaceId }) => {
    const accessToken = process.env.ACCESS_TOKEN!
    const integration = await convex.query(
      api.integrations.queries.getIntegration,
      { userIntegrationId, accessToken },
    )
    if (!integration) {
      return {
        success: false,
        data: null,
        message:
          'Integration not found please activate in the dashboard at https://twodo.skilldiggers.dev/integrations',
      }
    }
    const workspace = await convex.query(
      api.agents.workspaces.queries.getWorkspaceById,
      {
        accessToken,
        userId: integration.userId,
        workspaceId: workspaceId as Id<'workspace'>,
      },
    )
    return {
      success: true,
      data: workspace,
      message: null,
    }
  },
})

const createList = tool({
  description: `Creates a new list for the user. use this when asked to create a new list. ONLY CALL THIS AFTER IDENTIFYING THE WORKSPACE ID BY CALLING THE getWorkspaceById tool.`,
  inputSchema: z.object({
    userIntegrationId: z.string(),
    title: z.string(),
    workspaceId: z.string(),
  }),
  execute: async ({ userIntegrationId, title, workspaceId }) => {
    const accessToken = process.env.ACCESS_TOKEN!
    const integration = await convex.query(
      api.integrations.queries.getIntegration,
      { userIntegrationId, accessToken },
    )
    if (!integration) {
      return {
        success: false,
        data: null,
        message:
          'Integration not found please activate in the dashboard at https://twodo.skilldiggers.dev/integrations',
      }
    }
    const list = await convex.mutation(api.agents.lists.mutations.createList, {
      accessToken,
      userId: integration.userId,
      workspaceId: workspaceId as Id<'workspace'>,
      title: title,
    })
    return {
      success: true,
      data: list,
      message: null,
    }
  },
})

const updateList = tool({
  description: `Updates the title of a list. use this when asked to update the title of a list. ONLY CALL THIS AFTER IDENTIFYING THE LIST ID BY CALLING THE getListById tool.`,
  inputSchema: z.object({
    userIntegrationId: z.string(),
    listId: z.string(),
    title: z.string(),
  }),
  execute: async ({ userIntegrationId, listId, title }) => {
    const accessToken = process.env.ACCESS_TOKEN!
    const integration = await convex.query(
      api.integrations.queries.getIntegration,
      { userIntegrationId, accessToken },
    )
    if (!integration) {
      return {
        success: false,
        data: null,
        message:
          'Integration not found please activate in the dashboard at https://twodo.skilldiggers.dev/integrations',
      }
    }
    const list = await convex.mutation(api.agents.lists.mutations.updateList, {
      accessToken,
      userId: integration.userId,
      listId: listId as Id<'lists'>,
      title: title,
    })
    return {
      success: true,
      data: list,
      message: null,
    }
  },
})

const getLists = tool({
  description: `Returns a list of all lists for the user. use this when asked to list the user's lists. ONLY CALL THIS AFTER IDENTIFYING THE WORKSPACE ID BY CALLING THE getWorkspaceById tool.`,
  inputSchema: z.object({
    userIntegrationId: z.string(),
    workspaceId: z.string(),
  }),
  execute: async ({ userIntegrationId, workspaceId }) => {
    const accessToken = process.env.ACCESS_TOKEN!
    const integration = await convex.query(
      api.integrations.queries.getIntegration,
      { userIntegrationId, accessToken },
    )
    if (!integration) {
      return {
        success: false,
        data: [],
        message:
          'Integration not found please activate in the dashboard at https://twodo.skilldiggers.dev/integrations',
      }
    }
    const lists = await convex.query(api.agents.lists.queries.getLists, {
      accessToken,
      userId: integration.userId,
      workspaceId: workspaceId as Id<'workspace'>,
    })
    return {
      success: true,
      data: lists.map((list) => ({
        ...list,
        _creationTime: new Date(list._creationTime),
      })),
      message: null,
    }
  },
})

const getListById = tool({
  description: `Returns a list by its id. use this when asked to get a list by its id. ONLY CALL THIS AFTER IDENTIFYING THE LIST ID BY CALLING THE getLists tool.`,
  inputSchema: z.object({ userIntegrationId: z.string(), listId: z.string() }),
  execute: async ({ userIntegrationId, listId }) => {
    const accessToken = process.env.ACCESS_TOKEN!
    const integration = await convex.query(
      api.integrations.queries.getIntegration,
      { userIntegrationId, accessToken },
    )
    if (!integration) {
      return {
        success: false,
        data: null,
        message:
          'Integration not found please activate in the dashboard at https://twodo.skilldiggers.dev/integrations',
      }
    }
    const list = await convex.query(api.agents.lists.queries.getListById, {
      accessToken,
      userId: integration.userId,
      listId: listId as Id<'lists'>,
    })
    return {
      success: true,
      data: list,
      message: null,
    }
  },
})

const getTodos = tool({
  description: `Returns a list of all todos for the user. use this when asked to list the user's todos. ONLY CALL THIS AFTER IDENTIFYING THE LIST ID BY CALLING THE getListById tool.`,
  inputSchema: z.object({ userIntegrationId: z.string(), listId: z.string() }),
  execute: async ({ userIntegrationId, listId }) => {
    const accessToken = process.env.ACCESS_TOKEN!
    const integration = await convex.query(
      api.integrations.queries.getIntegration,
      { userIntegrationId, accessToken },
    )
    if (!integration) {
      return {
        success: false,
        data: [],
        message:
          'Integration not found please activate in the dashboard at https://twodo.skilldiggers.dev/integrations',
      }
    }
    const todos = await convex.query(api.agents.todos.queries.getTodos, {
      accessToken,
      userId: integration.userId,
      listId: listId as Id<'lists'>,
    })
    return {
      success: true,
      data: todos.map((todo) => ({
        ...todo,
        _creationTime: new Date(todo._creationTime),
      })),
      message: null,
    }
  },
})

export const tools: ToolSet = {
  verifyIntegration,
  getUsersWorkspaces,
  createWorkspace,
  updateWorkspace,
  getWorkspaceById,
  createList,
  getLists,
  updateList,
  getListById,
  getTodos,
}
