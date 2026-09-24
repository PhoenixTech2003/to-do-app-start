import type { Infer } from 'convex/values'
import type { recordValidator } from '../../convex/sync/validators'

export type RecordData = Infer<typeof recordValidator>
export type Kind = RecordData['kind']
export const kinds: Array<Kind> = [
  'workspace',
  'lists',
  'todos',
  'subTasks',
  'habits',
  'habitCompletions',
]
export type Replica = Partial<Record<string, RecordData>>
export const allRecords = (records: Replica): Array<RecordData> =>
  Object.values(records).filter((record): record is RecordData => !!record)
export const parentField: Partial<
  Record<Kind, 'workspaceId' | 'listId' | 'todoId' | 'habitId'>
> = {
  lists: 'workspaceId',
  todos: 'listId',
  subTasks: 'todoId',
  habitCompletions: 'habitId',
} as const
export function parentId(record: RecordData) {
  const field = parentField[record.kind]
  return field ? record[field] : undefined
}
export function isLive(records: Replica, record: RecordData): boolean {
  if (record.deleted) return false
  const parent = parentId(record)
  return !parent || (!!records[parent] && isLive(records, records[parent]))
}
