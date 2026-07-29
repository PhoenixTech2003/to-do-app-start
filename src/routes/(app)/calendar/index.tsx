import { Link, createFileRoute } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'
import { useConvexMutation } from '@convex-dev/react-query'
import { useQuery } from 'convex/react'
import { addMonths, format, isSameDay, isSameMonth, isToday } from 'date-fns'
import {
  CalendarMinus,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Plus,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { api } from 'convex/_generated/api'
import type { TodoLocation } from '@/types/global'
import { CreateCalendarTaskDialog } from '@/components/app/calendar/create-calendar-task-dialog'
import { BackButton } from '@/components/app/back-button'
import { Docket, DocketEmpty } from '@/components/app/docket'
import { TodoCheckInput } from '@/components/app/todos/todo-check-input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  dateKey,
  getMonthGrid,
  monthKey,
  parseCalendarDate,
  parseCalendarMonth,
} from '@/lib/calendar-month'
import { cn } from '@/lib/utils'

const calendarSearchSchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
})

type CalendarTodo =
  (typeof api.globals.queries.getTodosForDateRange._returnType)['todos'][number]

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const Route = createFileRoute('/(app)/calendar/')({
  validateSearch: zodValidator(calendarSearchSchema),
  component: CalendarPage,
})

function getStatusCounts(todos: Array<CalendarTodo>) {
  return {
    pending: todos.filter((todo) => todo.status === 'pending').length,
    completed: todos.filter((todo) => todo.status === 'completed').length,
    overdue: todos.filter((todo) => todo.status === 'overdue').length,
  }
}

function ActivityRail({ todos }: { todos: Array<CalendarTodo> }) {
  const counts = getStatusCounts(todos)
  const segments = [
    { count: counts.overdue, className: 'bg-destructive' },
    { count: counts.pending, className: 'bg-chart-4' },
    { count: counts.completed, className: 'bg-chart-3' },
  ].filter((segment) => segment.count > 0)

  if (segments.length === 0) return null

  return (
    <span
      aria-hidden
      className="absolute inset-y-2 left-0 flex w-[3px] flex-col gap-px overflow-hidden rounded-r-full"
    >
      {segments.map((segment) => (
        <span
          key={segment.className}
          className={segment.className}
          style={{ flexGrow: segment.count }}
        />
      ))}
    </span>
  )
}

function CalendarDay({
  day,
  month,
  selectedDate,
  todos,
  onSelect,
}: {
  day: Date
  month: Date
  selectedDate: Date
  todos: Array<CalendarTodo>
  onSelect: (day: Date) => void
}) {
  const selected = isSameDay(day, selectedDate)
  const outside = !isSameMonth(day, month)
  const counts = getStatusCounts(todos)

  return (
    <button
      type="button"
      onClick={() => onSelect(day)}
      aria-pressed={selected}
      aria-label={`${format(day, 'EEEE d MMMM')}, ${todos.length} task${todos.length === 1 ? '' : 's'}`}
      className={cn(
        'group relative min-h-[4.5rem] min-w-0 border-r border-b border-hairline bg-card p-2 pl-3 text-left',
        'transition-[background-color,box-shadow] duration-[var(--dur-2)] ease-[var(--ease-standard)]',
        'hover:z-10 hover:bg-accent/45 focus-visible:z-20',
        'sm:min-h-[6rem] xl:min-h-[7.25rem]',
        outside && 'bg-surface-sunken/55 text-muted-foreground/45',
        selected &&
          'z-10 bg-primary/[0.07] shadow-[inset_0_0_0_2px_var(--primary)] hover:bg-primary/[0.09]',
      )}
    >
      <ActivityRail todos={todos} />
      <span className="flex items-start justify-between gap-1">
        <span
          data-numeric
          className={cn(
            'flex size-6 items-center justify-center rounded-full font-mono text-[11px] font-semibold',
            isToday(day) && 'bg-foreground text-background',
            selected && !isToday(day) && 'bg-primary text-primary-foreground',
          )}
        >
          {format(day, 'd')}
        </span>
        {todos.length > 0 && (
          <span
            data-numeric
            className="font-mono text-[10px] font-semibold text-muted-foreground xl:hidden"
          >
            {todos.length}
          </span>
        )}
      </span>

      {todos.length > 0 && (
        <span className="mt-2 hidden min-w-0 space-y-1 xl:block">
          {todos.slice(0, 2).map((todo) => (
            <span
              key={todo._id}
              className={cn(
                'block truncate font-mono text-[9px] leading-4 text-muted-foreground',
                todo.status === 'completed' &&
                  'line-through decoration-muted-foreground/40',
                todo.status === 'overdue' && 'text-destructive',
              )}
            >
              {todo.dueTime ?? '—'} · {todo.title}
            </span>
          ))}
          {todos.length > 2 && (
            <span className="label-meta block text-muted-foreground/60">
              +{todos.length - 2} more
            </span>
          )}
        </span>
      )}

      {counts.overdue > 0 && (
        <span className="sr-only">{counts.overdue} overdue</span>
      )}
    </button>
  )
}

