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
  lastTickAt: number | null
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

export { db }
