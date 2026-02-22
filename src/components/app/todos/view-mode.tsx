import { KanbanSquare, List } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'

interface ViewModeProps {
  workspaceId: string
  listId: string
  mode: 'list' | 'kanban'
}

export function ViewModeTrigger({ mode, workspaceId, listId }: ViewModeProps) {
  return (
    <div className="hidden md:flex gap-2 items-center">
      <Tooltip>
        <TooltipTrigger asChild>
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
            <Button variant={mode === 'list' ? 'secondary' : 'ghost'}>
              <List />
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>List View</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
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
            <Button variant={mode === 'kanban' ? 'secondary' : 'ghost'}>
              <KanbanSquare />
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>Kanban view</p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
