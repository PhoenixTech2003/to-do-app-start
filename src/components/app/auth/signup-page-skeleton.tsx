import { Skeleton } from '@/components/ui/skeleton'

export function SignupPageSkeleton() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 font-['Patrick_Hand']">
      <div className="absolute top-4 right-4">
        <Skeleton className="h-9 w-[130px]" />
      </div>
      <div className="w-full max-w-md">
        <Skeleton className="h-10 w-32 mb-8" />
        <div className="bg-card rounded-2xl border border-border p-8 text-center">
          <Skeleton className="h-10 w-48 mx-auto mb-2" />
          <Skeleton className="h-6 w-64 mx-auto mb-8" />
          <Skeleton className="h-12 w-full mb-8" />
          <Skeleton className="h-4 w-56 mx-auto" />
        </div>
      </div>
    </div>
  )
}
