// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { describe, expect, it, vi } from 'vitest'
import { createReplica } from './replica'
import type { ConvexReactClient } from 'convex/react'
import type { RecordData } from './model'

function server() {
  const rows = new Map<string, RecordData>()
  const mutation = vi.fn((_fn, args) => {
    const row = {
      ...(rows.get(args.id) ?? {
        id: args.id,
        kind: args.kind,
        createdAt: args.createdAt,
        createdBy: 'owner',
        deleted: false,
      }),
      ...args.fields,
      remoteId: args.id,
      updatedAt: Date.now(),
      writeId: args.writeId,
    } as RecordData
    rows.set(args.id, row)
    return Promise.resolve(row)
  })
  const client = {
    mutation,
    query: vi.fn((_fn, args) =>
      Promise.resolve({
        page: [...rows.values()].filter((r) => r.kind === args.kind),
        isDone: true,
        continueCursor: '',
      }),
    ),
  } as unknown as ConvexReactClient
  return { client, mutation, rows }
}
const pause = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))
async function eventually(test: () => void) {
  await vi.waitFor(test, { timeout: 5000, interval: 25 })
}
describe('durable local replica', () => {
  it('creates every entity offline, restores after reload, and syncs parents first', async () => {
    const remote = server()
    const owner = crypto.randomUUID()
    const first = createReplica(remote.client, owner)
    await first.hydrated
    await first.act('createWorkspace', { title: 'Offline workspace' })
    const workspace = Object.values(first.records$.peek())[0]!
    await first.act('createList', { title: 'List', workspaceId: workspace.id })
    const list = Object.values(first.records$.peek()).find(
      (r) => r?.kind === 'lists',
    )!
    await first.act('createTodo', { title: 'Task', listId: list.id })
    const todo = Object.values(first.records$.peek()).find(
      (r) => r?.kind === 'todos',
    )!
    await first.act('addSubTask', { title: 'Part', todoId: todo.id })
    await first.act('createHabit', {
      title: 'Habit',
      category: 'health',
      frequency: 'daily',
    })
    const habit = Object.values(first.records$.peek()).find(
      (r) => r?.kind === 'habits',
    )!
    await first.act('toggleHabitCompletion', {
      habitId: habit.id,
      date: '2026-09-24',
      completed: true,
    })
    expect(remote.mutation).not.toHaveBeenCalled()
    await pause()
    first.dispose()
    const second = createReplica(remote.client, owner)
    await second.hydrated
    expect(Object.values(second.records$.peek())).toHaveLength(6)
    second.ready$.set(true)
    await eventually(() => expect(remote.rows.size).toBe(6))
    const calls = remote.mutation.mock.calls.map(([, a]) => a.kind)
    expect(calls.indexOf('workspace')).toBeLessThan(calls.indexOf('lists'))
    expect(calls.indexOf('lists')).toBeLessThan(calls.indexOf('todos'))
    expect(calls.indexOf('todos')).toBeLessThan(calls.indexOf('subTasks'))
    expect(calls.indexOf('habits')).toBeLessThan(
      calls.indexOf('habitCompletions'),
    )
    second.dispose()
  })
  it('isolates local records by account and merges remote fields with offline edits', async () => {
    const remote = server()
    const store = createReplica(remote.client, crypto.randomUUID())
    await store.hydrated
    await store.act('createTodo', { title: 'Initial' })
    store.ready$.set(true)
    await eventually(() => expect(remote.rows.size).toBe(1))
    await pause()
    const row = [...remote.rows.values()][0]
    store.ready$.set(false)
    await store.act('toggleTodoStatus', { todoId: row.id, status: 'completed' })
    remote.rows.set(row.id, { ...row, title: 'Edited elsewhere' })
    store.ready$.set(true)
    await store.state$.sync()
    await eventually(() =>
      expect(store.records$[row.id].title.peek()).toBe('Edited elsewhere'),
    )
    expect(store.records$[row.id].status.peek()).toBe('completed')
    const other = createReplica(remote.client, crypto.randomUUID())
    await other.hydrated
    expect(Object.keys(other.records$.peek())).toHaveLength(0)
    store.dispose()
    other.dispose()
  })
  it('retains a newer local edit when an older save resolves', async () => {
    const remote = server()
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const original = remote.mutation.getMockImplementation()!
    remote.mutation.mockImplementationOnce(async (fn, args) => {
      await gate
      return original(fn, args)
    })
    const store = createReplica(remote.client, crypto.randomUUID())
    await store.hydrated
    await store.act('createWorkspace', { title: 'First' })
    const row = Object.values(store.records$.peek())[0]!
    store.ready$.set(true)
    await eventually(() => expect(remote.mutation).toHaveBeenCalledTimes(1))
    await store.act('updateWorkspaceDetails', {
      workspaceId: row.id,
      title: 'Newer',
    })
    release()
    await eventually(() => expect(remote.rows.get(row.id)?.title).toBe('Newer'))
    expect(store.records$[row.id].title.peek()).toBe('Newer')
    store.dispose()
  })
  it('ignores a pull snapshot taken before a local write was acknowledged', async () => {
    const remote = server()
    const store = createReplica(remote.client, crypto.randomUUID())
    await store.hydrated
    await store.act('createTodo', { title: 'Task' })
    store.ready$.set(true)
    await eventually(() => expect(remote.rows.size).toBe(1))
    await pause()
    const row = [...remote.rows.values()][0]
    const stale = { ...row }
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const query = remote.client.query as ReturnType<typeof vi.fn>
    const live = query.getMockImplementation()!
    query.mockImplementation(async (fn, args) => {
      if (args.kind !== 'todos') return live(fn, args)
      query.mockImplementation(live)
      await gate
      return { page: [stale], isDone: true, continueCursor: '' }
    })
    const pull = store.state$.sync()
    await store.act('toggleTodoStatus', { todoId: row.id, status: 'completed' })
    await eventually(() =>
      expect(remote.rows.get(row.id)?.status).toBe('completed'),
    )
    await pause()
    release()
    await pull
    await pause()
    expect(store.records$[row.id].status.peek()).toBe('completed')
    store.dispose()
  })
})
