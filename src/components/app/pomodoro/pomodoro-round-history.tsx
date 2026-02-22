import { useLiveQuery } from 'dexie-react-hooks'
import { format, formatDistanceStrict } from 'date-fns'
import { CheckCircle2, History, Timer, XCircle } from 'lucide-react'
import { db } from '@/dexie/db'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

export function PomodoroRoundHistory() {
  const rounds = useLiveQuery(() =>
    db.pomodoroRounds.orderBy('startedAt').reverse().limit(20).toArray(),
  )

  return (
    <Card className="bg-card/50 rounded-lg">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <History className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Round History</h3>
        </div>

        {!rounds || rounds.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <div className="rounded-full bg-muted p-3">
              <Timer className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No rounds yet</p>
            <p className="text-xs text-muted-foreground/70">
              Press play to start your first round.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[20rem] md:h-[28rem]">
            <div className="space-y-2 pr-3">
              {rounds.map((round) => {
                const duration =
                  round.finishedAt && round.startedAt
                    ? formatDistanceStrict(round.finishedAt, round.startedAt)
                    : null

                const icon =
                  round.status === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                  ) : round.status === 'abandoned' ? (
                    <XCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
                  ) : (
                    <Timer className="h-4 w-4 text-primary shrink-0 animate-pulse" />
                  )

                return (
                  <div
                    key={round.id}
                    className={cn(
                      'flex items-center gap-3 rounded-md border px-3 py-2.5 transition-colors',
                      round.status === 'active' &&
                        'border-primary/30 bg-primary/5',
                    )}
                  >
                    {icon}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-medium tabular-nums">
                          {round.completedPomos}/{round.totalPomos}
                        </span>
                        {duration && (
                          <span className="text-[11px] text-muted-foreground">
                            {duration}
                          </span>
                        )}
                        {round.status === 'active' && (
                          <span className="text-[11px] text-primary font-medium">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {format(round.startedAt, 'MMM d · h:mm a')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
