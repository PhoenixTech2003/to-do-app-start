import type { Id } from 'convex/_generated/dataModel'
import { useLocalQuery } from '@/state/hooks'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const INBOX = 'inbox'

/** Where an entry is filed: the Inbox, or any list, grouped by workspace. */
export function ListSelect({
  value,
  onChange,
}: {
  value?: Id<'lists'>
  onChange: (listId?: Id<'lists'>) => void
}) {
  const lists = useLocalQuery('GetUserListsForMove', { searchTerm: undefined })

  const workspaces = new Map<string, typeof lists>()
  for (const list of lists) {
    const workspaceLists = workspaces.get(list.workspaceTitle) ?? []
    workspaceLists.push(list)
    workspaces.set(list.workspaceTitle, workspaceLists)
  }

  return (
    <Select
      value={value ?? INBOX}
      onValueChange={(next) =>
        onChange(next === INBOX ? undefined : (next as Id<'lists'>))
      }
    >
      <SelectTrigger
        size="sm"
        aria-label="List"
        className="h-7 min-w-0 flex-1 rounded-sm border-hairline text-xs shadow-none sm:flex-none"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={INBOX}>Inbox</SelectItem>
        {Array.from(workspaces.entries()).map(([workspace, workspaceLists]) => (
          <SelectGroup key={workspace}>
            <SelectLabel className="label-meta">{workspace}</SelectLabel>
            {workspaceLists.map((list) => (
              <SelectItem key={list._id} value={list._id}>
                {list.title}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}
