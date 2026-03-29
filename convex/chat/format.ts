import type {
  BotResponse,
  ListSummary,
  SessionTodoRef,
  TodoPriority,
  TodoStatus,
  TodoSummary,
  WorkspaceSummary,
} from './types'

function priorityTag(priority: TodoPriority): string {
  switch (priority) {
    case 'high':
      return '🔴 high'
    case 'medium':
      return '🟡 medium'
    case 'low':
      return '🟢 low'
    default:
      return ''
  }
}

function statusTag(status: TodoStatus): string {
  switch (status) {
    case 'completed':
      return '✅ Completed'
    case 'overdue':
      return '⚠️ Overdue'
    default:
      return '⏳ Pending'
  }
}

function locationTag(todo: {
  workspaceName: string | null
  listName: string | null
}): string {
  if (todo.workspaceName && todo.listName) {
    return `📁 ${todo.workspaceName} › ${todo.listName}`
  }
  if (todo.workspaceName) {
    return `📁 ${todo.workspaceName}`
  }
  if (todo.listName) {
    return `📁 Inbox › ${todo.listName}`
  }
  return '📁 Inbox'
}

// ─── Public formatters ───────────────────────────────────────

export function formatHelp(): BotResponse {
  return {
    format: 'markdown',
    body: [
      '**Twodo Commands**',
      '',
      '📌 **Context**',
      '`/cw Work` — set workspace',
      '`/cl Errands` — set list',
      '',
      '➕ **Create**',
      '`/wa Work` — new workspace',
      '`/la Errands` — new list',
      '`/ta "Buy milk" --due=tomorrow --p=high`',
      '',
      '📋 **View**',
      '`/tl` — all todos',
      '`/today` — due today',
      '`/overdue` — past due',
      '`/upcoming` — next 7 days',
      '',
      '✏️ **Manage**',
      '`/done 2` · `/reopen 2`',
      '`/update 2 --name="New"` · `/del 2`',
      '',
      '_You can also just type naturally!_',
    ].join('\n'),
  }
}

export function formatContext(context: {
  activeWorkspaceName: string | null
  activeListName: string | null
}): BotResponse {
  return {
    format: 'markdown',
    body: [
      '📍 **Current Context**',
      '',
      `📂 ${context.activeWorkspaceName ?? '_none_'}`,
      `📋 ${context.activeListName ?? '_none_'}`,
    ].join('\n'),
  }
}

export function formatContextSet(
  type: 'workspace' | 'list',
  name: string,
): BotResponse {
  const emoji = type === 'workspace' ? '📂' : '📋'
  const label = type === 'workspace' ? 'Workspace' : 'List'
  return {
    format: 'markdown',
    body: `${emoji} ${label} set to **${name}**`,
  }
}

export function formatCreated(
  type: 'workspace' | 'list',
  name: string,
): BotResponse {
  const emoji = type === 'workspace' ? '📂' : '📋'
  const label = type === 'workspace' ? 'Workspace' : 'List'
  return {
    format: 'markdown',
    body: [
      `${emoji} **${label} created:** ${name}`,
      `_Set as active ${type}._`,
    ].join('\n'),
  }
}

export function formatWorkspaceList(
  workspaces: Array<WorkspaceSummary>,
): BotResponse {
  if (!workspaces.length) {
    return { format: 'text', body: '📭 No workspaces yet.' }
  }

  const lines = ['📂 **Workspaces**', '']
  for (const [i, ws] of workspaces.entries()) {
    lines.push(`${i + 1}. ${ws.name}`)
  }
  return { format: 'markdown', body: lines.join('\n') }
}

export function formatListList(
  lists: Array<ListSummary>,
  workspaceName?: string | null,
): BotResponse {
  if (!lists.length) {
    return {
      format: 'text',
      body: workspaceName
        ? `📭 No lists in ${workspaceName}.`
        : '📭 No lists found. Set a workspace with /cw first.',
    }
  }

  const header = workspaceName
    ? `📋 **Lists in ${workspaceName}**`
    : '📋 **Lists**'
  const lines = [header, '']
  for (const [i, list] of lists.entries()) {
    lines.push(`${i + 1}. ${list.name} — ${list.workspaceName}`)
  }
  return { format: 'markdown', body: lines.join('\n') }
}

export function formatTodoAdded(todo: TodoSummary): BotResponse {
  const lines = ['✅ **Added**', '', todo.name]
  const meta: Array<string> = []
  if (todo.due) meta.push(`📅 ${todo.due}`)
  if (todo.priority !== 'none') meta.push(priorityTag(todo.priority))
  if (meta.length) lines.push(meta.join(' · '))
  lines.push(locationTag(todo))
  return { format: 'markdown', body: lines.join('\n') }
}

export function formatTodoUpdated(todo: TodoSummary): BotResponse {
  return {
    format: 'markdown',
    body: ['✏️ **Updated**', '', todo.name].join('\n'),
  }
}

export function formatTodoCompleted(todo: TodoSummary): BotResponse {
  return {
    format: 'markdown',
    body: ['🎉 **Done!**', '', todo.name].join('\n'),
  }
}

export function formatTodoReopened(todo: TodoSummary): BotResponse {
  return {
    format: 'markdown',
    body: ['↩️ **Reopened**', '', todo.name].join('\n'),
  }
}

export function formatTodoDeleted(todo: TodoSummary): BotResponse {
  return {
    format: 'markdown',
    body: ['🗑️ **Deleted**', '', todo.name].join('\n'),
  }
}

export function formatTodoView(todo: TodoSummary): BotResponse {
  const lines = [`📄 **${todo.name}**`, '']
  lines.push(statusTag(todo.status))
  if (todo.due) lines.push(`📅 ${todo.due}`)
  if (todo.priority !== 'none') lines.push(priorityTag(todo.priority))
  lines.push(locationTag(todo))
  if (todo.description) lines.push(`📝 ${todo.description}`)
  return { format: 'markdown', body: lines.join('\n') }
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
      response: { format: 'text', body: `📭 ${emptyMessage}` },
      sessionTodos: [],
    }
  }

  const lines = ['📋 **Your Todos**', '']
  for (const [i, todo] of todos.entries()) {
    lines.push(`${i + 1}. ${todo.name}`)
    const meta: Array<string> = []
    if (todo.due) meta.push(`📅 ${todo.due}`)
    if (todo.priority !== 'none') meta.push(priorityTag(todo.priority))
    if (todo.listName) meta.push(todo.listName)
    if (meta.length) lines.push(`   ${meta.join(' · ')}`)
  }
  lines.push('')
  lines.push(`_${todos.length} item${todos.length !== 1 ? 's' : ''}_`)

  return {
    response: { format: 'markdown', body: lines.join('\n') },
    sessionTodos: todos.map(toSessionTodoRef),
  }
}

export function formatLinkResult(success: boolean): BotResponse {
  if (success) {
    return {
      format: 'markdown',
      body: [
        '🔗 **Telegram Linked!**',
        '',
        'Your account is connected to Twodo. Manage your tasks right here.',
      ].join('\n'),
    }
  }
  return {
    format: 'text',
    body: '❌ Invalid or expired token. Generate a new one at https://twodo.skilldiggers.dev/integrations',
  }
}
