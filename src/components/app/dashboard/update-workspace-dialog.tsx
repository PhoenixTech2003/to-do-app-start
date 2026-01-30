import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function UpdateWorkspaceDialog() {
  return (
    <Dialog>
      <DialogTrigger>
        <Button variant="outline" size="sm" className="flex-1">
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Workspace Details</DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
