import { ChevronLeft } from 'lucide-react'
import { useCanGoBack, useRouter } from '@tanstack/react-router'

export function BackButton() {
  const canGoBack = useCanGoBack()
  const router = useRouter()
  return (
    <div>
      {canGoBack && (
        <div
          className="hover:cursor-pointer"
          onClick={() => router.history.back()}
        >
          <ChevronLeft />
        </div>
      )}
    </div>
  )
}
