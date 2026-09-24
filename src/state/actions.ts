import { isPastDue } from '../../convex/todos/due'
import { nextOccurrenceDate } from '../../convex/todos/recurrence'
import { allRecords, isLive } from './model'
import type { Kind, RecordData, Replica } from './model'

type DueFields = Pick<
  RecordData,
  'title' | 'description' | 'dueDate' | 'priority' | 'recurrence'
>
export type ActionArgs = {
  createWorkspace: { title: string }
  updateWorkspaceDetails: { workspaceId: string; title: string }
  deleteWorkspace: { workspaceId: string }
  createList: { title: string; workspaceId: string }
  updatelistDetails: { listId: string; title: string }
  deleteList: { listId: string }
  createTodo: DueFields & { listId?: string }
  updateTodo: DueFields & { todoId: string }
  toggleTodoStatus: {
    todoId: string
    status: 'pending' | 'completed' | 'overdue'
  }
  moveTodoToList: { todoId: string; listId?: string }
  removeTodoFromDate: { todoId: string }
  deleteTodo: { todoId: string }
  addSubTask: {
    todoId: string
    title: string
    description?: string
    dueDate?: string
  }
  updateSubTask: {
    subTaskId: string
    title: string
    description?: string
    dueDate?: string
  }
  toggleSubTask: { subTaskId: string; completed: boolean }
  deleteSubTask: { subTaskId: string }
  createHabit: {
    title: string
    description?: string
    frequency: 'daily' | 'weekly'
    category: NonNullable<RecordData['category']>
  }
  toggleHabitCompletion: { habitId: string; date: string; completed: boolean }
  deleteHabit: { habitId: string }
}
export type Patch = { id: string; kind: Kind; fields: Partial<RecordData> }
/** Pure local transaction: every screen and sync write starts from these changes. */
export function changesFor<T extends keyof ActionArgs>(
  records: Replica,
  action: T,
  input: ActionArgs[T],
  id: string = crypto.randomUUID(),
): Array<Patch> {
  const [type, a] = [action, input] as {
    [K in keyof ActionArgs]: [K, ActionArgs[K]]
  }[keyof ActionArgs]
  const changes: Array<Patch> = []
  const get = (key: string, kind?: Kind) => {
    const row = records[key]
    if (!row || !isLive(records, row) || (kind && row.kind !== kind))
      throw new Error('This item no longer exists')
    return row
  }
  const patch = (row: RecordData, fields: Partial<RecordData>) =>
    changes.push({ id: row.id, kind: row.kind, fields })
  const create = (kind: Kind, fields: Partial<RecordData>, key = id) =>
    changes.push({ id: key, kind, fields })
  const title = (value: unknown) => {
    if (typeof value !== 'string' || !value.trim() || value.length > 1000)
      throw new Error('Enter a title between 1 and 1000 characters')
    return value.trim()
  }
  const due = (value?: string | null) => ({
    dueDate: value ? value.slice(0, 10) : null,
    dueTime: value ? value.slice(11, 16) || null : null,
  })
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const remove = (row: RecordData) => {
    patch(row, { deleted: true })
    for (const child of allRecords(records)) {
      if (
        !child.deleted &&
        (child.workspaceId === row.id ||
          child.listId === row.id ||
          child.todoId === row.id ||
          child.habitId === row.id)
      )
        remove(child)
    }
  }
  const complete = (row: RecordData, status: RecordData['status']) => {
    patch(row, { status })
    if (status !== 'completed' || row.status === 'completed') return
    for (const child of allRecords(records))
      if (
        child.kind === 'subTasks' &&
        child.todoId === row.id &&
        !child.deleted
      )
        patch(child, { completed: true })
    if (row.recurrence && row.dueDate) {
      const index = row.recurrenceIndex ?? 0
      const next = nextOccurrenceDate(row.recurrence, row.dueDate, index)
      const root = row.seriesId ?? row.id
      const nextId = `recurrence:${root}:${index + 1}`
      if (next && !records[nextId])
        create(
          'todos',
          {
            title: row.title,
            description: row.description,
            listId: row.listId,
            priority: row.priority,
            recurrence: row.recurrence,
            recurrenceIndex: index + 1,
            seriesId: root,
            dueDate: next,
            dueTime: row.dueTime,
            timeZone: row.timeZone ?? zone,
            status: 'pending',
          },
          nextId,
        )
    }
  }
  const settle = (
    parent: RecordData,
    changed: string,
    completed?: boolean,
    removed = false,
  ) => {
    const parts = allRecords(records).filter(
      (r) =>
        r.kind === 'subTasks' &&
        r.todoId === parent.id &&
        !r.deleted &&
        !(removed && r.id === changed),
    )
    if (!parts.length) return
    const done = parts.every((r) =>
      r.id === changed ? completed : r.completed,
    )
    const overdue = isPastDue(parent)
    complete(parent, done ? 'completed' : overdue ? 'overdue' : 'pending')
  }
  switch (type) {
    case 'createWorkspace':
      create('workspace', { title: title(a.title) })
      break
    case 'updateWorkspaceDetails':
      patch(get(a.workspaceId, 'workspace'), { title: title(a.title) })
      break
    case 'deleteWorkspace':
      remove(get(a.workspaceId, 'workspace'))
      break
    case 'createList':
      get(a.workspaceId, 'workspace')
      create('lists', { title: title(a.title), workspaceId: a.workspaceId })
      break
    case 'updatelistDetails':
      patch(get(a.listId, 'lists'), { title: title(a.title) })
      break
    case 'deleteList':
      remove(get(a.listId, 'lists'))
      break
    case 'createTodo':
    case 'updateTodo': {
      if (type === 'createTodo' && a.listId) get(a.listId, 'lists')
      const fields = {
        title: title(a.title),
        description: a.description ?? null,
        ...due(a.dueDate),
        priority: a.priority ?? 'none',
        recurrence: a.dueDate ? (a.recurrence ?? null) : null,
        status: 'pending' as const,
        timeZone: zone,
      }
      if (type === 'createTodo')
        create('todos', {
          ...fields,
          listId: a.listId ?? null,
          recurrenceIndex: a.recurrence ? 0 : null,
        })
      else {
        const row = get(a.todoId, 'todos')
        patch(row, {
          ...fields,
          recurrenceIndex: fields.recurrence
            ? (row.recurrenceIndex ?? 0)
            : null,
        })
      }
      break
    }
    case 'toggleTodoStatus':
      complete(get(a.todoId, 'todos'), a.status)
      break
    case 'moveTodoToList':
      if (a.listId) get(a.listId, 'lists')
      patch(get(a.todoId, 'todos'), { listId: a.listId ?? null })
      break
    case 'removeTodoFromDate': {
      const row = get(a.todoId, 'todos')
      patch(row, {
        dueDate: null,
        dueTime: null,
        recurrence: null,
        recurrenceIndex: null,
        status: row.status === 'overdue' ? 'pending' : row.status,
      })
      break
    }
    case 'deleteTodo':
      remove(get(a.todoId, 'todos'))
      break
    case 'addSubTask':
      get(a.todoId, 'todos')
      create('subTasks', {
        todoId: a.todoId,
        title: title(a.title),
        description: a.description ?? null,
        ...due(a.dueDate),
        completed: false,
      })
      break
    case 'updateSubTask':
      patch(get(a.subTaskId, 'subTasks'), {
        title: title(a.title),
        description: a.description ?? null,
        ...due(a.dueDate),
      })
      break
    case 'toggleSubTask': {
      const row = get(a.subTaskId, 'subTasks')
      patch(row, { completed: a.completed })
      settle(get(row.todoId!, 'todos'), row.id, a.completed)
      break
    }
    case 'deleteSubTask': {
      const row = get(a.subTaskId, 'subTasks')
      remove(row)
      settle(get(row.todoId!, 'todos'), row.id, false, true)
      break
    }
    case 'createHabit':
      create('habits', {
        title: title(a.title),
        description: a.description ?? null,
        frequency: a.frequency,
        category: a.category,
      })
      break
    case 'deleteHabit':
      remove(get(a.habitId, 'habits'))
      break
    case 'toggleHabitCompletion': {
      get(a.habitId, 'habits')
      const existing = allRecords(records).find(
        (r) =>
          r.kind === 'habitCompletions' &&
          r.habitId === a.habitId &&
          r.completedDate === a.date,
      )
      if (existing) patch(existing, { deleted: !a.completed })
      else
        create(
          'habitCompletions',
          { habitId: a.habitId, completedDate: a.date, deleted: !a.completed },
          `completion:${a.habitId}:${a.date}`,
        )
      break
    }
  }
  return changes
}
