import { useState } from 'react'
import { toast } from 'sonner'
import { DeleteDialog } from '../delete-dialog'
import { UpdateDialog } from '../update-dialog'
import { UpdateSubtaskForm } from './update-subtask-form'
import type { SubTask } from '@/types/global'
import { cn } from '@/lib/utils'

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

  return (
    <div className="group flex items-center justify-between gap-3 py-2 transition-colors duration-[var(--dur-2)] ease-[var(--ease-standard)] hover:bg-accent/45">
      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
        {/* The same two states as a todo: a shallow well, or ink laid down. */}
        <input
          type="checkbox"
          checked={!!st.completed}
          onChange={(e) => onToggle(st._id, e.target.checked)}
          className={cn(
            'size-4 shrink-0 appearance-none rounded-[5px] border',
            'transition-[background-color,border-color,box-shadow] duration-[var(--dur-2)] ease-[var(--ease-out)]',
            'border-hairline-strong bg-surface-sunken shadow-inset-well',
            'checked:border-primary checked:bg-primary',
            "checked:bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3.5 8.5l3 3 6-6'/%3E%3C/svg%3E\")] checked:bg-center checked:bg-no-repeat",
          )}
        />
        <span
          className={cn(
            'min-w-0 truncate text-sm',
            st.completed &&
              'text-muted-foreground line-through decoration-muted-foreground/50',
          )}
        >
          {st.title}
        </span>
      </label>

      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-[var(--dur-2)] group-hover:opacity-100 focus-within:opacity-100">
        <UpdateDialog
          isOpen={isOpenUpdate}
          setDialogIsOpen={setIsOpenUpdate}
          updateDialogTitle="Update Subtask"
        >
          <UpdateSubtaskForm
            subtaskId={st._id}
            title={st.title}
            setUpdateDialogIsOpen={setIsOpenUpdate}
          />
        </UpdateDialog>

        <DeleteDialog
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
    </div>
  )
}
