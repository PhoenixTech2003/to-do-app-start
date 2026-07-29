import { Link, createFileRoute } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'
import { useConvexMutation } from '@convex-dev/react-query'
import { useQuery } from 'convex/react'
import {
  addMonths,
  format,
  getISOWeek,
  isSameDay,
  isSameMonth,
  isThisWeek,
  isToday,
} from 'date-fns'
import {
  CalendarMinus,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Plus,
} from 'lucide-react'
import { Fragment, useState } from 'react'
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

/**
 * The day's load, printed in the cell's left margin. Ink density is the whole
 * signal — how much is on the day, how much of it is spent — so the sheet needs
 * no legend. Only what is late takes colour.
 */
function LoadRail({ todos }: { todos: Array<CalendarTodo> }) {
  const counts = getStatusCounts(todos)
  const segments = [
    { key: 'overdue', count: counts.overdue, className: 'bg-destructive' },
    { key: 'pending', count: counts.pending, className: 'bg-foreground/50' },
    {
      key: 'completed',
      count: counts.completed,
      className: 'bg-foreground/12',
    },
  ].filter((segment) => segment.count > 0)

  if (segments.length === 0) return null

  return (
    <span
      aria-hidden
      className="absolute inset-y-2 left-0 flex w-[3px] flex-col gap-px overflow-hidden rounded-r-full"
    >
      {segments.map((segment) => (
        <span
          key={segment.key}
          className={segment.className}
          style={{ flexGrow: segment.count }}
        />
      ))}
    </span>
  )
}

/** The ledger's margin: one line number per ruled week. */
function WeekMarker({ week }: { week: Date }) {
  const current = isThisWeek(week, { weekStartsOn: 1 })

  return (
    <span
      aria-hidden
      className={cn(
        'hidden items-center justify-center border-r border-b border-hairline bg-card font-mono text-[10px] font-medium tabular-nums sm:flex',
        current ? 'text-primary' : 'text-muted-foreground/55',
      )}
    >
      {getISOWeek(week)}
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
  const today = isToday(day)
  const counts = getStatusCounts(todos)
  const open = counts.pending + counts.overdue

  return (
    <button
      type="button"
      onClick={() => onSelect(day)}
      aria-pressed={selected}
      aria-label={`${format(day, 'EEEE d MMMM')}, ${todos.length} task${todos.length === 1 ? '' : 's'}`}
      className={cn(
        'group relative flex min-w-0 flex-col overflow-hidden border-r border-b border-hairline bg-card p-2 pl-3 text-left',
        'transition-[background-color,box-shadow] duration-[var(--dur-2)] ease-[var(--ease-standard)]',
        'hover:z-10 hover:bg-accent/45 focus-visible:z-20',
        outside && 'bg-surface-sunken/55 text-muted-foreground/40',
        selected &&
          'z-10 bg-primary/[0.06] shadow-[inset_0_0_0_2px_var(--primary)] hover:bg-primary/[0.09]',
      )}
    >
      <LoadRail todos={todos} />

      <span className="flex shrink-0 items-center justify-between gap-1">
        <span
          data-numeric
          className={cn(
            'flex size-[1.375rem] items-center justify-center rounded-full font-mono text-[12px] font-semibold tabular-nums',
            today && 'bg-foreground text-background',
            selected && !today && 'text-primary',
          )}
        >
          {format(day, 'd')}
        </span>
        {todos.length > 0 && (
          <span
            data-numeric
            className={cn(
              'font-mono text-[10px] font-semibold tabular-nums',
              counts.overdue > 0
                ? 'text-destructive'
                : open > 0
                  ? 'text-foreground/70'
                  : 'text-muted-foreground/45',
            )}
          >
            {todos.length}
          </span>
        )}
      </span>

      {todos.length > 0 && (
        <span className="mt-1.5 hidden min-h-0 min-w-0 flex-1 flex-col gap-[3px] xl:flex">
          {todos.slice(0, 3).map((todo) => (
            <span
              key={todo._id}
              className={cn(
                'block truncate text-[10px] leading-[1.4] text-foreground/75',
                todo.status === 'completed' &&
                  'text-muted-foreground/60 line-through decoration-muted-foreground/40',
                todo.status === 'overdue' && 'text-destructive',
              )}
            >
              {todo.title}
            </span>
          ))}
          {todos.length > 3 && (
            <span className="label-meta block text-muted-foreground/55">
              +{todos.length - 3}
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
  const { monthStart, monthEnd, weeks } = getMonthGrid(month)
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

  // shrink-0 matters: this is a flex item in a scrolling pane, so without it
  // min-h-full lets the pane squash the sheet instead of scrolling it.
  return (
    <div className="flex min-h-full shrink-0 flex-col">
      <header className="mb-5 flex shrink-0 flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
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

      <div className="grid shrink-0 grow gap-4 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <section
          aria-label={`${format(month, 'MMMM yyyy')} calendar`}
          className="edge-lit min-w-0 overflow-hidden rounded-lg border border-hairline bg-card shadow-elev-2"
        >
          {/* One sheet: a week-number margin, then seven ruled columns. Rows
              share whatever height the pane has left, down to a floor — so the
              month fills the page, and the page scrolls once it can't. */}
          <div
            className="grid h-full grid-cols-7 border-l border-t border-hairline sm:grid-cols-[2.25rem_repeat(7,minmax(0,1fr))]"
            style={{
              gridTemplateRows: `auto repeat(${weeks.length}, minmax(4.75rem, 1fr))`,
            }}
          >
            <div className="label-meta hidden border-r border-b border-hairline bg-surface-sunken py-2 text-center text-muted-foreground/50 sm:block">
              Wk
            </div>
            {weekdays.map((weekday) => (
              <div
                key={weekday}
                className="label-meta border-r border-b border-hairline bg-surface-sunken py-2 text-center text-muted-foreground"
              >
                <span className="hidden sm:inline">{weekday}</span>
                <span className="sm:hidden">{weekday[0]}</span>
              </div>
            ))}
            {weeks.map((week) => (
              <Fragment key={dateKey(week[0])}>
                <WeekMarker week={week[0]} />
                {week.map((day) => (
                  <CalendarDay
                    key={dateKey(day)}
                    day={day}
                    month={month}
                    selectedDate={selectedDate}
                    todos={todosByDate.get(dateKey(day)) ?? []}
                    onSelect={selectDate}
                  />
                ))}
              </Fragment>
            ))}
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
