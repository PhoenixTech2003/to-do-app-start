import { Docket, DocketRowsSkeleton } from '@/components/app/docket'

export function DashboardLoadingSkeleton() {
  return (
    <Docket>
      <DocketRowsSkeleton rows={5} check={false} />
    </Docket>
  )
}
