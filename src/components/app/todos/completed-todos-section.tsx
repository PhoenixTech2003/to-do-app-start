import { motion } from 'motion/react'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import { StateHandler } from '../state-handler'
import { TodoCard } from './todo-card'
import type { Id } from 'convex/_generated/dataModel'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty } from '@/components/ui/empty'

interface CompletedTodosSectionProps {
  listId: Id<'lists'>
  searchTerm?: string
  priority?: string
}

function CompletedTodosLoadingSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-6">
      <h2 className="font-bold text-lg sm:text-xl">Completed Tasks</h2>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  )
}

function CompletedTodosEmptyState() {
  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-6">
      <h2 className="font-bold text-lg sm:text-xl">Completed Tasks</h2>
      <Empty>No completed tasks</Empty>
    </div>
  )
}

export function CompletedTodosSection({
  listId,
  searchTerm,
  priority,
}: CompletedTodosSectionProps) {
  const { data, isLoading, isFetching, isError, error } = useQuery(
    convexQuery(api.todos.queries.GetCompletedTodos, {
      listId,
      searchTerm: searchTerm || undefined,
      priority: priority === 'all' ? undefined : priority,
    }),
  )

  return (
    <StateHandler
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      error={error}
      isEmpty={!data?.todos || data.todos.length === 0}
      loadingSkeleton={<CompletedTodosLoadingSkeleton />}
      emptyState={<CompletedTodosEmptyState />}
    >
      <div className="space-y-4 sm:space-y-6 p-2 sm:p-6">
        <h2 className="font-bold text-lg sm:text-xl">Completed Tasks</h2>
        {data?.todos.map((todo) => (
          <motion.div key={todo._id} whileHover={{ scale: 1.03 }}>
            <TodoCard key={todo._id} todo={todo} />
          </motion.div>
        ))}
      </div>
    </StateHandler>
  )
}
