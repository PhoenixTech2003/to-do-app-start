import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRight, Check } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ThemeSwitcher } from '@/components/ui/theme-switcher'
import { BetaBadge } from '@/components/ui/beta-badge'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

// One easing family across the page, matching the app's motion tokens.
const EASE = [0.22, 1, 0.36, 1] as const

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
}

/**
 * The hero is the product, not a picture of it: a real TwoDo sheet, built
 * from the same margin rule and time gutter every list in the app uses. It
 * works itself while you read, and stops with today still standing.
 */
const SHEET = [
  { title: 'Send the March invoice', spine: 'var(--destructive)', due: '−2d' },
  { title: 'Confirm the venue', spine: 'var(--chart-4)', due: '−1d' },
  { title: 'Write the standup notes', spine: 'var(--chart-2)', due: 'TODAY' },
  { title: 'Review the open PRs', spine: 'var(--chart-4)', due: 'TODAY' },
  { title: 'Renew the domain', spine: 'var(--border)', due: '+3d' },
  { title: 'Plan the summer offsite', spine: 'var(--chart-2)', due: '+2w' },
] as const

/** Struck in the order you'd actually work them: oldest debt first. */
const STRIKE_ORDER = [
  { index: 0, at: 900 },
  { index: 1, at: 1700 },
  { index: 3, at: 2600 },
]

function LiveSheet() {
  const reduceMotion = useReducedMotion()
  const [struck, setStruck] = useState<Array<number>>(
    reduceMotion ? [0, 1, 3] : [],
  )

  useEffect(() => {
    if (reduceMotion) return
    const timers = STRIKE_ORDER.map(({ index, at }) =>
      setTimeout(() => setStruck((prev) => [...prev, index]), at),
    )
    return () => timers.forEach(clearTimeout)
  }, [reduceMotion])

  const done = struck.length
  const late = SHEET.filter(
    (row, i) => row.due.startsWith('−') && !struck.includes(i),
  ).length

  return (
    <div
      aria-label="A TwoDo sheet, working itself"
      className="edge-lit overflow-hidden rounded-lg border border-hairline bg-card shadow-[var(--elev-4)] [&>*+*]:border-t [&>*+*]:border-hairline"
    >
      <div className="flex items-center gap-3 bg-surface-sunken py-2 pr-3 pl-4">
        <span className="label-meta flex-1 text-muted-foreground">Today</span>
        <span
          data-numeric
          className={cn(
            'font-mono text-[11px] font-semibold',
            late > 0 ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {late > 0 ? `${late} late` : 'nothing late'}
        </span>
      </div>

      {SHEET.map((row, i) => {
        const isStruck = struck.includes(i)
        const isToday = row.due === 'TODAY'
        return (
          <div
            key={row.title}
            style={{ '--spine': row.spine } as React.CSSProperties}
            className={cn(
              'spine flex items-center gap-3 py-3 pr-3 pl-4',
              'transition-opacity duration-[var(--dur-3)] ease-[var(--ease-standard)]',
              isStruck && 'spine-drained',
            )}
          >
            <span
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-[6px] border',
                'transition-[background-color,border-color] duration-[var(--dur-3)] ease-[var(--ease-out)]',
                isStruck
                  ? 'border-primary bg-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),var(--elev-1)]'
                  : 'border-hairline-strong bg-surface-sunken shadow-inset-well',
              )}
            >
              <Check
                className={cn(
                  'h-3 w-3 stroke-[3.5px] text-primary-foreground transition-opacity duration-[var(--dur-2)]',
                  isStruck ? 'opacity-100' : 'opacity-0',
                )}
              />
            </span>
            <span
              className={cn(
                'min-w-0 flex-1 truncate text-sm font-medium transition-colors duration-[var(--dur-3)]',
                isStruck &&
                  'text-muted-foreground line-through decoration-muted-foreground/50',
              )}
            >
              {row.title}
            </span>
            <span
              data-numeric
              className={cn(
                'w-[4.25rem] shrink-0 text-right font-mono text-[11px] font-semibold',
                'transition-colors duration-[var(--dur-3)]',
                isStruck
                  ? 'text-muted-foreground/40'
                  : row.due.startsWith('−')
                    ? 'text-destructive'
                    : isToday
                      ? 'text-primary'
                      : 'text-muted-foreground',
              )}
            >
              {row.due}
            </span>
          </div>
        )
      })}

      <div className="flex items-center gap-3 bg-surface-sunken py-2 pr-3 pl-4">
        <span className="label-meta flex-1 text-muted-foreground/70">
          {done} struck
        </span>
        <span
          data-numeric
          className="w-[4.25rem] shrink-0 text-right font-mono text-[10px] tracking-[0.18em] text-muted-foreground/40 uppercase"
        >
          {SHEET.length - done} left
        </span>
      </div>
    </div>
  )
}

/**
 * The two columns, named. The whole app is built on them, so the page says so
 * once, plainly, instead of listing adjectives.
 */
