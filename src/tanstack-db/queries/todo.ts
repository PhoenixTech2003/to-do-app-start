import { pendingTodosCollection } from '../collections/todo'
import type { InitialQueryBuilder } from '@tanstack/db'
import type { Id } from 'convex/_generated/dataModel'

export const getPendingTodos = (q: InitialQueryBuilder, listId: Id<'lists'>) =>
  q.from({ pendingTodos: pendingTodosCollection(listId) })
