import { useDroppable } from '@dnd-kit/react'
import { KanbanCard } from './kanban-card'
import { PaginationController } from './pagination-controller'
import type { Todo } from '@/types/global'
import { cn } from '@/lib/utils'

interface KanbanLaneProps {
  title: string
  todos: Array<Todo>
  status: 'LoadingFirstPage' | 'CanLoadMore' | 'LoadingMore' | 'Exhausted'
  loadMore: (n: number) => void
  initialNumItems?: number
}

export function KanbanLane({
  title,
  todos,
  status,
  loadMore,
  initialNumItems = 6,
}: KanbanLaneProps) {
  const { ref, isDropTarget } = useDroppable({
    id: title,
  })

  return (
    <div className="flex flex-col h-full min-h-[500px]">
      {/* Lane headers speak the same structural voice as a docket's header
          band: label left, count in the gutter. Terracotta only for late. */}
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-hairline-strong pb-2">
        <h2 className="label-meta truncate text-muted-foreground">{title}</h2>
        <span
          data-numeric
          className={cn(
            'font-mono text-[11px] font-semibold',
            title === 'Overdue' && todos.length > 0
              ? 'text-destructive'
              : 'text-muted-foreground',
          )}
        >
          {todos.length}
        </span>
      </div>

      <div
        className={cn(
          'min-h-[200px] flex-1 space-y-2 rounded-md border border-dashed p-3',
          'transition-colors duration-[var(--dur-2)] ease-[var(--ease-standard)]',
          isDropTarget
            ? 'border-primary bg-primary/5'
            : 'border-hairline-strong bg-surface-sunken/50 hover:border-muted-foreground/30',
        )}
        ref={ref}
      >
        <div className="space-y-2">
          {todos.map((todo, index) => (
            <KanbanCard
              key={todo._id}
              parent={title}
              index={index}
              todo={todo}
            />
          ))}
        </div>
        <PaginationController
          status={status}
          loadMore={loadMore}
          resultsCount={todos.length}
          label={`${title} Todos`}
          initialNumItems={initialNumItems}
        />
      </div>
    </div>
  )
}
