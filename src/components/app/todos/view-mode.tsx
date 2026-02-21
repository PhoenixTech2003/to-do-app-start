import { KanbanSquare, List } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ViewModeProps {
  workspaceId: string
  listId: string
}

export function ViewModeTrigger({ workspaceId, listId }: ViewModeProps) {
  return (
    <div className="flex gap-2 items-center">
      <Tooltip>
        <TooltipTrigger>
          <Link
            to="/dashboard/workspace/$workspaceId/lists/$listId/todos"
            params={{
              workspaceId,
              listId,
            }}
            search={{
              view: 'list',
            }}
          >
            <List />
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>List View</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
          <Link
            to="/dashboard/workspace/$workspaceId/lists/$listId/todos"
            params={{
              workspaceId,
              listId,
            }}
            search={{
              view: 'kanban',
            }}
          >
            <KanbanSquare />
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>Kanban view</p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
