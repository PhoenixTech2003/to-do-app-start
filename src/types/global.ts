import type { HabitXp } from '../../convex/habits/xp'
import type { Doc } from 'convex/_generated/dataModel'

export type WorkspaceItem = Doc<'workspace'>
export type WorkspacesList = Array<WorkspaceItem>
export type ListItem = Doc<'lists'>
export type ListItems = Array<ListItem>
export type TodoLocation = {
  listId: ListItem['_id'] | null
  listTitle: string | null
  workspaceId: WorkspaceItem['_id'] | null
  workspaceTitle: string | null
}
export type Todo = Doc<'todos'> & {
  subTasks: { total: number; done: number; remaining: number }
  location?: TodoLocation
}
export type Todos = Array<Todo>
export type TodosPageData = { todos: Todos; listDetails: ListItem }
export type SubTask = Doc<'subTasks'>
export type SubTasks = Array<SubTask>
export type SubTasksData = {
  subtasks: SubTasks
  progress: { total: number; done: number; remaining: number }
}
export type HabitWithStatus = Doc<'habits'> &
  HabitXp & { completedToday: boolean }
export type HabitsWithStatus = Array<HabitWithStatus>
