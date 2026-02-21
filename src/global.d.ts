import type { Id } from 'convex/_generated/dataModel'

// In a global type definition file (e.g., types.d.ts or global.d.ts)
declare module '@tanstack/query-db-collection' {
  interface QueryCollectionMeta {
    // Add your custom properties here
    listId: Id<'lists'>
    workspaceId: Id<'workspace'>
  }
}
