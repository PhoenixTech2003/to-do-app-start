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
