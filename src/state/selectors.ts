import { format, subDays } from 'date-fns'
import { isPastDue } from '../../convex/todos/due'
import { computeHabitXp } from '../../convex/habits/xp'
import { allRecords, isLive } from './model'
import type { Kind, RecordData, Replica } from './model'
import type { Doc } from 'convex/_generated/dataModel'
import type { HabitWithStatus, SubTask, Todo } from '@/types/global'

type Search = { searchTerm?: string; priority?: string; refreshKey?: number }
function doc<T extends Kind>(row: RecordData): Doc<T> {
  const value = Object.fromEntries(
    Object.entries(row).filter(([, fieldValue]) => fieldValue !== null),
  )
  return {
    ...value,
    _id: row.id,
    _creationTime: row.createdAt,
  } as unknown as Doc<T>
}
const rows = (r: Replica, kind: Kind) =>
  allRecords(r)
    .filter((row) => row.kind === kind && isLive(r, row))
    .sort((a, b) => b.createdAt - a.createdAt)
const match = (row: RecordData, args: Search) =>
  (!args.searchTerm ||
    (row.title ?? '')
      .toLocaleLowerCase()
      .includes(args.searchTerm.toLocaleLowerCase())) &&
  (!args.priority || args.priority === 'all' || row.priority === args.priority)
function progress(parts: Array<SubTask>) {
  const done = parts.filter((p) => p.completed).length
  return { total: parts.length, done, remaining: parts.length - done }
}
function todos(r: Replica, args: Search = {}) {
  const parts = rows(r, 'subTasks').map((row) => doc<'subTasks'>(row))
  return rows(r, 'todos')
    .filter((row) => match(row, args))
    .map((row) => {
      const list = row.listId ? r[row.listId] : undefined
      const workspace = list?.workspaceId ? r[list.workspaceId] : undefined
      const todo: Todo & { location: NonNullable<Todo['location']> } = {
        ...doc<'todos'>(row),
        subTasks: progress(parts.filter((part) => part.todoId === row.id)),
        location: {
          listId: list ? doc<'lists'>(list)._id : null,
          listTitle: list?.title ?? null,
          workspaceId: workspace ? doc<'workspace'>(workspace)._id : null,
          workspaceTitle: workspace?.title ?? null,
        },
      }
      if (todo.status === 'pending' && isPastDue(row)) todo.status = 'overdue'
      return todo
    })
}
const listTodos = (
  r: Replica,
  args: Search & { listId?: string },
  status: Todo['status'],
) =>
  todos(r, args).filter((t) => t.listId === args.listId && t.status === status)
