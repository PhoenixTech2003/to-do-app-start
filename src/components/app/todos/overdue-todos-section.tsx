import { usePaginatedQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { PaginationController } from '../pagination-controller'
import { StateHandler } from '../state-handler'
import { TodoCard } from './todo-card'
import { TodoSectionHeading } from './section-heading'
import type { Id } from 'convex/_generated/dataModel'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty } from '@/components/ui/empty'

interface OverdueTodosSectionProps {
  listId: Id<'lists'>
  searchTerm?: string
  priority?: string
}

function OverdueTodosLoadingSkeleton() {
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

function OverdueTodosEmptyState() {
  return (
    <div className="flex flex-col gap-3">
      <TodoSectionHeading tone="overdue" title="Overdue" />
      <Empty>Nothing overdue. You're on top of it.</Empty>
    </div>
  )
}

export function OverdueTodosSection({
  listId,
  searchTerm,
  priority,
}: OverdueTodosSectionProps) {
  const {
    results: todos,
    status: paginationStatus,
    isLoading: isPaginatedLoading,
    loadMore,
  } = usePaginatedQuery(
    api.todos.queries.GetOverDueTodos,
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
      loadingSkeleton={<OverdueTodosLoadingSkeleton />}
      emptyState={<OverdueTodosEmptyState />}
    >
      <div className="flex flex-col gap-3 mb-8">
        <TodoSectionHeading
          tone="overdue"
          title="Overdue"
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
          label="Overdue Todos"
          initialNumItems={6}
        />
      </div>
    </StateHandler>
  )
}
