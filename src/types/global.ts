import type { api } from 'convex/_generated/api'

export type WorkspacesList =
  typeof api.dashboard.queries.getUserWorkspaces._returnType['page']

export type ListItems =
  typeof api.workspace.queries.GetWorkspaceLists._returnType['page']

export type WorkspaceItem = WorkspacesList[number]

export type ListItem = ListItems[number]

export type TodosPageData = typeof api.todos.queries.GetAllTodos._returnType

export type Todos = TodosPageData['todos']

export type Todo = Todos[number]

export type SubTasksData = typeof api.todos.queries.GetAllSubtasks._returnType

export type SubTasks = SubTasksData['subtasks']

export type SubTask = SubTasks[number]
