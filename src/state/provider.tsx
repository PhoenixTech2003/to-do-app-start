import { createContext, useContext, useEffect, useState } from 'react'
import { useValue } from '@legendapp/state/react'
import { useConvex, useConvexAuth } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { setLocalUserId, useLocalUserId } from './session'
import { createReplica } from './replica'
import type { AppReplica } from './replica'
import type { ReactNode } from 'react'
import { authClient } from '@/lib/auth-client'

export type SyncStatus =
  | 'offline'
  | 'signed-out'
  | 'syncing'
  | 'loading'
  | 'synced'

const Context = createContext<AppReplica | null>(null)
const StatusContext = createContext<SyncStatus>('synced')
export const useSyncStatus = () => useContext(StatusContext)
export function useReplica() {
  const store = useContext(Context)
  if (!store) throw new Error('The local replica is not ready')
  return store
}
export function ReplicaProvider({ children }: { children: ReactNode }) {
  const { data } = authClient.useSession()
  const userId = useLocalUserId()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  useEffect(() => {
    if (data?.user.id) void setLocalUserId(data.user.id)
  }, [data?.user.id])
  if (!mounted || !userId || (data?.user.id && data.user.id !== userId))
    return <Loading />
  return (
    <UserReplica key={userId} userId={userId}>
      {children}
    </UserReplica>
  )
}
function Loading() {
  return (
    <div className="p-8 text-sm text-muted-foreground" role="status">
      Opening your local workspace…
    </div>
  )
}
function UserReplica({
  userId,
  children,
}: {
  userId: string
  children: ReactNode
}) {
  const client = useConvex()
  const { isAuthenticated } = useConvexAuth()
  const { data } = authClient.useSession()
  const [online, setOnline] = useState(navigator.onLine)
  const [store] = useState(() => createReplica(client, userId))
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])
  useEffect(() => {
    const ready = online && isAuthenticated && data?.user.id === userId
    store.ready$.set(ready)
    if (!ready) return
    const refresh = () => store.refresh()
    const watch = client.watchQuery(api.sync.queries.head, {})
    const unsubscribe = watch.onUpdate(refresh)
    refresh()
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      store.ready$.set(false)
      unsubscribe()
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [client, store, userId, online, isAuthenticated, data?.user.id])
  useEffect(() => {
    const timer = setInterval(() => store.clock$.set(Date.now()), 30_000)
    return () => {
      clearInterval(timer)
      store.dispose()
    }
  }, [store])
  const persisted = useValue(
    () =>
      store.state$.isPersistLoaded.get() &&
      store.intentSync$.isPersistLoaded.get(),
  )
  const loaded = useValue(
    () =>
      store.state$.isLoaded.get() ||
      Object.keys(store.records$.get()).length > 0,
  )
  const errors = useValue(store.errors$)
  const pending = useValue(
    () =>
      (store.state$.numPendingSets.get() ?? 0) > 0 ||
      Object.keys(store.state$.getPendingChanges() ?? {}).length > 0,
  )
  const status: SyncStatus = !online
    ? 'offline'
    : !isAuthenticated
      ? 'signed-out'
      : pending
        ? 'syncing'
        : !loaded
          ? 'loading'
          : 'synced'
  if (!persisted) return <Loading />
  return (
    <Context.Provider value={store}>
      <StatusContext.Provider value={status}>
        {Object.keys(errors).length > 0 && (
          <div className="border-b p-3 text-sm text-destructive" role="alert">
            Changes are saved locally. Sync needs attention:{' '}
            {Object.values(errors)[0]}{' '}
            <button className="underline" onClick={() => store.retry()}>
              Retry sync
            </button>
          </div>
        )}
        {children}
      </StatusContext.Provider>
    </Context.Provider>
  )
}
