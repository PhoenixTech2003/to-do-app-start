import { useEffect } from 'react'
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouteContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { initTabSafeTimers } from '@vorthain/tab-safe-timers'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { createServerFn } from '@tanstack/react-start'
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react'

import { hotkeysDevtoolsPlugin } from '@tanstack/react-hotkeys-devtools'
import appCss from '../styles.css?url'
import type { ConvexQueryClient } from '@convex-dev/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { authClient } from '@/lib/auth-client'
import { getToken } from '@/lib/auth-server'

const getAuth = createServerFn({ method: 'GET' }).handler(async () => {
  return await getToken()
})

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
  convexQueryClient: ConvexQueryClient
}>()({
  head: () => ({
    scripts: [
      {
        src: 'https://feedlab.cloud/widget/166e4296-875c-4178-b528-83133f6a81fc.js',
      },
    ],
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TwoDo',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        type: 'image/png',
        href: '/favicon.png',
      },
    ],
  }),
  beforeLoad: async (ctx) => {
    const token = await ctx.context.queryClient.ensureQueryData({
      queryKey: ['auth', 'token'],
      queryFn: async () => (await getAuth()) ?? null,
      staleTime: 60_000,
      revalidateIfStale: true,
    })
    // all queries, mutations and actions through TanStack Query will be
    // authenticated during SSR if we have a valid token
    if (token) {
      // During SSR only (the only time serverHttpClient exists),
      // set the auth token to make HTTP queries with.
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(token)
    }
    return {
      isAuthenticated: !!token,
      token,
    }
  },
  component: RootComponent,
})

function RootComponent() {
  const context = useRouteContext({ from: Route.id })

  useEffect(() => {
    try {
      initTabSafeTimers()
    } catch {
      // Tab-safe timers not available (e.g. worker unsupported); native timers used
    }
  }, [])

  return (
    <ConvexBetterAuthProvider
      client={context.convexQueryClient.convexClient}
      authClient={authClient}
      initialToken={context.token}
    >
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <RootDocument>
          <Outlet />
        </RootDocument>
      </ThemeProvider>
    </ConvexBetterAuthProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            hotkeysDevtoolsPlugin(),
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Toaster richColors position="top-center" />
        <Scripts />
      </body>
    </html>
  )
}
