import { Skeleton } from '@/components/ui/skeleton'

export function SignupLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 font-['Patrick_Hand'] transition-colors duration-300">
      <div className="absolute top-4 right-4">
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <div className="w-full max-w-md">
        <Skeleton className="h-10 w-32 mb-8" />
        <div className="bg-card rounded-2xl border border-border p-8 shadow-sm text-center transition-colors duration-300 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-10 w-48 mx-auto" />
            <Skeleton className="h-6 w-64 mx-auto" />
          </div>
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    </div>
  )
}
