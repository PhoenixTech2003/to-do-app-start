import { DragDropProvider } from '@dnd-kit/react'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import { toast } from 'sonner'
import { isAfter, parse } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { KanbanLane } from './kanban-lane'
import type { Todo } from '@/types/global'
import type { Id } from 'convex/_generated/dataModel'

interface KanbanBoardProps {
  listId: Id<'lists'>
  searchTerm?: string
  priority?: string
}

export function KanbanBoard({ listId, searchTerm, priority }: KanbanBoardProps) {
  const queryArgs = {
    listId,
    searchTerm: searchTerm || undefined,
    priority: priority === 'all' ? undefined : priority,
  }

  const { data: pendingTodos } = useQuery(
    convexQuery(api.todos.queries.GetPendingTodos, queryArgs),
  )
  const { data: completedTodos } = useQuery(
    convexQuery(api.todos.queries.GetCompletedTodos, queryArgs),
  )
  const { data: overdueTodos } = useQuery(
    convexQuery(api.todos.queries.GetOverDueTodos, queryArgs),
  )
  const updateTodoStatus = useConvexMutation(
    api.todos.mutations.toggleTodoStatus,
  ).withOptimisticUpdate((localStore, args) => {
    const { todoId, status: newStatus } = args

    const pendingData = localStore.getQuery(
      api.todos.queries.GetPendingTodos,
      queryArgs,
    )
    const completedData = localStore.getQuery(
      api.todos.queries.GetCompletedTodos,
      queryArgs,
    )
    const overdueData = localStore.getQuery(
      api.todos.queries.GetOverDueTodos,
      queryArgs,
    )

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
        queryArgs,
        nextPending,
      )
    if (nextCompleted)
      localStore.setQuery(
        api.todos.queries.GetCompletedTodos,
        queryArgs,
        nextCompleted,
      )
    if (nextOverdue)
      localStore.setQuery(
        api.todos.queries.GetOverDueTodos,
        queryArgs,
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
    if (!dueDate) {
      return status === 'completed' ? 'pending' : 'completed'
    }
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
          loading: 'Updating todo…',
          success: 'Todo updated',
          error: 'Failed to update todo',
        })
      }}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory sm:grid sm:grid-cols-3 sm:overflow-x-visible sm:snap-none sm:pb-0">
        <div className="min-w-[80vw] snap-center sm:min-w-0">
          <KanbanLane title="Pending" todos={pendingTodos?.todos ?? []} />
        </div>
        <div className="min-w-[80vw] snap-center sm:min-w-0">
          <KanbanLane title="Completed" todos={completedTodos?.todos ?? []} />
        </div>
        <div className="min-w-[80vw] snap-center sm:min-w-0">
          <KanbanLane title="Overdue" todos={overdueTodos?.todos ?? []} />
        </div>
      </div>
    </DragDropProvider>
  )
}
