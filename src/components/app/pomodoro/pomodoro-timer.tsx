import { useCallback, useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import { PomodoroSettingsDialog } from './pomodoro-settings-dialog'
import type { PomodoroSettings } from './pomodoro-settings-dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

type Phase = 'focus' | 'shortBreak' | 'longBreak'

const STORAGE_KEY = 'twodo-pomo-settings'

function loadSettings(): PomodoroSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as PomodoroSettings
  } catch {
    /* ignore */
  }
  return {
    pomoDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    pomosBeforeLongBreak: 4,
  }
}

function saveSettings(s: PomodoroSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

function phaseLabel(phase: Phase) {
  switch (phase) {
    case 'focus':
      return 'Focus'
    case 'shortBreak':
      return 'Short Break'
    case 'longBreak':
      return 'Long Break'
  }
}

function phaseColor(phase: Phase) {
  switch (phase) {
    case 'focus':
      return 'text-primary'
    case 'shortBreak':
      return 'text-chart-2'
    case 'longBreak':
      return 'text-chart-4'
  }
}

function phaseBg(phase: Phase) {
  switch (phase) {
    case 'focus':
      return 'bg-primary'
    case 'shortBreak':
      return 'bg-chart-2'
    case 'longBreak':
      return 'bg-chart-4'
  }
}

export function PomodoroTimer() {
  const [settings, setSettings] = useState<PomodoroSettings>(loadSettings)
  const [phase, setPhase] = useState<Phase>('focus')
  const [completedPomos, setCompletedPomos] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  const phaseDuration = useCallback(
    (p: Phase) => {
      switch (p) {
        case 'focus':
          return settings.pomoDuration * 60
        case 'shortBreak':
          return settings.shortBreakDuration * 60
        case 'longBreak':
          return settings.longBreakDuration * 60
      }
    },
    [settings],
  )

  const [secondsLeft, setSecondsLeft] = useState(() => phaseDuration('focus'))
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning])

  useEffect(() => {
    if (secondsLeft === 0 && !isRunning) {
      advancePhase()
    }
  }, [secondsLeft, isRunning])

  function advancePhase() {
    if (phase === 'focus') {
      const next = completedPomos + 1
      setCompletedPomos(next)
      if (next % settings.pomosBeforeLongBreak === 0) {
        switchTo('longBreak')
      } else {
        switchTo('shortBreak')
      }
    } else {
      switchTo('focus')
    }
  }

  function switchTo(p: Phase) {
    setPhase(p)
    setSecondsLeft(phaseDuration(p))
    setIsRunning(false)
  }

  function handleReset() {
    setSecondsLeft(phaseDuration(phase))
    setIsRunning(false)
  }

  function handleSkip() {
    setSecondsLeft(0)
    setIsRunning(false)
  }

  function handleSettingsSave(next: PomodoroSettings) {
    setSettings(next)
    saveSettings(next)
    setPhase('focus')
    setCompletedPomos(0)
    setSecondsLeft(next.pomoDuration * 60)
    setIsRunning(false)
  }

  const totalDuration = phaseDuration(phase)
  const progress = ((totalDuration - secondsLeft) / totalDuration) * 100
  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
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
              phase === p
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
            className={cn('transition-all duration-1000', phaseColor(phase))}
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
              phaseColor(phase),
            )}
          >
            {display}
          </span>
          <span className="text-xs sm:text-sm text-muted-foreground mt-1">
            {phaseLabel(phase)}
          </span>
        </div>
      </div>

      {/* Session progress bar */}
      <div className="w-full max-w-xs space-y-2">
        <Progress
          value={progress}
          className={cn(
            'h-2',
            `[&>[data-slot=progress-indicator]]:${phaseBg(phase)}`,
          )}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            Session{' '}
            {(completedPomos % settings.pomosBeforeLongBreak) +
              (phase === 'focus' ? 1 : 0)}{' '}
            / {settings.pomosBeforeLongBreak}
          </span>
          <span>{completedPomos} completed</span>
        </div>
      </div>

      {/* Session dots */}
      <div className="flex gap-2">
        {Array.from({ length: settings.pomosBeforeLongBreak }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-3 w-3 rounded-full border-2 transition-colors',
              i < completedPomos % settings.pomosBeforeLongBreak ||
                (completedPomos > 0 &&
                  completedPomos % settings.pomosBeforeLongBreak === 0 &&
                  phase !== 'focus')
                ? 'bg-primary border-primary'
                : 'border-muted-foreground/40',
            )}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={handleReset}
          aria-label="Reset"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          size="lg"
          className="h-14 w-14 rounded-full"
          onClick={() => setIsRunning(!isRunning)}
          aria-label={isRunning ? 'Pause' : 'Start'}
        >
          {isRunning ? (
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
