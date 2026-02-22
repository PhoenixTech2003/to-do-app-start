import { useEffect, useRef } from 'react'
import { Pause, Play, Plus, RotateCcw, SkipForward } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { PomodoroSettingsDialog } from './pomodoro-settings-dialog'
import {
  DEFAULT_SETTINGS,
  DEFAULT_STATE,
  advancePhase,
  catchUpTimer,
  createRound,
  ensureState,
  getPhaseDuration,
  getSettings,
  phaseBg,
  phaseColor,
  phaseLabel,
  saveState,
  startNewRound,
} from './pomo-helpers'
import type { Phase, PomodoroSettings } from '@/dexie/db'
import { db } from '@/dexie/db'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export function PomodoroTimer() {
  const rawSettings = useLiveQuery(() => db.pomodoroSettings.get(1))
  const settings = rawSettings ?? DEFAULT_SETTINGS
  const rawState = useLiveQuery(() => db.pomodoroState.get(1))
  const state = rawState ?? DEFAULT_STATE

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const catchUpDoneRef = useRef(false)
  const lastSavedTickRef = useRef(0)

  useEffect(() => {
    ensureState(settings)
  }, [])

  useEffect(() => {
    if (catchUpDoneRef.current || !rawState) return
    catchUpDoneRef.current = true

    if (rawState.isRunning && rawState.lastTickAt) {
      const elapsed = Math.floor((Date.now() - rawState.lastTickAt) / 1000)
      if (elapsed > 0) {
        catchUpTimer(rawState, elapsed, settings)
      }
    }
  }, [rawState])

  useEffect(() => {
    if (!state.isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = null
      return
    }
    intervalRef.current = setInterval(() => {
      tick()
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [state.isRunning])

  async function tick() {
    const current = await db.pomodoroState.get(1)
    if (!current || !current.isRunning) return

    const next = current.secondsLeft - 1
    const now = Date.now()

    if (next <= 0) {
      await advancePhase(current)
    } else {
      const shouldPersistTick = now - lastSavedTickRef.current >= 5000
      if (shouldPersistTick) {
        lastSavedTickRef.current = now
        await saveState({ secondsLeft: next, lastTickAt: now })
      } else {
        await saveState({ secondsLeft: next })
      }
    }
  }

  async function switchTo(p: Phase) {
    await db.pomodoroState.put({
      id: 1,
      roundId: state.roundId,
      phase: p,
      secondsLeft: getPhaseDuration(p, settings),
      completedPomos: state.completedPomos,
      isRunning: false,
      lastTickAt: null,
    })
  }

  async function handlePlayPause() {
    if (state.isRunning) {
      await saveState({ isRunning: false, lastTickAt: null })
    } else {
      if (!state.roundId) {
        const cfg = await getSettings()
        const newRoundId = await createRound(cfg)
        await saveState({
          roundId: newRoundId,
          isRunning: true,
          lastTickAt: Date.now(),
        })
      } else {
        await saveState({ isRunning: true, lastTickAt: Date.now() })
      }
    }
  }

  async function handleReset() {
    await saveState({
      secondsLeft: getPhaseDuration(state.phase, settings),
      isRunning: false,
      lastTickAt: null,
    })
  }

  async function handleSkip() {
    const current = await db.pomodoroState.get(1)
    if (current) {
      await advancePhase(current)
    }
  }

  async function handleSettingsSave(next: Omit<PomodoroSettings, 'id'>) {
    await db.pomodoroSettings.put({ id: 1, ...next })
    await db.pomodoroState.put({
      id: 1,
      roundId: state.roundId,
      phase: 'focus',
      secondsLeft: next.pomoDuration * 60,
      completedPomos: 0,
      isRunning: false,
      lastTickAt: null,
    })
  }

  const totalDuration = getPhaseDuration(state.phase, settings)
  const progress = ((totalDuration - state.secondsLeft) / totalDuration) * 100
  const minutes = Math.floor(state.secondsLeft / 60)
  const seconds = state.secondsLeft % 60
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return (
    <div className="flex flex-col items-center gap-6 sm:gap-8">
      {/* Phase tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {(['focus', 'shortBreak', 'longBreak'] as const).map((p) => (
          <button
            key={p}
            onClick={() => switchTo(p)}
            className={cn(
              'rounded-md px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium transition-colors',
              state.phase === p
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {phaseLabel(p)}
          </button>
        ))}
      </div>

      {/* Timer ring */}
      <div className="relative flex items-center justify-center">
        <svg
          className="h-48 w-48 sm:h-64 sm:w-64 -rotate-90"
          viewBox="0 0 200 200"
        >
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="currentColor"
            className="text-muted/40"
            strokeWidth="6"
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
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 90}
            strokeDashoffset={2 * Math.PI * 90 * (1 - progress / 100)}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span
            className={cn(
              'text-5xl sm:text-7xl font-bold tabular-nums tracking-tight',
              phaseColor(state.phase),
            )}
          >
            {display}
          </span>
          <span className="text-xs sm:text-sm text-muted-foreground mt-1">
            {phaseLabel(state.phase)}
          </span>
        </div>
      </div>

      {/* Session progress bar */}
      <div className="w-full max-w-xs space-y-2">
        <Progress
          value={progress}
          className={cn(
            'h-2',
            `[&>[data-slot=progress-indicator]]:${phaseBg(state.phase)}`,
          )}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            Session{' '}
            {(state.completedPomos % settings.pomosBeforeLongBreak) +
              (state.phase === 'focus' ? 1 : 0)}{' '}
            / {settings.pomosBeforeLongBreak}
          </span>
          <span>{state.completedPomos} completed</span>
        </div>
      </div>

      {/* Session dots */}
      <div className="flex gap-2">
        {Array.from({ length: settings.pomosBeforeLongBreak }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-3 w-3 rounded-full border-2 transition-colors',
              i < state.completedPomos % settings.pomosBeforeLongBreak ||
                (state.completedPomos > 0 &&
                  state.completedPomos % settings.pomosBeforeLongBreak === 0 &&
                  state.phase !== 'focus')
                ? 'bg-primary border-primary'
                : 'border-muted-foreground/40',
            )}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={startNewRound}
          aria-label="New Round"
          title="New Round"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleReset}
          aria-label="Reset"
          title="Reset"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          size="lg"
          className="h-14 w-14 rounded-full"
          onClick={handlePlayPause}
          aria-label={state.isRunning ? 'Pause' : 'Start'}
        >
          {state.isRunning ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6 ml-0.5" />
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleSkip}
          aria-label="Skip"
          title="Skip"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
        <PomodoroSettingsDialog
          settings={settings}
          onSave={handleSettingsSave}
        />
      </div>
    </div>
  )
}
