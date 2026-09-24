import { batch, observable, syncState, when } from '@legendapp/state'
import { synced } from '@legendapp/state/sync'
import { syncedCrud } from '@legendapp/state/sync-plugins/crud'
import { observablePersistIndexedDB } from '@legendapp/state/persist-plugins/indexeddb'
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage'
import { ConvexError } from 'convex/values'
import { api } from '../../convex/_generated/api'
import { kinds, parentId } from './model'
import { changesFor } from './actions'
import type { Observable } from '@legendapp/state'
import type { SyncedSetParams } from '@legendapp/state/sync'
import type { ConvexReactClient } from 'convex/react'
import type { ActionArgs } from './actions'
import type { RecordData, Replica } from './model'

type Intent = { token: string; fields: Partial<RecordData>; record: RecordData }
const persistence = observablePersistIndexedDB({
  databaseName: 'twodo-replica',
  version: 1,
  tableNames: ['records'],
})
export function createReplica(client: ConvexReactClient, userId: string) {
  const ready$ = observable(false)
  const clock$ = observable(Date.now())
  const booted$ = observable(false)
  const remoteIds$ = observable<Record<string, string>>({})
  const errors$ = observable<Record<string, string>>({})
  const intents$ = observable(
    synced<Partial<Record<string, Array<Intent>>>>({
      initial: {},
      persist: {
        name: `twodo-intents-${userId}`,
        plugin: ObservablePersistLocalStorage,
      },
    }),
  )
  const intentSync$ = syncState(intents$)
  const writes = new Map<string, Promise<unknown>>()
  async function save(
    input: Partial<RecordData>,
    params: SyncedSetParams<RecordData>,
  ): Promise<RecordData> {
    const id = input.id!
    const previous = writes.get(id) ?? Promise.resolve()
    const next = previous
      .catch(() => {})
      .then(async () => {
        await when(ready$)
        const row = records$[id].peek()
        if (!row) throw new Error('Missing local record')
        const intents = [...(intents$[id].peek() ?? [])]
        const fields = Object.assign(
          {},
          ...intents.map((intent) => intent.fields),
        )
        if (!intents.length) return row
        const writeId = intents[intents.length - 1].token
        let timer: ReturnType<typeof setTimeout> | undefined
        try {
          const saved = await Promise.race([
            client.mutation(api.sync.mutations.write, {
              id,
              kind: row.kind,
              createdAt: row.createdAt,
              writeId,
              fields,
            }),
            new Promise<never>((_, reject) => {
              timer = setTimeout(
                () => reject(new Error('Sync timed out; retrying')),
                15_000,
              )
            }),
          ])
          remoteIds$[id].set(saved.remoteId)
          const tokens = new Set(intents.map((intent) => intent.token))
          const remaining = (intents$[id].peek() ?? []).filter(
            (intent) => !tokens.has(intent.token),
          )
          if (remaining.length) intents$[id].set(remaining)
          else intents$[id].delete()
          errors$[id].delete()
          return { ...saved, writeId: input.writeId ?? saved.writeId }
        } catch (error) {
          if (error instanceof ConvexError) {
            params.cancelRetry = true
            errors$[id].set(String(error.data))
          }
          throw error
        } finally {
          clearTimeout(timer)
        }
      })
    writes.set(id, next)
    try {
      return await next
    } finally {
      if (writes.get(id) === next) writes.delete(id)
    }
  }
  const records$: Observable<Replica> = observable(
    syncedCrud<RecordData>({
      initial: {},
      as: 'object',
      mode: 'assign',
      updatePartial: false,
      persist: {
        name: 'records',
        plugin: persistence,
        indexedDB: { prefixID: userId },
        retrySync: true,
      },
      retry: {
        infinite: true,
        backoff: 'exponential',
        delay: 1000,
        maxDelay: 30_000,
      },
      debounceSet: 100,
      onError: (error, params) => {
        if (params.source === 'get') errors$.remote.set(error.message)
      },
      waitFor: () => ready$.get() && booted$.get(),
      waitForSet:
        ({ value }) =>
        () => {
          if (!ready$.get() || !booted$.get()) return false
          const parent = parentId(value)
          return (
            !parent ||
            !!remoteIds$[parent].get() ||
            !!records$[parent].remoteId.get()
          )
        },
      list: async (): Promise<Array<RecordData>> => {
        await when(ready$)
        const rows: Array<RecordData> = []
        for (const kind of kinds) {
          let cursor: string | null = null
          do {
            const result: {
              page: Array<RecordData>
              isDone: boolean
              continueCursor: string
            } = await client.query(api.sync.queries.list, {
              kind,
              paginationOpts: { cursor, numItems: 100 },
            })
            rows.push(...result.page)
            cursor = result.isDone ? null : result.continueCursor
          } while (cursor)
        }
        errors$.remote.delete()
        const current = records$.peek()
        return rows.map((row) => {
          const pending = intents$[row.id].peek() ?? []
          if (
            row.kind !== 'habitCompletions' &&
            (row.deleted || current[row.id]?.deleted)
          )
            return { ...row, deleted: true }
          return Object.assign(
            {},
            row,
            ...pending.map((intent) => intent.fields),
          )
        })
      },
      create: save,
      update: save,
    }),
  )
  const state$ = syncState(records$)
  records$.get()
  intents$.get()
  const hydrated = when(
    () => state$.isPersistLoaded.get() && intentSync$.isPersistLoaded.get(),
  ).then(() => {
    batch(() => {
      for (const [id, pending] of Object.entries(intents$.peek())) {
        if (!pending?.length) continue
        const latest = pending[pending.length - 1]
        records$[id].set({
          ...latest.record,
          ...records$[id].peek(),
          ...Object.assign({}, ...pending.map((intent) => intent.fields)),
          writeId: latest.token,
        })
      }
    })
    booted$.set(true)
  })
  return {
    userId,
    clock$,
    hydrated,
    records$,
    ready$,
    state$,
    errors$,
    intentSync$,
    async act<T extends keyof ActionArgs>(action: T, args: ActionArgs[T]) {
      await hydrated
      const changes = changesFor(records$.peek(), action, args)
      batch(() => {
        for (const change of changes) {
          const token = crypto.randomUUID()
          const fields = Object.fromEntries(
            Object.entries(change.fields as Record<string, unknown>).filter(
              ([, value]) => value !== undefined,
            ),
          )
          const current = records$[change.id].peek()
          const record: RecordData = {
            ...(current ?? {
              id: change.id,
              kind: change.kind,
              remoteId: '',
              createdBy: userId,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              deleted: false,
            }),
            ...fields,
            writeId: token,
          }
          const pending = intents$[change.id].peek() ?? []
          intents$[change.id].set(
            writes.has(change.id)
              ? [...pending, { token, fields, record }]
              : [
                  {
                    token,
                    fields: Object.assign(
                      {},
                      ...pending.map((intent) => intent.fields),
                      fields,
                    ),
                    record,
                  },
                ],
          )
          records$[change.id].set(record)
        }
      })
    },
    refresh() {
      if (ready$.peek()) void state$.sync()
    },
    retry() {
      errors$.set({})
      for (const [id, intents] of Object.entries(intents$.peek())) {
        if (intents?.length && records$[id].peek())
          records$[id].writeId.set(crypto.randomUUID())
      }
      if (ready$.peek()) void state$.sync()
    },
    dispose() {
      ready$.set(false)
    },
  }
}
export type AppReplica = ReturnType<typeof createReplica>
