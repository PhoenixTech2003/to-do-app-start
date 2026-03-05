import { useEffect, useState } from 'react'
import { Pause, Play, Plus, RotateCcw, SkipForward } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { convexQuery, useConvexAction } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { PomodoroSettingsDialog } from './pomodoro-settings-dialog'
import {
  DEFAULT_SETTINGS,
  DEFAULT_STATE,
  advancePhase,
  createRound,
  getPhaseDuration,
  getSecondsLeft,
  getSettings,
  pauseTimer,
  phaseColor,
  phaseLabel,
  resumeTimer,
  saveState,
  startNewRound,
} from './pomo-helpers'
import type { Phase, PomodoroSettings } from '@/dexie/db'
import { db } from '@/dexie/db'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function PomodoroTimer() {
  const { data: pushNotificationToken } = useSuspenseQuery(
    convexQuery(api.notifications.queries.getPushNotificationToken),
  )
  const sendPushNotification = useConvexAction(
    api.notifications.actions.sendPushNotification,
  )
  const rawSettings = useLiveQuery(() => db.pomodoroSettings.get(1))
  const settings = rawSettings ?? DEFAULT_SETTINGS
  const rawState = useLiveQuery(() => db.pomodoroState.get(1))
  const state = rawState ?? DEFAULT_STATE

  const [, setTick] = useState(0)
  useEffect(() => {
    if (!state.isRunning) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [state.isRunning])

  const displaySeconds = getSecondsLeft(state, settings)
  const totalDuration = getPhaseDuration(state.phase, settings)
  const progress =
    totalDuration > 0
      ? ((totalDuration - displaySeconds) / totalDuration) * 100
      : 0
  const minutes = Math.floor(displaySeconds / 60)
  const seconds = displaySeconds % 60
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  async function switchTo(p: Phase) {
    const duration = getPhaseDuration(p, settings)
    await db.pomodoroState.update(1, {
      phase: p,
      secondsLeft: duration,
      isRunning: false,
      phaseStartedAt: null,
    })
  }

  async function handlePlayPause() {
    if (state.isRunning) {
      await pauseTimer(state, settings)
    } else {
      if (!state.roundId) {
        const cfg = await getSettings()
        const newRoundId = await createRound(cfg)
        const duration = getPhaseDuration('focus', cfg)
        const now = Date.now()
        await db.pomodoroState.put({
          id: 1,
          roundId: newRoundId,
          phase: 'focus',
          secondsLeft: duration,
          completedPomos: 0,
          isRunning: true,
          phaseStartedAt: now,
        })
      } else {
        await resumeTimer()
      }
    }
  }

  async function handleReset() {
    const duration = getPhaseDuration(state.phase, settings)
    await saveState({
      secondsLeft: duration,
      isRunning: false,
      phaseStartedAt: null,
    })
  }

  async function handlePhaseComplete(completed: string, next: string) {
    if (pushNotificationToken.data?.token) {
      await sendPushNotification({
        token: pushNotificationToken.data.token,
        title: `${completed} complete`,
        body: `Time for ${next}. Press play when you're ready.`,
      })
    }
  }

  async function handleSkip() {
    const current = await db.pomodoroState.get(1)
    if (current) {
      await advancePhase(current, handlePhaseComplete)
    }
  }

  async function handleSettingsSave(next: Omit<PomodoroSettings, 'id'>) {
    await db.pomodoroSettings.put({ id: 1, ...next })
    const duration = next.pomoDuration * 60
    await db.pomodoroState.update(1, {
      phase: 'focus',
      secondsLeft: duration,
      completedPomos: 0,
      isRunning: false,
      phaseStartedAt: null,
    })
  }

  const circumference = 2 * Math.PI * 90

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Phase tabs */}
      <div className="flex border border-border rounded-md overflow-hidden">
        {(['focus', 'shortBreak', 'longBreak'] as const).map((p) => (
          <button
            key={p}
            onClick={() => switchTo(p)}
            className={cn(
              'px-3 py-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider transition-colors border-r border-border last:border-r-0',
              state.phase === p
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent',
            )}
          >
            {phaseLabel(p)}
          </button>
        ))}
      </div>

      {/* Timer ring */}
      <div className="relative flex items-center justify-center">
        <svg
          className="h-44 w-44 sm:h-52 sm:w-52 -rotate-90"
          viewBox="0 0 200 200"
        >
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="currentColor"
            className="text-border"
            strokeWidth="2"
          />
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="currentColor"
            className={cn(
              'transition-all duration-1000',
              phaseColor(state.phase),
            )}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress / 100)}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="font-mono text-4xl sm:text-5xl font-bold tabular-nums tracking-tighter">
            {display}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mt-1.5">
            {phaseLabel(state.phase)}
          </span>
        </div>
      </div>

      {/* Session dots + counter in one row */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1.5">
          {Array.from({ length: settings.pomosBeforeLongBreak }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 w-1.5 rounded-full transition-colors',
                i < state.completedPomos % settings.pomosBeforeLongBreak ||
                  (state.completedPomos > 0 &&
                    state.completedPomos % settings.pomosBeforeLongBreak === 0 &&
                    state.phase !== 'focus')
                  ? 'bg-primary'
                  : 'bg-border',
              )}
            />
          ))}
        </div>
        <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
          {(state.completedPomos % settings.pomosBeforeLongBreak) + (state.phase === 'focus' ? 1 : 0)}/{settings.pomosBeforeLongBreak}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-md"
          onClick={startNewRound}
          aria-label="New Round"
          title="New Round"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-md"
          onClick={handleReset}
          aria-label="Reset"
          title="Reset"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="lg"
          className="h-11 w-11 rounded-full"
          onClick={handlePlayPause}
          aria-label={state.isRunning ? 'Pause' : 'Start'}
        >
          {state.isRunning ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-md"
          onClick={handleSkip}
          aria-label="Skip"
          title="Skip"
        >
          <SkipForward className="h-3.5 w-3.5" />
        </Button>
        <PomodoroSettingsDialog
          settings={settings}
          onSave={handleSettingsSave}
        />
      </div>
    </div>
  )
}
