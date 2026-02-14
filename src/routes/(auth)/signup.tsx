import { createFileRoute } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'
import { GoogleLogo } from '@/components/app/auth/google-logo'
import { ThemeSwitcher } from '@/components/ui/theme-switcher'

export const Route = createFileRoute('/(auth)/signup')({
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 font-['Patrick_Hand'] transition-colors duration-300">
      <div className="absolute top-4 right-4">
        <ThemeSwitcher />
      </div>
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          className="mb-8 pl-0 hover:bg-transparent hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Button>

        <div className="bg-card rounded-2xl border border-border p-8 shadow-sm text-center transition-colors duration-300">
          <h1 className="text-4xl font-bold text-primary mb-2">
            Get Started
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Create your account to start organizing
          </p>

          <Button
            onClick={handleGoogleSignUp}
            className="w-full h-12 text-lg rounded-xl bg-card border-2 border-border text-foreground hover:bg-accent hover:border-accent-foreground/20 transition-all shadow-sm"
            variant="outline"
          >
            <GoogleLogo className="mr-2 h-5 w-5" />
            Sign up with Google
          </Button>

          <p className="mt-8 text-muted-foreground text-sm">
            Already have an account?{' '}
            <a
              href="/signin"
              className="text-primary hover:underline font-bold"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
