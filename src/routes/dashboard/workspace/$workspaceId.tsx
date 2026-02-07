import { convexQuery } from '@convex-dev/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { ListCard } from '@/components/app/workspace/list-card'
import { StateHandler } from '@/components/app/state-handler'
import { WorkspaceLoadingSkeleton } from '@/components/app/workspace/workspace-loading-skeleton'
import { NoListsEmptyState } from '@/components/app/workspace/no-lists-empty-state'

export const Route = createFileRoute('/dashboard/workspace/$workspaceId')({
  loader: async (opts) => {
    await opts.context.queryClient.ensureQueryData(
      convexQuery(api.workspace.queries.getAllUserWorkspaceLists, {
        workspaceId: opts.params.workspaceId as Id<'workspace'>,
      }),
    )
  },
  component: WorkspaceListsPage,
})

function WorkspaceListsPage() {
  const { workspaceId } = Route.useParams()
  const { data, isFetching, isError, error } = useSuspenseQuery(
    convexQuery(api.workspace.queries.getAllUserWorkspaceLists, {
      workspaceId: workspaceId as Id<'workspace'>,
    }),
  )

  return (
    <StateHandler
      isFetching={isFetching}
      isError={isError}
      error={error}
      isEmpty={data.lists.length === 0}
      loadingSkeleton={<WorkspaceLoadingSkeleton />}
      emptyState={
        <NoListsEmptyState workspaceName={data.workspaceDetails?.title} />
      }
      errorTitle="Failed to load lists"
      errorDescription="An error occurred while loading your workspace lists. Please try again."
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.lists.map((listDetails) => (
          <ListCard key={listDetails._id} listTitle={listDetails.title} />
        ))}
      </div>
    </StateHandler>
  )
}
