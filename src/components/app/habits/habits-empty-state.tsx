import { Flame } from 'lucide-react'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

export function HabitsEmptyState() {
  return (
    <Empty className="py-20">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Flame className="size-5 text-muted-foreground" />
        </EmptyMedia>
        <EmptyTitle>Your habits define your future</EmptyTitle>
        <EmptyDescription>
          The person you become is the sum of your daily actions. Start with
          one small habit and watch it compound into something extraordinary.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
