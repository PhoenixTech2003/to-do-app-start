import { usePaginatedQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { StateHandler } from '../state-handler'
import { PaginationController } from '../pagination-controller'
import { TodoCard } from './todo-card'
import type { Id } from 'convex/_generated/dataModel'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty } from '@/components/ui/empty'

interface PendingTodosSectionProps {
  listId: Id<'lists'>
  searchTerm?: string
  priority?: string
}

function PendingTodosLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-5 w-24 rounded" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-md" />
        ))}
      </div>
    </div>
  )
}

function PendingTodosEmptyState() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <div className="h-1.5 w-1.5 rounded-full bg-chart-4" />
        <h2 className="text-xs font-mono font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Pending
        </h2>
      </div>
      <Empty>No pending tasks</Empty>
    </div>
  )
}

export function PendingTodosSection({
  listId,
  searchTerm,
  priority,
}: PendingTodosSectionProps) {
  const {
    results: todos,
    status: paginationStatus,
    isLoading: isPaginatedLoading,
    loadMore,
  } = usePaginatedQuery(
    api.todos.queries.GetPendingTodos,
    {
      listId,
      searchTerm: searchTerm || undefined,
      priority: priority === 'all' ? undefined : priority,
    },
    { initialNumItems: 6 },
  )

  const isLoading = paginationStatus === 'LoadingFirstPage'
  const isFetching = isPaginatedLoading
  const isError = false
  const error = null

  return (
    <StateHandler
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      error={error}
      isEmpty={todos.length === 0}
      loadingSkeleton={<PendingTodosLoadingSkeleton />}
      emptyState={<PendingTodosEmptyState />}
    >
      <div className="flex flex-col gap-3 mb-8">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-chart-4" />
            <h2 className="text-xs font-mono font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Pending
            </h2>
          </div>
          <span className="font-mono text-[10px] font-bold text-muted-foreground tabular-nums">
            {todos.length}
          </span>
        </div>
        <div className="space-y-2">
          {todos.map((todo) => (
            <TodoCard key={todo._id} todo={todo} />
          ))}
        </div>
        <PaginationController
          status={paginationStatus}
          loadMore={loadMore}
          resultsCount={todos.length}
          label="Pending Todos"
          initialNumItems={6}
        />
      </div>
    </StateHandler>
  )
}