function TaskLocation({ location }: { location: TodoLocation }) {
  if (!location.listId || !location.workspaceId) {
    return (
      <Link
        to="/inbox"
        className="inline-flex min-w-0 items-center gap-1 hover:text-foreground"
      >
        <Inbox className="size-3 shrink-0" />
        <span className="truncate">Inbox</span>
      </Link>
    )
  }

  return (
    <Link
      to="/dashboard/workspace/$workspaceId/lists/$listId/todos"
      params={{
        workspaceId: location.workspaceId,
        listId: location.listId,
      }}
      search={{ view: 'list' }}
      className="truncate hover:text-foreground"
      title={`${location.workspaceTitle} / ${location.listTitle}`}
    >
      {location.workspaceTitle} / {location.listTitle}
    </Link>
  )
}

function CalendarTaskRow({
  todo,
  selectedDate,
}: {
  todo: CalendarTodo
  selectedDate: Date
}) {
  const removeFromDate = useConvexMutation(
    api.todos.mutations.removeTodoFromDate,
  )

  const spineColor = {
    high: 'var(--destructive)',
    medium: 'var(--chart-4)',
    low: 'var(--chart-2)',
    none: 'var(--border)',
  }[todo.priority]

  const handleRemove = () => {
    const removePromise = removeFromDate({ todoId: todo._id })
    toast.promise(removePromise, {
      loading: 'Removing task from the day…',
      success: `"${todo.title}" removed from ${format(selectedDate, 'd MMMM')}`,
      error: 'Task could not be removed from the day.',
    })
  }

  return (
    <div
      style={{ '--spine': spineColor } as React.CSSProperties}
      className={cn(
        'spine group grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 bg-card py-3 pr-2 pl-4',
        todo.status === 'completed' && 'spine-drained',
      )}
    >
      <div className="mt-0.5">
        <TodoCheckInput todo={todo} />
      </div>

      <div className="min-w-0">
        <p
          className={cn(
            'truncate text-sm font-medium',
            todo.status === 'completed' &&
              'text-muted-foreground line-through decoration-muted-foreground/50',
          )}
        >
          {todo.title}
        </p>
        <div className="mt-1 flex min-w-0 items-center gap-2 font-mono text-[10px] text-muted-foreground">
          <time dateTime={`${todo.dueDate}T${todo.dueTime ?? '00:00'}`}>
            {todo.dueTime ?? 'Any time'}
          </time>
          <span className="text-muted-foreground/30">/</span>
          <TaskLocation location={todo.location} />
        </div>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleRemove}
            className="text-muted-foreground opacity-70 hover:text-destructive group-hover:opacity-100"
            aria-label={`Remove ${todo.title} from ${format(selectedDate, 'd MMMM')}`}
          >
            <CalendarMinus className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Remove from this day</TooltipContent>
      </Tooltip>
    </div>
  )
}

function DayAgenda({
  date,
  todos,
}: {
  date: Date
  todos: Array<CalendarTodo>
}) {
  const [createOpen, setCreateOpen] = useState(false)
  const counts = getStatusCounts(todos)

  return (
    <>
      <Docket className="h-fit">
        <div className="relative overflow-hidden bg-surface-sunken p-4">
          <p className="label-meta text-muted-foreground">
            {format(date, 'MMMM yyyy')}
          </p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <div className="flex items-baseline gap-3">
              <span
                data-numeric
                className="font-mono text-4xl font-semibold leading-none tracking-[-0.08em]"
              >
                {format(date, 'dd')}
              </span>
              <div>
                <h2 className="text-lg font-bold">{format(date, 'EEEE')}</h2>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {todos.length} task{todos.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Add task
            </Button>
          </div>

          {todos.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-muted-foreground">
              <span data-numeric>{counts.pending} pending</span>
              <span data-numeric className="text-chart-3">
                {counts.completed} done
              </span>
              {counts.overdue > 0 && (
                <span data-numeric className="text-destructive">
                  {counts.overdue} overdue
                </span>
              )}
            </div>
          )}
        </div>

        {todos.length === 0 ? (
          <DocketEmpty>
            No tasks are scheduled. Add one here or choose another day.
          </DocketEmpty>
        ) : (
          todos.map((todo) => (
            <CalendarTaskRow key={todo._id} todo={todo} selectedDate={date} />
          ))
        )}
      </Docket>

      <CreateCalendarTaskDialog
        key={dateKey(date)}
        date={date}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </>
  )
}

function CalendarPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const isMobile = useIsMobile()
  const today = new Date()
  const month = parseCalendarMonth(search.month, today)
  const { monthStart, monthEnd, days } = getMonthGrid(month)
  const requestedDate = parseCalendarDate(search.date)
  const selectedDate =
    requestedDate && isSameMonth(requestedDate, month)
      ? requestedDate
      : isSameMonth(today, month)
        ? today
        : monthStart
  const [mobileAgendaOpen, setMobileAgendaOpen] = useState(false)

  const data = useQuery(api.globals.queries.getTodosForDateRange, {
    startDate: dateKey(monthStart),
    endDate: dateKey(monthEnd),
  })
  const todos = data?.todos ?? []
  const todosByDate = new Map<string, Array<CalendarTodo>>()
  for (const todo of todos) {
    if (!todo.dueDate) continue
    const dayTodos = todosByDate.get(todo.dueDate) ?? []
    dayTodos.push(todo)
    todosByDate.set(todo.dueDate, dayTodos)
  }
  for (const dayTodos of todosByDate.values()) {
    dayTodos.sort((a, b) =>
      (a.dueTime ?? '99:99').localeCompare(b.dueTime ?? '99:99'),
    )
  }

  const selectedTodos = todosByDate.get(dateKey(selectedDate)) ?? []
  const monthCounts = getStatusCounts(todos)

  const selectDate = (date: Date) => {
    navigate({
      search: {
        month: monthKey(date),
        date: dateKey(date),
      },
      replace: true,
    })
    if (isMobile) setMobileAgendaOpen(true)
  }

  const changeMonth = (offset: number) => {
    const nextMonth = addMonths(month, offset)
    navigate({
      search: {
        month: monthKey(nextMonth),
        date: dateKey(isSameMonth(today, nextMonth) ? today : nextMonth),
      },
      replace: true,
    })
  }

  const goToToday = () => {
    navigate({
      search: {
        month: monthKey(today),
        date: dateKey(today),
      },
      replace: true,
    })
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="mb-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <BackButton />
          <div className="min-w-0">
            <p className="label-meta text-muted-foreground">Month ledger</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
              {format(month, 'MMMM')}{' '}
              <span className="font-normal text-muted-foreground">
                {format(month, 'yyyy')}
              </span>
            </h1>
            <p className="mt-1 flex flex-wrap gap-x-2 font-mono text-[10px] text-muted-foreground">
              {data === undefined ? (
                <span className="inline-flex items-center gap-1.5">
                  <Spinner className="size-3" /> Reading the month
                </span>
              ) : (
                <>
                  <span data-numeric>{todos.length} scheduled</span>
                  <span className="text-muted-foreground/30">/</span>
                  <span data-numeric>{monthCounts.completed} done</span>
                  {monthCounts.overdue > 0 && (
                    <>
                      <span className="text-muted-foreground/30">/</span>
                      <span data-numeric className="text-destructive">
                        {monthCounts.overdue} overdue
                      </span>
                    </>
                  )}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 self-end sm:self-auto">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => changeMonth(-1)}
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => changeMonth(1)}
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <section
          aria-label={`${format(month, 'MMMM yyyy')} calendar`}
          className="edge-lit min-w-0 overflow-hidden rounded-lg border border-hairline bg-card shadow-elev-2"
        >
          <div className="grid grid-cols-7 border-l border-t border-hairline bg-surface-sunken">
            {weekdays.map((weekday) => (
              <div
                key={weekday}
                className="label-meta border-r border-b border-hairline py-2 text-center text-muted-foreground"
              >
                <span className="hidden sm:inline">{weekday}</span>
                <span className="sm:hidden">{weekday[0]}</span>
              </div>
            ))}
            {days.map((day) => (
              <CalendarDay
                key={dateKey(day)}
                day={day}
                month={month}
                selectedDate={selectedDate}
                todos={todosByDate.get(dateKey(day)) ?? []}
                onSelect={selectDate}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-hairline bg-surface-sunken px-4 py-2.5 font-mono text-[9px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-chart-4" />
              Pending
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-chart-3" />
              Completed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-destructive" />
              Overdue
            </span>
            <span className="ml-auto hidden text-muted-foreground/60 sm:inline">
              The margin shows each day’s mix
            </span>
          </div>
        </section>

        <aside
          aria-label={`Tasks for ${format(selectedDate, 'EEEE d MMMM')}`}
          aria-live="polite"
          className="hidden min-w-0 lg:block"
        >
          <DayAgenda date={selectedDate} todos={selectedTodos} />
        </aside>
      </div>

      <Dialog open={mobileAgendaOpen} onOpenChange={setMobileAgendaOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto p-0 lg:hidden">
          <DialogTitle className="sr-only">
            Tasks for {format(selectedDate, 'EEEE d MMMM')}
          </DialogTitle>
          <DayAgenda date={selectedDate} todos={selectedTodos} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
