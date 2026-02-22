import type { Phase, PomodoroSettings, PomodoroTimerState } from '@/dexie/db'
import { db } from '@/dexie/db'

export const DEFAULT_SETTINGS: Omit<PomodoroSettings, 'id'> = {
  pomoDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  pomosBeforeLongBreak: 4,
}

export const DEFAULT_STATE: PomodoroTimerState = {
  id: 1,
  roundId: null,
  phase: 'focus',
  secondsLeft: 25 * 60,
  completedPomos: 0,
  isRunning: false,
  lastTickAt: null,
}

export function getPhaseDuration(
  p: Phase,
  s: Omit<PomodoroSettings, 'id'>,
): number {
  switch (p) {
    case 'focus':
      return s.pomoDuration * 60
    case 'shortBreak':
      return s.shortBreakDuration * 60
    case 'longBreak':
      return s.longBreakDuration * 60
  }
}

export function phaseLabel(phase: Phase) {
  switch (phase) {
    case 'focus':
      return 'Focus'
    case 'shortBreak':
      return 'Short Break'
    case 'longBreak':
      return 'Long Break'
  }
}

export function phaseColor(phase: Phase) {
  switch (phase) {
    case 'focus':
      return 'text-primary'
    case 'shortBreak':
      return 'text-chart-2'
    case 'longBreak':
      return 'text-chart-4'
  }
}

export function phaseBg(phase: Phase) {
  switch (phase) {
    case 'focus':
      return 'bg-primary'
    case 'shortBreak':
      return 'bg-chart-2'
    case 'longBreak':
      return 'bg-chart-4'
  }
}

export function playNotificationSound() {
  try {
    const audio = new Audio('/audio/pomo.mp3')
    audio.play()
  } catch {
    // Audio may be blocked by browser autoplay policy
  }
}

export async function getSettings() {
  return (await db.pomodoroSettings.get(1)) ?? DEFAULT_SETTINGS
}

export async function saveState(patch: Partial<PomodoroTimerState>) {
  await db.pomodoroState.update(1, patch)
}

export async function ensureState(settings: Omit<PomodoroSettings, 'id'>) {
  const existing = await db.pomodoroState.get(1)
  if (!existing) {
    await db.pomodoroState.put({
      ...DEFAULT_STATE,
      secondsLeft: settings.pomoDuration * 60,
    })
  }
}

export async function createRound(
  cfg: Omit<PomodoroSettings, 'id'>,
): Promise<number> {
  const newId = await db.pomodoroRounds.add({
    completedPomos: 0,
    totalPomos: cfg.pomosBeforeLongBreak,
    startedAt: Date.now(),
    finishedAt: null,
    status: 'active',
  })
  return newId as number
}

export async function advancePhase(current: PomodoroTimerState) {
  playNotificationSound()
  const cfg = await getSettings()

  if (current.phase === 'focus') {
    const nextCompleted = current.completedPomos + 1
    const roundId = current.roundId

    if (roundId) {
      const round = await db.pomodoroRounds.get(roundId)
      if (round) {
        const isRoundDone = nextCompleted >= round.totalPomos
        await db.pomodoroRounds.update(roundId, {
          completedPomos: nextCompleted,
          ...(isRoundDone && { status: 'completed', finishedAt: Date.now() }),
        })
      }
    }

    const isLongBreak = nextCompleted % cfg.pomosBeforeLongBreak === 0
    const nextPhase: Phase = isLongBreak ? 'longBreak' : 'shortBreak'

    await db.pomodoroState.put({
      id: 1,
      roundId,
      phase: nextPhase,
      secondsLeft: getPhaseDuration(nextPhase, cfg),
      completedPomos: nextCompleted,
      isRunning: false,
      lastTickAt: null,
    })
  } else {
    let nextRoundId = current.roundId

    if (nextRoundId) {
      const round = await db.pomodoroRounds.get(nextRoundId)
      if (!round || round.status === 'completed') {
        nextRoundId = await createRound(cfg)
      }
    } else {
      nextRoundId = await createRound(cfg)
    }

    await db.pomodoroState.put({
      id: 1,
      roundId: nextRoundId,
      phase: 'focus',
      secondsLeft: getPhaseDuration('focus', cfg),
      completedPomos:
        nextRoundId !== current.roundId ? 0 : current.completedPomos,
      isRunning: false,
      lastTickAt: null,
    })
  }
}

export async function catchUpTimer(
  s: PomodoroTimerState,
  elapsedSeconds: number,
  cfg: Omit<PomodoroSettings, 'id'>,
) {
  let remaining = s.secondsLeft - elapsedSeconds
  let currentPhase = s.phase
  let completedPomos = s.completedPomos
  let roundId = s.roundId

  while (remaining <= 0) {
    if (currentPhase === 'focus') {
      completedPomos += 1
      if (roundId) {
        const round = await db.pomodoroRounds.get(roundId)
        if (round) {
          const isRoundDone = completedPomos >= round.totalPomos
          await db.pomodoroRounds.update(roundId, {
            completedPomos,
            ...(isRoundDone && {
              status: 'completed',
              finishedAt: Date.now(),
            }),
          })
        }
      }
      const isLongBreak = completedPomos % cfg.pomosBeforeLongBreak === 0
      const nextPhase: Phase = isLongBreak ? 'longBreak' : 'shortBreak'
      remaining += getPhaseDuration(nextPhase, cfg)
      currentPhase = nextPhase
    } else {
      if (roundId) {
        const round = await db.pomodoroRounds.get(roundId)
        if (!round || round.status === 'completed') {
          roundId = await createRound(cfg)
          completedPomos = 0
        }
      } else {
        roundId = await createRound(cfg)
        completedPomos = 0
      }
      remaining += getPhaseDuration('focus', cfg)
      currentPhase = 'focus'
    }
  }

  await db.pomodoroState.put({
    id: 1,
    roundId,
    phase: currentPhase,
    secondsLeft: Math.max(0, remaining),
    completedPomos,
    isRunning: remaining > 0,
    lastTickAt: remaining > 0 ? Date.now() : null,
  })
}

export async function startNewRound() {
  const cfg = await getSettings()
  const currentState = await db.pomodoroState.get(1)

  if (currentState?.roundId) {
    const currentRound = await db.pomodoroRounds.get(currentState.roundId)
    if (currentRound && currentRound.status === 'active') {
      await db.pomodoroRounds.update(currentState.roundId, {
        status: 'abandoned',
        finishedAt: Date.now(),
      })
    }
  }

  const newRoundId = await createRound(cfg)

  await db.pomodoroState.put({
    id: 1,
    roundId: newRoundId,
    phase: 'focus',
    secondsLeft: getPhaseDuration('focus', cfg),
    completedPomos: 0,
    isRunning: false,
    lastTickAt: null,
  })
}
