import { convexQuery } from '@convex-dev/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { ListCard } from '@/components/app/workspace/list-card'
import { StateHandler } from '@/components/app/state-handler'
import { WorkspaceLoadingSkeleton } from '@/components/app/workspace/workspace-loading-skeleton'
import { NoListsEmptyState } from '@/components/app/workspace/no-lists-empty-state'
import { CreateListDialog } from '@/components/app/workspace/create-list-dialog'

export const Route = createFileRoute('/dashboard/workspace/$workspaceId/lists/')({
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
        <NoListsEmptyState
          workspaceName={data.workspaceDetails?.title}
          workspaceId={workspaceId as Id<'workspace'>}
        />
      }
      errorTitle="Failed to load lists"
      errorDescription="An error occurred while loading your workspace lists. Please try again."
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{data.workspaceDetails?.title}</h1>
          <div className="flex gap-2">
            {data.workspaceDetails?._id && (
              <CreateListDialog workspaceId={data.workspaceDetails._id} />
            )}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.lists.map((listDetails) => (
            <ListCard
              key={listDetails._id}
              listTitle={listDetails.title}
              listItem={listDetails}
            />
          ))}
        </div>
      </div>
    </StateHandler>
  )
}
