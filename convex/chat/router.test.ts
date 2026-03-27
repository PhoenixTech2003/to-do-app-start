import { beforeEach, describe, expect, it, vi } from 'vitest'
import { processIncomingChatMessage } from './router'
import type {
  BotResponse,
  ChatCommandServices,
  ChatSessionContext,
  ListSummary,
  TodoSummary,
  WorkspaceSummary,
} from './types'

function createTodo(overrides: Partial<TodoSummary> = {}): TodoSummary {
  return {
    id: overrides.id ?? 'todo-1',
    name: overrides.name ?? 'Finish math paper',
    description:
      overrides.description === undefined ? null : overrides.description,
    due: overrides.due === undefined ? '2026-03-28' : overrides.due,
    priority: overrides.priority ?? 'high',
    status: overrides.status ?? 'pending',
    listId: overrides.listId === undefined ? 'list-1' : overrides.listId,
    listName:
      overrides.listName === undefined ? 'Assignments' : overrides.listName,
    workspaceId:
      overrides.workspaceId === undefined ? 'ws-1' : overrides.workspaceId,
    workspaceName:
      overrides.workspaceName === undefined ? 'School' : overrides.workspaceName,
  }
}

function createServices({
  context,
  workspaces = [],
  lists = [],
  todos = [],
}: {
  context?: Partial<ChatSessionContext>
  workspaces?: WorkspaceSummary[]
  lists?: ListSummary[]
  todos?: TodoSummary[]
} = {}) {
  const session: ChatSessionContext = {
    activeWorkspaceId: context?.activeWorkspaceId ?? null,
    activeWorkspaceName: context?.activeWorkspaceName ?? null,
    activeListId: context?.activeListId ?? null,
    activeListName: context?.activeListName ?? null,
    todos: context?.todos ?? [],
  }

  const state = {
    session,
    workspaces,
    lists,
    todos,
  }

  const aiFallback = vi.fn<(_: string) => Promise<BotResponse>>(async (prompt) => ({
    format: 'markdown',
    body: `AI:${prompt}`,
  }))

  const services: ChatCommandServices = {
    getSessionContext: vi.fn(async () => state.session),
    saveSessionContext: vi.fn(async (update) => {
      state.session = {
        ...state.session,
        ...(Object.prototype.hasOwnProperty.call(update, 'activeWorkspaceId')
          ? { activeWorkspaceId: update.activeWorkspaceId ?? null }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(update, 'activeListId')
          ? { activeListId: update.activeListId ?? null }
          : {}),
        ...(update.todos ? { todos: update.todos } : {}),
      }
    }),
    listWorkspaces: vi.fn(async () => state.workspaces),
    findLists: vi.fn(async (workspaceId?: string | null) =>
      workspaceId
        ? state.lists.filter((list) => list.workspaceId === workspaceId)
        : state.lists,
    ),
    listTodos: vi.fn(async (filters) =>
      state.todos.filter((todo) => {
        if (filters.listId && todo.listId !== filters.listId) return false
        if (filters.workspaceId && todo.workspaceId !== filters.workspaceId) return false
        if (filters.completed === true && todo.status !== 'completed') return false
        if (filters.completed === false && todo.status === 'completed') return false
        return true
      }),
    ),
    getTodoById: vi.fn(async (todoId) => state.todos.find((todo) => todo.id === todoId) ?? null),
    createWorkspace: vi.fn(async (name) => ({ id: 'ws-new', name })),
    createList: vi.fn(async ({ name, workspaceId }) => ({
      id: 'list-new',
      name,
      workspaceId,
      workspaceName:
        state.workspaces.find((workspace) => workspace.id === workspaceId)?.name ?? 'Unknown',
    })),
    createTodo: vi.fn(async ({ name, due, priority, listId }) => {
      const sourceList = state.lists.find((list) => list.id === listId) ?? null
      const todo = createTodo({
        id: `todo-${state.todos.length + 1}`,
        name,
        due,
        priority,
        listId: sourceList?.id ?? null,
        listName: sourceList?.name ?? null,
        workspaceId: sourceList?.workspaceId ?? state.session.activeWorkspaceId,
        workspaceName:
          sourceList?.workspaceName ?? state.session.activeWorkspaceName,
      })
      state.todos.push(todo)
      return todo
    }),
    updateTodo: vi.fn(async ({ todoId, name, due, priority, listId }) => {
      const current = state.todos.find((todo) => todo.id === todoId)
      if (!current) throw new Error('Missing todo')
      const nextList = listId
        ? state.lists.find((list) => list.id === listId) ?? null
        : current.listId
          ? state.lists.find((list) => list.id === current.listId) ?? null
          : null
      const updated = {
        ...current,
        name: name ?? current.name,
        due: due === undefined ? current.due : due,
        priority: priority ?? current.priority,
        listId: listId === undefined ? current.listId : listId,
        listName:
          listId === undefined ? current.listName : nextList?.name ?? null,
        workspaceId:
          listId === undefined ? current.workspaceId : nextList?.workspaceId ?? null,
        workspaceName:
          listId === undefined
            ? current.workspaceName
            : nextList?.workspaceName ?? null,
      } satisfies TodoSummary
      state.todos = state.todos.map((todo) => (todo.id === todoId ? updated : todo))
      return updated
    }),
    setTodoStatus: vi.fn(async ({ todoId, status }) => {
      const current = state.todos.find((todo) => todo.id === todoId)
      if (!current) throw new Error('Missing todo')
      const updated = { ...current, status } satisfies TodoSummary
      state.todos = state.todos.map((todo) => (todo.id === todoId ? updated : todo))
      return updated
    }),
    deleteTodo: vi.fn(async (todoId) => {
      const todo = state.todos.find((item) => item.id === todoId) ?? null
      state.todos = state.todos.filter((item) => item.id !== todoId)
      return todo
    }),
    linkTelegram: vi.fn(async () => true),
    aiFallback,
  }

  return { services, state, aiFallback }
}

