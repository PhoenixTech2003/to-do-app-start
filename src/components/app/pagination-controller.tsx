import { ArrowDown, Loader2 } from 'lucide-react'
import { GUTTER } from './docket'
import { cn } from '@/lib/utils'

type PaginationStatus =
  | 'LoadingFirstPage'
  | 'CanLoadMore'
  | 'LoadingMore'
  | 'Exhausted'

interface PaginationControllerProps {
  status: PaginationStatus
  loadMore: (n: number) => void
  resultsCount: number
  initialNumItems: number
  label?: string
}

/**
 * The docket's closing rule. A sheet should end with a line, not trail off —
 * so "there is more" is a ruled band at the foot of the sheet holding the
 * count on the left and the action in the gutter column, exactly where every
 * other number on the page sits.
 */
export function PaginationController({
  status,
  loadMore,
  resultsCount,
  initialNumItems,
  label = 'Items',
}: PaginationControllerProps) {
  const canLoadMore = status === 'CanLoadMore'
  const isLoadingMore = status === 'LoadingMore'

  if (!canLoadMore && !isLoadingMore) return null

  return (
    <div className="flex items-center gap-3 bg-surface-sunken py-2 pr-3 pl-4">
      <span
        data-numeric
        className="label-meta min-w-0 flex-1 truncate text-muted-foreground/70"
      >
        {resultsCount} {label} shown
      </span>
      <button
        type="button"
        onClick={() => canLoadMore && loadMore(initialNumItems)}
        disabled={isLoadingMore}
        className={cn(
          'label-meta group flex items-center justify-end gap-1.5 rounded-sm py-1 text-muted-foreground',
          'transition-colors duration-[var(--dur-2)] ease-[var(--ease-standard)]',
          'hover:text-primary disabled:pointer-events-none disabled:opacity-60',
        )}
      >
        {isLoadingMore ? (
          <>
            <Loader2 className="size-3 animate-spin" />
            Loading
          </>
        ) : (
          <>
            <ArrowDown className="size-3 transition-transform duration-[var(--dur-2)] ease-[var(--ease-out)] group-hover:translate-y-0.5" />
            More
          </>
        )}
      </button>
      <span className={cn(GUTTER, 'label-meta text-muted-foreground/40')}>
        +{initialNumItems}
      </span>
    </div>
  )
}
