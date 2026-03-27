import {
  formatContext,
  formatHelp,
  formatListList,
  formatTodoAdded,
  formatTodoCompleted,
  formatTodoDeleted,
  formatTodoList,
  formatTodoReopened,
  formatTodoUpdated,
  formatTodoView,
  formatWorkspaceList,
  toSessionTodoRef,
} from './format'
import { parseIncomingMessage } from './parser'
import type {
  ChatCommandServices,
  ChatPlatform,
  ListSummary,
  ParsedAction,
  ResolvedMatch,
  TodoSummary,
  WorkspaceSummary,
} from './types'

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function resolveByName<T extends { name: string }>(
  reference: string,
  items: Array<T>,
  noun: string,
): ResolvedMatch<T> {
  const normalizedReference = normalize(reference)
  const exact = items.filter(
    (item) => normalize(item.name) === normalizedReference,
  )
  if (exact.length === 1) {
    return { kind: 'match', value: exact[0] }
  }
  if (exact.length > 1) {
    return {
      kind: 'clarify',
      message: `I found multiple ${noun}s named "${reference}". Please be more specific.`,
    }
  }

  const partial = items.filter((item) =>
    normalize(item.name).includes(normalizedReference),
  )
  if (partial.length === 1) {
    return { kind: 'match', value: partial[0] }
  }
  if (partial.length > 1) {
    const preview = partial
      .slice(0, 3)
      .map((item, index) => `(${index + 1}) ${item.name}`)
      .join(', ')
    return {
      kind: 'clarify',
      message: `Did you mean: ${preview}?`,
    }
  }

  return {
    kind: 'not_found',
    message: `I couldn't find ${noun} "${reference}".`,
  }
}

async function resolveWorkspace(
  services: ChatCommandServices,
  name: string,
): Promise<ResolvedMatch<WorkspaceSummary>> {
  const workspaces = await services.listWorkspaces()
  return resolveByName(name, workspaces, 'workspace')
}

async function resolveList(
  services: ChatCommandServices,
  name: string,
  workspaceId?: string | null,
): Promise<ResolvedMatch<ListSummary>> {
  const lists = await services.findLists(workspaceId ?? undefined)
  return resolveByName(name, lists, 'list')
}

async function resolveTodo(
  services: ChatCommandServices,
  reference: string,
  sessionTodos: Array<TodoSummary>,
  context: Awaited<ReturnType<ChatCommandServices['getSessionContext']>>,
): Promise<ResolvedMatch<TodoSummary>> {
  const numericRef = Number(reference)
  if (
    !Number.isNaN(numericRef) &&
    Number.isInteger(numericRef) &&
    numericRef > 0
  ) {
    const todoIndex = numericRef - 1
    const todo =
      todoIndex < sessionTodos.length ? sessionTodos[todoIndex] : undefined
    if (!todo) {
      return {
        kind: 'not_found',
        message: `I couldn't find todo #${numericRef} in your current session list.`,
      }
    }
    return { kind: 'match', value: todo }
  }

  const candidates = await services.listTodos({
    listId: context.activeListId,
    workspaceId: context.activeWorkspaceId,
  })
  return resolveByName(reference, candidates, 'todo')
}

function clarification(message: string) {
  return { format: 'text' as const, body: message }
}

async function withSessionTodos(
  services: ChatCommandServices,
  session: Awaited<ReturnType<ChatCommandServices['getSessionContext']>>,
) {
  if (!session.todos.length) {
    return []
  }

  const todos = await Promise.all(
    session.todos.map((todo) => services.getTodoById(todo.id)),
  )
  return todos.filter((todo): todo is TodoSummary => Boolean(todo))
}

