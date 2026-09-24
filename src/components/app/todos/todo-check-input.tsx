import { isAfter, parse } from 'date-fns'
import { CheckIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type { Todo } from '@/types/global'
import { cn } from '@/lib/utils'
import { useLocalMutation } from '@/state/hooks'

interface TodoCheckInputProps {
  todo: Todo
}

function getTodoStatus({
  status,
  dueDate,
}: {
  status: 'pending' | 'completed' | 'overdue'
  dueDate?: Date
}) {
  if (!dueDate) return status === 'completed' ? 'pending' : 'completed'
  if (status === 'completed') {
    return isAfter(new Date(), dueDate) ? 'overdue' : 'pending'
  }
  return 'completed'
}

export function TodoCheckInput({ todo }: TodoCheckInputProps) {
  const toggle = useLocalMutation('toggleTodoStatus')
  const displayStatus = todo.status
  const isCompleted = displayStatus === 'completed'
  const formattedDate =
    todo.dueDate && todo.dueTime
      ? parse(`${todo.dueDate} ${todo.dueTime}`, 'yyyy-MM-dd HH:mm', new Date())
      : undefined

  const handleClick = () => {
    void toggle({
      todoId: todo._id,
      status: getTodoStatus({ status: displayStatus, dueDate: formattedDate }),
    })
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'relative flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border',
        'transition-[background-color,border-color,box-shadow] duration-[var(--dur-2)] ease-[var(--ease-out)]',
        'active:scale-95 active:duration-[var(--dur-1)]',
        isCompleted
          ? // Filled: ink laid down, with a lit top edge so it sits proud.
            'border-primary bg-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),var(--elev-1)]'
          : // Empty: a shallow well cut into the card.
            'border-hairline-strong bg-surface-sunken shadow-inset-well hover:border-primary/70 hover:bg-primary/5',
      )}
      aria-pressed={isCompleted}
      aria-label={`Mark ${todo.title} ${isCompleted ? 'incomplete' : 'complete'}`}
    >
      <AnimatePresence initial={false}>
        {isCompleted && (
          <motion.span
            className="flex"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <CheckIcon className="h-3 w-3 text-primary-foreground stroke-[3.5px]" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
