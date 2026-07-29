import { useDraggable } from '@dnd-kit/react'
import { TodoCard } from './todos/todo-card'
import type { Todo } from '@/types/global'

interface KanbanCardProps {
  todo: Todo
  index: number
  parent: string
}

export function KanbanCard({ todo, index, parent }: KanbanCardProps) {
  const { ref } = useDraggable({
    id: todo._id,
    data: {
      ...todo,
      index,
      parent,
    },
  })

  // Lanes are the one place a todo is an object you pick up, not a printed
  // line — so it keeps its edges and its elevation.
  return <TodoCard ref={ref} todo={todo} variant="card" />
}
