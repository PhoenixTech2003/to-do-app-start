import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowRight,
  BarChart3,
  Check,
  Flame,
  Inbox,
  Sparkles,
  Zap,
} from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { ThemeSwitcher } from '@/components/ui/theme-switcher'
import { BetaBadge } from '@/components/ui/beta-badge'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

// One easing family across the page, matching the app's motion tokens.
const EASE = [0.22, 1, 0.36, 1] as const

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
}

const capabilities = [
  'Workspaces',
  'Kanban boards',
  'Priority filters',
  'Command palette',
  'Habit streaks',
  'Dark mode',
]

const features = [
  {
    icon: Zap,
    title: 'Instant capture',
    desc: 'Add tasks in seconds. No friction, no forms — just type and go.',
  },
  {
    icon: Flame,
    title: 'Habits & streaks',
    desc: 'Build daily routines alongside your tasks. Watch streaks grow on a year-at-a-glance graph.',
  },
  {
    icon: BarChart3,
    title: 'Stay on track',
    desc: 'Priority levels, due dates, and status filters keep you focused on what matters.',
  },
  {
    icon: Sparkles,
    title: 'Kanban & list views',
    desc: 'Switch between board and list layouts. Drag cards across columns effortlessly.',
  },
  {
    icon: Check,
    title: 'Satisfying completion',
    desc: 'Check off tasks with a crisp animation. See your progress build up over time.',
  },
  {
    icon: Inbox,
    title: 'Inbox and Today',
    desc: 'Capture anything to your inbox, then pull just what matters into Today.',
  },
]

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-hairline bg-background/75 backdrop-blur-xl backdrop-saturate-150">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="flex items-center gap-2 text-base font-bold tracking-tight">
            Two<span className="text-primary">Do</span>
            <BetaBadge />
          </span>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <Link to="/signup" className="hidden sm:inline-block">
              <Button variant="ghost" size="sm" className="text-sm h-8">
                Sign in
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="text-sm h-8">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 px-6">
        {/* A single warm bloom behind the headline — the page's only gradient,
            sitting where the eye lands first. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-[0.55] [mask-image:radial-gradient(60%_60%_at_30%_20%,black,transparent)]"
          style={{
            background:
              'radial-gradient(60% 55% at 28% 18%, color-mix(in srgb, var(--primary) 18%, transparent), transparent 70%)',
          }}
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="relative max-w-3xl mx-auto"
        >
          <motion.div variants={fadeUp} className="mb-7 flex items-center gap-3">
            <BetaBadge variant="pill" />
            <span className="label-meta text-primary">
              Productivity, distilled
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-[3.25rem] sm:text-7xl md:text-8xl font-black tracking-[-0.045em] leading-[0.92] mb-8"
          >
            Get things
            <br />
            <span className="text-primary">done.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed mb-10"
          >
            A minimal task manager built for people who value clarity over
            clutter. Organize. Focus. Ship.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
            <Link to="/signup">
              <Button size="lg" className="h-12 px-8 text-sm font-semibold">
                Start for free
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/signup">
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 text-sm font-semibold"
              >
                See how it works
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Capability strip ── */}
      <div className="border-y border-hairline bg-surface-sunken">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-2.5">
          {capabilities.map((item) => (
            <span
              key={item}
              className="label-meta flex items-center gap-2 text-muted-foreground"
            >
              <Check className="h-3 w-3 text-primary" strokeWidth={3} />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section className="py-20 sm:py-32 px-6">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          className="max-w-6xl mx-auto"
        >
          <motion.div variants={fadeUp} className="mb-14">
            <p className="label-meta text-primary mb-3">Why TwoDo</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Everything you need,
              <br />
              nothing you don't.
            </h2>
          </motion.div>

          {/* Hairline grid: the gap is the rule. No card borders needed. */}
          <div className="grid gap-px overflow-hidden rounded-xl border border-hairline bg-hairline-strong sm:grid-cols-2 lg:grid-cols-3 shadow-[var(--elev-2)]">
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                className="group relative bg-card p-8 sm:p-10 transition-colors duration-[var(--dur-3)] ease-[var(--ease-standard)] hover:bg-accent/40"
              >
                <div className="mb-5 flex size-9 items-center justify-center rounded-md border border-hairline bg-primary/8 text-primary transition-all duration-[var(--dur-2)] ease-[var(--ease-out)] group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),var(--elev-2)]">
                  <feature.icon className="h-4 w-4" />
                </div>
                <h3 className="text-lg font-bold mb-2 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 pb-20 sm:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border border-hairline bg-card px-6 py-16 text-center shadow-[inset_0_1px_0_0_var(--edge-highlight),var(--elev-3)] sm:px-16 sm:py-20"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                'radial-gradient(70% 90% at 50% 110%, color-mix(in srgb, var(--primary) 14%, transparent), transparent 70%)',
            }}
          />
          <div className="relative">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-[-0.03em] mb-5">
              Ready to simplify
              <br />
              your workflow?
            </h2>
            <p className="text-muted-foreground text-lg mb-9 max-w-md mx-auto">
              Free while we're in beta. Bring your lists across in minutes.
            </p>
            <Link to="/signup">
              <Button size="lg" className="h-12 px-10 text-sm font-semibold">
                Get started — it's free
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-hairline bg-surface-sunken">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="label-meta text-muted-foreground">
            © {new Date().getFullYear()} TwoDo
          </span>
          <span className="label-meta text-muted-foreground">
            Crafted with precision
          </span>
        </div>
      </footer>
    </div>
  )
}
