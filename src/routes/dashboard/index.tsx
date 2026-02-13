import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { convexQuery } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import { CreateWorkspaceDialog } from '@/components/app/dashboard/create-workspace-dialog'
import { WorkspaceList } from '@/components/app/dashboard/workspace-list'
import { StateHandler } from '@/components/app/state-handler'
import { DashboardLoadingSkeleton } from '@/components/app/dashboard/dashboard-loading-skeleton'
import { NoWorkspacesEmptyState } from '@/components/app/dashboard/no-workspaces-empty-state'

export const Route = createFileRoute('/dashboard/')({
  loader: async (opts) => {
    await opts.context.queryClient.ensureQueryData(
      convexQuery(api.dashboard.queries.getUserWorkspaces),
    )
  },
  component: DashboardPage,
})

function DashboardPage() {
  const { data, isFetching, isError, error } = useSuspenseQuery(
    convexQuery(api.dashboard.queries.getUserWorkspaces),
  )

  return (
    <StateHandler
      isFetching={isFetching}
      isError={isError}
      error={error}
      isEmpty={data.length === 0}
      loadingSkeleton={<DashboardLoadingSkeleton />}
      emptyState={<NoWorkspacesEmptyState />}
      errorTitle="Failed to load workspaces"
      errorDescription="An error occurred while loading your workspaces. Please try again."
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Your Workspaces</h1>
          <CreateWorkspaceDialog />
        </div>
        <WorkspaceList workspaceListData={data} />
      </div>
    </StateHandler>
  )
}
