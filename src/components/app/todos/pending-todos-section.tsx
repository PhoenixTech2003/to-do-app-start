import { usePaginatedQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { StateHandler } from '../state-handler'
import { PaginationController } from '../pagination-controller'
import { TodoCard } from './todo-card'
import { TodoSectionHeading } from './section-heading'
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
      <TodoSectionHeading tone="pending" title="Pending" />
      <Empty>Nothing pending. Add a task to get started.</Empty>
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
        <TodoSectionHeading
          tone="pending"
          title="Pending"
          count={todos.length}
        />
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
