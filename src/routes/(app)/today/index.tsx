import { createFileRoute } from '@tanstack/react-router'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { motion } from 'motion/react'
import { convexQuery } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { BackButton } from '@/components/app/back-button'
import { TodoCard } from '@/components/app/todos/todo-card'
import { TodosPageSkeleton } from '@/components/app/todos/todos-page-skeleton'
import { StateHandler } from '@/components/app/state-handler'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty } from '@/components/ui/empty'

export const Route = createFileRoute('/(app)/today/')({
  loaderDeps: () => ({
    today: format(new Date(), 'yyyy-LL-dd'),
  }),
  loader: async (opts) => {
    await opts.context.queryClient.ensureQueryData(
      convexQuery(api.globals.queries.getTodosByDate, {
        date: opts.deps.today,
      }),
    )
  },
  pendingComponent: TodosPageSkeleton,
  component: TodayPage,
})

function TodayPage() {
  const deps = Route.useLoaderDeps()
  const { data, isFetching, isError, error } = useSuspenseQuery(
    convexQuery(api.globals.queries.getTodosByDate, {
      date: deps.today,
    }),
  )

  const pendingTodos = data.todos.filter((t: any) => t.status === 'pending')
  const completedTodos = data.todos.filter((t: any) => t.status === 'completed')

  return (
    <div className="p-6 flex flex-col">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <BackButton />
          <div>
            <h2 className="text-2xl font-semibold">Todos for today</h2>
            <p className="text-sm text-muted-foreground">
              Showing todos for today.
            </p>
          </div>
        </div>
      </header>
      <ScrollArea className="w-full h-75">
        <div className="space-y-6">
          <StateHandler
            isFetching={isFetching}
            isError={isError}
            error={error}
            isEmpty={pendingTodos.length === 0}
            loadingSkeleton={
              <div className="space-y-6 p-6">
                <h2 className="font-bold text-xl">Pending Tasks</h2>
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              </div>
            }
            emptyState={
              <div className="space-y-6 p-6">
                <h2 className="font-bold text-xl">Pending Tasks</h2>
                <Empty>No pending tasks for today</Empty>
              </div>
            }
            errorTitle="Failed to load today's pending tasks"
            errorDescription="An error occurred while loading pending tasks. Please try again."
          >
            <div className="space-y-6 p-6">
              <h2 className="font-bold text-xl">Pending Tasks</h2>
              {pendingTodos.map((todo: any) => (
                <motion.div key={todo._id} whileHover={{ scale: 1.03 }}>
                  <TodoCard todo={todo} />
                </motion.div>
              ))}
            </div>
          </StateHandler>

          <StateHandler
            isFetching={isFetching}
            isError={isError}
            error={error}
            isEmpty={completedTodos.length === 0}
            loadingSkeleton={
              <div className="space-y-6 p-6">
                <h2 className="font-bold text-xl">Completed Tasks</h2>
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              </div>
            }
            emptyState={
              <div className="space-y-6 p-6">
                <h2 className="font-bold text-xl">Completed Tasks</h2>
                <Empty>No completed tasks for today</Empty>
              </div>
            }
            errorTitle="Failed to load today's completed tasks"
            errorDescription="An error occurred while loading completed tasks. Please try again."
          >
            <div className="space-y-6 p-6">
              <h2 className="font-bold text-xl">Completed Tasks</h2>
              {completedTodos.map((todo: any) => (
                <motion.div key={todo._id} whileHover={{ scale: 1.03 }}>
                  <TodoCard todo={todo} />
                </motion.div>
              ))}
            </div>
          </StateHandler>
        </div>
      </ScrollArea>
    </div>
  )
}
