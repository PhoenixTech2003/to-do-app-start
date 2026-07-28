import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { CATEGORIES, CATEGORY_META  } from './habit-helpers'
import type {Category} from './habit-helpers';
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export function CreateHabitDialog() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('productivity')
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily')
  const createHabit = useMutation(api.habits.mutations.createHabit)

  function reset() {
    setTitle('')
    setDescription('')
    setCategory('productivity')
    setFrequency('daily')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    const promise = createHabit({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      frequency,
    })

    toast.promise(promise, {
      loading: 'Creating habit...',
      success: () => {
        reset()
        setOpen(false)
        return 'Habit created. Day one starts now.'
      },
      error: 'Failed to create habit',
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 h-8 px-3 rounded-md text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">New Habit</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Build a New Habit</DialogTitle>
          <DialogDescription>
            Small daily actions compound into extraordinary results.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="habit-title"
              className="text-xs font-medium text-muted-foreground"
            >
              What do you want to build?
            </label>
            <Input
              id="habit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Meditate for 10 minutes"
              autoComplete="off"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="habit-desc"
              className="text-xs font-medium text-muted-foreground"
            >
              Why does this matter?{' '}
              <span className="text-muted-foreground/50">(optional)</span>
            </label>
            <Textarea
              id="habit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Clarity and calm to start the day..."
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Category
              </label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as Category)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => {
                    const m = CATEGORY_META[cat]
                    return (
                      <SelectItem key={cat} value={cat}>
                        <div className="flex items-center gap-2">
                          <m.icon className={cn('size-3.5', m.accent)} />
                          {m.label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Frequency
              </label>
              <Select
                value={frequency}
                onValueChange={(v) =>
                  setFrequency(v as 'daily' | 'weekly')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!title.trim()} className="w-full">
              Start Building
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
