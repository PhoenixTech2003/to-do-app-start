import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import { zodValidator } from '@tanstack/zod-adapter'
import { z } from 'zod'
import type { Id } from 'convex/_generated/dataModel'
import { CreateTodoDialog } from '@/components/app/todos/create-todo-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TodosPageSkeleton } from '@/components/app/todos/todos-page-skeleton'
import { BackButton } from '@/components/app/back-button'
import { PendingTodosSection } from '@/components/app/todos/pending-todos-section'
import { OverdueTodosSection } from '@/components/app/todos/overdue-todos-section'
import { CompletedTodosSection } from '@/components/app/todos/completed-todos-section'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { KanbanBoard } from '@/components/app/kanban-board'
import { ViewModeTrigger } from '@/components/app/todos/view-mode'

const viewModeSchema = z.object({
  view: z.enum(['list', 'kanban']).default('list'),
})

export const Route = createFileRoute(
  '/(app)/dashboard/workspace/$workspaceId/lists/$listId/todos/',
)({
  validateSearch: zodValidator(viewModeSchema),
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
  const { listId, workspaceId } = Route.useParams()
  const { view } = Route.useSearch()
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
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              {data.title} List
              {isFetching ? (
                <Spinner className="text-muted-foreground" />
              ) : null}
            </h2>
            <p className="text-sm text-muted-foreground">
              Showing todos for this list.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div>
            <ViewModeTrigger
              mode={view}
              listId={listId}
              workspaceId={workspaceId}
            />
          </div>
          <CreateTodoDialog listId={listId as Id<'lists'>} />
        </div>
      </header>
      {isError ? (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Failed to load list</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : 'An unexpected error occurred.'}
          </AlertDescription>
        </Alert>
      ) : null}
      <section>
        {view === 'kanban' && <KanbanBoard listId={listId as Id<'lists'>} />}

        {view === 'list' && (
          <ScrollArea className="w-full h-120">
            <PendingTodosSection listId={listId as Id<'lists'>} />
            <OverdueTodosSection listId={listId as Id<'lists'>} />
            <CompletedTodosSection listId={listId as Id<'lists'>} />
          </ScrollArea>
        )}
      </section>
    </div>
  )
}
