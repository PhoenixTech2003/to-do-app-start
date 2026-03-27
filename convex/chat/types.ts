export type ChatPlatform = 'whatsapp' | 'telegram'

export type TodoPriority = 'high' | 'medium' | 'low' | 'none'
export type TodoStatus = 'pending' | 'completed' | 'overdue'

export type BotResponseFormat = 'text' | 'markdown'

export type BotResponse = {
  format: BotResponseFormat
  body: string
}

export type SessionTodoRef = {
  id: string
  name: string
  due: string | null
  priority: Exclude<TodoPriority, 'none'> | null
  completed: boolean
}

export type ChatSessionContext = {
  activeWorkspaceId: string | null
  activeWorkspaceName: string | null
  activeListId: string | null
  activeListName: string | null
  todos: Array<SessionTodoRef>
}

export type WorkspaceSummary = {
  id: string
  name: string
}

export type ListSummary = {
  id: string
  name: string
  workspaceId: string
  workspaceName: string
}

export type TodoSummary = {
  id: string
  name: string
  description: string | null
  due: string | null
  priority: TodoPriority
  status: TodoStatus
  listId: string | null
  listName: string | null
  workspaceId: string | null
  workspaceName: string | null
}

export type ConfidenceMeta = {
  confidence: number
  clarification?: string
}

export type ParsedAction =
  | ({
      action: 'context.set_workspace'
      workspaceName: string
    } & ConfidenceMeta)
  | ({ action: 'context.set_list'; listName: string } & ConfidenceMeta)
  | ({ action: 'context.get' } & ConfidenceMeta)
  | ({ action: 'workspace.add'; name: string } & ConfidenceMeta)
  | ({ action: 'workspace.list' } & ConfidenceMeta)
  | ({
      action: 'list.add'
      name: string
      workspaceName?: string
    } & ConfidenceMeta)
  | ({ action: 'list.list'; workspaceName?: string } & ConfidenceMeta)
  | ({
      action: 'todo.add'
      name: string
      due?: string | null
      priority?: Exclude<TodoPriority, 'none'> | null
      listName?: string
      workspaceName?: string
    } & ConfidenceMeta)
  | ({
      action: 'todo.list'
      filters: {
        due?: string | null
        priority?: Exclude<TodoPriority, 'none'> | null
        completed?: boolean
        listName?: string
        workspaceName?: string
      }
    } & ConfidenceMeta)
  | ({ action: 'todo.list_overdue' } & ConfidenceMeta)
  | ({ action: 'todo.list_upcoming'; days: number } & ConfidenceMeta)
  | ({ action: 'todo.view'; reference: string } & ConfidenceMeta)
  | ({ action: 'todo.complete'; reference: string } & ConfidenceMeta)
  | ({ action: 'todo.reopen'; reference: string } & ConfidenceMeta)
  | ({
      action: 'todo.update'
      reference: string
      changes: {
        name?: string
        due?: string | null
        priority?: Exclude<TodoPriority, 'none'> | null
        listName?: string
      }
    } & ConfidenceMeta)
  | ({ action: 'todo.delete'; reference: string } & ConfidenceMeta)
  | ({ action: 'help' } & ConfidenceMeta)
  | ({ action: 'integration.link_telegram'; token: string } & ConfidenceMeta)
  | ({ action: 'clarify'; message: string } & ConfidenceMeta)
  | ({ action: 'unknown'; message: string } & ConfidenceMeta)
  | ({ action: 'ai_fallback' } & ConfidenceMeta)

export type CommandParseOptions = {
  now: Date
  platform: ChatPlatform
}

export type ResolvedMatch<T> =
  | { kind: 'match'; value: T }
  | { kind: 'clarify'; message: string }
  | { kind: 'not_found'; message: string }

export type TodoListFilters = {
  due?: string | null
  priority?: Exclude<TodoPriority, 'none'> | null
  completed?: boolean
  listId?: string | null
  workspaceId?: string | null
  dueBefore?: string | null
}

export type ChatCommandServices = {
  getSessionContext: () => Promise<ChatSessionContext>
  saveSessionContext: (update: {
    activeWorkspaceId?: string | null
    activeListId?: string | null
    todos?: Array<SessionTodoRef>
  }) => Promise<void>
  listWorkspaces: () => Promise<Array<WorkspaceSummary>>
  findLists: (workspaceId?: string | null) => Promise<Array<ListSummary>>
  listTodos: (filters: TodoListFilters) => Promise<Array<TodoSummary>>
  getTodoById: (todoId: string) => Promise<TodoSummary | null>
  createWorkspace: (name: string) => Promise<WorkspaceSummary>
  createList: (input: {
    name: string
    workspaceId: string
  }) => Promise<ListSummary>
  createTodo: (input: {
    name: string
    due: string | null
    priority: TodoPriority
    listId: string | null
  }) => Promise<TodoSummary>
  updateTodo: (input: {
    todoId: string
    name?: string
    due?: string | null
    priority?: TodoPriority
    listId?: string | null
  }) => Promise<TodoSummary>
  setTodoStatus: (input: {
    todoId: string
    status: TodoStatus
  }) => Promise<TodoSummary>
  deleteTodo: (todoId: string) => Promise<TodoSummary | null>
  linkTelegram: (token: string) => Promise<boolean>
  aiFallback: (prompt: string) => Promise<BotResponse>
}
