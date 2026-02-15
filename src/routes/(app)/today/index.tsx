import { createFileRoute } from '@tanstack/react-router'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { motion } from 'motion/react'
import { convexQuery } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { CheckCircle } from 'lucide-react'
import { BackButton } from '@/components/app/back-button'
import { TodoCard } from '@/components/app/todos/todo-card'
import { TodosPageSkeleton } from '@/components/app/todos/todos-page-skeleton'
import { StateHandler } from '@/components/app/state-handler'

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

  return (
    <div className="p-6 grid">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <BackButton />
          <div>
            <h2 className="text-2xl font-semibold">Twodo's for today</h2>
            <p className="text-sm text-muted-foreground">
              Showing twodos for today.
            </p>
          </div>
        </div>
      </header>
      <StateHandler
        isFetching={isFetching}
        isError={isError}
        error={error}
        isEmpty={data.todos.length === 0}
        loadingSkeleton={<TodosPageSkeleton />}
        emptyState={
          <div className="flex flex-col items-center justify-center space-y-6 rounded-lg border-2 border-dashed border-slate-200 bg-linear-to-br from-slate-50 to-slate-100 px-4 py-16 sm:px-6 lg:px-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
            <div className="space-y-2 text-center">
              <h3 className="text-2xl font-bold text-slate-900">
                All caught up!
              </h3>
              <p className="text-base text-slate-500">
                No tasks for today. Great job staying organized!
              </p>
            </div>
          </div>
        }
        errorTitle="Failed to load today's tasks"
        errorDescription="An error occurred while loading your tasks for today. Please try again."
      >
        <ScrollArea className="w-full h-72">
          <div className="space-y-6 p-6">
            {data.todos.map((todo) => (
              <motion.div key={todo._id} whileHover={{ scale: 1.03 }}>
                <TodoCard todo={todo} />
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </StateHandler>
    </div>
  )
}
