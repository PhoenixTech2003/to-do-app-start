import { ListTodo } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NoListsEmptyStateProps {
  workspaceName?: string
  onCreateList?: () => void
}

export function NoListsEmptyState({
  workspaceName = 'Workspace',
  onCreateList,
}: NoListsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 rounded-lg border-2 border-dashed border-slate-200 bg-linear-to-br from-slate-50 to-slate-100 px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
        <ListTodo className="h-8 w-8 text-purple-600" />
      </div>

      <div className="space-y-2 text-center">
        <h3 className="text-2xl font-bold text-slate-900">No Lists Yet</h3>
        <p className="text-base text-slate-500">
          Create your first list in{' '}
          <span className="font-semibold text-slate-900">{workspaceName}</span>{' '}
          to start managing your tasks.
        </p>
      </div>

      {onCreateList && (
        <Button onClick={onCreateList} className="mt-4">
          Create Your First List
        </Button>
      )}
    </div>
  )
}
