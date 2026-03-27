import type {
  BotResponse,
  ListSummary,
  SessionTodoRef,
  TodoPriority,
  TodoSummary,
  WorkspaceSummary,
} from './types'

function priorityEmoji(priority: TodoPriority) {
  switch (priority) {
    case 'high':
      return '🔴'
    case 'medium':
      return '🟡'
    case 'low':
      return '🟢'
    default:
      return ''
  }
}

function formatLocation(todo: {
  workspaceName: string | null
  listName: string | null
}) {
  if (todo.workspaceName && todo.listName) {
    return `${todo.workspaceName} > ${todo.listName}`
  }
  if (todo.workspaceName) {
    return todo.workspaceName
  }
  if (todo.listName) {
    return `Inbox > ${todo.listName}`
  }
  return 'Inbox'
}

export function formatHelp(): BotResponse {
  return {
    format: 'markdown',
    body: [
      'Here are the main commands I support:',
      '',
      '1. `/cw Work` or `/cl Errands` to set context',
      '2. `/wa Work` and `/la Errands` to create workspaces or lists',
      '3. `/ta "Buy milk" --due=tomorrow --p=high` to add a todo',
      '4. `/tl`, `/today`, `/overdue`, `/upcoming` to list todos',
      '5. `/done 2`, `/reopen 2`, `/update 2 --name=New name`, `/del 2` to manage a todo',
      '',
      'You can also say things like `done 2` or `remind me to call mum tomorrow`.',
    ].join('\n'),
  }
}

export function formatContext(context: {
  activeWorkspaceName: string | null
  activeListName: string | null
}): BotResponse {
  return {
    format: 'text',
    body: `Context: workspace ${context.activeWorkspaceName ?? 'none'}, list ${context.activeListName ?? 'none'}.`,
  }
}

export function formatWorkspaceList(
  workspaces: Array<WorkspaceSummary>,
): BotResponse {
  if (!workspaces.length) {
    return { format: 'text', body: 'No workspaces yet.' }
  }

  return {
    format: 'markdown',
    body: workspaces
      .map((workspace, index) => `${index + 1}. ${workspace.name}`)
      .join('\n'),
  }
}

export function formatListList(
  lists: Array<ListSummary>,
  workspaceName?: string | null,
): BotResponse {
  if (!lists.length) {
    return {
      format: 'text',
      body: workspaceName
        ? `No lists found in ${workspaceName}.`
        : 'No lists found. Set a workspace with /cw or pass --workspace=<name>.',
    }
  }

  return {
    format: 'markdown',
    body: lists
      .map(
        (list, index) => `${index + 1}. ${list.name} (${list.workspaceName})`,
      )
      .join('\n'),
  }
}

export function formatTodoAdded(todo: TodoSummary): BotResponse {
  const parts = [`✅ Added: ${todo.name}`]
  if (todo.due) parts.push(`📅 ${todo.due}`)
  if (todo.priority !== 'none') parts.push(priorityEmoji(todo.priority))
  parts.push(`🗂 ${formatLocation(todo)}`)

  return { format: 'text', body: parts.join('  ') }
}

export function formatTodoUpdated(todo: TodoSummary): BotResponse {
  return { format: 'text', body: `✏️ Updated: ${todo.name}` }
}

export function formatTodoCompleted(todo: TodoSummary): BotResponse {
  return { format: 'text', body: `✅ Completed: ${todo.name} 🎉` }
}

export function formatTodoReopened(todo: TodoSummary): BotResponse {
  return { format: 'text', body: `↩️ Reopened: ${todo.name}` }
}

export function formatTodoDeleted(todo: TodoSummary): BotResponse {
  return { format: 'text', body: `🗑 Deleted: ${todo.name}` }
}

export function formatTodoView(todo: TodoSummary): BotResponse {
  const lines = [todo.name]
  lines.push(`Status: ${todo.status}`)
  if (todo.due) lines.push(`Due: ${todo.due}`)
  if (todo.priority !== 'none') lines.push(`Priority: ${todo.priority}`)
  lines.push(`Location: ${formatLocation(todo)}`)
  if (todo.description) lines.push(`Notes: ${todo.description}`)

  return { format: 'text', body: lines.join('\n') }
}

export function toSessionTodoRef(todo: TodoSummary): SessionTodoRef {
  return {
    id: todo.id,
    name: todo.name,
    due: todo.due,
    priority: todo.priority === 'none' ? null : todo.priority,
    completed: todo.status === 'completed',
  }
}

export function formatTodoList(
  todos: Array<TodoSummary>,
  emptyMessage: string,
): { response: BotResponse; sessionTodos: Array<SessionTodoRef> } {
  if (!todos.length) {
    return {
      response: { format: 'text', body: emptyMessage },
      sessionTodos: [],
    }
  }

  const lines = todos.map((todo, index) => {
    const meta: Array<string> = []
    if (todo.due) meta.push(`due ${todo.due}`)
    if (todo.priority !== 'none') meta.push(todo.priority)
    if (todo.listName) meta.push(todo.listName)
    const suffix = meta.length ? ` - ${meta.join(' - ')}` : ''
    return `${index + 1}. ${todo.name}${suffix}`
  })

  return {
    response: { format: 'markdown', body: lines.join('\n') },
    sessionTodos: todos.map(toSessionTodoRef),
  }
}
