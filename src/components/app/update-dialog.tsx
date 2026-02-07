import { Pencil } from 'lucide-react'
import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface UpdateDialogProps {
  isOpen: boolean
  setDialogIsOpen: (value: boolean) => void
  children: React.ReactNode
  updateDialogTitle: string
}

export function UpdateDialog({
  isOpen,
  setDialogIsOpen,
  children,
  updateDialogTitle,
}: UpdateDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setDialogIsOpen}>
      <DialogTrigger>
        <Button variant="outline" size="sm" className="flex-1">
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{updateDialogTitle}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
