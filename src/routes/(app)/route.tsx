import {
  Outlet,
  createFileRoute,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { getToken, onMessage } from 'firebase/messaging'
import { useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { BellIcon, LogOut } from 'lucide-react'
import {
  convexQuery,
  useConvexAction,
  useConvexMutation,
} from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import { useQuery } from '@tanstack/react-query'
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
import { usePomoBackgroundTimer } from '@/hooks/use-pomo-background-timer'
import { playNotificationSound } from '@/components/app/pomodoro/pomo-helpers'
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
  const { isPending, isRefetching, data } = authClient.useSession()

  const handleSignOut = useCallback(async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          throw redirect({ to: '/' })
        },
      },
    })
  }, [navigate])
  const createPushNotificationToken = useConvexMutation(
    api.notifications.mutation.createPushNotificationToken,
  )
  const sendPushNotification = useConvexAction(
    api.notifications.actions.sendPushNotification,
  )
  const { data: pushTokenData } = useQuery(
    convexQuery(api.notifications.queries.getPushNotificationToken),
  )

  const onPhaseComplete = useCallback(
    (completed: string, next: string) => {
      const token = pushTokenData?.data?.token
      if (!token) return
      playNotificationSound()
      sendPushNotification({
        token,
        title: `${completed} complete`,
        body: `Time for ${next}. Press play when you're ready.`,
      })
    },
    [pushTokenData?.data?.token, sendPushNotification],
  )

  usePomoBackgroundTimer(onPhaseComplete)

  useEffect(() => {
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
  }, [])

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex min-w-0 flex-1 flex-col h-screen max-h-screen overflow-hidden">
        <SidebarInset className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden">
          <header className="flex shrink-0 items-center gap-4 px-6 h-14 z-30 bg-background border-b border-border">
            <SidebarTrigger />
            <div className="flex-1 min-w-0">
              {isPending || isRefetching ? (
                <span className="text-muted-foreground text-sm">loading…</span>
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