export async function processIncomingChatMessage({
  prompt,
  platform,
  services,
  now = new Date(),
}: {
  prompt: string
  platform: ChatPlatform
  services: ChatCommandServices
  now?: Date
}) {
  const parsed = parseIncomingMessage(prompt, { now, platform })
  const context = await services.getSessionContext()
  const sessionTodos = await withSessionTodos(services, context)

  const respond = (response: {
    format: 'text' | 'markdown'
    body: string
  }) => ({
    response,
  })

  const handleClarify = (
    action: Extract<ParsedAction, { action: 'clarify' }>,
  ) => respond(clarification(action.message))

  if (parsed.action === 'clarify') {
    return handleClarify(parsed)
  }

  if (parsed.action === 'unknown') {
    return respond(clarification(`❓ ${parsed.message}`))
  }

  if (parsed.action === 'ai_fallback') {
    return { response: await services.aiFallback(prompt) }
  }

  if (parsed.action === 'help') {
    return respond(formatHelp())
  }

  if (parsed.action === 'context.get') {
    return respond(formatContext(context))
  }

  if (parsed.action === 'integration.link_telegram') {
    const linked = await services.linkTelegram(parsed.token)
    return respond(
      linked
        ? {
            format: 'text',
            body: 'Your Telegram account has been linked to Twodo successfully! You can now manage your tasks from here.',
          }
        : {
            format: 'text',
            body: 'Invalid or expired link token. Please generate a new one at https://twodo.skilldiggers.dev/integrations',
          },
    )
  }

  if (parsed.action === 'workspace.list') {
    return respond(formatWorkspaceList(await services.listWorkspaces()))
  }

  if (parsed.action === 'context.set_workspace') {
    const workspace = await resolveWorkspace(services, parsed.workspaceName)
    if (workspace.kind !== 'match') {
      return respond(clarification(workspace.message))
    }
    await services.saveSessionContext({
      activeWorkspaceId: workspace.value.id,
      activeListId: null,
    })
    return respond({
      format: 'text',
      body: `✅ Active workspace: ${workspace.value.name}`,
    })
  }

  if (parsed.action === 'workspace.add') {
    const workspace = await services.createWorkspace(parsed.name)
    await services.saveSessionContext({
      activeWorkspaceId: workspace.id,
      activeListId: null,
    })
    return respond({
      format: 'text',
      body: `✅ Active workspace: ${workspace.name}`,
    })
  }

  if (parsed.action === 'list.list') {
    let workspaceId = context.activeWorkspaceId
    let workspaceName = context.activeWorkspaceName

    if (parsed.workspaceName) {
      const workspace = await resolveWorkspace(services, parsed.workspaceName)
      if (workspace.kind !== 'match') {
        return respond(clarification(workspace.message))
      }
      workspaceId = workspace.value.id
      workspaceName = workspace.value.name
    }

    const lists = await services.findLists(workspaceId ?? undefined)
    return respond(formatListList(lists, workspaceName))
  }

  if (parsed.action === 'context.set_list') {
    const list = await resolveList(
      services,
      parsed.listName,
      context.activeWorkspaceId,
    )
    if (list.kind !== 'match') {
      return respond(clarification(list.message))
    }
    await services.saveSessionContext({
      activeWorkspaceId: list.value.workspaceId,
      activeListId: list.value.id,
    })
    return respond({
      format: 'text',
      body: `✅ Active list: ${list.value.name}`,
    })
  }

  if (parsed.action === 'list.add') {
    let workspaceId = context.activeWorkspaceId
    if (parsed.workspaceName) {
      const workspace = await resolveWorkspace(services, parsed.workspaceName)
      if (workspace.kind !== 'match') {
        return respond(clarification(workspace.message))
      }
      workspaceId = workspace.value.id
    }

    if (!workspaceId) {
      return respond(
        clarification(
          'Set a workspace with /cw first or pass --workspace=<name>.',
        ),
      )
    }

    const list = await services.createList({ name: parsed.name, workspaceId })
    await services.saveSessionContext({
      activeWorkspaceId: list.workspaceId,
      activeListId: list.id,
    })
    return respond({
      format: 'text',
      body: `✅ Active list: ${list.name}`,
    })
  }

  if (parsed.action === 'todo.add') {
    let workspaceId = context.activeWorkspaceId
    let listId = context.activeListId

    if (parsed.workspaceName) {
      const workspace = await resolveWorkspace(services, parsed.workspaceName)
      if (workspace.kind !== 'match') {
        return respond(clarification(workspace.message))
      }
      workspaceId = workspace.value.id
    }

    if (parsed.listName) {
      const list = await resolveList(services, parsed.listName, workspaceId)
      if (list.kind !== 'match') {
        return respond(clarification(list.message))
      }
      listId = list.value.id
      workspaceId = list.value.workspaceId
    }

    const todo = await services.createTodo({
      name: parsed.name,
      due: parsed.due ?? null,
      priority: parsed.priority ?? 'none',
      listId: listId ?? null,
    })

    await services.saveSessionContext({
      activeWorkspaceId: workspaceId ?? null,
      activeListId: listId ?? null,
      todos: [...context.todos, toSessionTodoRef(todo)],
    })

    return respond(formatTodoAdded(todo))
  }

  if (
    parsed.action === 'todo.list' ||
    parsed.action === 'todo.list_overdue' ||
    parsed.action === 'todo.list_upcoming'
  ) {
    let workspaceId = context.activeWorkspaceId
    let listId = context.activeListId
    let dueBefore: string | null | undefined
    const due = parsed.action === 'todo.list' ? parsed.filters.due : undefined
    const completed =
      parsed.action === 'todo.list'
        ? parsed.filters.completed
        : parsed.action === 'todo.list_overdue'
          ? false
          : false
    const priority =
      parsed.action === 'todo.list' ? (parsed.filters.priority ?? null) : null

    if (parsed.action === 'todo.list' && parsed.filters.workspaceName) {
      const workspace = await resolveWorkspace(
        services,
        parsed.filters.workspaceName,
      )
      if (workspace.kind !== 'match') {
        return respond(clarification(workspace.message))
      }
      workspaceId = workspace.value.id
      listId = null
    }

    if (parsed.action === 'todo.list' && parsed.filters.listName) {
      const list = await resolveList(
        services,
        parsed.filters.listName,
        workspaceId,
      )
      if (list.kind !== 'match') {
        return respond(clarification(list.message))
      }
      listId = list.value.id
      workspaceId = list.value.workspaceId
    }

    if (parsed.action === 'todo.list_overdue') {
      dueBefore = now.toISOString().slice(0, 10)
    }
    if (parsed.action === 'todo.list_upcoming') {
      dueBefore = new Date(now.getTime() + parsed.days * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10)
    }

    const todos = await services.listTodos({
      due,
      dueBefore,
      completed,
      priority,
      listId,
      workspaceId,
    })

    const { response, sessionTodos: nextSessionTodos } = formatTodoList(
      todos,
      parsed.action === 'todo.list_overdue'
        ? 'No overdue todos.'
        : parsed.action === 'todo.list_upcoming'
          ? 'No upcoming todos.'
          : 'No todos matched those filters.',
    )

    await services.saveSessionContext({
      activeWorkspaceId: workspaceId ?? null,
      activeListId: listId ?? null,
      todos: nextSessionTodos,
    })

    return respond(response)
  }

  switch (parsed.action) {
    case 'todo.view':
    case 'todo.complete':
    case 'todo.reopen':
    case 'todo.delete':
    case 'todo.update': {
      const resolved = await resolveTodo(
        services,
        parsed.reference,
        sessionTodos,
        context,
      )
      if (resolved.kind !== 'match') {
        return respond(clarification(resolved.message))
      }

      const todo = resolved.value

      if (parsed.action === 'todo.view') {
        return respond(formatTodoView(todo))
      }

      if (parsed.action === 'todo.complete') {
        const updated = await services.setTodoStatus({
          todoId: todo.id,
          status: 'completed',
        })
        await services.saveSessionContext({
          todos: context.todos.filter((item) => item.id !== todo.id),
        })
        return respond(formatTodoCompleted(updated))
      }

      if (parsed.action === 'todo.reopen') {
        const updated = await services.setTodoStatus({
          todoId: todo.id,
          status: 'pending',
        })
        await services.saveSessionContext({
          todos: context.todos.filter((item) => item.id !== todo.id),
        })
        return respond(formatTodoReopened(updated))
      }

      if (parsed.action === 'todo.delete') {
        const deleted = await services.deleteTodo(todo.id)
        await services.saveSessionContext({
          todos: context.todos.filter((item) => item.id !== todo.id),
        })
        return respond(formatTodoDeleted(deleted ?? todo))
      }

      let nextListId: string | null | undefined
      if (parsed.changes.listName) {
        const list = await resolveList(
          services,
          parsed.changes.listName,
          context.activeWorkspaceId,
        )
        if (list.kind !== 'match') {
          return respond(clarification(list.message))
        }
        nextListId = list.value.id
      }

      const updated = await services.updateTodo({
        todoId: todo.id,
        name: parsed.changes.name,
        due: parsed.changes.due,
        priority: parsed.changes.priority ?? undefined,
        listId: nextListId,
      })

      await services.saveSessionContext({
        activeWorkspaceId: updated.workspaceId ?? context.activeWorkspaceId,
        activeListId: updated.listId ?? context.activeListId,
        todos: context.todos.map((item) =>
          item.id === updated.id ? toSessionTodoRef(updated) : item,
        ),
      })

      return respond(formatTodoUpdated(updated))
    }
    default:
      return { response: await services.aiFallback(prompt) }
  }
}
