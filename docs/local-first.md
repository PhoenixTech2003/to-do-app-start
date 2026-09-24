# Local-first data

All workspace, list, todo, subtask, habit and habit-completion screens use the user-scoped Legend State replica in `src/state`. UI actions commit locally; Convex is the authenticated synchronization backend. Notification registration and authentication still require a connection.

## Storage and synchronization

- IndexedDB stores normalized records and Legend's pending sync metadata. A persisted LocalStorage intent journal records the fields edited locally and enough data to recover a write interrupted before IndexedDB commits.
- Local IDs remain stable after synchronization. Existing server records retain their IDs. A habit completion has one deterministic identity per habit and date; recurring successors also have deterministic IDs.
- Parent records sync before their children. Writes are serialized per record, retried with exponential backoff, and deduplicated by server receipts. An acknowledged write removes only the intent tokens it actually sent.
- The server applies only edited fields. Unrelated edits from another device survive; competing edits to the same field use server arrival order. Deletions are permanent tombstones, except habit completions, which can be unchecked and checked again. A deleted ancestor hides its descendants and prevents a late child write from reviving them.
- An authenticated subscription watches an owner-specific revision. A revision change, browser focus, or reconnect triggers a paginated pull of all six entity types, including tombstones. Local pending fields are overlaid on the incoming records.
- Session identity selects the local partition; credentials are not persisted in the replica. Changing accounts disposes the previous sync scope. Signing out keeps that account's local data and pending edits on the device for the next sign-in.

## TanStack Start and offline reload

The root uses `ssr: false` with a server-rendered `shellComponent`. This keeps browser storage and auth routing out of server rendering. Server functions and auth routes remain available.

The build plugin in `scripts/offline.ts` emits the service worker before Nitro indexes public files. It precaches the compiled assets and an anonymous root document fetched without credentials. It never caches API responses, server-function responses, or authenticated navigation responses. Offline navigation uses that document; local session identity opens the correct replica. An initial online visit and sign-in are required. Service workers require HTTPS (or localhost) and are enabled in production builds.

New service-worker versions wait until old tabs close so a running application keeps its matching asset cache.

## Verification and deployment

Run `npx tsc --noEmit`, `bun run test`, and `bun run build`. The tests cover durable offline writes, account isolation, parent dependencies, overlapping saves, remote field merging, ownership, retry receipts, tombstones, local cascades, recurrence and habit calculations.

For an offline browser check, start the production output with the usual environment variables, sign in and allow initial sync, disable the browser's network, create and edit each entity type, reload, then reconnect and verify the changes on another device.

Deploy the Convex schema and `sync/*` functions together with the frontend. The old domain CRUD endpoints have been removed. This change does not deploy either service automatically.

## References

The persistence, intents, parent dependencies and retry approach follows `/home/chiyembekezo/repos/notes/src/state`.

- [Legend State syncedCrud](https://legendapp.com/open-source/state/v3/sync/crud/)
- [Legend State persistence and sync](https://legendapp.com/open-source/state/v3/sync/persist-sync/)
- [TanStack Start selective SSR and root shells](https://tanstack.com/start/latest/docs/framework/react/guide/selective-ssr)
- [TanStack Start SPA mode](https://tanstack.com/start/latest/docs/framework/react/guide/spa-mode)
