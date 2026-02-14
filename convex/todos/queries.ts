import { v } from 'convex/values'
import { query } from '../_generated/server'

export const GetAllTodos = query({
  args: {
    listId: v.id('lists'),
  },
  handler: async (ctx, args) => {
    const listDetails = await ctx.db.get('lists', args.listId)
    if (!listDetails) {
      throw new Error('List does not exist contact support')
    }

    const todos = await ctx.db
      .query('todos')
      .withIndex('by_listId', (q) => q.eq('listId', args.listId))
      .collect()

    return {
      listDetails: listDetails,
      todos,
    }
  },
})

export const GetAllSubtasks = query({
  args: {
    todoId: v.id('todos'),
  },
  handler: async (ctx, args) => {
    const subtasks = await ctx.db
      .query('subTasks')
      .withIndex('by_todo_id', (q) => q.eq('todoId', args.todoId))
      .collect()

    return {
      subtasks,
    }
  },
})
