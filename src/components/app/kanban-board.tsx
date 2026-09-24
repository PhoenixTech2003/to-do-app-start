import { DragDropProvider } from '@dnd-kit/react'
import { KanbanLane } from './kanban-lane'
import type { Todo } from '@/types/global'
import type { Id } from 'convex/_generated/dataModel'
import { useLocalMutation, useLocalPage } from '@/state/hooks'

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

  const {
    results: pendingTodosPage,
    status: pendingStatus,
    loadMore: loadMorePending,
  } = useLocalPage('GetPendingTodos', queryArgs, {
    initialNumItems: 6,
  })
  const {
    results: completedTodosPage,
    status: completedStatus,
    loadMore: loadMoreCompleted,
  } = useLocalPage('GetCompletedTodos', queryArgs, {
    initialNumItems: 6,
  })
  const {
    results: overdueTodosPage,
    status: overdueStatus,
    loadMore: loadMoreOverdue,
  } = useLocalPage('GetOverDueTodos', queryArgs, {
    initialNumItems: 6,
  })

  const toggle = useLocalMutation('toggleTodoStatus')
  const pendingTodos = pendingTodosPage
  const completedTodos = completedTodosPage
  const overdueTodos = overdueTodosPage

  return (
    <DragDropProvider
      onDragEnd={(e) => {
        const todo = e.operation.source?.data as Todo | undefined
        const target = e.operation.target?.id.toString().toLowerCase()
        if (
          !todo ||
          (target !== 'pending' &&
            target !== 'completed' &&
            target !== 'overdue')
        )
          return
        if (todo.status === target) return
        void toggle({ todoId: todo._id, status: target })
      }}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory sm:grid sm:grid-cols-3 sm:overflow-x-visible sm:snap-none sm:pb-0">
        <div className="min-w-[80vw] snap-center sm:min-w-0">
          <KanbanLane
            title="Pending"
            todos={pendingTodos}
            status={pendingStatus}
            loadMore={loadMorePending}
            initialNumItems={6}
          />
        </div>
        <div className="min-w-[80vw] snap-center sm:min-w-0">
          <KanbanLane
            title="Completed"
            todos={completedTodos}
            status={completedStatus}
            loadMore={loadMoreCompleted}
            initialNumItems={6}
          />
        </div>
        <div className="min-w-[80vw] snap-center sm:min-w-0">
          <KanbanLane
            title="Overdue"
            todos={overdueTodos}
            status={overdueStatus}
            loadMore={loadMoreOverdue}
            initialNumItems={6}
          />
        </div>
      </div>
    </DragDropProvider>
  )
}
