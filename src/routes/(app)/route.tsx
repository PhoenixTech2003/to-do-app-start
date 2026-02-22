import { useEffect } from 'react'
import { Outlet, createFileRoute } from '@tanstack/react-router'
import { BellIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useConvexMutation } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app/dashboard/app-sidebar'
import { authClient } from '@/lib/auth-client'
import { ThemeSwitcher } from '@/components/ui/theme-switcher'
import { usePomoBackgroundTimer } from '@/hooks/use-pomo-background-timer'
import { Button } from '@/components/ui/button'
import {
  getMessagingToken,
  listenForForegroundMessages,
} from '@/firebase/firebase'

export const Route = createFileRoute('/(app)')({
  component: DashboardLayout,
})

export function DashboardLayout() {
  const { isPending, isRefetching, data } = authClient.useSession()
  const createPushNotificationToken = useConvexMutation(
    api.notifications.mutation.createPushNotificationToken,
  )
  usePomoBackgroundTimer()

  useEffect(() => {
    const unsubscribe = listenForForegroundMessages((payload) => {
      toast.info(payload.title, { description: payload.body })
    })
    return () => unsubscribe()
  }, [])

  function requestPermission() {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        toast.success('Notification permission granted.')
        getMessagingToken()
          .then(async (token) => {
            console.log('Token:', token)
            await createPushNotificationToken({ token })
          })
          .catch(() => {
            toast.error('Failed to get notification token.')
          })
      } else {
        toast.error('Notification permission denied.')
      }
    })
  }

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
            <Button onClick={requestPermission}>
              <BellIcon className="w-4 h-4" />
              Enable Notifications
            </Button>
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
