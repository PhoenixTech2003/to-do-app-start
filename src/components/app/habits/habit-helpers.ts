import {
  BookOpen,
  Brain,
  Dumbbell,
  Heart,
  Palette,
  Star,
  Target,
  Users,
} from 'lucide-react'
import { addDays, format, subDays } from 'date-fns'

export const CATEGORIES = [
  'health',
  'fitness',
  'learning',
  'mindfulness',
  'productivity',
  'social',
  'creative',
  'other',
] as const

export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_META: Record<
  Category,
  {
    icon: typeof Heart
    label: string
    accent: string
    bg: string
    border: string
  }
> = {
  health: {
    icon: Heart,
    label: 'Health',
    accent: 'text-rose-400',
    bg: 'bg-rose-400/10',
    border: 'border-l-rose-400',
  },
  fitness: {
    icon: Dumbbell,
    label: 'Fitness',
    accent: 'text-orange-400',
    bg: 'bg-orange-400/10',
    border: 'border-l-orange-400',
  },
  learning: {
    icon: BookOpen,
    label: 'Learning',
    accent: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-l-blue-400',
  },
  mindfulness: {
    icon: Brain,
    label: 'Mindfulness',
    accent: 'text-violet-400',
    bg: 'bg-violet-400/10',
    border: 'border-l-violet-400',
  },
  productivity: {
    icon: Target,
    label: 'Productivity',
    accent: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-l-emerald-400',
  },
  social: {
    icon: Users,
    label: 'Social',
    accent: 'text-sky-400',
    bg: 'bg-sky-400/10',
    border: 'border-l-sky-400',
  },
  creative: {
    icon: Palette,
    label: 'Creative',
    accent: 'text-pink-400',
    bg: 'bg-pink-400/10',
    border: 'border-l-pink-400',
  },
  other: {
    icon: Star,
    label: 'Other',
    accent: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-l-amber-400',
  },
}

const LEVEL_THRESHOLDS = [
  0, 50, 150, 300, 500, 800, 1200, 1700, 2500, 3500, 5000,
]
const LEVEL_TITLES = [
  'Starter',
  'Apprentice',
  'Devoted',
  'Committed',
  'Warrior',
  'Champion',
  'Master',
  'Legend',
  'Titan',
  'Transcendent',
  'Enlightened',
]

export function getLevel(totalXP: number) {
  let level = 0
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) {
      level = i
      break
    }
  }
  const currentThreshold = LEVEL_THRESHOLDS[level]
  const nextThreshold = LEVEL_THRESHOLDS[level + 1] ?? currentThreshold + 1500
  const progress =
    ((totalXP - currentThreshold) / (nextThreshold - currentThreshold)) * 100
  return {
    level: level + 1,
    title: LEVEL_TITLES[level],
    progress: Math.min(progress, 100),
    xpInLevel: totalXP - currentThreshold,
    xpNeeded: nextThreshold - currentThreshold,
  }
}

export const CATEGORY_FILL: Record<Category, string> = {
  health: 'bg-rose-400',
  fitness: 'bg-orange-400',
  learning: 'bg-blue-400',
  mindfulness: 'bg-violet-400',
  productivity: 'bg-emerald-400',
  social: 'bg-sky-400',
  creative: 'bg-pink-400',
  other: 'bg-amber-400',
}

const DATE_FORMAT = 'yyyy-MM-dd'

export type Run = {
  /** Days in a row with at least one habit marked. */
  length: number
  /** Whether today already has a mark. Today never breaks a run on its own. */
  markedToday: boolean
  /** First day of the current run, or null when there is no run. */
  startedOn: string | null
  /** Longest run inside the activity window, current run included. */
  longest: number
}

/**
 * The run is the page's headline figure: consecutive days on which any habit
 * was marked. It is derived from the same activity map the year sheet draws,
 * so the wall and the sheet can never disagree.
 *
 * Today is treated as still in play — an unmarked today does not end the run,
 * it just leaves the next slot empty.
 */
export function computeRun(
  activity: Record<string, number>,
  today: string,
): Run {
  const todayDate = new Date(today + 'T12:00:00')
  const marked = (date: Date) => (activity[format(date, DATE_FORMAT)] ?? 0) > 0

  const markedToday = marked(todayDate)
  let cursor = markedToday ? todayDate : subDays(todayDate, 1)
  let length = 0
  while (marked(cursor)) {
    length++
    cursor = subDays(cursor, 1)
  }

  const dates = Object.keys(activity)
    .filter((date) => (activity[date] ?? 0) > 0)
    .sort()
  let longest = 0
  let streak = 0
  let previous: string | null = null
  for (const date of dates) {
    const expected =
      previous === null
        ? null
        : format(addDays(new Date(previous + 'T12:00:00'), 1), DATE_FORMAT)
    streak = expected === date ? streak + 1 : 1
    if (streak > longest) longest = streak
    previous = date
  }

  return {
    length,
    markedToday,
    startedOn:
      length > 0
        ? format(
            subDays(
              markedToday ? todayDate : subDays(todayDate, 1),
              length - 1,
            ),
            DATE_FORMAT,
          )
        : null,
    longest: Math.max(longest, length),
  }
}

export const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]
