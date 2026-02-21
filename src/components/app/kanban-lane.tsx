import { useDroppable } from '@dnd-kit/react'
import { KanbanCard } from './kanban-card'
import type { Todo } from '@/types/global'

interface KanbanLaneProps {
  title: string
  todos: Array<Todo>
}

export function KanbanLane({ title, todos }: KanbanLaneProps) {
  const { ref } = useDroppable({
    id: title,
  })

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">{title}</h1>
      <div className="space-y-4" ref={ref}>
        {todos.map((todo, index) => (
          <KanbanCard key={todo._id} parent={title} index={index} todo={todo} />
        ))}
      </div>
    </div>
  )
}
