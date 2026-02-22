import { createFileRoute } from '@tanstack/react-router'
import { PomodoroTimer } from '@/components/app/pomodoro/pomodoro-timer'
import { PomodoroRoundHistory } from '@/components/app/pomodoro/pomodoro-round-history'
import { PomodoroPageSkeleton } from '@/components/app/pomodoro/pomodoro-page-skeleton'
import { BackButton } from '@/components/app/back-button'

export const Route = createFileRoute('/(app)/pomodoro/')({
  pendingComponent: PomodoroPageSkeleton,
  component: PomodoroPage,
})

function PomodoroPage() {
  return (
    <div className="p-3 sm:p-6 flex flex-col">
      <header className="mb-4 sm:mb-6 flex items-center gap-2 sm:gap-6">
        <BackButton />
        <div className="min-w-0">
          <h2 className="text-lg sm:text-2xl font-semibold">Pomodoro</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Stay focused, take breaks.
          </p>
        </div>
      </header>
      <div className="grid gap-6 md:grid-cols-[2fr_1fr] md:items-start">
        <div className="flex items-start justify-center pt-4 sm:pt-8">
          <PomodoroTimer />
        </div>
        <PomodoroRoundHistory />
      </div>
    </div>
  )
}
