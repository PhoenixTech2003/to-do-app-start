import { usePaginatedQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { PaginationController } from '../pagination-controller'
import { StateHandler } from '../state-handler'
import { Docket, DocketEmpty, DocketRowsSkeleton } from '../docket'
import { TodoCard } from './todo-card'
import { TodoSectionHeading } from './section-heading'
import type { Id } from 'convex/_generated/dataModel'

interface CompletedTodosSectionProps {
  listId: Id<'lists'>
  searchTerm?: string
  priority?: string
}

function CompletedTodosLoadingSkeleton() {
  return (
    <Docket className="mb-4">
      <TodoSectionHeading tone="completed" title="Completed" />
      <DocketRowsSkeleton />
    </Docket>
  )
}

function CompletedTodosEmptyState() {
  return (
    <Docket className="mb-4">
      <TodoSectionHeading tone="completed" title="Completed" />
      <DocketEmpty>Nothing completed yet. Check a task off to see it here.</DocketEmpty>
    </Docket>
  )
}

export function CompletedTodosSection({
  listId,
  searchTerm,
  priority,
}: CompletedTodosSectionProps) {
  const {
    results: todos,
    status: paginationStatus,
    isLoading: isPaginatedLoading,
    loadMore,
  } = usePaginatedQuery(
    api.todos.queries.GetCompletedTodos,
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
      loadingSkeleton={<CompletedTodosLoadingSkeleton />}
      emptyState={<CompletedTodosEmptyState />}
    >
      <Docket className="mb-4">
        <TodoSectionHeading
          tone="completed"
          title="Completed"
          count={todos.length}
        />
        {todos.map((todo) => (
          <TodoCard key={todo._id} todo={todo} />
        ))}
        <PaginationController
          status={paginationStatus}
          loadMore={loadMore}
          resultsCount={todos.length}
          label="Completed Todos"
          initialNumItems={6}
        />
      </Docket>
    </StateHandler>
  )
}
