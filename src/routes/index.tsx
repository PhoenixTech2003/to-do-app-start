import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRight, CheckCircle2, ListTodo, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeSwitcher } from '@/components/ui/theme-switcher'

export const Route = createFileRoute('/')({ component: LandingPage })

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-['Patrick_Hand'] transition-colors duration-300">
      <nav className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center border-b border-border gap-2">
        <div className="text-2xl sm:text-3xl font-bold tracking-wider text-primary shrink-0">
          TwoDo
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeSwitcher />
          <div className="flex gap-2 sm:space-x-4">
            <Link to="/signup" className="hidden sm:inline-block">
              <Button variant="ghost" className="text-lg">
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="text-sm sm:text-lg">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="container mx-auto px-4 sm:px-6 py-10 sm:py-20 text-center">
        <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight text-primary">
          Simply get things{' '}
          <span className="text-chart-1 decoration-wavy underline decoration-2">
            done.
          </span>
        </h1>
        <p className="text-2xl md:text-3xl text-muted-foreground mb-12 max-w-2xl mx-auto">
          The minimal, collaborative to-do list app that feels like your
          favorite notebook.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/signup">
            <Button
              size="lg"
              variant={'link'}
              className="h-auto transform rounded-full px-8 py-6 text-xl shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              Start for Free <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 py-10 sm:py-20">
        <div className="grid gap-6 sm:gap-12 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-8 shadow-sm transition-colors hover:border-chart-1">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-chart-1/20 text-chart-1">
              <ListTodo size={32} />
            </div>
            <h3 className="mb-3 text-2xl font-bold text-card-foreground">Simple Lists</h3>
            <p className="text-xl text-muted-foreground">
              Create workspaces and lists without the clutter. Just you and your
              tasks.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 sm:p-8 shadow-sm transition-colors hover:border-chart-2">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-chart-2/20 text-chart-2">
              <Users size={32} />
            </div>
            <h3 className="mb-3 text-2xl font-bold text-card-foreground">Collaborate</h3>
            <p className="text-xl text-muted-foreground">
              Invite a buddy to your workspace. Plan events, projects, or
              groceries together.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 sm:p-8 shadow-sm transition-colors hover:border-chart-4">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-chart-4/20 text-chart-4">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="mb-3 text-2xl font-bold text-card-foreground">Stay on Track</h3>
            <p className="text-xl text-muted-foreground">
              Satisfying checkmarks and progress tracking to keep you motivated.
            </p>
          </div>
        </div>
      </section>

      <footer className="container mx-auto mt-12 border-t border-border px-6 py-12 text-center text-lg text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} TwoDo. Crafted with &hearts;.</p>
      </footer>
    </div>
  )
}
