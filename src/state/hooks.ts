import { useValue } from '@legendapp/state/react'
import { useCallback, useState } from 'react'
import { selectors } from './selectors'
import { useReplica } from './provider'
import type { ActionArgs } from './actions'
import type { Replica } from './model'

type Query = keyof typeof selectors
type Args<T extends Query> = Parameters<(typeof selectors)[T]>[1]
type Result<T extends Query> = ReturnType<(typeof selectors)[T]>
export function useLocalQuery<T extends Query>(
  name: T,
  args: Args<T>,
): Result<T>
export function useLocalQuery<T extends Query>(
  name: T,
  args: Args<T> | 'skip',
): Result<T> | undefined
export function useLocalQuery<T extends Query>(
  name: T,
  args: Args<T> | 'skip',
): Result<T> | undefined {
  const store = useReplica()
  return useValue(() => {
    store.clock$.get()
    return args === 'skip'
      ? undefined
      : (selectors[name] as (r: Replica, a: Args<T>) => Result<T>)(
          store.records$.get(),
          args,
        )
  })
}
type PageQuery = {
  [K in Query]: Result<K> extends Array<unknown> ? K : never
}[Query]
export function useLocalPage<T extends PageQuery>(
  name: T,
  args: Args<T>,
  options: { initialNumItems: number },
) {
  const items = useLocalQuery(name, args) as Result<T> & Array<unknown>
  const key = JSON.stringify([name, args])
  const [page, setPage] = useState({ key, count: options.initialNumItems })
  const count = page.key === key ? page.count : options.initialNumItems
  return {
    results: items.slice(0, count) as Result<T>,
    status: (items.length > count ? 'CanLoadMore' : 'Exhausted') as
      | 'LoadingFirstPage'
      | 'LoadingMore'
      | 'CanLoadMore'
      | 'Exhausted',
    isLoading: false,
    loadMore: (n: number) => setPage({ key, count: count + n }),
  }
}
export function useLocalMutation<T extends keyof ActionArgs>(name: T) {
  const store = useReplica()
  return useCallback(
    (args: ActionArgs[T]) => store.act(name, args),
    [store, name],
  )
}
