import { useDroppable } from '@dnd-kit/react'
import { KanbanCard } from './kanban-card'
import type { Todo } from '@/types/global'
import { cn } from '@/lib/utils'

interface KanbanLaneProps {
  title: string
  todos: Array<Todo>
}

const statusDot: Record<string, string> = {
  Pending: 'bg-chart-4',
  Completed: 'bg-chart-3',
  Overdue: 'bg-destructive',
}

export function KanbanLane({ title, todos }: KanbanLaneProps) {
  const { ref, isDropTarget } = useDroppable({
    id: title,
  })

  return (
    <div className="flex flex-col h-full min-h-[500px]">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className={cn("h-1.5 w-1.5 rounded-full", statusDot[title] || 'bg-muted-foreground')} />
          <h2 className="text-xs font-mono font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            {title}
          </h2>
        </div>
        <span className="font-mono text-[10px] font-bold text-muted-foreground tabular-nums">
          {todos.length}
        </span>
      </div>

      <div
        className={cn(
          "flex-1 space-y-2 min-h-[200px] rounded-md border border-dashed p-3 transition-colors duration-200",
          isDropTarget
            ? "border-primary bg-primary/5"
            : "border-border hover:border-muted-foreground/30"
        )}
        ref={ref}
      >
        {todos.map((todo, index) => (
          <KanbanCard key={todo._id} parent={title} index={index} todo={todo} />
        ))}
      </div>
    </div>
  )
}
