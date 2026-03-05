import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'
import { GoogleLogo } from '@/components/app/auth/google-logo'
import { ThemeSwitcher } from '@/components/ui/theme-switcher'
import { SignupPageSkeleton } from '@/components/app/auth/signup-page-skeleton'

export const Route = createFileRoute('/(auth)/signup')({
  pendingComponent: SignupPageSkeleton,
  component: SignUpPage,
})

function SignUpPage() {
  function handleGoogleSignUp() {
    const googleSignInHandler = authClient.signIn.social({
      provider: 'google',
      callbackURL: '/dashboard',
    })
    toast.promise(googleSignInHandler, {
      loading: 'Signing up',
      error: 'An error occured while signing up with Google',
    })
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground text-background flex-col justify-between p-12">
        <div>
          <Link to="/" className="text-base font-bold tracking-tight">
            Two<span className="text-primary">Do</span>
          </Link>
        </div>

        <div className="max-w-sm">
          <h2 className="text-4xl font-bold tracking-tight leading-tight mb-4">
            Organize your work,<br />simplify your life.
          </h2>
          <p className="text-background/60 text-sm leading-relaxed">
            Join thousands of people who've traded chaos for clarity with a minimal,
            focused task manager.
          </p>
        </div>

        <p className="font-mono text-[10px] uppercase tracking-wider text-background/40">
          © {new Date().getFullYear()} TwoDo
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <ThemeSwitcher />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <Link to="/">
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
          </Link>

          <div className="mb-8">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-primary mb-3">
              Get started
            </p>
            <h1 className="text-2xl font-bold tracking-tight mb-2">
              Create your account
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign up to start organizing your tasks
            </p>
          </div>

          <Button
            onClick={handleGoogleSignUp}
            variant="outline"
            className="w-full h-11 text-sm rounded-md border-border justify-center gap-2.5 hover:bg-accent transition-colors"
          >
            <GoogleLogo className="h-4 w-4" />
            Continue with Google
          </Button>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Already have an account?{' '}
              <a href="/signin" className="text-primary font-semibold hover:underline">
                Sign in
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
