import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { ConvexQueryClient } from '@convex-dev/react-query'
import { QueryClient, notifyManager } from '@tanstack/react-query'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instance
export const getRouter = () => {
  if (typeof document !== 'undefined') {
    notifyManager.setScheduler(window.requestAnimationFrame)
  }
  const convexUrl = (import.meta as any).env.VITE_CONVEX_URL!
  if (!convexUrl) {
    throw new Error('VITE_CONVEX_URL is not set')
  }

  const convexQueryClient = new ConvexQueryClient(convexUrl, {
    expectAuth: true,
  })
  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
      },
    },
  })
  convexQueryClient.connect(queryClient)
  const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
    context: { queryClient, convexQueryClient },
    defaultErrorComponent: (err) => <p>{err.error.stack}</p>,
    defaultNotFoundComponent: () => <p>not found</p>,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  })
  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  })
  return router
}
