import { Docket, DocketHeader, DocketRowsSkeleton } from '@/components/app/docket'
import { Skeleton } from '@/components/ui/skeleton'

export function TodosPageSkeleton() {
  return (
    <div className="flex flex-col p-4 sm:p-6">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="size-8 shrink-0 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-44 rounded" />
            <Skeleton className="h-3 w-32 rounded" />
          </div>
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </header>
      <div className="space-y-4">
        {['Pending', 'Completed'].map((label) => (
          <Docket key={label}>
            <DocketHeader label={label} />
            <DocketRowsSkeleton />
          </Docket>
        ))}
      </div>
    </div>
  )
}
