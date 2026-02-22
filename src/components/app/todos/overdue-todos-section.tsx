import { motion } from 'motion/react'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import { StateHandler } from '../state-handler'
import { TodoCard } from './todo-card'
import type { Id } from 'convex/_generated/dataModel'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty } from '@/components/ui/empty'

interface OverdueTodosSectionProps {
  listId: Id<'lists'>
}

function OverdueTodosLoadingSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-6">
      <h2 className="font-bold text-lg sm:text-xl">Overdue Tasks</h2>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  )
}

function OverdueTodosEmptyState() {
  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-6">
      <h2 className="font-bold text-lg sm:text-xl">Overdue Tasks</h2>
      <Empty>No overdue tasks</Empty>
    </div>
  )
}

export function OverdueTodosSection({ listId }: OverdueTodosSectionProps) {
  const { data, isLoading, isFetching, isError, error } = useQuery(
    convexQuery(api.todos.queries.GetOverDueTodos, {
      listId,
    }),
  )

  return (
    <StateHandler
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      error={error}
      isEmpty={!data?.todos || data.todos.length === 0}
      loadingSkeleton={<OverdueTodosLoadingSkeleton />}
      emptyState={<OverdueTodosEmptyState />}
    >
      <div className="space-y-4 sm:space-y-6 p-2 sm:p-6">
        <h2 className="font-bold text-lg sm:text-xl">Overdue Tasks</h2>
        {data?.todos.map((todo) => (
          <motion.div key={todo._id} whileHover={{ scale: 1.03 }}>
            <TodoCard key={todo._id} todo={todo} />
          </motion.div>
        ))}
      </div>
    </StateHandler>
  )
}
