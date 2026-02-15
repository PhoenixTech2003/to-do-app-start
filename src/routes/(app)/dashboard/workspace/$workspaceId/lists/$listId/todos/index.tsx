import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { convexQuery } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { CreateTodoDialog } from '@/components/app/todos/create-todo-dialog'
import { TodoCard } from '@/components/app/todos/todo-card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TodosPageSkeleton } from '@/components/app/todos/todos-page-skeleton'
import { BackButton } from '@/components/app/back-button'

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
  const { data } = useSuspenseQuery(
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
      <ScrollArea className="w-full h-120">
        <div className="space-y-6 p-6">
          {data.todos.map((todo) => (
            <motion.div key={todo._id} whileHover={{ scale: 1.03 }}>
              <TodoCard key={todo._id} todo={todo} />
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
