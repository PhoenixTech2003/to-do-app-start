import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { convexQuery } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import z from 'zod'
import { zodValidator } from '@tanstack/zod-adapter'
import { useDebouncer } from '@tanstack/react-pacer'
import { CreateWorkspaceDialog } from '@/components/app/dashboard/create-workspace-dialog'
import { WorkspaceList } from '@/components/app/dashboard/workspace-list'
import { StateHandler } from '@/components/app/state-handler'
import { DashboardLoadingSkeleton } from '@/components/app/dashboard/dashboard-loading-skeleton'
import { NoWorkspacesEmptyState } from '@/components/app/dashboard/no-workspaces-empty-state'
import { DashboardPageSkeleton } from '@/components/app/dashboard/dashboard-page-skeleton'
import { SearchInput } from '@/components/app/search-box'

const searchSchema = z.object({
  searchTerm: z.string().optional(),
})

export const Route = createFileRoute('/(app)/dashboard/')({
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search: { searchTerm } }) => ({ searchTerm }),
  loader: async (opts) => {
    await opts.context.queryClient.ensureQueryData(
      convexQuery(api.dashboard.queries.getUserWorkspaces, {
        searchTerm: opts.deps.searchTerm,
      }),
    )
  },
  pendingComponent: DashboardPageSkeleton,
  component: DashboardPage,
})

function DashboardPage() {
  const navigate = useNavigate()
  const { searchTerm } = Route.useSearch()
  const { data, isFetching, isError, error, isLoading } = useSuspenseQuery(
    convexQuery(api.dashboard.queries.getUserWorkspaces, {
      searchTerm: searchTerm,
    }),
  )
  const handleSearch = (q: string) => {
    navigate({
      to: '/dashboard',
      search: { searchTerm: q },
    })
  }
  const debouncer = useDebouncer(handleSearch, {
    wait: 200,
  })

  return (
    <>
      <SearchInput searchTerm={searchTerm} onSearch={debouncer.maybeExecute} />
      <StateHandler
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        error={error}
        isEmpty={data.length === 0}
        loadingSkeleton={<DashboardLoadingSkeleton />}
        emptyState={<NoWorkspacesEmptyState />}
        errorTitle="Failed to load workspaces"
        errorDescription="An error occurred while loading your workspaces. Please try again."
      >
        <div className="space-y-4 pb-24">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl sm:text-3xl font-bold truncate min-w-0">
              Your Workspaces
            </h1>
            <CreateWorkspaceDialog />
          </div>
          <WorkspaceList workspaceListData={data} />
        </div>
      </StateHandler>
    </>
  )
}
