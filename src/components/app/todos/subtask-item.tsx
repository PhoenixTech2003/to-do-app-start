import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { DeleteDialog } from '../delete-dialog'
import { EntrySlip } from './entry-slip'
import { UpdateSubtaskForm } from './subtask-form'
import type { SubTask } from '@/types/global'
import { cn } from '@/lib/utils'
import { GUTTER } from '@/components/app/docket'
import { gutterInk, gutterTime } from '@/lib/todo-time'

/**
 * A part, printed as the entry it is: the same checkbox, the same note beneath
 * the title, the same gutter of time on the right. The only thing that marks
 * it as subordinate is the sheet it sits on.
 */
export function SubtaskItem({
  st,
  onToggle,
  onDelete,
}: {
  st: SubTask
  onToggle: (id: string, checked: boolean) => void
  onDelete: (id: string) => Promise<void>
}) {
  const [isOpenUpdate, setIsOpenUpdate] = useState(false)
  const [isOpenDelete, setIsOpenDelete] = useState(false)

  const due = gutterTime(st.dueDate, st.dueTime)

  return (
    <div className="group flex items-start gap-3 py-2.5 transition-colors duration-[var(--dur-2)] ease-[var(--ease-standard)] hover:bg-accent/45">
      <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
        {/* The same two states as a todo: a shallow well, or ink laid down. */}
        <input
          type="checkbox"
          checked={!!st.completed}
          onChange={(e) => onToggle(st._id, e.target.checked)}
          className={cn(
            'mt-0.5 size-4 shrink-0 appearance-none rounded-[5px] border',
            'transition-[background-color,border-color,box-shadow] duration-[var(--dur-2)] ease-[var(--ease-out)]',
            'border-hairline-strong bg-surface-sunken shadow-inset-well',
            'checked:border-primary checked:bg-primary',
            "checked:bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3.5 8.5l3 3 6-6'/%3E%3C/svg%3E\")] checked:bg-center checked:bg-no-repeat",
          )}
        />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span
            className={cn(
              'min-w-0 truncate text-sm leading-snug',
              st.completed &&
                'text-muted-foreground line-through decoration-muted-foreground/50',
            )}
          >
            {st.title}
          </span>
          {st.description && (
            <span className="line-clamp-1 text-xs leading-relaxed text-muted-foreground">
              {st.description}
            </span>
          )}
        </span>
      </label>

      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-[var(--dur-2)] group-hover:opacity-100 focus-within:opacity-100">
        <button
          type="button"
          onClick={() => setIsOpenUpdate(true)}
          aria-label={`Edit ${st.title}`}
          className="rounded-sm p-1 text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setIsOpenDelete(true)}
          aria-label={`Delete ${st.title}`}
          className="rounded-sm p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {/* The gutter, in the same column the parent entry keeps it. */}
      <span
        data-numeric
        title={due.long}
        className={cn(
          'mt-0.5 font-mono text-[11px] leading-5 font-semibold',
          GUTTER,
          'w-12',
          st.completed ? 'text-muted-foreground/40' : gutterInk[due.tone],
        )}
      >
        {due.short}
      </span>

      <EntrySlip
        open={isOpenUpdate}
        onOpenChange={setIsOpenUpdate}
        label="Edit part"
        description="Change this subtask's title, note or due date."
      >
        <UpdateSubtaskForm
          subtask={st}
          setUpdateDialogIsOpen={setIsOpenUpdate}
        />
      </EntrySlip>

      <DeleteDialog
        showTrigger={false}
        isOpen={isOpenDelete}
        setIsOpen={setIsOpenDelete}
        dialogTitle={`This action will permanently delete the ${st.title} subtask`}
        handleDelete={() => {
          const deletePromise = onDelete(st._id)
          toast.promise(deletePromise, {
            loading: 'deleting subtask',
            success: () => {
              setIsOpenDelete(false)
              return 'Subtask deleted successfully'
            },
            error: 'Failed to delete subtask',
          })
        }}
      />
    </div>
  )
}
