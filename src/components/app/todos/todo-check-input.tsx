import { useConvexMutation } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import { isAfter, parse } from 'date-fns'
import { CheckIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type { Todo } from '@/types/global'
import { cn } from '@/lib/utils'

interface StateHandlerProps {
  isFetching?: boolean
}

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
  const toggleTodo = useConvexMutation(
    api.todos.mutations.toggleTodoStatus,
  ).withOptimisticUpdate((localStore, args) => {
    const { todoId, status: newStatus } = args
    const listArgs = {
      listId: todo.listId,
      paginationOpts: { numItems: 6, cursor: null },
    }

    const pendingData = localStore.getQuery(
      api.todos.queries.GetPendingTodos,
      listArgs,
    )
    const completedData = localStore.getQuery(
      api.todos.queries.GetCompletedTodos,
      listArgs,
    )
    const overdueData = localStore.getQuery(
      api.todos.queries.GetOverDueTodos,
      listArgs,
    )

    const findTodo = (data: { page: Array<Todo> } | undefined) =>
      data?.page.find((t) => t._id === todoId)

    const currentTodo =
      findTodo(pendingData) ?? findTodo(completedData) ?? findTodo(overdueData)
    if (!currentTodo) return

    const optimisticTodo = { ...currentTodo, status: newStatus } as Todo

    const withoutTodo = (data: { page: Array<Todo> } | undefined) =>
      data
        ? { ...data, page: data.page.filter((t: Todo) => t._id !== todoId) }
        : undefined

    const withTodo = (
      data: { page: Array<Todo> } | undefined,
      optimisticTodoItem: Todo,
    ) =>
      data ? { ...data, page: [optimisticTodoItem, ...data.page] } : undefined

    const nextPending =
      currentTodo.status === 'pending'
        ? withoutTodo(pendingData)
        : newStatus === 'pending'
          ? withTodo(pendingData, optimisticTodo)
          : pendingData
    const nextCompleted =
      currentTodo.status === 'completed'
        ? withoutTodo(completedData)
        : newStatus === 'completed'
          ? withTodo(completedData, optimisticTodo)
          : completedData
    const nextOverdue =
      currentTodo.status === 'overdue'
        ? withoutTodo(overdueData)
        : newStatus === 'overdue'
          ? withTodo(overdueData, optimisticTodo)
          : overdueData

    if (nextPending)
      localStore.setQuery(api.todos.queries.GetPendingTodos, listArgs, {
        ...nextPending,
        isDone: false,
        continueCursor: 'optimistic',
      })
    if (nextCompleted)
      localStore.setQuery(api.todos.queries.GetCompletedTodos, listArgs, {
        ...nextCompleted,
        isDone: false,
        continueCursor: 'optimistic',
      })
    if (nextOverdue)
      localStore.setQuery(api.todos.queries.GetOverDueTodos, listArgs, {
        ...nextOverdue,
        isDone: false,
        continueCursor: 'optimistic',
      })

    if (todo.dueDate) {
      const byDateData = localStore.getQuery(
        api.globals.queries.getTodosByDate,
        { date: todo.dueDate },
      )
      if (byDateData) {
        const nextTodos = byDateData.todos.map((t) =>
          t._id === todoId ? optimisticTodo : t,
        )
        localStore.setQuery(
          api.globals.queries.getTodosByDate,
          { date: todo.dueDate },
          { todos: nextTodos },
        )
      }
    }
  })

  const formattedDate =
    todo.dueDate && todo.dueTime
      ? parse(`${todo.dueDate} ${todo.dueTime}`, 'yyyy-MM-dd HH:mm', new Date())
      : undefined

  const isCompleted = todo.status === 'completed'

  return (
    <button
      onClick={() =>
        toggleTodo({
          todoId: todo._id,
          status: getTodoStatus({
            status: todo.status,
            dueDate: formattedDate,
          }),
        })
      }
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
