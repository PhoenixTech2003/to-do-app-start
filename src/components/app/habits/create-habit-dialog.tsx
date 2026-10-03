import { useState } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { CATEGORIES, CATEGORY_META } from './habit-helpers'
import type { Category } from './habit-helpers'
import { useLocalMutation } from '@/state/hooks'
import { Button } from '@/components/ui/button'
import { Band, chipClasses } from '@/components/app/todos/entry-fields'
import {
  EntryLine,
  EntrySlip,
  LineError,
  NoteInput,
  SlipActions,
  TitleInput,
  submitOnModEnter,
} from '@/components/app/todos/entry-slip'
import { cn } from '@/lib/utils'

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
] as const

export function CreateHabitDialog() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 h-8 px-3 rounded-md text-xs"
      >
        <Plus className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">New Habit</span>
      </Button>

      <EntrySlip
        open={open}
        onOpenChange={setOpen}
        label="New habit"
        destination="Habits"
        description="Name a habit, say why it matters and how often it is kept."
      >
        <CreateHabitForm onClose={() => setOpen(false)} />
      </EntrySlip>
    </>
  )
}

function CreateHabitForm({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('productivity')
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily')
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const createHabit = useLocalMutation('createHabit')

  function submit() {
    setTouched(true)
    if (!title.trim() || submitting) return
    setSubmitting(true)

    const promise = createHabit({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      frequency,
    }).finally(() => setSubmitting(false))

    toast.promise(promise, {
      loading: 'Creating habit…',
      success: () => {
        onClose()
        return 'Habit created. Day one starts now.'
      },
      error: 'The habit could not be created. Try again.',
    })
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      onKeyDown={submitOnModEnter(submit)}
    >
      <div className="max-h-[60vh] overflow-y-auto">
        <EntryLine>
          <TitleInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setTouched(true)}
            aria-label="Habit"
            aria-invalid={touched && !title.trim()}
            placeholder="Meditate for 10 minutes"
            autoComplete="off"
            autoFocus
          />
          {touched && !title.trim() && (
            <LineError>A habit needs a name.</LineError>
          )}
          <NoteInput
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-label="Why it matters"
            placeholder="Why does this matter?"
          />
        </EntryLine>

        <Band label="Category">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            {CATEGORIES.map((cat) => {
              const meta = CATEGORY_META[cat]
              return (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={category === cat}
                  onClick={() => setCategory(cat)}
                  className={cn(
                    chipClasses(category === cat),
                    'flex items-center gap-1.5',
                  )}
                >
                  <meta.icon
                    className={cn('size-3', category !== cat && meta.accent)}
                    aria-hidden
                  />
                  {meta.label}
                </button>
              )
            })}
          </div>
        </Band>

        <Band label="Kept">
          <div className="flex flex-wrap items-center gap-1.5">
            {FREQUENCIES.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={frequency === option.value}
                onClick={() => setFrequency(option.value)}
                className={chipClasses(frequency === option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Band>
      </div>

      <SlipActions
        submitLabel="Start habit"
        hint="to start"
        onCancel={onClose}
        disabled={submitting}
      />
    </form>
  )
}
