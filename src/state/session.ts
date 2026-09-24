import { observable, syncState, when } from '@legendapp/state'
import { synced } from '@legendapp/state/sync'
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage'
import { useValue } from '@legendapp/state/react'

const session$ = observable(
  synced<{ userId: string | null }>({
    initial: { userId: null },
    persist: {
      name: 'twodo-session-v1',
      plugin: ObservablePersistLocalStorage,
    },
  }),
)
const persistence$ = syncState(session$)

export function useLocalUserId() {
  return useValue(session$.userId)
}

export async function setLocalUserId(userId: string | null) {
  session$.get()
  await when(persistence$.isPersistLoaded)
  session$.userId.set(userId)
}

export async function getLocalUserId() {
  session$.get()
  await when(persistence$.isPersistLoaded)
  return session$.userId.peek()
}
