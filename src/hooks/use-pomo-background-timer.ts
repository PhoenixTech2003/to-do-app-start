import { useEffect, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { OnPhaseComplete } from '@/components/app/pomodoro/pomo-helpers'
import {
  DEFAULT_SETTINGS,
  advancePhase,
  ensureState,
  saveState,
} from '@/components/app/pomodoro/pomo-helpers'
import { db } from '@/dexie/db'

/**
 * Runs the pomodoro tick interval at the app-layout level so the timer
 * keeps counting even when the user navigates away from /pomodoro.
 * When secondsLeft reaches 0, advancePhase is called which plays the
 * notification sound and pauses the timer (isRunning → false).
 */
export function usePomoBackgroundTimer(onPhaseComplete?: OnPhaseComplete) {
  const rawState = useLiveQuery(() => db.pomodoroState.get(1))
  const rawSettings = useLiveQuery(() => db.pomodoroSettings.get(1))
  const settings = rawSettings ?? DEFAULT_SETTINGS

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const catchUpDoneRef = useRef(false)
  const lastSavedTickRef = useRef(0)
  const onPhaseCompleteRef = useRef(onPhaseComplete)
  onPhaseCompleteRef.current = onPhaseComplete

  useEffect(() => {
    ensureState(settings)
  }, [])

  // On first load, catch up if the timer was running before a full page refresh
  useEffect(() => {
    if (catchUpDoneRef.current || !rawState) return
    catchUpDoneRef.current = true

    if (rawState.isRunning && rawState.lastTickAt) {
      const elapsed = Math.floor((Date.now() - rawState.lastTickAt) / 1000)
      if (elapsed > 0) {
        catchUpAfterRefresh(elapsed)
      }
    }
  }, [rawState])

  // Tick every second while running
  useEffect(() => {
    const isRunning = rawState?.isRunning ?? false
    if (!isRunning) {
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
  }, [rawState?.isRunning])

  async function tick() {
    const current = await db.pomodoroState.get(1)
    if (!current || !current.isRunning) return

    const next = current.secondsLeft - 1
    const now = Date.now()

    if (next <= 0) {
      await advancePhase(current, onPhaseCompleteRef.current)
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

  async function catchUpAfterRefresh(elapsedSeconds: number) {
    const current = await db.pomodoroState.get(1)
    if (!current || !current.isRunning) return

    const remaining = current.secondsLeft - elapsedSeconds

    if (remaining > 0) {
      await saveState({ secondsLeft: remaining, lastTickAt: Date.now() })
    } else {
      // Phase ended while the app was closed — advance once and pause
      await advancePhase(current, onPhaseCompleteRef.current)
    }
  }
}
