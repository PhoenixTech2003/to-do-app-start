import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRight, CheckCircle2, ListTodo, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/')({ component: LandingPage })

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fdfbf7] text-slate-800 font-['Patrick_Hand']">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-3xl font-bold tracking-wider text-primary">
          TwoDo
        </div>
        <div className="space-x-4">
          <Link to="/signup">
            <Button variant="ghost" className="text-lg">
              Sign In
            </Button>
          </Link>
          <Link to="/signup">
            <Button className="text-lg">Get Started</Button>
          </Link>
        </div>
      </nav>

      <section className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight text-primary">
          Simply get things{' '}
          <span className="text-blue-600 decoration-wavy underline decoration-2">
            done.
          </span>
        </h1>
        <p className="text-2xl md:text-3xl text-slate-600 mb-12 max-w-2xl mx-auto">
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

      <section className="container mx-auto px-6 py-20">
        <div className="grid gap-12 md:grid-cols-3">
          <div className="rounded-2xl border-2 border-slate-100 bg-white p-8 shadow-sm transition-colors hover:border-blue-200">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <ListTodo size={32} />
            </div>
            <h3 className="mb-3 text-2xl font-bold">Simple Lists</h3>
            <p className="text-xl text-slate-600">
              Create workspaces and lists without the clutter. Just you and your
              tasks.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-slate-100 bg-white p-8 shadow-sm transition-colors hover:border-green-200">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
              <Users size={32} />
            </div>
            <h3 className="mb-3 text-2xl font-bold">Collaborate</h3>
            <p className="text-xl text-slate-600">
              Invite a buddy to your workspace. Plan events, projects, or
              groceries together.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-slate-100 bg-white p-8 shadow-sm transition-colors hover:border-purple-200">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="mb-3 text-2xl font-bold">Stay on Track</h3>
            <p className="text-xl text-slate-600">
              Satisfying checkmarks and progress tracking to keep you motivated.
            </p>
          </div>
        </div>
      </section>

      <footer className="container mx-auto mt-12 border-t border-slate-200 px-6 py-12 text-center text-lg text-slate-500">
        <p>&copy; {new Date().getFullYear()} TwoDo. Crafted with &hearts;.</p>
      </footer>
    </div>
  )
}
