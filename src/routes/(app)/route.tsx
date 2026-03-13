import { Outlet, createFileRoute } from '@tanstack/react-router'
import { getToken, onMessage } from 'firebase/messaging'
import { useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { BellIcon } from 'lucide-react'
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
import { ThemeSwitcher } from '@/components/ui/theme-switcher'
import { usePomoBackgroundTimer } from '@/hooks/use-pomo-background-timer'
import { playNotificationSound } from '@/components/app/pomodoro/pomo-helpers'
import { env } from '@/env'
import { getFirebaseMessaging } from '@/firebase/firebase-config'

export const Route = createFileRoute('/(app)')({
  component: DashboardLayout,
})

export function DashboardLayout() {
  const { isPending, isRefetching, data } = authClient.useSession()
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
      <main className="flex min-w-0 flex-1 flex-col min-h-screen">
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-4 px-6 h-14 sticky top-0 z-30 bg-background border-b border-border">
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
          </header>
          <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto p-4 sm:p-6 pb-20 sm:pb-6">
            <Outlet />
          </div>
        </SidebarInset>
      </main>
    </SidebarProvider>
  )
}
