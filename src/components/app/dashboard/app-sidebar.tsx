import { CheckCircleIcon, Home, Timer } from 'lucide-react'
import { Link, useLocation } from '@tanstack/react-router'
import { motion } from 'motion/react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const items = [
  { title: 'Workspaces', url: '/dashboard', icon: Home },
  { title: 'Today', url: '/today', icon: CheckCircleIcon },
  { title: 'Pomodoro', url: '/pomodoro', icon: Timer },
]

export function AppSidebar() {
  const location = useLocation()

  return (
    <Sidebar variant="inset" className="border-none">
      <SidebarHeader className="px-6 pt-8 pb-10">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Two<span className="text-primary">Do</span>
        </h1>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarGroup>
          <p className="px-3 mb-4 text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Navigation
          </p>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {items.map((item) => {
                const isActive = location.pathname.startsWith(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="relative group"
                    >
                      <Link
                        to={item.url}
                        className="flex items-center gap-3 py-2.5 px-3 rounded-md"
                      >
                        {isActive && (
                          <motion.div
                            layoutId="active-indicator"
                            className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-primary"
                            transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                          />
                        )}
                        <item.icon
                          className={`h-4 w-4 ${isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'} transition-colors`}
                        />
                        <span
                          className={`text-sm ${isActive ? 'font-semibold text-foreground' : 'text-muted-foreground group-hover:text-foreground'} transition-colors`}
                        >
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
