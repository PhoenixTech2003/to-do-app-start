import { useConvexMutation } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import { isAfter, parse } from 'date-fns'
import type { Todo } from '@/types/global'
import { motion, AnimatePresence } from 'motion/react'
import { CheckIcon } from 'lucide-react'
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
  const toggleTodo = useConvexMutation(
    api.todos.mutations.toggleTodoStatus,
  ).withOptimisticUpdate((localStore, args) => {
    const { todoId, status: newStatus } = args
    const pendingData = localStore.getQuery(api.todos.queries.GetPendingTodos, { listId: todo.listId })
    const completedData = localStore.getQuery(api.todos.queries.GetCompletedTodos, { listId: todo.listId })
    const overdueData = localStore.getQuery(api.todos.queries.GetOverDueTodos, { listId: todo.listId })

    const findTodo = (data: { todos: Array<Todo> } | undefined) =>
      data?.todos.find((t) => t._id === todoId)
    const currentTodo =
      findTodo(pendingData) ?? findTodo(completedData) ?? findTodo(overdueData)
    if (!currentTodo) return

    const optimisticTodo = { ...currentTodo, status: newStatus } as Todo

    const withoutTodo = (data: { todos: Array<Todo> } | undefined) =>
      data ? { todos: data.todos.filter((t) => t._id !== todoId) } : undefined
    const withTodo = (
      data: { todos: Array<Todo> } | undefined,
      optimisticTodoItem: Todo,
    ) => (data ? { todos: [...data.todos, optimisticTodoItem] } : undefined)

    const nextPending = currentTodo.status === 'pending' ? withoutTodo(pendingData) : newStatus === 'pending' ? withTodo(pendingData, optimisticTodo) : pendingData
    const nextCompleted = currentTodo.status === 'completed' ? withoutTodo(completedData) : newStatus === 'completed' ? withTodo(completedData, optimisticTodo) : completedData
    const nextOverdue = currentTodo.status === 'overdue' ? withoutTodo(overdueData) : newStatus === 'overdue' ? withTodo(overdueData, optimisticTodo) : overdueData

    if (nextPending) localStore.setQuery(api.todos.queries.GetPendingTodos, { listId: todo.listId }, nextPending)
    if (nextCompleted) localStore.setQuery(api.todos.queries.GetCompletedTodos, { listId: todo.listId }, nextCompleted)
    if (nextOverdue) localStore.setQuery(api.todos.queries.GetOverDueTodos, { listId: todo.listId }, nextOverdue)

    if (todo.dueDate) {
      const byDateData = localStore.getQuery(api.globals.queries.getTodosByDate, { date: todo.dueDate })
      if (byDateData) {
        const nextTodos = byDateData.todos.map((t) => t._id === todoId ? optimisticTodo : t)
        localStore.setQuery(api.globals.queries.getTodosByDate, { date: todo.dueDate }, { todos: nextTodos })
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
        "relative flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border-2 transition-colors duration-150",
        isCompleted
          ? "bg-primary border-primary"
          : "bg-transparent border-border hover:border-primary"
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
