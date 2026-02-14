import React from 'react'
import { Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { TodoCheckInput } from './todo-check-input'
import type { Todo } from '@/types/global'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

interface TodoSheetProps {
  children: React.ReactNode
  todo: Todo
}

export function TodoSheet({ children, todo }: TodoSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <div className="flex items-center gap-2">
            <TodoCheckInput todo={todo} />
            <SheetTitle>{todo.title}</SheetTitle>
          </div>
          <SheetDescription>{todo.description}</SheetDescription>
          <div className="flex items-center gap-2">
            <Calendar size={20} />
            {todo.dueDate &&
              `Due: ${format(todo.dueDate, 'EEEE, dd MMMM yyyy')} at ${format(todo.dueDate, 'HH:mm')}`}
          </div>
        </SheetHeader>
        <div className="grid flex-1 auto-rows-min gap-6 px-4">
          <div className="grid gap-3">
            <Label htmlFor="sheet-demo-name">Name</Label>
            <Input id="sheet-demo-name" defaultValue="Pedro Duarte" />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="sheet-demo-username">Username</Label>
            <Input id="sheet-demo-username" defaultValue="@peduarte" />
          </div>
        </div>
        <SheetFooter>
          <Button type="submit">Save changes</Button>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
