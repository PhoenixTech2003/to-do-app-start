import { motion } from 'motion/react'
import { TrendingDown } from 'lucide-react'
import { getLevel } from './habit-helpers'
import type { HabitWithStatus } from '@/types/global'
import { cn } from '@/lib/utils'

/**
 * The account. Everything the page knows in figures, ruled like a statement:
 * label left, number right. XP is kept the same way — a balance, with what was
 * earned and what was drained shown underneath it.
 */
export function StandingLedger({
  doneToday,
  totalHabits,
  weeklyRate,
  weekCompletions,
  totalXP,
  totalEarned,
  totalDecay,
  decayingHabits,
}: {
  doneToday: number
  totalHabits: number
  weeklyRate: number
  weekCompletions: number
  totalXP: number
  totalEarned: number
  totalDecay: number
  decayingHabits: Array<HabitWithStatus>
}) {
  const level = getLevel(totalXP)
  const toNext = Math.max(0, level.xpNeeded - level.xpInLevel)

  return (
    <motion.aside
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay: 0.09, ease: [0.22, 1, 0.36, 1] }}
      className="edge-lit rounded-lg border border-hairline-strong bg-card px-4 py-3.5 shadow-elev-1"
    >
      <h2 className="label-meta border-b border-hairline pb-2.5 text-muted-foreground">
        Standing
      </h2>

      <dl>
        <Line label="Today" value={`${doneToday}/${totalHabits}`} />
        <Line
          label="This week"
          value={`${weeklyRate}%`}
          note={`${weekCompletions} marks`}
        />
        <Line label="XP" value={totalXP.toLocaleString()} emphasis />
      </dl>

      {totalDecay > 0 && (
        <p className="pt-1.5 font-mono text-[11px] text-muted-foreground">
          <span data-numeric>{totalEarned.toLocaleString()}</span> earned{' '}
          <span className="text-destructive">
            − <span data-numeric>{totalDecay.toLocaleString()}</span> drained
          </span>
        </p>
      )}

      <div className="mt-3.5 border-t border-hairline pt-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[13px] font-medium">{level.title}</span>
          <span className="label-meta text-muted-foreground/70">
            Level {level.level}
          </span>
        </div>

        <div
          className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-sunken"
          style={{ boxShadow: 'var(--elev-inset)' }}
          role="progressbar"
          aria-valuenow={Math.round(level.progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress to level ${level.level + 1}`}
        >
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${level.progress}%` }}
            transition={{
              duration: 0.7,
              delay: 0.25,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        </div>

        <p className="mt-1.5 font-mono text-[11px] text-muted-foreground/80">
          <span data-numeric>{toNext.toLocaleString()}</span> XP to the next
          level
        </p>
      </div>

      {decayingHabits.length > 0 && (
        <div className="mt-3.5 flex items-start gap-2 border-t border-destructive/20 pt-3">
          <TrendingDown className="mt-0.5 size-3.5 shrink-0 text-destructive/80" />
          <p className="min-w-0 text-[12px] leading-relaxed text-muted-foreground">
            {decayingHabits.length === 1 ? (
              <>
                <span className="font-medium text-foreground">
                  {decayingHabits[0].title}
                </span>{' '}
                is draining XP.
              </>
            ) : (
              <>
                <span className="font-medium text-foreground">
                  {decayingHabits.length} habits
                </span>{' '}
                are draining XP.
              </>
            )}{' '}
            Mark one to stop the slide.
          </p>
        </div>
      )}
    </motion.aside>
  )
}

function Line({
  label,
  value,
  note,
  emphasis,
}: {
  label: string
  value: string
  note?: string
  emphasis?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-hairline py-2.5 last:border-b-0">
      <dt className="label-meta text-muted-foreground">{label}</dt>
      <dd className="flex items-baseline gap-2">
        {note && (
          <span className="font-mono text-[11px] text-muted-foreground/60">
            {note}
          </span>
        )}
        <span
          data-numeric
          className={cn(
            'font-mono font-semibold',
            emphasis ? 'text-lg tracking-tight' : 'text-sm',
          )}
        >
          {value}
        </span>
      </dd>
    </div>
  )
}
