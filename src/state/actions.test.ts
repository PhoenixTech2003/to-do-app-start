import { describe, expect, it } from 'vitest'
import { changesFor } from './actions'
import { selectors } from './selectors'
import type { ActionArgs } from './actions'
import type { Replica } from './model'

function local() {
  const records: Replica = {}
  const act = <T extends keyof ActionArgs>(
    action: T,
    args: ActionArgs[T],
    id = action as string,
  ) => {
    for (const change of changesFor(records, action, args, id))
      records[change.id] = {
        id: change.id,
        kind: change.kind,
        createdBy: 'owner',
        createdAt: Date.now(),
        updatedAt: 0,
        deleted: false,
        remoteId: '',
        writeId: '',
        ...records[change.id],
        ...change.fields,
      }
  }
  return { records, act }
}
describe('offline domain actions', () => {
  it('moves tasks to Inbox and deletes the complete workspace tree locally', () => {
    const { records, act } = local()
    act('createWorkspace', { title: 'Work' }, 'workspace')
    act('createList', { title: 'Tasks', workspaceId: 'workspace' }, 'list')
    act('createTodo', { title: 'Task', listId: 'list' }, 'task')
    act('addSubTask', { title: 'Part', todoId: 'task' }, 'part')
    act('moveTodoToList', { todoId: 'task' })
    expect(selectors.GetInboxPendingTodos(records, {})).toHaveLength(1)
    act('moveTodoToList', { todoId: 'task', listId: 'list' })
    act('deleteWorkspace', { workspaceId: 'workspace' })
    expect(Object.values(records).every((row) => row!.deleted)).toBe(true)
    expect(selectors.getUserWorkspaces(records, {})).toHaveLength(0)
  })
  it('completes the parent from subtasks and creates only one next recurring task', () => {
    const { records, act } = local()
    act(
      'createTodo',
      {
        title: 'Recurring',
        dueDate: '2026-09-24T12:00',
        recurrence: { freq: 'daily', interval: 1 },
      },
      'task',
    )
    act('addSubTask', { title: 'Part', todoId: 'task' }, 'part')
    act('toggleSubTask', { subTaskId: 'part', completed: true })
    expect(records.task!.status).toBe('completed')
    expect(records['recurrence:task:1']!.dueDate).toBe('2026-09-25')
    act('toggleSubTask', { subTaskId: 'part', completed: false })
    act('toggleSubTask', { subTaskId: 'part', completed: true })
    expect(
      Object.values(records).filter((row) => row!.kind === 'todos'),
    ).toHaveLength(2)
  })
  it('recalculates habit completion, streak and XP locally and reverses a completion', () => {
    const { records, act } = local()
    act(
      'createHabit',
      { title: 'Walk', category: 'health', frequency: 'daily' },
      'habit',
    )
    for (const date of ['2026-09-23', '2026-09-24'])
      act('toggleHabitCompletion', { habitId: 'habit', date, completed: true })
    const habit = selectors.getHabitsWithStatus(records, {
      today: '2026-09-24',
    })[0]
    expect(habit.totalCompletions).toBe(2)
    expect(habit.currentStreak).toBe(2)
    expect(habit.completedToday).toBe(true)
    act('toggleHabitCompletion', {
      habitId: 'habit',
      date: '2026-09-24',
      completed: false,
    })
    expect(
      selectors.getHabitsWithStatus(records, { today: '2026-09-24' })[0]
        .completedToday,
    ).toBe(false)
  })
})
