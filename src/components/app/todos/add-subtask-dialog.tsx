import { useState } from 'react'
import { Plus } from 'lucide-react'

import { CreateSubtaskForm } from './subtask-form'
import { EntrySlip } from './entry-slip'
import type { Id } from 'convex/_generated/dataModel'

interface CreateSubtaskDialogProps {
  todoId: Id<'todos'>
  /** The entry this part is filed under, printed in the slip's header band. */
  destination?: string
}

export function CreateSubtaskDialog({
  todoId,
  destination,
}: CreateSubtaskDialogProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Add subtask"
        className="rounded-sm p-1 text-muted-foreground transition-colors duration-[var(--dur-2)] hover:bg-accent/60 hover:text-foreground"
      >
        <Plus className="size-4" />
      </button>

      <EntrySlip
        open={isOpen}
        onOpenChange={setIsOpen}
        label="New part"
        destination={destination}
        description="Write a subtask, give it a note and choose when it is due."
      >
        <CreateSubtaskForm todoId={todoId} setCreateDialogIsOpen={setIsOpen} />
      </EntrySlip>
    </>
  )
}
