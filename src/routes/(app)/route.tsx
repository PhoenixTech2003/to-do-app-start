import {
  Outlet,
  createFileRoute,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { getToken, onMessage } from 'firebase/messaging'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { BellIcon, LoaderCircle, LogOut } from 'lucide-react'
import { useConvexMutation } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import { useQueryClient } from '@tanstack/react-query'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app/dashboard/app-sidebar'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ThemeSwitcher } from '@/components/ui/theme-switcher'
import { env } from '@/env'
import { getFirebaseMessaging } from '@/firebase/firebase-config'

export const Route = createFileRoute('/(app)')({
  beforeLoad: ({ context, location }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: '/signup', search: { redirectUrl: location.href } })
    }
  },
  component: DashboardLayout,
})

export function DashboardLayout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isPending, isRefetching, data } = authClient.useSession()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true)
    queryClient.setQueryData(['auth', 'token'], null)
    void navigate({ to: '/', replace: true })

    await authClient.signOut({
      fetchOptions: {
        onError: () => {
          setIsSigningOut(false)
          toast.error('Failed to sign out')
        },
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: ['auth', 'token'] })
        },
      },
    })
  }, [navigate, queryClient])
  const createPushNotificationToken = useConvexMutation(
    api.notifications.mutation.createPushNotificationToken,
  )

  useEffect(() => {
    if (!isPending && !isRefetching && !data) {
      void navigate({ to: '/', replace: true })
    }
  }, [data, isPending, isRefetching, navigate])

  useEffect(() => {
    if (isSigningOut) return
    const messaging = getFirebaseMessaging()
    if (!messaging) return

    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        getToken(messaging, { vapidKey: env.VITE_APP_VAPID_KEY }).then(
          async (token) => {
            await createPushNotificationToken({ token })
          },
        )
      } else if (permission === 'denied') {
        console.warn('Notification permission denied')
      }
    })

    const unsubscribe = onMessage(messaging, (payload) => {
      toast.info(payload.data?.title, {
        icon: <BellIcon />,
        description: payload.data?.body,
      })
    })

    return () => {
      unsubscribe()
    }
  }, [createPushNotificationToken, isSigningOut])

  if (isSigningOut) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-card px-5 py-4 text-sm text-muted-foreground shadow-[inset_0_1px_0_0_var(--edge-highlight),var(--elev-3)]">
          <LoaderCircle className="size-4 animate-spin text-primary" />
          Signing you out
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex min-w-0 flex-1 flex-col h-screen max-h-screen overflow-hidden">
        {/* The workspace is a sheet of paper resting on the sidebar surface. */}
        <SidebarInset className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden md:peer-data-[variant=inset]:border md:peer-data-[variant=inset]:border-hairline md:peer-data-[variant=inset]:shadow-[inset_0_1px_0_0_var(--edge-highlight),var(--elev-3)]">
          {/* Content scrolls in the sibling below, not under this bar, so it
              stays opaque — no blur to pay for. */}
          <header className="flex shrink-0 items-center gap-4 px-6 h-14 z-30 border-b border-hairline bg-background">
            <SidebarTrigger />
            <div className="flex-1 min-w-0">
              {isPending || isRefetching ? (
                <span className="text-muted-foreground text-sm">Loading…</span>
              ) : (
                <p className="text-sm truncate text-muted-foreground">
                  Welcome back,{' '}
                  <span className="text-foreground font-medium">
                    {data?.user.name}
                  </span>
                </p>
              )}
            </div>
            <ThemeSwitcher />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleSignOut}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={6}>
                Sign out
              </TooltipContent>
            </Tooltip>
          </header>
          <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto p-4 sm:p-6 pb-20 sm:pb-6">
            <Outlet />
          </div>
        </SidebarInset>
      </main>
    </SidebarProvider>
  )
}
