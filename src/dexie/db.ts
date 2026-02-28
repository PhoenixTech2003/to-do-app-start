import { Dexie } from 'dexie'
import type { EntityTable } from 'dexie'

export type Phase = 'focus' | 'shortBreak' | 'longBreak'

export interface PomodoroSettings {
  id: number
  pomoDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  pomosBeforeLongBreak: number
}

export interface PomodoroTimerState {
  id: number
  roundId: number | null
  phase: Phase
  secondsLeft: number
  completedPomos: number
  isRunning: boolean
  phaseStartedAt: number | null
}

export interface PomodoroRound {
  id?: number
  completedPomos: number
  totalPomos: number
  startedAt: number
  finishedAt: number | null
  status: 'active' | 'completed' | 'abandoned'
}

const db = new Dexie('twodo') as Dexie & {
  pomodoroSettings: EntityTable<PomodoroSettings, 'id'>
  pomodoroState: EntityTable<PomodoroTimerState, 'id'>
  pomodoroRounds: EntityTable<PomodoroRound, 'id'>
}

db.version(1).stores({
  pomodoroSettings:
    'id, pomoDuration, shortBreakDuration, longBreakDuration, pomosBeforeLongBreak',
})

db.version(2).stores({
  pomodoroSettings:
    'id, pomoDuration, shortBreakDuration, longBreakDuration, pomosBeforeLongBreak',
  pomodoroState: 'id',
  pomodoroRounds: '++id, status, startedAt',
})

db.version(3).stores({
  pomodoroSettings:
    'id, pomoDuration, shortBreakDuration, longBreakDuration, pomosBeforeLongBreak',
  pomodoroState: 'id',
  pomodoroRounds: '++id, status, startedAt',
}).upgrade(async (trans) => {
  const settings = await trans.table('pomodoroSettings').get(1)
  const phaseDurations: Record<string, number> = settings
    ? {
        focus: (settings as { pomoDuration: number }).pomoDuration * 60,
        shortBreak:
          (settings as { shortBreakDuration: number }).shortBreakDuration * 60,
        longBreak:
          (settings as { longBreakDuration: number }).longBreakDuration * 60,
      }
    : { focus: 1500, shortBreak: 300, longBreak: 900 }

  await trans.table('pomodoroState').toCollection().modify((row) => {
    const r = row as Record<string, unknown>
    if ('lastTickAt' in r && !('phaseStartedAt' in r)) {
      const secondsLeft = r.secondsLeft as number
      const isRunning = r.isRunning as boolean
      const phase = r.phase as string
      const duration = phaseDurations[phase] ?? 1500
      const now = Date.now()
      r.phaseStartedAt = isRunning
        ? now - (duration - secondsLeft) * 1000
        : null
      delete r.lastTickAt
    }
  })
})

export { db }
