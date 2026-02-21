import { DragDropProvider } from '@dnd-kit/react'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import { toast } from 'sonner'
import { isAfter, parse } from 'date-fns'
import { useSuspenseQuery } from '@tanstack/react-query'
import { KanbanLane } from './kanban-lane'
import type { Todo } from '@/types/global'
import type { Id } from 'convex/_generated/dataModel'

interface KanbanBoardProps {
  listId: Id<'lists'>
}

export function KanbanBoard({ listId }: KanbanBoardProps) {
  const { data: pendingTodos } = useSuspenseQuery(
    convexQuery(api.todos.queries.GetPendingTodos, {
      listId,
    }),
  )
  const { data: completedTodos } = useSuspenseQuery(
    convexQuery(api.todos.queries.GetCompletedTodos, {
      listId,
    }),
  )
  const { data: overdueTodos } = useSuspenseQuery(
    convexQuery(api.todos.queries.GetOverDueTodos, {
      listId,
    }),
  )
  const updateTodoStatus = useConvexMutation(
    api.todos.mutations.toggleTodoStatus,
  ).withOptimisticUpdate((localStore, args) => {
    const { todoId, status: newStatus } = args

    const pendingData = localStore.getQuery(api.todos.queries.GetPendingTodos, {
      listId,
    })
    const completedData = localStore.getQuery(
      api.todos.queries.GetCompletedTodos,
      { listId },
    )
    const overdueData = localStore.getQuery(api.todos.queries.GetOverDueTodos, {
      listId,
    })

    const findTodo = (data: { todos: Array<Todo> } | undefined) =>
      data?.todos.find((t) => t._id === todoId)
    const currentTodo =
      findTodo(pendingData) ?? findTodo(completedData) ?? findTodo(overdueData)
    if (!currentTodo) return

    const optimisticTodo = { ...currentTodo, status: newStatus } as Todo

    const withoutTodo = (data: { todos: Array<Todo> } | undefined) =>
      data ? { todos: data.todos.filter((t) => t._id !== todoId) } : undefined
    const withTodo = (data: { todos: Array<Todo> } | undefined, todo: Todo) =>
      data ? { todos: [...data.todos, todo] } : undefined

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
        { listId },
        nextPending,
      )
    if (nextCompleted)
      localStore.setQuery(
        api.todos.queries.GetCompletedTodos,
        { listId },
        nextCompleted,
      )
    if (nextOverdue)
      localStore.setQuery(
        api.todos.queries.GetOverDueTodos,
        { listId },
        nextOverdue,
      )
  })
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
  return (
    <DragDropProvider
      onDragEnd={(e) => {
        const todo = e.operation.source?.data as Todo
        const formattedDate = parse(
          `${todo.dueDate} ${todo.dueTime}`,
          'yyyy-MM-dd HH:mm',
          new Date(),
        )
        const containerStatus = e.operation.target?.id.toString().toLowerCase()
        if (containerStatus === todo.status) {
          return
        }

        const status = getTodoStatus({
          status: todo.status,
          dueDate: formattedDate,
        })
        const todoPromise = updateTodoStatus({
          todoId: todo._id,
          status,
        })

        toast.promise(todoPromise, {
          loading: 'Updating Todo....',
          success: 'Todo updated successfully',
          error: 'Failed to updated todo',
        })
      }}
    >
      <div className="grid grid-cols-3 gap-4">
        <KanbanLane title="Pending" todos={pendingTodos.todos} />
        <KanbanLane title="Completed" todos={completedTodos.todos} />
        <KanbanLane title="Overdue" todos={overdueTodos.todos} />
      </div>
    </DragDropProvider>
  )
}
