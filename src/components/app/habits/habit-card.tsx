import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
import { toast } from 'sonner'
import { AnimatePresence, motion } from 'motion/react'
import { CheckIcon, Flame, Trash2 } from 'lucide-react'
import { CATEGORY_META } from './habit-helpers'
import { HabitDetailSheet } from './habit-detail-sheet'
import type { Id } from 'convex/_generated/dataModel'
import type { Category } from './habit-helpers'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function HabitCard({
  habit,
  index,
  today,
}: {
  habit: {
    _id: Id<'habits'>
    _creationTime: number
    title: string
    description?: string
    category: Category
    currentStreak: number
    longestStreak: number
    totalCompletions: number
    completedToday: boolean
    frequency: string
  }
  index: number
  today: string
}) {
  const toggle = useMutation(api.habits.mutations.toggleHabitCompletion)
  const deleteHabit = useMutation(api.habits.mutations.deleteHabit)
  const [isToggling, setIsToggling] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const meta = CATEGORY_META[habit.category]
  const Icon = meta.icon

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation()
    if (isToggling) return
    setIsToggling(true)
    toggle({ habitId: habit._id, date: today })
      .catch(() => toast.error('Failed to update habit'))
      .finally(() => setIsToggling(false))
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    const promise = deleteHabit({ habitId: habit._id })
    toast.promise(promise, {
      loading: 'Removing habit...',
      success: 'Habit removed',
      error: 'Failed to delete',
    })
  }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2, delay: index * 0.03 }}
        onClick={() => setSheetOpen(true)}
        className={cn(
          'group relative flex items-center gap-3 p-4 bg-card border border-border rounded-md cursor-pointer transition-colors duration-200 hover:bg-accent border-l-[3px]',
          meta.border,
          habit.completedToday && 'opacity-60',
        )}
      >
        <button
          onClick={handleToggle}
          disabled={isToggling}
          className={cn(
            'relative flex shrink-0 items-center justify-center size-5 rounded-sm border-2 transition-colors duration-150',
            habit.completedToday
              ? 'bg-primary border-primary'
              : 'bg-transparent border-border hover:border-primary',
          )}
          aria-label={`Mark ${habit.title} ${habit.completedToday ? 'incomplete' : 'complete'}`}
        >
          <AnimatePresence>
            {habit.completedToday && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.15 }}
              >
                <CheckIcon className="h-3 w-3 text-primary-foreground stroke-[3px]" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={cn(
                'text-sm font-medium leading-tight',
                habit.completedToday && 'line-through text-muted-foreground',
              )}
            >
              {habit.title}
            </h3>
            <Badge
              variant="outline"
              className={cn(
                'text-[9px] px-1.5 py-0 h-4 border-transparent',
                meta.bg,
                meta.accent,
              )}
            >
              <Icon className="size-2.5 mr-0.5" />
              {meta.label}
            </Badge>
          </div>
          {habit.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {habit.description}
            </p>
          )}
        </div>

        {habit.currentStreak > 0 && (
          <div className="flex items-center gap-1 shrink-0">
            <Flame
              className={cn(
                'size-3',
                habit.currentStreak >= 7
                  ? 'text-amber-400'
                  : 'text-muted-foreground/60',
              )}
            />
            <span
              className={cn(
                'font-mono text-[10px] font-bold tabular-nums',
                habit.currentStreak >= 7
                  ? 'text-amber-400'
                  : 'text-muted-foreground',
              )}
            >
              {habit.currentStreak}d
            </span>
          </div>
        )}

        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity shrink-0 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground/40 hover:text-destructive"
          aria-label="Delete habit"
        >
          <Trash2 className="size-3.5" />
        </button>
      </motion.div>

      <HabitDetailSheet
        habit={habit}
        today={today}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  )
}
