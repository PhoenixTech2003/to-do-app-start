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

    const findTodoInQueries = (
      queryResults: Array<{
        args: Record<string, unknown>
        value: { page: Array<Todo> } | undefined
      }>,
    ) => {
      for (const { args: qArgs, value } of queryResults) {
        if (qArgs.listId !== todo.listId) continue
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

    const pendingMatch = findTodoInQueries(pendingQueries)
    const completedMatch = findTodoInQueries(completedQueries)
    const overdueMatch = findTodoInQueries(overdueQueries)

    let currentTodo =
      pendingMatch?.found ?? completedMatch?.found ?? overdueMatch?.found

    // On today page, only getTodosByDate is loaded - find todo there if not in paginated queries
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
        value: { page: Array<Todo> } | undefined
      }>,
      queryRef: typeof api.todos.queries.GetPendingTodos,
      isSource: boolean,
      isTarget: boolean,
    ) => {
      for (const { args: qArgs, value } of queries) {
        if (qArgs.listId !== todo.listId) continue
        if (!value) continue

        const isFirstPage = !(qArgs.paginationOpts as { cursor?: string }).cursor
        const pageContainsTodo = value.page.some((t) => t._id === todoId)

        let nextValue: {
          page: Array<Todo>
          isDone?: boolean
          continueCursor?: string
        }
        if (isSource && pageContainsTodo) {
          nextValue = {
            ...value,
            page: value.page.filter((t) => t._id !== todoId),
            isDone: false,
            continueCursor: 'optimistic',
          }
        } else if (isTarget && isFirstPage) {
          nextValue = {
            ...value,
            page: [optimisticTodo, ...value.page],
            isDone: false,
            continueCursor: 'optimistic',
          }
        } else continue

        localStore.setQuery(queryRef, qArgs as any, nextValue as any)
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

    // Update getTodosByDate - any query that contains this todo (today page, etc.)
    const byDateQueries = localStore.getAllQueries(
      api.globals.queries.getTodosByDate,
    )
    for (const { args: qArgs, value: byDateData } of byDateQueries) {
      if (!byDateData) continue
      const hasTodo = byDateData.todos.some((t) => t._id === todoId)
      if (!hasTodo) continue

      const nextTodos = byDateData.todos.map((t) =>
        t._id === todoId ? optimisticTodo : t,
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
        'relative flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border-2 transition-colors duration-150',
        isCompleted
          ? 'bg-primary border-primary'
          : 'bg-transparent border-border hover:border-primary',
      )}
      aria-label={`Mark ${todo.title} ${isCompleted ? 'incomplete' : 'complete'}`}
    >
      <AnimatePresence>
        {isCompleted && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.15 }}
          >
            <CheckIcon className="h-3 w-3 text-primary-foreground stroke-[3px]" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  )
}
