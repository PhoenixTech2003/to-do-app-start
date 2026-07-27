import type { Doc, Id } from '../_generated/dataModel'
import type { QueryCtx } from '../_generated/server'

export type TodoLocation = {
  listId: Id<'lists'> | null
  listTitle: string | null
  workspaceId: Id<'workspace'> | null
  workspaceTitle: string | null
}

export const attachTodoLocations =
  async function AttachesListAndWorkspaceTitlesToTodos({
    ctx,
    todos,
  }: {
    ctx: QueryCtx
    todos: Array<Doc<'todos'>>
  }) {
    const listIds = [
      ...new Set(
        todos
          .map((todo) => todo.listId)
          .filter((listId): listId is Id<'lists'> => listId !== undefined),
      ),
    ]

    const lists = await Promise.all(
      listIds.map(async (listId) => await ctx.db.get('lists', listId)),
    )
    const listById = new Map(
      lists
        .filter((list): list is Doc<'lists'> => list !== null)
        .map((list) => [list._id, list]),
    )

    const workspaceIds = [
      ...new Set([...listById.values()].map((list) => list.workspaceId)),
    ]
    const workspaceTitleById = new Map<string, string>()
    await Promise.all(
      workspaceIds.map(async (workspaceId) => {
        const workspace = await ctx.db.get('workspace', workspaceId)
        workspaceTitleById.set(
          workspaceId,
          workspace?.title ?? 'Unknown workspace',
        )
      }),
    )

    return todos.map((todo) => {
      const list = todo.listId ? listById.get(todo.listId) : undefined

      const location: TodoLocation = list
        ? {
            listId: list._id,
            listTitle: list.title,
            workspaceId: list.workspaceId,
            workspaceTitle:
              workspaceTitleById.get(list.workspaceId) ?? 'Unknown workspace',
          }
        : {
            listId: null,
            listTitle: null,
            workspaceId: null,
            workspaceTitle: null,
          }

      return { ...todo, location }
    })
  }

export const verifyWorkspaceOnwership =
  async function VerifiesIfAPersonOwnsAWorkspace({
    ctx,
    userId,
    workspaceId,
  }: {
    ctx: QueryCtx
    userId: string
    workspaceId: Id<'workspace'>
  }) {
    try {
      const workspace = await ctx.db.get('workspace', workspaceId)
      if (!workspace) {
        throw new Error('Workspace does not exist')
      }
      const workspaceOwnerId = workspace.createdBy
      if (workspaceOwnerId != userId) {
        return false
      }
      return true
    } catch (error) {
      console.error(error)
      throw error
    }
  }

export const verifyListOnwership = async function VerifiesIfAPersonOwnsAList({
  ctx,
  userId,
  listId,
}: {
  ctx: QueryCtx
  userId: string
  listId: Id<'lists'>
}) {
  try {
    const list = await ctx.db.get('lists', listId)
    if (!list) {
      throw new Error('list does not exist')
    }
    const listOwnerId = list.createdBy
    if (listOwnerId != userId) {
      return false
    }
    return true
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const verifyTodoOnwership = async function VerifiesIfAPersonOwnsATodo({
  ctx,
  userId,
  todoId,
}: {
  ctx: QueryCtx
  userId: string
  todoId: Id<'todos'>
}) {
  try {
    const todo = await ctx.db.get('todos', todoId)
    if (!todo) {
      throw new Error('todo does not exist')
    }
    const todoOwnerId = todo.createdBy
    if (todoOwnerId != userId) {
      return false
    }
    return true
  } catch (error) {
    console.error(error)
    throw error
  }
}
