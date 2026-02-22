import { Skeleton } from '@/components/ui/skeleton'

export function PomodoroPageSkeleton() {
  return (
    <div className="flex flex-col items-center gap-8 p-3 sm:p-6 pt-8 sm:pt-12">
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        <Skeleton className="h-8 w-20 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      <Skeleton className="h-48 w-48 sm:h-64 sm:w-64 rounded-full" />
      <Skeleton className="h-2 w-full max-w-xs rounded-full" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-3 rounded-full" />
        ))}
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-14 w-14 rounded-full" />
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>
    </div>
  )
}
