import { usePaginatedQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { StateHandler } from '../state-handler'
import { PaginationController } from '../pagination-controller'
import { Docket, DocketEmpty, DocketRowsSkeleton } from '../docket'
import { TodoCard } from './todo-card'
import { TodoSectionHeading } from './section-heading'
import type { Id } from 'convex/_generated/dataModel'

interface PendingTodosSectionProps {
  listId: Id<'lists'>
  searchTerm?: string
  priority?: string
}

function PendingTodosLoadingSkeleton() {
  return (
    <Docket className="mb-4">
      <TodoSectionHeading tone="pending" title="Pending" />
      <DocketRowsSkeleton />
    </Docket>
  )
}

function PendingTodosEmptyState() {
  return (
    <Docket className="mb-4">
      <TodoSectionHeading tone="pending" title="Pending" />
      <DocketEmpty>Nothing pending. Add a task to get started.</DocketEmpty>
    </Docket>
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
      <Docket className="mb-4">
        <TodoSectionHeading
          tone="pending"
          title="Pending"
          count={todos.length}
        />
        {todos.map((todo) => (
          <TodoCard key={todo._id} todo={todo} />
        ))}
        <PaginationController
          status={paginationStatus}
          loadMore={loadMore}
          resultsCount={todos.length}
          label="Pending Todos"
          initialNumItems={6}
        />
      </Docket>
    </StateHandler>
  )
}
