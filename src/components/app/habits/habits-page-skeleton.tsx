import { Skeleton } from '@/components/ui/skeleton'

export function HabitsPageSkeleton() {
  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col p-4 sm:p-6">
      <div className="mb-6 flex items-center justify-between sm:mb-8">
        <div className="flex min-w-0 items-center gap-4">
          <Skeleton className="size-8 shrink-0 rounded-md" />
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-7 w-24 rounded" />
            <Skeleton className="h-3 w-40 rounded" />
          </div>
        </div>
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>

      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-lg" />

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-8">
            <Skeleton className="h-4 w-20 rounded" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded" />
            ))}
          </div>
          <Skeleton className="h-56 w-full rounded-lg lg:col-span-4" />
        </div>

        <div className="space-y-3">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
