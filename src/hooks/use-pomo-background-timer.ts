import { useEffect, useRef } from 'react'
import type { OnPhaseComplete } from '@/components/app/pomodoro/pomo-helpers'
import {
  DEFAULT_SETTINGS,
  advancePhase,
  ensureState,
  getSecondsLeft,
} from '@/components/app/pomodoro/pomo-helpers'
import { db } from '@/dexie/db'

export function usePomoBackgroundTimer(onPhaseComplete?: OnPhaseComplete) {
  const onPhaseCompleteRef = useRef(onPhaseComplete)
  onPhaseCompleteRef.current = onPhaseComplete
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    ensureState(DEFAULT_SETTINGS).then(() => {
      function check() {
        db.pomodoroState.get(1).then(async (current) => {
          if (!current?.isRunning) return

          const settings =
            (await db.pomodoroSettings.get(1)) ?? DEFAULT_SETTINGS
          const remaining = getSecondsLeft(current, settings)

          if (remaining <= 0) {
            advancePhase(current, onPhaseCompleteRef.current)
          }
        })
      }

      intervalRef.current = setInterval(check, 1000)
      check()
    })

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [])
}
