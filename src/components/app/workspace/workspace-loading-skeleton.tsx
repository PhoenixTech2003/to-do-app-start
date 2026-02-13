import { Skeleton } from '@/components/ui/skeleton'

export function WorkspaceLoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      ))}
    </div>
  )
}
