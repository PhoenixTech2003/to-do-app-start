import { useDroppable } from '@dnd-kit/react'
import React from 'react'

export function Droppable({
  id,
  children,
}: {
  id: string
  children: React.ReactNode
}) {
  const { ref } = useDroppable({
    id,
  })

  return (
    <div
      ref={ref}
      className="bg-card/50 p-6"
      style={{ width: 300, height: 300 }}
    >
      {children}
    </div>
  )
}
