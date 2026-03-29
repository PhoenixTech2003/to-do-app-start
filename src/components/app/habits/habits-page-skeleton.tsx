import { Skeleton } from '@/components/ui/skeleton'

export function HabitsPageSkeleton() {
  return (
    <div className="p-4 sm:p-6 flex flex-col h-full">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <Skeleton className="h-8 w-8 rounded-md shrink-0" />
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-7 w-24 rounded" />
            <Skeleton className="h-3 w-44 rounded" />
          </div>
        </div>
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      <Skeleton className="h-24 w-full rounded-md mb-8" />
      <div className="space-y-2 mb-8">
        <Skeleton className="h-5 w-32 rounded" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-md" />
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-32 rounded" />
        <Skeleton className="h-36 w-full rounded-md" />
      </div>
    </div>
  )
}
