import { DragDropProvider } from '@dnd-kit/react'
import { isAfter, parse } from 'date-fns'
import { useMutation, usePaginatedQuery } from 'convex/react'
import { toast } from 'sonner'
import { api } from 'convex/_generated/api'
import { KanbanLane } from './kanban-lane'
import type { Todo } from '@/types/global'
import type { Id } from 'convex/_generated/dataModel'

interface KanbanBoardProps {
  listId: Id<'lists'>
  searchTerm?: string
  priority?: string
}

type PaginatedTodoResult = {
  page: Array<Todo>
  isDone: boolean
  continueCursor: string
}

export function KanbanBoard({
  listId,
  searchTerm,
  priority,
}: KanbanBoardProps) {
  const queryArgs = {
    listId,
    searchTerm: searchTerm || undefined,
    priority: priority === 'all' ? undefined : priority,
  }

  const {
    results: pendingTodosPage,
    status: pendingStatus,
    loadMore: loadMorePending,
  } = usePaginatedQuery(
    api.todos.queries.GetPendingTodos,
    queryArgs,
    { initialNumItems: 6 },
  )
  const {
    results: completedTodosPage,
    status: completedStatus,
    loadMore: loadMoreCompleted,
  } = usePaginatedQuery(
    api.todos.queries.GetCompletedTodos,
    queryArgs,
    { initialNumItems: 6 },
  )
  const {
    results: overdueTodosPage,
    status: overdueStatus,
    loadMore: loadMoreOverdue,
  } = usePaginatedQuery(
    api.todos.queries.GetOverDueTodos,
    queryArgs,
    { initialNumItems: 6 },
  )

  const updateTodoStatus = useMutation(
    api.todos.mutations.toggleTodoStatus,
  ).withOptimisticUpdate((localStore, args) => {
    const { todoId, status: newStatus } = args

    const findTodoInQueries = (
      queryResults: Array<{
        args: Record<string, unknown>
        value: PaginatedTodoResult | undefined
      }>,
    ) => {
      for (const { args: qArgs, value } of queryResults) {
        if (qArgs.listId !== listId) continue
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

    const currentTodo =
      pendingMatch?.found ?? completedMatch?.found ?? overdueMatch?.found
    if (!currentTodo) return

    const optimisticTodo = { ...currentTodo, status: newStatus } as Todo

    const updateQueriesForType = (
      queries: Array<{
        args: Record<string, unknown>
        value: PaginatedTodoResult | undefined
      }>,
      queryRef: typeof api.todos.queries.GetPendingTodos,
      isSource: boolean,
      isTarget: boolean,
    ) => {
      for (const { args: qArgs, value } of queries) {
        if (qArgs.listId !== listId) continue
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
        const todo = e.operation.source?.data as Todo | undefined
        if (!todo) return

        const formattedDate =
          todo.dueDate && todo.dueTime
            ? parse(
                `${todo.dueDate} ${todo.dueTime}`,
                'yyyy-MM-dd HH:mm',
                new Date(),
              )
            : undefined

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
          <KanbanLane
            title="Pending"
            todos={pendingTodosPage}
            status={pendingStatus}
            loadMore={loadMorePending}
            initialNumItems={6}
          />
        </div>
        <div className="min-w-[80vw] snap-center sm:min-w-0">
          <KanbanLane
            title="Completed"
            todos={completedTodosPage}
            status={completedStatus}
            loadMore={loadMoreCompleted}
            initialNumItems={6}
          />
        </div>
        <div className="min-w-[80vw] snap-center sm:min-w-0">
          <KanbanLane
            title="Overdue"
            todos={overdueTodosPage}
            status={overdueStatus}
            loadMore={loadMoreOverdue}
            initialNumItems={6}
          />
        </div>
      </div>
    </DragDropProvider>
  )
}
