import { Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DeleteDialogProps {
  dialogTitle: string
  triggerTitle?: string
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  handleDelete: () => void
  description?: string
  showTrigger?: boolean
}

export function DeleteDialog({
  isOpen,
  setIsOpen,
  triggerTitle,
  dialogTitle,
  handleDelete,
  description,
  showTrigger = true,
}: DeleteDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {showTrigger && (
        <Button
          variant="destructive"
          onClick={() => setIsOpen(true)}
          size="sm"
          className="flex-1 py-2"
        >
          <Trash2 className="h-4 w-4" />
          {triggerTitle}
        </Button>
      )}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => setIsOpen(false)} variant={'outline'}>
            Cancel
          </Button>
          <Button variant={'destructive'} onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
