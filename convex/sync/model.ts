import { ConvexError } from 'convex/values'
import type { kindValidator, recordValidator } from './validators'
import type { Infer } from 'convex/values'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import type { Doc } from '../_generated/dataModel'

export type Kind = Infer<typeof kindValidator>
export type SyncRecord = Infer<typeof recordValidator>
export const kinds: Array<Kind> = [
  'workspace',
  'lists',
  'todos',
  'subTasks',
  'habits',
  'habitCompletions',
]
export const allowed: Record<Kind, Array<string>> = {
  workspace: ['title'],
  lists: ['title', 'workspaceId'],
  todos: [
    'title',
    'description',
    'listId',
    'status',
    'priority',
    'dueDate',
    'dueTime',
    'recurrence',
    'recurrenceIndex',
    'seriesId',
    'timeZone',
  ],
  subTasks: [
    'title',
    'description',
    'todoId',
    'completed',
    'dueDate',
    'dueTime',
  ],
  habits: ['title', 'description', 'frequency', 'category'],
  habitCompletions: ['habitId', 'completedDate'],
}
export const parents: Partial<Record<Kind, readonly [string, Kind]>> = {
  lists: ['workspaceId', 'workspace'],
  todos: ['listId', 'lists'],
  subTasks: ['todoId', 'todos'],
  habitCompletions: ['habitId', 'habits'],
} as const

export async function find(
  ctx: QueryCtx,
  kind: Kind,
  owner: string,
  id: string,
): Promise<Doc<Kind> | null> {
  if (kind === 'habitCompletions' && id.startsWith('completion:')) {
    const date = id.slice(-10)
    const habit = await find(ctx, 'habits', owner, id.slice(11, -11))
    if (!habit) return null
    return ctx.db
      .query('habitCompletions')
      .withIndex('by_habitId_date', (q) =>
        q
          .eq('habitId', habit._id as Doc<'habits'>['_id'])
          .eq('completedDate', date),
      )
      .unique()
  }
  const native = ctx.db.normalizeId(kind, id)
  const row = native
    ? await ctx.db.get(native)
    : await ctx.db
        .query(kind)
        .withIndex('sync_client', (q) =>
          q.eq('createdBy', owner).eq('clientId', id),
        )
        .unique()
  return row?.createdBy === owner ? row : null
}
export async function record(
  ctx: QueryCtx,
  kind: Kind,
  row: Doc<Kind>,
): Promise<SyncRecord> {
  const data = row as unknown as Record<string, unknown>
  const value: Record<string, unknown> = {
    id: row.clientId ?? row._id,
    remoteId: row._id,
    kind,
    createdBy: row.createdBy,
    createdAt: row.localCreatedAt ?? row._creationTime,
    updatedAt: row.updatedAt ?? row._creationTime,
    deleted: row.deleted ?? false,
    writeId: row.lastWriteId ?? '',
  }
  for (const field of allowed[kind])
    if (data[field] !== undefined) value[field] = data[field]
  const relation = parents[kind]
  if (relation && data[relation[0]]) {
    const id = ctx.db.normalizeId(relation[1], data[relation[0]] as string)
    const parent = id ? await ctx.db.get(id) : null
    value[relation[0]] = parent?.clientId ?? data[relation[0]]
  }
  for (const field of [
    'description',
    'listId',
    'dueDate',
    'dueTime',
    'recurrence',
    'recurrenceIndex',
  ]) {
    if (allowed[kind].includes(field) && value[field] === undefined)
      value[field] = null
  }
  if (kind === 'habitCompletions')
    value.id = `completion:${value.habitId}:${value.completedDate}`
  return value as SyncRecord
}
export async function deletedAncestor(
  ctx: QueryCtx,
  kind: Kind,
  row: Doc<Kind>,
): Promise<boolean> {
  if (row.deleted) return true
  const relation = parents[kind]
  if (!relation) return false
  const parentId = (row as unknown as Record<string, unknown>)[relation[0]] as
    | string
    | undefined
  if (!parentId) return false
  const parent = await find(ctx, relation[1], row.createdBy, parentId)
  return !parent || deletedAncestor(ctx, relation[1], parent)
}
export function validate(
  kind: Kind,
  fields: Record<string, unknown>,
  creating: boolean,
) {
  for (const field of Object.keys(fields)) {
    if (field !== 'deleted' && !allowed[kind].includes(field))
      throw new ConvexError(`Invalid ${kind} field: ${field}`)
  }
  if (
    'title' in fields &&
    (typeof fields.title !== 'string' ||
      !fields.title.trim() ||
      fields.title.length > 1000)
  )
    throw new ConvexError('Enter a title between 1 and 1000 characters')
  if (creating) {
    const required =
      kind === 'habitCompletions' ? ['habitId', 'completedDate'] : ['title']
    if (kind === 'lists') required.push('workspaceId')
    if (kind === 'subTasks') required.push('todoId', 'completed')
    if (kind === 'todos') required.push('status', 'priority')
    if (kind === 'habits') required.push('frequency', 'category')
    for (const field of required)
      if (fields[field] === undefined || fields[field] === null)
        throw new ConvexError(`Missing ${field}`)
  }
  if (fields.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(String(fields.dueDate)))
    throw new ConvexError('Invalid due date')
  if (
    fields.completedDate &&
    !/^\d{4}-\d{2}-\d{2}$/.test(String(fields.completedDate))
  )
    throw new ConvexError('Invalid completion date')
}
export async function receipt(
  ctx: MutationCtx,
  owner: string,
  writeId: string,
) {
  return await ctx.db
    .query('syncReceipts')
    .withIndex('by_owner_write', (q) =>
      q.eq('createdBy', owner).eq('writeId', writeId),
    )
    .unique()
}

export async function bumpHead(ctx: MutationCtx, createdBy: string) {
  const head = await ctx.db
    .query('syncHeads')
    .withIndex('by_owner', (q) => q.eq('createdBy', createdBy))
    .unique()
  if (head) await ctx.db.patch(head._id, { version: head.version + 1 })
  else await ctx.db.insert('syncHeads', { createdBy, version: 1 })
}
