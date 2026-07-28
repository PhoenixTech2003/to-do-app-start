import { format } from 'date-fns'
import { motion } from 'motion/react'
import { TallyWall, tallySizeFor } from './tally'
import type { Run } from './habit-helpers'

/**
 * The hero. One wall of struck marks — a day per mark, five to a group, on
 * ruled paper. It is the reason to open the page: it is different every day,
 * it is yours, and there is always one empty slot at the end of it.
 */
export function RunWall({
  run,
  today,
  doneToday,
  totalHabits,
}: {
  run: Run
  today: string
  doneToday: number
  totalHabits: number
}) {
  const size = tallySizeFor(run.length)

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      className="edge-lit relative overflow-hidden rounded-lg border border-hairline-strong bg-card px-5 py-5 shadow-elev-2 sm:px-7 sm:py-6"
      aria-label="Days in a row"
    >
      <div className="flex items-baseline justify-between gap-4 pb-4">
        <span className="label-meta text-muted-foreground">Days in a row</span>
        <time
          dateTime={today}
          className="label-meta text-muted-foreground/70 whitespace-nowrap"
        >
          {format(new Date(today + 'T12:00:00'), 'd MMM yyyy · EEE')}
        </time>
      </div>

      {run.length === 0 ? (
        <EmptyWall markedToday={run.markedToday} />
      ) : (
        <TallyWall
          count={run.length}
          markedToday={run.markedToday}
          size={size}
        />
      )}

      <div className="mt-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-t border-hairline pt-4">
        <p className="flex items-baseline gap-2.5">
          <span
            data-numeric
            className="font-mono text-4xl leading-none font-bold tracking-[-0.05em] sm:text-5xl"
          >
            {run.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {run.length === 1 ? 'day' : 'days'} unbroken
          </span>
        </p>

        <dl className="flex items-baseline gap-6">
          <Figure label="Longest" value={`${run.longest}d`} />
          <Figure label="Today" value={`${doneToday}/${totalHabits}`} />
          {run.startedOn && (
            <Figure
              label="Since"
              value={format(new Date(run.startedOn + 'T12:00:00'), 'd MMM')}
              className="hidden sm:block"
            />
          )}
        </dl>
      </div>
    </motion.section>
  )
}

function Figure({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={className}>
      <dt className="label-meta text-muted-foreground/70">{label}</dt>
      <dd
        data-numeric
        className="mt-1 font-mono text-sm font-semibold text-foreground/85"
      >
        {value}
      </dd>
    </div>
  )
}

function EmptyWall({ markedToday }: { markedToday: boolean }) {
  return (
    <div className="flex items-center gap-4">
      <TallyWall count={0} markedToday={markedToday} size="lg" />
      <p className="text-sm text-muted-foreground">
        Mark any habit below to strike the first day.
      </p>
    </div>
  )
}
