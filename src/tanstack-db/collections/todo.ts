import { QueryClient } from '@tanstack/query-core'
import { createCollection } from '@tanstack/db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { ConvexHttpClient } from 'convex/browser'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { getToken } from '@/lib/auth-server'

const queryClient = new QueryClient()

export const pendingTodosCollection = (listId: Id<'lists'>) =>
  createCollection(
    queryCollectionOptions({
      queryKey: ['pending-todos'],
      queryFn: async () => {
        const token = await getToken()
        const client = new ConvexHttpClient(process.env.VITE_CONVEX_URL!, {
          auth: token,
        })

        const response = await client.query(api.todos.queries.GetPendingTodos, {
          listId: listId,
        })
        return response.todos
      },
      queryClient,
      getKey: (todo) => todo._id,
    }),
  )
