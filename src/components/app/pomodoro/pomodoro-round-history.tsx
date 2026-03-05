import { useLiveQuery } from 'dexie-react-hooks'
import { endOfDay, format, formatDistanceStrict, startOfDay } from 'date-fns'
import { CheckCircle2, History, Timer, XCircle } from 'lucide-react'
import { db } from '@/dexie/db'
import { cn } from '@/lib/utils'


export function PomodoroRoundHistory() {
  const rounds = useLiveQuery(() => {
    const now = new Date()
    const dayStart = startOfDay(now).getTime()
    const dayEnd = endOfDay(now).getTime()
    return db.pomodoroRounds
      .where('startedAt')
      .between(dayStart, dayEnd, true, true)
      .reverse()
      .toArray()
  })

  return (
    <div className="flex flex-col border border-border rounded-md overflow-hidden min-h-0">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <History className="h-3.5 w-3.5 text-muted-foreground" />
        <h3 className="text-xs font-mono font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Today's Rounds
        </h3>
      </div>

      {!rounds || rounds.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center flex-1">
          <Timer className="h-5 w-5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">No rounds today</p>
          <p className="text-[10px] font-mono text-muted-foreground/60">
            Press play to start
          </p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-3 space-y-1.5">
            {rounds.map((round) => {
              const duration =
                round.finishedAt && round.startedAt
                  ? formatDistanceStrict(round.finishedAt, round.startedAt)
                  : null

              const icon =
                round.status === 'completed' ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-chart-3 shrink-0" />
                ) : round.status === 'abandoned' ? (
                  <XCircle className="h-3.5 w-3.5 text-chart-4 shrink-0" />
                ) : (
                  <Timer className="h-3.5 w-3.5 text-primary shrink-0 animate-pulse" />
                )

              return (
                <div
                  key={round.id}
                  className={cn(
                    'flex items-center gap-3 rounded-md border px-3 py-2 transition-colors',
                    round.status === 'active'
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border',
                  )}
                >
                  {icon}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono text-xs font-semibold tabular-nums">
                        {round.completedPomos}/{round.totalPomos}
                      </span>
                      {duration && (
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {duration}
                        </span>
                      )}
                      {round.status === 'active' && (
                        <span className="font-mono text-[10px] text-primary font-semibold uppercase">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-[10px] text-muted-foreground truncate">
                      {format(round.startedAt, 'MMM d · h:mm a')}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
