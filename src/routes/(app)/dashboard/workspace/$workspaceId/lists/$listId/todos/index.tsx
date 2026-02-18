import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { CreateTodoDialog } from '@/components/app/todos/create-todo-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TodosPageSkeleton } from '@/components/app/todos/todos-page-skeleton'
import { BackButton } from '@/components/app/back-button'
import { PendingTodosSection } from '@/components/app/todos/pending-todos-section'
import { OverdueTodosSection } from '@/components/app/todos/overdue-todos-section'
import { CompletedTodosSection } from '@/components/app/todos/completed-todos-section'

export const Route = createFileRoute(
  '/(app)/dashboard/workspace/$workspaceId/lists/$listId/todos/',
)({
  loader: async (opts) => {
    await opts.context.queryClient.ensureQueryData(
      convexQuery(api.todos.queries.GetListDetails, {
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
    convexQuery(api.todos.queries.GetListDetails, {
      listId: listId as Id<'lists'>,
    }),
  )

  return (
    <div className="p-6 grid">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <BackButton />
          <div>
            <h2 className="text-2xl font-semibold">{data.title} List</h2>
            <p className="text-sm text-muted-foreground">
              Showing twodos for this list.
            </p>
          </div>
        </div>
        <CreateTodoDialog listId={listId as Id<'lists'>} />
      </header>
      <ScrollArea className="w-full h-120">
        <PendingTodosSection listId={listId as Id<'lists'>} />
        <OverdueTodosSection listId={listId as Id<'lists'>} />
        <CompletedTodosSection listId={listId as Id<'lists'>} />
      </ScrollArea>
    </div>
  )
}