const completionRows = (r: Replica) => rows(r, 'habitCompletions')
export const selectors = {
  getUserWorkspaces: (r: Replica, a: Search) =>
    rows(r, 'workspace')
      .filter((row) => match(row, a))
      .map((row) => doc<'workspace'>(row)),
  GetWorkspaceDetails: (r: Replica, a: { workspaceId: string }) =>
    r[a.workspaceId] && isLive(r, r[a.workspaceId]!)
      ? doc<'workspace'>(r[a.workspaceId]!)
      : null,
  GetWorkspaceLists: (r: Replica, a: Search & { workspaceId: string }) =>
    rows(r, 'lists')
      .filter((row) => row.workspaceId === a.workspaceId && match(row, a))
      .map((row) => doc<'lists'>(row)),
  GetUserListsForMove: (r: Replica, a: Search) =>
    rows(r, 'lists')
      .filter((row) => match(row, a))
      .map((row) => ({
        ...doc<'lists'>(row),
        workspaceTitle: r[row.workspaceId!]?.title ?? '',
      })),
  GetListDetails: (r: Replica, a: { listId: string }) =>
    r[a.listId] && isLive(r, r[a.listId]!) ? doc<'lists'>(r[a.listId]!) : null,
  GetPendingTodos: (r: Replica, a: Search & { listId: string }) =>
    listTodos(r, a, 'pending'),
  GetCompletedTodos: (r: Replica, a: Search & { listId: string }) =>
    listTodos(r, a, 'completed'),
  GetOverDueTodos: (r: Replica, a: Search & { listId: string }) =>
    listTodos(r, a, 'overdue'),
  GetInboxPendingTodos: (r: Replica, a: Search) => listTodos(r, a, 'pending'),
  GetInboxCompletedTodos: (r: Replica, a: Search) =>
    listTodos(r, a, 'completed'),
  GetInboxOverdueTodos: (r: Replica, a: Search) => listTodos(r, a, 'overdue'),
  GetAllUpcomingTodos: (r: Replica, a: Search & { today: string }) =>
    todos(r, a).filter(
      (t) => t.status === 'pending' && t.dueDate && t.dueDate >= a.today,
    ),
  GetAllOverdueTodos: (r: Replica, a: Search) =>
    todos(r, a).filter((t) => t.status === 'overdue'),
  getTodosByDate: (r: Replica, a: Search & { date: string }) => ({
    todos: todos(r, a).filter((t) => t.dueDate === a.date),
  }),
  getTodosForDateRange: (
    r: Replica,
    a: { startDate: string; endDate: string },
  ) => ({
    todos: todos(r).filter(
      (t) => t.dueDate && t.dueDate >= a.startDate && t.dueDate <= a.endDate,
    ),
  }),
  GetAllSubtasks: (r: Replica, a: { todoId: string }) => {
    const subtasks = rows(r, 'subTasks')
      .filter((row) => row.todoId === a.todoId)
      .map((row) => doc<'subTasks'>(row))
    return { subtasks, progress: progress(subtasks) }
  },
  getHabitsWithStatus: (
    r: Replica,
    a: { today: string },
  ): Array<HabitWithStatus> =>
    rows(r, 'habits').map((row) => {
      const dates = [
        ...new Set(
          completionRows(r)
            .filter((c) => c.habitId === row.id)
            .map((c) => c.completedDate!),
        ),
      ].sort()
      const done = new Set(dates)
      let currentStreak = 0
      let day = new Date(`${a.today}T12:00:00`)
      if (!done.has(a.today)) day = subDays(day, 1)
      while (done.has(format(day, 'yyyy-MM-dd'))) {
        currentStreak++
        day = subDays(day, 1)
      }
      let longestStreak = 0,
        streak = 0,
        previous = ''
      for (const date of dates) {
        streak =
          previous ===
          format(subDays(new Date(`${date}T12:00:00`), 1), 'yyyy-MM-dd')
            ? streak + 1
            : 1
        longestStreak = Math.max(longestStreak, streak)
        previous = date
      }
      return {
        ...doc<'habits'>(row),
        totalCompletions: dates.length,
        currentStreak,
        longestStreak,
        completedToday: done.has(a.today),
        ...computeHabitXp({
          frequency: row.frequency!,
          totalCompletions: dates.length,
          createdAt: row.createdAt,
          completionDates: dates,
          today: a.today,
        }),
      }
    }),
  getActivityData: (r: Replica, a: { startDate: string; endDate: string }) => {
    const result: Record<string, number> = {}
    for (const row of completionRows(r))
      if (row.completedDate! >= a.startDate && row.completedDate! <= a.endDate)
        result[row.completedDate!] = (result[row.completedDate!] ?? 0) + 1
    return result
  },
  getWeekCompletions: (r: Replica, a: { startDate: string; endDate: string }) =>
    completionRows(r).filter(
      (row) =>
        row.completedDate! >= a.startDate && row.completedDate! <= a.endDate,
    ).length,
  getHabitCompletions: (
    r: Replica,
    a: { habitId: string; startDate: string; endDate: string },
  ) =>
    completionRows(r)
      .filter(
        (row) =>
          row.habitId === a.habitId &&
          row.completedDate! >= a.startDate &&
          row.completedDate! <= a.endDate,
      )
      .map((row) => row.completedDate!),
}
