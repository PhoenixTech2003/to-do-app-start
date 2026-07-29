import { Docket, DocketRowsSkeleton } from '@/components/app/docket'
import { Skeleton } from '@/components/ui/skeleton'

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40 rounded" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>
      <Docket>
        <DocketRowsSkeleton rows={5} check={false} />
      </Docket>
    </div>
  )
}
