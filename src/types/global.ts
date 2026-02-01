import type { api } from 'convex/_generated/api'

export type WorkspacesList =
  typeof api.dashboard.queries.getUserWorkspaces._returnType

export type WorkspaceItem = WorkspacesList[number]
