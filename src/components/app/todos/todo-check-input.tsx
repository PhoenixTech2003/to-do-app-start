import { useConvexMutation } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import { isAfter, parse } from 'date-fns'
import type { Todo } from '@/types/global'
import { Checkbox } from '@/components/ui/checkbox'

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
  // No due date: simple toggle (overdue also goes to completed)
  if (!dueDate) {
    return status === 'completed' ? 'pending' : 'completed'
  }

  // Has due date: completing a todo goes back to pending or overdue based on date,
  // otherwise mark as completed
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

    const pendingData = localStore.getQuery(api.todos.queries.GetPendingTodos, {
      listId: todo.listId,
    })
    const completedData = localStore.getQuery(
      api.todos.queries.GetCompletedTodos,
      { listId: todo.listId },
    )
    const overdueData = localStore.getQuery(api.todos.queries.GetOverDueTodos, {
      listId: todo.listId,
    })

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
      localStore.setQuery(
        api.todos.queries.GetPendingTodos,
        { listId: todo.listId },
        nextPending,
      )
    if (nextCompleted)
      localStore.setQuery(
        api.todos.queries.GetCompletedTodos,
        { listId: todo.listId },
        nextCompleted,
      )
    if (nextOverdue)
      localStore.setQuery(
        api.todos.queries.GetOverDueTodos,
        { listId: todo.listId },
        nextOverdue,
      )

    // Today page: getTodosByDate returns all todos for a date; update in place
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

  return (
    <Checkbox
      onCheckedChange={() =>
        toggleTodo({
          todoId: todo._id,
          status: getTodoStatus({
            status: todo.status,
            dueDate: formattedDate,
          }),
        })
      }
      className="shrink-0"
      checked={todo.status === 'completed'}
      aria-label={`Mark ${todo.title} complete`}
    />
  )
}
