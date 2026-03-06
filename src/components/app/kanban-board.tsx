import { DragDropProvider } from '@dnd-kit/react'
import { isAfter, parse } from 'date-fns'
import { useState } from 'react'
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

  const [pendingRefreshKey, setPendingRefreshKey] = useState(0)
  const [completedRefreshKey, setCompletedRefreshKey] = useState(0)
  const [overdueRefreshKey, setOverdueRefreshKey] = useState(0)

  const {
    results: pendingTodosPage,
    status: pendingStatus,
    loadMore: loadMorePending,
  } = usePaginatedQuery(
    api.todos.queries.GetPendingTodos,
    { ...queryArgs, refreshKey: pendingRefreshKey },
    {
      initialNumItems: 6,
    },
  )
  const {
    results: completedTodosPage,
    status: completedStatus,
    loadMore: loadMoreCompleted,
  } = usePaginatedQuery(
    api.todos.queries.GetCompletedTodos,
    { ...queryArgs, refreshKey: completedRefreshKey },
    {
      initialNumItems: 6,
    },
  )
  const {
    results: overdueTodosPage,
    status: overdueStatus,
    loadMore: loadMoreOverdue,
  } = usePaginatedQuery(
    api.todos.queries.GetOverDueTodos,
    { ...queryArgs, refreshKey: overdueRefreshKey },
    {
      initialNumItems: 6,
    },
  )

  const updateTodoStatus = useMutation(api.todos.mutations.toggleTodoStatus)

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
            onShowLess={() => setPendingRefreshKey((prev) => prev + 1)}
          />
        </div>
        <div className="min-w-[80vw] snap-center sm:min-w-0">
          <KanbanLane
            title="Completed"
            todos={completedTodosPage}
            status={completedStatus}
            loadMore={loadMoreCompleted}
            initialNumItems={6}
            onShowLess={() => setCompletedRefreshKey((prev) => prev + 1)}
          />
        </div>
        <div className="min-w-[80vw] snap-center sm:min-w-0">
          <KanbanLane
            title="Overdue"
            todos={overdueTodosPage}
            status={overdueStatus}
            loadMore={loadMoreOverdue}
            initialNumItems={6}
            onShowLess={() => setOverdueRefreshKey((prev) => prev + 1)}
          />
        </div>
      </div>
    </DragDropProvider>
  )
}
