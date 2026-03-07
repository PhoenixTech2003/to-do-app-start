import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface StateHandlerProps {
  isFetching?: boolean
  isError?: boolean
  error?: Error | null
  isLoading?: boolean
  isEmpty?: boolean
  loadingSkeleton?: React.ReactNode
  emptyState?: React.ReactNode
  errorTitle?: string
  errorDescription?: string
  children: React.ReactNode
}

export function StateHandler({
  isError,
  error,
  isLoading,
  isEmpty,
  loadingSkeleton,
  emptyState,
  errorTitle = 'Failed to load data',
  errorDescription = 'An error occurred while loading the data. Please try again.',
  children,
}: StateHandlerProps) {
  // Show loading skeleton only on initial load
  if (isLoading) {
    if (loadingSkeleton) {
      return <>{loadingSkeleton}</>
    }
    return null
  }

  // Show error alert if there's an error
  if (isError) {
    return (
      <Alert
        variant="destructive"
        className="rounded-xl border-2 border-destructive/20 bg-card"
      >
        <AlertCircle className="h-4 w-4 shrink-0" />
        <AlertTitle>{errorTitle}</AlertTitle>
        <AlertDescription>
          {error?.message || errorDescription}
        </AlertDescription>
      </Alert>
    )
  }

  // Show empty state if data is empty
  if (isEmpty && emptyState) {
    return <>{emptyState}</>
  }

  // Show children if no error or loading
  return <>{children}</>
}