describe('processIncomingChatMessage', () => {
  const now = new Date('2026-03-27T10:00:00Z')

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resolves numbered todos from session context and skips AI', async () => {
    const todo = createTodo()
    const { services, aiFallback } = createServices({
      context: {
        activeWorkspaceId: 'ws-1',
        activeWorkspaceName: 'School',
        activeListId: 'list-1',
        activeListName: 'Assignments',
        todos: [
          {
            id: todo.id,
            name: todo.name,
            due: todo.due,
            priority: 'high',
            completed: false,
          },
        ],
      },
      lists: [
        {
          id: 'list-1',
          name: 'Assignments',
          workspaceId: 'ws-1',
          workspaceName: 'School',
        },
      ],
      todos: [todo],
    })

    const result = await processIncomingChatMessage({
      prompt: '/done 1',
      platform: 'telegram',
      services,
      now,
    })

    expect(result.response).toEqual({
      format: 'text',
      body: '✅ Completed: Finish math paper 🎉',
    })
    expect(aiFallback).not.toHaveBeenCalled()
    expect(services.setTodoStatus).toHaveBeenCalledWith({
      todoId: 'todo-1',
      status: 'completed',
    })
  })

  it('returns clarification for ambiguous list names', async () => {
    const { services, aiFallback } = createServices({
      context: {
        activeWorkspaceId: 'ws-1',
        activeWorkspaceName: 'Work',
      },
      lists: [
        { id: 'l1', name: 'Backlog Web', workspaceId: 'ws-1', workspaceName: 'Work' },
        { id: 'l2', name: 'Backlog Mobile', workspaceId: 'ws-1', workspaceName: 'Work' },
      ],
    })

    const result = await processIncomingChatMessage({
      prompt: '/cl backlog',
      platform: 'whatsapp',
      services,
      now,
    })

    expect(result.response).toEqual({
      format: 'text',
      body: 'Did you mean: (1) Backlog Web, (2) Backlog Mobile?',
    })
    expect(aiFallback).not.toHaveBeenCalled()
  })

  it('falls through to AI for open-ended natural language', async () => {
    const { services, aiFallback } = createServices()

    const result = await processIncomingChatMessage({
      prompt: 'Can you help me plan my workload for next sprint?',
      platform: 'telegram',
      services,
      now,
    })

    expect(aiFallback).toHaveBeenCalledWith(
      'Can you help me plan my workload for next sprint?',
    )
    expect(result.response).toEqual({
      format: 'markdown',
      body: 'AI:Can you help me plan my workload for next sprint?',
    })
  })

  it('stores numbered session todos when listing tasks', async () => {
    const todoA = createTodo({ id: 'todo-1', name: 'Alpha' })
    const todoB = createTodo({ id: 'todo-2', name: 'Bravo', due: null, priority: 'none' })
    const { services, state } = createServices({
      context: {
        activeWorkspaceId: 'ws-1',
        activeWorkspaceName: 'School',
        activeListId: 'list-1',
        activeListName: 'Assignments',
      },
      todos: [todoA, todoB],
    })

    const result = await processIncomingChatMessage({
      prompt: '/tl',
      platform: 'whatsapp',
      services,
      now,
    })

    expect(result.response).toEqual({
      format: 'markdown',
      body: '1. Alpha - due 2026-03-28 - high - Assignments\n2. Bravo - Assignments',
    })
    expect(state.session.todos.map((todo) => todo.id)).toEqual(['todo-1', 'todo-2'])
  })
})
