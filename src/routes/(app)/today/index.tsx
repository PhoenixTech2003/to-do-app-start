import { createFileRoute } from '@tanstack/react-router'
import { BackButton } from '@/components/app/back-button'

export const Route = createFileRoute('/(app)/today/')({
  component: TodayPage,
})

function TodayPage() {
  return (
    <header className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <BackButton />
        <div>
          <h2 className="text-2xl font-semibold">Twodo's for Today</h2>
        </div>
      </div>
      {/* <CreateTodoDialog listId={listId as Id<'lists'>} /> */}
    </header>
  )
}
