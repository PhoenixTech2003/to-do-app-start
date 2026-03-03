import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { convexQuery } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import z from 'zod'
import { zodValidator } from '@tanstack/zod-adapter'
import { useDebouncer } from '@tanstack/react-pacer'
import { formatForDisplay } from '@tanstack/react-hotkeys'
import { Search } from 'lucide-react'
import { CreateWorkspaceDialog } from '@/components/app/dashboard/create-workspace-dialog'
import { WorkspaceList } from '@/components/app/dashboard/workspace-list'
import { StateHandler } from '@/components/app/state-handler'
import { DashboardLoadingSkeleton } from '@/components/app/dashboard/dashboard-loading-skeleton'
import { NoWorkspacesEmptyState } from '@/components/app/dashboard/no-workspaces-empty-state'
import { DashboardPageSkeleton } from '@/components/app/dashboard/dashboard-page-skeleton'
import { SearchInput } from '@/components/app/search-box'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'

const searchSchema = z.object({
  searchTerm: z.string().optional(),
})

export const Route = createFileRoute('/(app)/dashboard/')({
  validateSearch: zodValidator(searchSchema),
  pendingComponent: DashboardPageSkeleton,
  component: DashboardPage,
})

function DashboardPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { searchTerm } = Route.useSearch()
  const [localSearch, setLocalSearch] = useState(searchTerm ?? '')
  const [searchOpen, setSearchOpen] = useState(false)
  const pendingSearchRef = useRef<string | null>(null)

  useEffect(() => {
    const urlValue = searchTerm ?? ''
    if (
      pendingSearchRef.current !== null &&
      urlValue !== pendingSearchRef.current
    ) {
      return
    }
    pendingSearchRef.current = null
    setLocalSearch(urlValue)
  }, [searchTerm])

  const {
    data = [],
    isFetching,
    isError,
    error,
    isLoading,
  } = useQuery(
    convexQuery(api.dashboard.queries.getUserWorkspaces, {
      searchTerm: searchTerm,
    }),
  )
  const handleSearch = (q: string) => {
    pendingSearchRef.current = q
    navigate({
      to: '/dashboard',
      search: { searchTerm: q },
      replace: true,
    })
  }
  const debouncer = useDebouncer(handleSearch, {
    wait: 200,
  })

  const onSearchChange = (q: string) => {
    setLocalSearch(q)
    debouncer.maybeExecute(q)
  }

  return (
    <>
      <SearchInput
        searchTerm={localSearch}
        onSearch={onSearchChange}
        open={searchOpen}
        onOpenChange={setSearchOpen}
        alwaysVisible={isMobile}
      />
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
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex gap-1.5"
                onClick={() => setSearchOpen(true)}
                aria-label="Open search"
              >
                <Search className="h-4 w-4" />
                {formatForDisplay('Mod+K')}
              </Button>
              <CreateWorkspaceDialog />
            </div>
          </div>
          <WorkspaceList workspaceListData={data} />
        </div>
      </StateHandler>
    </>
  )
}
