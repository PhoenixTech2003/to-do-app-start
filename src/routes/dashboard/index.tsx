import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { convexQuery } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import { CreateWorkspaceDialog } from '@/components/app/dashboard/create-workspace-dialog'
import { WorkspaceList } from '@/components/app/dashboard/workspace-list'

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
  if (isFetching) {
    return <div>loading workspaces .....</div>
  }

  if (isError) {
    ;<div>Failed to load todos {error.message}</div>
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your Workspaces</h1>
        <CreateWorkspaceDialog />
      </div>
      <WorkspaceList workspaceListData={data} />
    </div>
  )
}
