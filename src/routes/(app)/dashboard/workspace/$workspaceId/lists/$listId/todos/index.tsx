import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import { zodValidator } from '@tanstack/zod-adapter'
import { z } from 'zod'
import type { Id } from 'convex/_generated/dataModel'
import { CreateTodoDialog } from '@/components/app/todos/create-todo-dialog'
import { TodosPageSkeleton } from '@/components/app/todos/todos-page-skeleton'
import { BackButton } from '@/components/app/back-button'
import { PendingTodosSection } from '@/components/app/todos/pending-todos-section'
import { OverdueTodosSection } from '@/components/app/todos/overdue-todos-section'
import { CompletedTodosSection } from '@/components/app/todos/completed-todos-section'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { KanbanBoard } from '@/components/app/kanban-board'
import { ViewModeTrigger } from '@/components/app/todos/view-mode'
import { useIsMobile } from '@/hooks/use-mobile'

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
  const { view: searchView } = Route.useSearch()
  const isMobile = useIsMobile()
  const view = isMobile ? 'list' : searchView
  const { data, isFetching, isError, error } = useSuspenseQuery(
    convexQuery(api.todos.queries.GetListDetails, {
      listId: listId as Id<'lists'>,
    }),
  )

  return (
    <div className="p-3 sm:p-6 flex flex-col min-w-0">
      <header className="mb-4 sm:mb-6 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-6 min-w-0">
          <BackButton />
          <div className="min-w-0">
            <h2 className="text-lg sm:text-2xl font-semibold flex items-center gap-2 truncate">
              <span className="truncate">{data.title} List</span>
              {isFetching ? (
                <Spinner className="text-muted-foreground shrink-0" />
              ) : null}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Showing todos for this list.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          <ViewModeTrigger
            mode={view}
            listId={listId}
            workspaceId={workspaceId}
          />
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
      <section className="min-w-0 overflow-hidden">
        {view === 'kanban' && <KanbanBoard listId={listId as Id<'lists'>} />}

        {view === 'list' && (
          <div className="space-y-2">
            <PendingTodosSection listId={listId as Id<'lists'>} />
            <OverdueTodosSection listId={listId as Id<'lists'>} />
            <CompletedTodosSection listId={listId as Id<'lists'>} />
          </div>
        )}
      </section>
    </div>
  )
}
