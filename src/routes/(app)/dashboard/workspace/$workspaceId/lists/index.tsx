import { convexQuery } from '@convex-dev/react-query'
import { usePaginatedQuery } from 'convex/react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useDebouncer } from '@tanstack/react-pacer'
import { formatForDisplay } from '@tanstack/react-hotkeys'
import { Search } from 'lucide-react'
import { api } from 'convex/_generated/api'
import { z } from 'zod'
import { zodValidator } from '@tanstack/zod-adapter'
import { AnimatePresence, motion } from 'motion/react'
import type { Id } from 'convex/_generated/dataModel'
import { ListCard } from '@/components/app/workspace/list-card'
import { StateHandler } from '@/components/app/state-handler'
import { WorkspaceLoadingSkeleton } from '@/components/app/workspace/workspace-loading-skeleton'
import { NoListsEmptyState } from '@/components/app/workspace/no-lists-empty-state'
import { CreateListDialog } from '@/components/app/workspace/create-list-dialog'
import { ListsPageSkeleton } from '@/components/app/workspace/lists-page-skeleton'
import { BackButton } from '@/components/app/back-button'
import { SearchInput } from '@/components/app/search-box'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import { PaginationController } from '@/components/app/pagination-controller'
import { Docket } from '@/components/app/docket'

const searchSchema = z.object({
  searchTerm: z.string().optional(),
})

export const Route = createFileRoute(
  '/(app)/dashboard/workspace/$workspaceId/lists/',
)({
  validateSearch: zodValidator(searchSchema),
  pendingComponent: ListsPageSkeleton,
  component: WorkspaceListsPage,
})

function WorkspaceListsPage() {
  const navigate = useNavigate()
  const { workspaceId } = Route.useParams()
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
    data: workspaceDetails,
    isLoading: isLoadingWorkspace,
    isError: isErrorWorkspace,
    error: errorWorkspace,
  } = useQuery(
    convexQuery(api.workspace.queries.GetWorkspaceDetails, {
      workspaceId: workspaceId as Id<'workspace'>,
    }),
  )

  const {
    results: lists,
    status: paginationStatus,
    loadMore,
  } = usePaginatedQuery(
    api.workspace.queries.GetWorkspaceLists,
    {
      workspaceId: workspaceId as Id<'workspace'>,
      searchTerm: searchTerm,
    },
    { initialNumItems: 6 },
  )

  const isLoading =
    isLoadingWorkspace || paginationStatus === 'LoadingFirstPage'
  const isError = isErrorWorkspace
  const error = errorWorkspace
  const isFetching = paginationStatus === 'LoadingMore'
  const displayedLists = lists

  const handleSearch = (q: string) => {
    pendingSearchRef.current = q
    navigate({
      to: '/dashboard/workspace/$workspaceId/lists',
      params: { workspaceId },
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
        placeholder="Search lists..."
      />
      {/* Header outside the state handler, so an empty workspace keeps its
          title and its way back. */}
      <div className="space-y-6 pb-8">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-4">
            <BackButton />
            <div className="min-w-0">
              <h1 className="min-w-0 truncate text-xl font-bold tracking-tight sm:text-2xl">
                {workspaceDetails?.title}
              </h1>
              <p
                data-numeric
                className="mt-1 font-mono text-[11px] text-muted-foreground"
              >
                {isLoading
                  ? 'Loading'
                  : lists.length === 1
                    ? '1 list'
                    : `${lists.length} lists`}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
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
            {workspaceDetails?._id && (
              <CreateListDialog workspaceId={workspaceDetails._id} />
            )}
          </div>
        </div>

        <StateHandler
          isLoading={isLoading}
          isFetching={isFetching}
          isError={isError}
          error={error}
          isEmpty={lists.length === 0}
          loadingSkeleton={<WorkspaceLoadingSkeleton />}
          emptyState={
            <NoListsEmptyState
              workspaceName={workspaceDetails?.title}
              workspaceId={workspaceId as Id<'workspace'>}
            />
          }
          errorTitle="Failed to load lists"
          errorDescription="An error occurred while loading your workspace lists. Please try again."
        >
          <Docket>
            <AnimatePresence mode="popLayout" initial={false}>
              {displayedLists.map((listDetails) => (
                <motion.div
                  key={listDetails._id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                >
                  <ListCard
                    listTitle={listDetails.title}
                    listItem={listDetails}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            <PaginationController
              status={paginationStatus}
              loadMore={loadMore}
              resultsCount={lists.length}
              label="Lists"
              initialNumItems={9}
            />
          </Docket>
        </StateHandler>
      </div>
    </>
  )
}
