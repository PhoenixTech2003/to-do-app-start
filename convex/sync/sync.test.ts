import { describe, expect, it, vi } from 'vitest'
import { convexTest } from 'convex-test'
import schema from '../schema'
import { api } from '../_generated/api'
import type { QueryCtx } from '../_generated/server'
import type { Kind, SyncRecord } from './model'

vi.mock('../auth', () => ({
  authComponent: {
    getAuthUser: async (ctx: QueryCtx) => {
      const identity = await ctx.auth.getUserIdentity()
      if (!identity) throw new Error('Unauthenticated')
      return { _id: identity.subject }
    },
    safeGetAuthUser: async (ctx: QueryCtx) => {
      const identity = await ctx.auth.getUserIdentity()
      return identity ? { _id: identity.subject } : null
    },
  },
}))
const modules = import.meta.glob('/convex/**/*.*s')
function setup() {
  const t = convexTest(schema, modules)
  const user = t.withIdentity({ subject: 'owner' })
  const write = (
    kind: Kind,
    id: string,
    fields: Partial<SyncRecord>,
    writeId: string = crypto.randomUUID(),
  ) =>
    user.mutation(api.sync.mutations.write, {
      kind,
      id,
      fields,
      writeId,
      createdAt: Date.now(),
    })
  return { t, user, write }
}
describe('sync protocol', () => {
  it('preserves unrelated edits, clears nullable fields, and deduplicates retries', async () => {
    const { user, write } = setup()
    await write('workspace', 'workspace-one', { title: 'Workspace' })
    await write('lists', 'list-one', {
      title: 'List',
      workspaceId: 'workspace-one',
    })
    await write('todos', 'todo-one', {
      title: 'Task',
      listId: 'list-one',
      description: 'Details',
      status: 'pending',
      priority: 'none',
    })
    await write('todos', 'todo-one', { status: 'completed' }, 'status-write')
    await write('todos', 'todo-one', { title: 'New title' })
    await write('todos', 'todo-one', { status: 'pending' })
    const repeated = await write(
      'todos',
      'todo-one',
      { status: 'completed' },
      'status-write',
    )
    expect(repeated.status).toBe('pending')
    expect(repeated.title).toBe('New title')
    const moved = await write('todos', 'todo-one', {
      listId: null,
      description: null,
    })
    expect(moved.listId).toBeNull()
    expect(moved.description).toBeNull()
    expect(await user.query(api.sync.queries.head, {})).toBe(7)
  })
  it('enforces ownership and permanent deletion, including writes under deleted parents', async () => {
    const { t, write } = setup()
    const parent = await write('workspace', 'workspace-one', {
      title: 'Workspace',
    })
    await expect(
      t.withIdentity({ subject: 'other' }).mutation(api.sync.mutations.write, {
        kind: 'lists',
        id: 'foreign-list',
        writeId: 'foreign-write',
        createdAt: 1,
        fields: { title: 'Forbidden', workspaceId: parent.id },
      }),
    ).rejects.toThrow('Parent has not synced yet')
    await write('workspace', parent.id, { deleted: true })
    const child = await write('lists', 'list-one', {
      title: 'Offline child',
      workspaceId: parent.id,
    })
    expect(child.deleted).toBe(true)
    expect(
      (await write('workspace', parent.id, { deleted: false, title: 'Revive' }))
        .deleted,
    ).toBe(true)
  })
  it('gives existing and new habit completions one stable identity', async () => {
    const { t, user, write } = setup()
    const habit = await write('habits', 'habit-one', {
      title: 'Walk',
      frequency: 'daily',
      category: 'health',
    })
    await t.run(async (ctx) => {
      await ctx.db.insert('habitCompletions', {
        habitId: ctx.db.normalizeId('habits', habit.remoteId)!,
        createdBy: 'owner',
        completedDate: '2026-09-24',
      })
    })
    const id = 'completion:habit-one:2026-09-24'
    const off = await write('habitCompletions', id, { deleted: true })
    expect(off.id).toBe(id)
    const on = await write('habitCompletions', id, { deleted: false })
    expect(on.deleted).toBe(false)
    const list = await user.query(api.sync.queries.list, {
      kind: 'habitCompletions',
      paginationOpts: { numItems: 100, cursor: null },
    })
    expect(list.page).toHaveLength(1)
  })
})
