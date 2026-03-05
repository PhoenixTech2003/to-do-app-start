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
    <div className="flex flex-col h-[calc(100svh-3.5rem-3rem)] overflow-hidden">
      <header className="mb-4 flex items-center gap-4 shrink-0">
        <BackButton />
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight">Pomodoro</h2>
          <p className="text-xs font-mono text-muted-foreground mt-0.5">Focus · Break · Repeat</p>
        </div>
      </header>

      <div className="flex-1 min-h-0 grid gap-4 lg:grid-cols-[1fr_260px] items-stretch">
        <div className="flex items-center justify-center min-h-0">
          <PomodoroTimer />
        </div>
        <div className="hidden lg:flex min-h-0">
          <PomodoroRoundHistory />
        </div>
      </div>
    </div>
  )
}