function HowItReads() {
  return (
    <section className="px-6 py-20 sm:py-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: EASE }}
        className="mx-auto max-w-3xl"
      >
        <p className="label-meta mb-3 text-primary">How a sheet reads</p>
        <h2 className="mb-10 text-3xl font-bold tracking-tight sm:text-4xl">
          Two columns, and neither of them moves.
        </h2>

        <div className="flex items-center gap-4">
          <div className="hidden w-40 shrink-0 text-right lg:block">
            <p className="label-meta text-muted-foreground">The margin</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              How much this one matters
            </p>
          </div>
          <span aria-hidden className="hidden h-px w-6 bg-hairline lg:block" />

          <div
            style={{ '--spine': 'var(--destructive)' } as React.CSSProperties}
            className="spine edge-lit flex flex-1 items-center gap-3 rounded-lg border border-hairline bg-card py-4 pr-3 pl-4 shadow-[var(--elev-2)]"
          >
            <span className="size-5 shrink-0 rounded-[6px] border border-hairline-strong bg-surface-sunken shadow-inset-well" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              Send the March invoice
            </span>
            <span
              data-numeric
              className="w-[4.25rem] shrink-0 text-right font-mono text-[11px] font-semibold text-destructive"
            >
              −2d
            </span>
          </div>

          <span aria-hidden className="hidden h-px w-6 bg-hairline lg:block" />
          <div className="hidden w-40 shrink-0 lg:block">
            <p className="label-meta text-muted-foreground">The gutter</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              How long you have left
            </p>
          </div>
        </div>

        <dl className="mt-6 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2 lg:hidden">
          <div>
            <dt className="label-meta text-muted-foreground">The margin</dt>
            <dd className="mt-1 text-muted-foreground/80">
              How much this one matters
            </dd>
          </div>
          <div>
            <dt className="label-meta text-muted-foreground">The gutter</dt>
            <dd className="mt-1 text-muted-foreground/80">
              How long you have left
            </dd>
          </div>
        </dl>

        <p className="mt-10 max-w-xl leading-relaxed text-muted-foreground">
          Every list in TwoDo is printed the same way, so scanning a workspace
          works exactly like scanning your inbox. Dates are set as distance —
          <span className="font-mono text-foreground/80"> −2d</span>,
          <span className="font-mono text-foreground/80"> TODAY</span>,
          <span className="font-mono text-foreground/80"> +2w</span> — because
          that is the part you act on.
        </p>
      </motion.div>
    </section>
  )
}

/** What the app does, said once each, in the app's own ruled voice. */
const SPEC = [
  ['Capture', 'Send anything to the inbox now and file it later.'],
  ['Today', 'One sheet of what the day actually asks of you.'],
  ['Workspaces', 'Group lists by project, client or part of your life.'],
  ['Board', 'Swap any list to a kanban board and drag between lanes.'],
  ['Habits', 'A tally sheet for the things you do every day.'],
  ['Search', 'Mod+K from anywhere, with priority and status filters.'],
] as const

function Spec() {
  return (
    <section className="px-6 pb-20 sm:pb-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: EASE }}
        className="mx-auto max-w-3xl"
      >
        <div className="edge-lit overflow-hidden rounded-lg border border-hairline bg-card shadow-[var(--elev-2)] [&>*+*]:border-t [&>*+*]:border-hairline">
          <div className="bg-surface-sunken px-4 py-2">
            <h2 className="label-meta text-muted-foreground">
              What you get
            </h2>
          </div>
          {SPEC.map(([name, what]) => (
            <div
              key={name}
              className="flex flex-col gap-1 px-4 py-4 transition-colors duration-[var(--dur-2)] ease-[var(--ease-standard)] hover:bg-accent/45 sm:flex-row sm:items-baseline sm:gap-6"
            >
              <span className="label-meta w-28 shrink-0 text-foreground/80">
                {name}
              </span>
              <span className="text-sm leading-relaxed text-muted-foreground">
                {what}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Nav ── */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-hairline bg-background/75 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <span className="flex items-center gap-2 text-base font-bold tracking-tight">
            Two<span className="text-primary">Do</span>
            <BetaBadge />
          </span>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <Link to="/signup" className="hidden sm:inline-block">
              <Button variant="ghost" size="sm" className="h-8 text-sm">
                Sign in
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="h-8 text-sm">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ──
          No gradient bloom behind the headline. The sheet is the picture. */}
      <section className="px-6 pt-28 pb-16 sm:pt-36 sm:pb-24">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16"
        >
          <div>
            <motion.div variants={fadeUp} className="mb-6">
              <BetaBadge variant="pill" />
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="mb-6 text-[3rem] leading-[0.95] font-black tracking-[-0.045em] sm:text-6xl"
            >
              Know what's
              <br />
              <span className="text-primary">late.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mb-8 max-w-md text-lg leading-relaxed text-muted-foreground"
            >
              TwoDo prints every task on one sheet with a column of time down
              the side. Everything sits in ink. Only what's overdue takes
              colour — so there is exactly one thing to look for.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-wrap items-center gap-4"
            >
              <Link to="/signup">
                <Button size="lg" className="h-12 px-8 text-sm font-semibold">
                  Start for free
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <span className="label-meta text-muted-foreground/70">
                Free while in beta
              </span>
            </motion.div>
          </div>

          <motion.div variants={fadeUp}>
            <LiveSheet />
          </motion.div>
        </motion.div>
      </section>

      <HowItReads />
      <Spec />

      {/* ── CTA ── */}
      <section className="border-y border-hairline bg-surface-sunken px-6 py-20 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mx-auto flex max-w-3xl flex-col items-start justify-between gap-8 sm:flex-row sm:items-center"
        >
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Start your first sheet.
            </h2>
            <p className="mt-2 text-muted-foreground">
              It takes about a minute, and nothing is late yet.
            </p>
          </div>
          <Link to="/signup" className="shrink-0">
            <Button size="lg" className="h-12 px-8 text-sm font-semibold">
              Get started
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer>
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <span className="label-meta text-muted-foreground">
            © {new Date().getFullYear()} TwoDo
          </span>
          <span className="label-meta text-muted-foreground/60">
            Set in Satoshi &amp; JetBrains Mono
          </span>
        </div>
      </footer>
    </div>
  )
}
