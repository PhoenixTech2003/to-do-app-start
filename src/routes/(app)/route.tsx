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

    return () => unsubscribe()
  }, [])

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex flex-1 flex-col min-h-screen">
        <SidebarInset className="flex flex-col flex-1">
          <header className="flex items-center gap-2 sm:gap-4 border-b px-3 sm:px-4 py-2">
            <SidebarTrigger />
            <div className="flex-1 min-w-0">
              {isPending || isRefetching ? (
                <p>loading...</p>
              ) : (
                <p className="text-sm sm:text-lg truncate">
                  Welcome back, {data?.user.name}
                </p>
              )}
            </div>
            <ThemeSwitcher />
          </header>
          <div className="flex-1 overflow-auto p-2 sm:p-4">
            <Outlet />
          </div>
        </SidebarInset>
      </main>
    </SidebarProvider>
  )
}
