import { usePaginatedQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { PaginationController } from '../pagination-controller'
import { StateHandler } from '../state-handler'
import { Docket, DocketEmpty, DocketRowsSkeleton } from '../docket'
import { TodoCard } from './todo-card'
import { TodoSectionHeading } from './section-heading'
import type { Id } from 'convex/_generated/dataModel'

interface OverdueTodosSectionProps {
  listId: Id<'lists'>
  searchTerm?: string
  priority?: string
}

function OverdueTodosLoadingSkeleton() {
  return (
    <Docket className="mb-4">
      <TodoSectionHeading tone="overdue" title="Overdue" />
      <DocketRowsSkeleton />
    </Docket>
  )
}

function OverdueTodosEmptyState() {
  return (
    <Docket className="mb-4">
      <TodoSectionHeading tone="overdue" title="Overdue" />
      <DocketEmpty>Nothing overdue. You&apos;re on top of it.</DocketEmpty>
    </Docket>
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
      <Docket className="mb-4">
        <TodoSectionHeading
          tone="overdue"
          title="Overdue"
          count={todos.length}
        />
        {todos.map((todo) => (
          <TodoCard key={todo._id} todo={todo} />
        ))}
        <PaginationController
          status={paginationStatus}
          loadMore={loadMore}
          resultsCount={todos.length}
          label="Overdue Todos"
          initialNumItems={6}
        />
      </Docket>
    </StateHandler>
  )
}
