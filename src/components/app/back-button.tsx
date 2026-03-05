import { ChevronLeft } from 'lucide-react'
import { useRouter } from '@tanstack/react-router'

export function BackButton() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.history.back()}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      aria-label="Go back"
    >
      <ChevronLeft className="h-4 w-4" />
    </button>
  )
}
