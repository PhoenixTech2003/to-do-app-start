import { useEffect, useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
import { isAfter, parse } from 'date-fns'
import { CheckIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type { Todo } from '@/types/global'
import { cn } from '@/lib/utils'

interface TodoCheckInputProps {
  todo: Todo
}

type PaginatedTodoResult = {
  page: Array<Todo>
  isDone: boolean
  continueCursor: string
}

function getTodoStatus({
  status,
  dueDate,
}: {
  status: 'pending' | 'completed' | 'overdue'
  dueDate?: Date
}) {
  if (!dueDate) {
    return status === 'completed' ? 'pending' : 'completed'
  }

  const now = new Date()
  if (status === 'completed') {
    return isAfter(now, dueDate) ? 'overdue' : 'pending'
  }

  return 'completed'
}

export function TodoCheckInput({ todo }: TodoCheckInputProps) {
  const [optimisticStatus, setOptimisticStatus] = useState<
    'pending' | 'completed' | 'overdue' | null
  >(null)

  const toggleTodo = useMutation(
    api.todos.mutations.toggleTodoStatus,
  ).withOptimisticUpdate((localStore, args) => {
    const { todoId, status: newStatus } = args
    const matchesQueryList = (queryArgs: Record<string, unknown>) => {
      if ('listId' in queryArgs) {
        return queryArgs.listId === todo.listId
      }

      return todo.listId === undefined
    }

    const findTodoInQueries = (
      queryResults: Array<{
        args: Record<string, unknown>
        value: PaginatedTodoResult | undefined
      }>,
    ) => {
      for (const { args: qArgs, value } of queryResults) {
        if (!matchesQueryList(qArgs)) continue
        const found = value?.page.find((t) => t._id === todoId)
        if (found) return { found, args: qArgs, value }
      }
      return null
    }

    const pendingQueries = localStore.getAllQueries(
      api.todos.queries.GetPendingTodos,
    )
    const completedQueries = localStore.getAllQueries(
      api.todos.queries.GetCompletedTodos,
    )
    const overdueQueries = localStore.getAllQueries(
      api.todos.queries.GetOverDueTodos,
    )
    const inboxPendingQueries = localStore.getAllQueries(
      api.todos.queries.GetInboxPendingTodos,
    )
    const inboxCompletedQueries = localStore.getAllQueries(
      api.todos.queries.GetInboxCompletedTodos,
    )
    const inboxOverdueQueries = localStore.getAllQueries(
      api.todos.queries.GetInboxOverdueTodos,
    )
    const globalUpcomingQueries = localStore.getAllQueries(
      api.globals.queries.GetAllUpcomingTodos,
    )
    const globalOverdueQueries = localStore.getAllQueries(
      api.globals.queries.GetAllOverdueTodos,
    )

    const findTodoInGlobalQueries = (
      queryResults: Array<{
        args: Record<string, unknown>
        value: PaginatedTodoResult | undefined
      }>,
    ) => {
      for (const { args: qArgs, value } of queryResults) {
        const found = value?.page.find((t) => t._id === todoId)
        if (found) return { found, args: qArgs, value }
      }
      return null
    }

    const pendingMatch = findTodoInQueries(pendingQueries)
    const completedMatch = findTodoInQueries(completedQueries)
    const overdueMatch = findTodoInQueries(overdueQueries)
    const inboxPendingMatch = findTodoInQueries(inboxPendingQueries)
    const inboxCompletedMatch = findTodoInQueries(inboxCompletedQueries)
    const inboxOverdueMatch = findTodoInQueries(inboxOverdueQueries)
    const globalUpcomingMatch = findTodoInGlobalQueries(globalUpcomingQueries)
    const globalOverdueMatch = findTodoInGlobalQueries(globalOverdueQueries)

    let currentTodo =
      pendingMatch?.found ??
      completedMatch?.found ??
      overdueMatch?.found ??
      inboxPendingMatch?.found ??
      inboxCompletedMatch?.found ??
      inboxOverdueMatch?.found ??
      globalUpcomingMatch?.found ??
      globalOverdueMatch?.found

    if (!currentTodo) {
      const byDateQueries = localStore.getAllQueries(
        api.globals.queries.getTodosByDate,
      )
      for (const { value: byDateData } of byDateQueries) {
        const found = byDateData?.todos.find((t) => t._id === todoId)
        if (found) {
          currentTodo = found
          break
        }
      }
    }

    if (!currentTodo) return

    const optimisticTodo = { ...currentTodo, status: newStatus } as Todo

    const updateQueriesForType = (
      queries: Array<{
        args: Record<string, unknown>
        value: PaginatedTodoResult | undefined
      }>,
      queryRef: any,
      isSource: boolean,
      isTarget: boolean,
      global = false,
    ) => {
      for (const { args: qArgs, value } of queries) {
        if (!global && !matchesQueryList(qArgs)) continue
        if (!value) continue

        const isFirstPage =
          (qArgs.paginationOpts as { cursor?: string | null }).cursor == null
        const pageContainsTodo = value.page.some((t) => t._id === todoId)

        let nextValue: typeof value | undefined
        if (isSource && pageContainsTodo) {
          nextValue = {
            ...value,
            page: value.page.filter((t) => t._id !== todoId),
          }
        } else if (isTarget && isFirstPage) {
          nextValue = {
            ...value,
            page: [optimisticTodo, ...value.page],
          }
        } else continue

        localStore.setQuery(queryRef, qArgs as any, nextValue)
      }
    }

    updateQueriesForType(
      pendingQueries,
      api.todos.queries.GetPendingTodos,
      !!pendingMatch,
      newStatus === 'pending',
    )
    updateQueriesForType(
      completedQueries,
      api.todos.queries.GetCompletedTodos,
      !!completedMatch,
      newStatus === 'completed',
    )
    updateQueriesForType(
      overdueQueries,
      api.todos.queries.GetOverDueTodos,
      !!overdueMatch,
      newStatus === 'overdue',
    )
    updateQueriesForType(
      inboxPendingQueries,
      api.todos.queries.GetInboxPendingTodos,
      !!inboxPendingMatch,
      newStatus === 'pending',
    )
    updateQueriesForType(
      inboxCompletedQueries,
      api.todos.queries.GetInboxCompletedTodos,
      !!inboxCompletedMatch,
      newStatus === 'completed',
    )
    updateQueriesForType(
      inboxOverdueQueries,
      api.todos.queries.GetInboxOverdueTodos,
      !!inboxOverdueMatch,
      newStatus === 'overdue',
    )
    updateQueriesForType(
      globalUpcomingQueries,
      api.globals.queries.GetAllUpcomingTodos,
      !!globalUpcomingMatch,
      newStatus === 'pending',
      true,
    )
    updateQueriesForType(
      globalOverdueQueries,
      api.globals.queries.GetAllOverdueTodos,
      !!globalOverdueMatch,
      newStatus === 'overdue',
      true,
    )

    // Update getTodosByDate - any query that contains this todo (today page, etc.)
    const byDateQueries = localStore.getAllQueries(
      api.globals.queries.getTodosByDate,
    )
    for (const { args: qArgs, value: byDateData } of byDateQueries) {
      if (!byDateData) continue
      const hasTodo = byDateData.todos.some((t) => t._id === todoId)
      if (!hasTodo) continue

      const nextTodos = byDateData.todos.map((t) =>
        t._id === todoId ? { ...t, status: newStatus } : t,
      )
      localStore.setQuery(api.globals.queries.getTodosByDate, qArgs, {
        todos: nextTodos,
      })
    }
  })

  const formattedDate =
    todo.dueDate && todo.dueTime
      ? parse(`${todo.dueDate} ${todo.dueTime}`, 'yyyy-MM-dd HH:mm', new Date())
      : undefined

  const displayStatus = optimisticStatus ?? todo.status
  const isCompleted = displayStatus === 'completed'

  useEffect(() => {
    if (optimisticStatus !== null && todo.status === optimisticStatus) {
      setOptimisticStatus(null)
    }
  }, [todo.status, optimisticStatus])

  const handleClick = () => {
    const newStatus = getTodoStatus({
      status: todo.status,
      dueDate: formattedDate,
    })
    setOptimisticStatus(newStatus)
    toggleTodo({
      todoId: todo._id,
      status: newStatus,
    }).catch(() => setOptimisticStatus(null))
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'relative flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border',
        'transition-[background-color,border-color,box-shadow] duration-[var(--dur-2)] ease-[var(--ease-out)]',
        'active:scale-95 active:duration-[var(--dur-1)]',
        isCompleted
          ? // Filled: ink laid down, with a lit top edge so it sits proud.
            'border-primary bg-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),var(--elev-1)]'
          : // Empty: a shallow well cut into the card.
            'border-hairline-strong bg-surface-sunken shadow-inset-well hover:border-primary/70 hover:bg-primary/5',
      )}
      aria-pressed={isCompleted}
      aria-label={`Mark ${todo.title} ${isCompleted ? 'incomplete' : 'complete'}`}
    >
      <AnimatePresence initial={false}>
        {isCompleted && (
          <motion.span
            className="flex"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <CheckIcon className="h-3 w-3 text-primary-foreground stroke-[3.5px]" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
