import {
  CheckCircleIcon,
  Home,
  MessageCircle,
  PuzzleIcon,
  Timer,
} from 'lucide-react'
import { Link, useLocation } from '@tanstack/react-router'
import { motion } from 'motion/react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { BetaBadge } from '@/components/ui/beta-badge'

const appNavItems = [
  { title: 'Workspaces', url: '/dashboard', icon: Home },
  { title: 'Today', url: '/today', icon: CheckCircleIcon },
  { title: 'Pomodoro', url: '/pomodoro', icon: Timer },
  { title: 'Chat', url: '/chat', icon: MessageCircle, beta: true },
] satisfies NavItem[]

const settingsNavItems = [
  { title: 'Integrations', url: '/integrations', icon: PuzzleIcon },
] satisfies NavItem[]

type NavItem = {
  title: string
  url: string
  icon: typeof Home
  beta?: boolean
}

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <SidebarMenuButton
      asChild
      isActive={isActive}
      tooltip={item.title}
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
          className={`h-4 w-4 shrink-0 ${isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'} transition-colors`}
        />
        <span
          className={`text-sm truncate ${isActive ? 'font-semibold text-foreground' : 'text-muted-foreground group-hover:text-foreground'} transition-colors`}
        >
          {item.title}
        </span>
        {item.beta && <BetaBadge className="ml-auto" />}
      </Link>
    </SidebarMenuButton>
  )
}

export function AppSidebar() {
  const location = useLocation()

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="border-none"
    >
      <SidebarHeader className="px-5 pt-8 pb-6 group-data-[collapsible=icon]:hidden group-data-[collapsible=icon]:py-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Two<span className="text-primary">Do</span>
          </h1>
          <BetaBadge className="translate-y-px" />
        </div>
      </SidebarHeader>

      <SidebarContent className="flex flex-col gap-1 px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            App
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {appNavItems.map((item) => {
                const isActive = location.pathname.startsWith(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <NavLink item={item} isActive={isActive} />
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-2 opacity-60" />

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Settings
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {settingsNavItems.map((item) => {
                const isActive = location.pathname.startsWith(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <NavLink item={item} isActive={isActive} />
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
