import { Docket, DocketRowsSkeleton } from '@/components/app/docket'

export function WorkspaceLoadingSkeleton() {
  return (
    <Docket>
      <DocketRowsSkeleton rows={5} check={false} />
    </Docket>
  )
}
