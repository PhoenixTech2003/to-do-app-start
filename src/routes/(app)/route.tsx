import { Outlet, createFileRoute } from '@tanstack/react-router'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app/dashboard/app-sidebar'
import { authClient } from '@/lib/auth-client'
import { ThemeSwitcher } from '@/components/ui/theme-switcher'

export const Route = createFileRoute('/(app)')({
  component: DashboardLayout,
})

export function DashboardLayout() {
  const { isPending, isRefetching, data } = authClient.useSession()
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
                <p className="text-sm sm:text-lg truncate">Welcome back, {data?.user.name}</p>
              )}
            </div>
            <ThemeSwitcher />
          </header>
          <div className="grid flex-1 gap-4 p-2 sm:p-4">
            <Outlet />
          </div>
        </SidebarInset>
      </main>
    </SidebarProvider>
  )
}
