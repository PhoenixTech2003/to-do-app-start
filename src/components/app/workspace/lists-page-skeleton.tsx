import { Docket, DocketRowsSkeleton } from '@/components/app/docket'
import { Skeleton } from '@/components/ui/skeleton'

export function ListsPageSkeleton() {
  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <Skeleton className="size-8 shrink-0 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
      <Docket>
        <DocketRowsSkeleton rows={5} check={false} />
      </Docket>
    </div>
  )
}
