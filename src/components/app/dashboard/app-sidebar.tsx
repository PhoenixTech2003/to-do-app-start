import { CheckCircleIcon, Flame, Home, Inbox } from 'lucide-react'
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
} from '@/components/ui/sidebar'
import { BetaBadge } from '@/components/ui/beta-badge'

const appNavItems = [
  { title: 'Workspaces', url: '/dashboard', icon: Home },
  { title: 'Inbox', url: '/inbox', icon: Inbox },
  { title: 'Today', url: '/today', icon: CheckCircleIcon },
  { title: 'Habits', url: '/habits', icon: Flame },
] satisfies Array<NavItem>

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
        className="flex items-center gap-3 py-2.5 px-3 rounded-md transition-colors duration-[var(--dur-2)] ease-[var(--ease-standard)]"
      >
        {/* The same spine that marks priority on a todo marks position in the
            nav: one device, one meaning — "this is the live one". */}
        {isActive && (
          <motion.span
            layoutId="active-indicator"
            className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-linear-to-b from-primary to-primary/50"
            transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
          />
        )}
        <item.icon
          className={`h-4 w-4 shrink-0 transition-colors duration-[var(--dur-2)] ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}
        />
        <span
          className={`text-sm truncate transition-colors duration-[var(--dur-2)] ${isActive ? 'font-semibold text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}
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
    <Sidebar variant="inset" collapsible="icon" className="border-none">
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
          <SidebarGroupLabel className="px-3 label-meta text-muted-foreground/70">
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
      </SidebarContent>
    </Sidebar>
  )
}
