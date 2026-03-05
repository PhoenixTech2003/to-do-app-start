import { AnimatePresence } from 'motion/react'
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
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
        <h2 className="text-xs font-mono font-semibold uppercase tracking-[0.15em] text-muted-foreground">Overdue</h2>
      </div>
      <Empty>No overdue tasks</Empty>
    </div>
  )
}

export function OverdueTodosSection({
  listId,
  searchTerm,
  priority,
}: OverdueTodosSectionProps) {
  const { data, isLoading, isFetching, isError, error } = useQuery(
    convexQuery(api.todos.queries.GetOverDueTodos, {
      listId,
      searchTerm: searchTerm || undefined,
      priority: priority === 'all' ? undefined : priority,
    }),
  )

  const todos = data?.todos ?? []

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
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
            <h2 className="text-xs font-mono font-semibold uppercase tracking-[0.15em] text-muted-foreground">Overdue</h2>
          </div>
          <span className="font-mono text-[10px] font-bold text-muted-foreground tabular-nums">{todos.length}</span>
        </div>
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {todos.map((todo) => (
              <TodoCard key={todo._id} todo={todo} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </StateHandler>
  )
}
