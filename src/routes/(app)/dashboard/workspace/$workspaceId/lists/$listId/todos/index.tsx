import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { convexQuery } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { ListTodo } from 'lucide-react'
import { CreateTodoDialog } from '@/components/app/todos/create-todo-dialog'
import { TodoCard } from '@/components/app/todos/todo-card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TodosPageSkeleton } from '@/components/app/todos/todos-page-skeleton'
import { BackButton } from '@/components/app/back-button'
import { StateHandler } from '@/components/app/state-handler'

export const Route = createFileRoute(
  '/(app)/dashboard/workspace/$workspaceId/lists/$listId/todos/',
)({
  loader: async (opts) => {
    await opts.context.queryClient.ensureQueryData(
      convexQuery(api.todos.queries.GetAllTodos, {
        listId: opts.params.listId as Id<'lists'>,
      }),
    )
  },
  pendingComponent: TodosPageSkeleton,
  component: RouteComponent,
})

function RouteComponent() {
  const { listId } = Route.useParams()
  const { data, isFetching, isError, error } = useSuspenseQuery(
    convexQuery(api.todos.queries.GetAllTodos, {
      listId: listId as Id<'lists'>,
    }),
  )

  return (
    <div className="p-6 grid">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <BackButton />
          <div>
            <h2 className="text-2xl font-semibold">
              {data.listDetails.title} List
            </h2>
            <p className="text-sm text-muted-foreground">
              Showing twodos for this list.
            </p>
          </div>
        </div>
        <CreateTodoDialog listId={listId as Id<'lists'>} />
      </header>
      <StateHandler
        isFetching={isFetching}
        isError={isError}
        error={error}
        isEmpty={data.todos.length === 0}
        loadingSkeleton={<TodosPageSkeleton />}
        emptyState={
          <div className="flex flex-col items-center justify-center space-y-6 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 px-4 py-16 sm:px-6 lg:px-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
              <ListTodo className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="space-y-2 text-center">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                No Todos Yet
              </h3>
              <p className="text-base text-slate-500 dark:text-slate-400">
                Create your first todo in {data.listDetails.title} to get
                started.
              </p>
            </div>
          </div>
        }
        errorTitle="Failed to load todos"
        errorDescription="An error occurred while loading the todos for this list. Please try again."
      >
        <ScrollArea className="w-full h-120">
          <div className="space-y-6 p-6">
            {data.todos.map((todo) => (
              <motion.div key={todo._id} whileHover={{ scale: 1.03 }}>
                <TodoCard key={todo._id} todo={todo} />
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </StateHandler>
    </div>
  )
}
