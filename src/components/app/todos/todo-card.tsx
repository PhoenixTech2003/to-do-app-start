import { format } from 'date-fns'
import { forwardRef, useState } from 'react'
import { motion } from 'motion/react'
import { CalendarIcon, ClockIcon } from 'lucide-react'
import { TodoSheet } from './todo-sheet'
import { TodoCheckInput } from './todo-check-input'
import type { Todo } from '@/types/global'
import { cn, truncateText } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

interface TodoCardProps {
  todo: Todo
}

export const TodoCard = forwardRef<HTMLDivElement, TodoCardProps>(
  ({ todo }: TodoCardProps, ref) => {
    const [sheetIsOpen, setSheetIsOpen] = useState(false)
    const isMobile = useIsMobile()

    const title = isMobile ? truncateText(todo.title) : todo.title
    const description = isMobile
      ? truncateText(todo.description)
      : todo.description

    const priorityBorder: Record<string, string> = {
      high: 'border-l-destructive',
      medium: 'border-l-chart-4',
      low: 'border-l-chart-2',
      none: 'border-l-border',
    }

    return (
      <TodoSheet isOpen={sheetIsOpen} setIsOpen={setSheetIsOpen} todo={todo}>
        <motion.div
          ref={ref}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          onClick={() => setSheetIsOpen(true)}
          className={cn(
            'group relative flex flex-col gap-2 p-4 bg-card border border-border rounded-md cursor-pointer transition-colors duration-200 hover:bg-accent border-l-[3px]',
            priorityBorder[todo.priority] || priorityBorder.none,
            todo.status === 'completed' && 'opacity-50',
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3 flex-1 min-w-0">
              <div onClick={(e) => e.stopPropagation()} className="mt-0.5">
                <TodoCheckInput todo={todo} />
              </div>
              <div className="flex flex-col min-w-0 gap-1">
                <h3
                  className={cn(
                    'text-sm font-medium leading-tight',
                    todo.status === 'completed' &&
                      'line-through text-muted-foreground',
                  )}
                >
                  {title}
                </h3>
                {description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
            </div>

            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
              {todo.priority !== 'none' ? todo.priority : ''}
            </span>
          </div>

          {(todo.dueDate || todo.dueTime) && (
            <div className="flex items-center gap-3 pl-8">
              <div
                className={cn(
                  'flex items-center gap-3 font-mono text-[11px]',
                  todo.status === 'overdue'
                    ? 'text-destructive'
                    : 'text-muted-foreground',
                )}
              >
                {todo.dueDate && (
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    {format(todo.dueDate, 'dd MMM yyyy')}
                  </span>
                )}
                {todo.dueTime && (
                  <span className="flex items-center gap-1">
                    <ClockIcon className="h-3 w-3" />
                    {todo.dueTime}
                  </span>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </TodoSheet>
    )
  },
)
