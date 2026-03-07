import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowRight,
  BarChart3,
  Check,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { ThemeSwitcher } from '@/components/ui/theme-switcher'

export const Route = createFileRoute('/')({ component: LandingPage })

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* ── Nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-base font-bold tracking-tight">
            Two<span className="text-primary">Do</span>
          </span>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <Link to="/signup" className="hidden sm:inline-block">
              <Button variant="ghost" size="sm" className="text-sm h-8">
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="text-sm h-8">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-24 pb-16 sm:pt-28 sm:pb-24 px-6">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="max-w-3xl mx-auto"
        >
          <motion.p
            variants={fadeUp}
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-primary mb-6"
          >
            Productivity, distilled
          </motion.p>

          <motion.h1
            variants={fadeUp}
            className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight leading-[0.95] mb-8"
          >
            Get things
            <br />
            <span className="text-primary">done.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed mb-10"
          >
            A minimal, collaborative task manager built for people who value
            clarity over clutter. Organize. Focus. Ship.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
            <Link to="/signup">
              <Button size="lg" className="h-12 px-8 text-sm font-semibold">
                Start for free
                <ArrowRight className="ml-2 h-4 w-4" />
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

      {/* ── Ticker strip ── */}
      <div className="border-y border-border bg-secondary/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-2">
          {[
            'Workspaces',
            'Kanban boards',
            'Priority filters',
            'Pomodoro timer',
            'Real-time collaboration',
            'Dark mode',
          ].map((item) => (
            <span
              key={item}
              className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
            >
              <Check className="h-3 w-3 text-primary" />
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
          <motion.div variants={fadeUp} className="mb-16">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-primary mb-3">
              Why TwoDo
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Everything you need,
              <br />
              nothing you don't.
            </h2>
          </motion.div>

          <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3 border border-border">
            {[
              {
                icon: Zap,
                title: 'Instant capture',
                desc: 'Add tasks in seconds. No friction, no forms — just type and go.',
              },
              {
                icon: Users,
                title: 'Collaborate',
                desc: 'Invite teammates to shared workspaces. Plan projects together in real time.',
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
                icon: Zap,
                title: 'Pomodoro built in',
                desc: 'Focus timer with break reminders and push notifications. Stay in the zone.',
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                className="bg-background p-8 sm:p-10 group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    0{i + 1}
                  </span>
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
      <section className="py-20 sm:py-32 px-6 border-t border-border">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-6">
            Ready to simplify
            <br />
            your workflow?
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-md mx-auto">
            Join thousands of people who've traded chaos for clarity.
          </p>
          <Link to="/signup">
            <Button size="lg" className="h-12 px-10 text-sm font-semibold">
              Get started — it's free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
            © {new Date().getFullYear()} TwoDo
          </span>
          <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
            Crafted with precision
          </span>
        </div>
      </footer>
    </div>
  )
}
