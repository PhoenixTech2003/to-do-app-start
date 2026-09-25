import { ConvexError, v } from 'convex/values'
import { fromZonedTime } from 'date-fns-tz'
import { mutation } from '../_generated/server'
import { internal } from '../_generated/api'
import { authComponent } from '../auth'
import { kindValidator, patchValidator } from './validators'
import {
  bumpHead,
  deletedAncestor,
  find,
  parents,
  receipt,
  record,
  validate,
} from './model'

export const write = mutation({
  args: {
    id: v.string(),
    kind: kindValidator,
    writeId: v.string(),
    createdAt: v.number(),
    fields: patchValidator,
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    let row = await find(ctx, args.kind, user._id, args.id)
    if (await receipt(ctx, user._id, args.writeId)) {
      if (!row) throw new ConvexError('Record no longer exists')
      return record(ctx, args.kind, row)
    }
    if (row?.deleted && args.kind !== 'habitCompletions')
      return record(ctx, args.kind, row)
    validate(args.kind, args.fields, !row)
    const patch: Record<string, unknown> = {
      ...args.fields,
      updatedAt: Date.now(),
      lastWriteId: args.writeId,
    }
    const relation = parents[args.kind]
    let inheritedDelete = false
    if (relation) {
      const current = row ? await record(ctx, args.kind, row) : null
      const parentId = relation[0] in args.fields
        ? (args.fields as Record<string, unknown>)[relation[0]]
        : (current as Record<string, unknown> | null)?.[relation[0]]
      if (parentId) {
        const parent = await find(
          ctx,
          relation[1],
          user._id,
          parentId as string,
        )
        if (!parent) throw new ConvexError('Parent has not synced yet')
        patch[relation[0]] = parent._id
        inheritedDelete = await deletedAncestor(ctx, relation[1], parent)
      }
    }
    if (inheritedDelete) patch.deleted = true
    for (const field of Object.keys(patch))
      if (patch[field] === null) patch[field] = undefined
    if (!row) {
      if (args.id.length > 300 || args.id.length < 8)
        throw new ConvexError('Invalid local ID')
      // A completion has one stable identity per habit and calendar date.
      if (args.kind === 'habitCompletions') {
        const existing = await ctx.db
          .query('habitCompletions')
          .withIndex('by_habitId_date', (q) =>
            q
              .eq('habitId', patch.habitId as never)
              .eq('completedDate', patch.completedDate as string),
          )
          .unique()
        if (existing) row = existing
      }
    }
    if (row) {
      await ctx.db.patch(row._id, patch)
    } else {
      const id = await ctx.db.insert(args.kind, {
        ...patch,
        createdBy: user._id,
        clientId: args.id,
        localCreatedAt: args.createdAt,
        deleted: patch.deleted ?? false,
        ...(args.kind === 'habits'
          ? { currentStreak: 0, longestStreak: 0, totalCompletions: 0 }
          : {}),
      } as never)
      row = await ctx.db.get(id)
    }
    if (!row) throw new ConvexError('Unable to save record')
    if (args.kind === 'todos') {
      const todo = await ctx.db.get(ctx.db.normalizeId('todos', row._id)!)
      if (todo?.markAsOverdueScheudledFunctionId) {
        const job = await ctx.db.system.get(
          todo.markAsOverdueScheudledFunctionId,
        )
        if (job?.state.kind === 'pending')
          await ctx.scheduler.cancel(todo.markAsOverdueScheudledFunctionId)
      }
      let scheduled
      if (
        todo &&
        !todo.deleted &&
        todo.status === 'pending' &&
        todo.dueDate &&
        todo.dueTime &&
        todo.timeZone
      ) {
        const time =
          fromZonedTime(
            `${todo.dueDate}T${todo.dueTime}`,
            todo.timeZone,
          ).getTime() + 60_000
        if (Number.isFinite(time))
          scheduled = await ctx.scheduler.runAt(
            Math.max(Date.now(), time),
            internal.todos.mutations.ToggleTodoStatusOverdue,
            { todoId: todo._id },
          )
      }
      await ctx.db.patch(row._id, {
        markAsOverdueScheudledFunctionId: scheduled,
      })
    }
    await bumpHead(ctx, user._id)
    await ctx.db.insert('syncReceipts', {
      createdBy: user._id,
      writeId: args.writeId,
    })
    return record(ctx, args.kind, (await ctx.db.get(row._id))!)
  },
})
