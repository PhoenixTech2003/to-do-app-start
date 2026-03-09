import { CheckCircle2, Circle } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface IntegrationCardProps {
  title: string
  description: string
  isActive?: boolean
  children?: ReactNode
  className?: string
}

export function IntegrationCard({
  title,
  description,
  isActive = false,
  children,
  className,
}: IntegrationCardProps) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-300 hover:shadow-md',
        className,
      )}
    >
      <div
        className={cn(
          'absolute top-0 left-0 w-1 h-full transition-colors duration-300',
          isActive ? 'bg-primary' : 'bg-muted',
        )}
      />
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold tracking-tight">
            {title}
          </CardTitle>
          <CardDescription className="text-sm">{description}</CardDescription>
        </div>
        <Badge
          variant={isActive ? 'default' : 'secondary'}
          className="capitalize font-mono text-[10px] tracking-wider"
        >
          {isActive ? (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Active
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Circle className="h-3 w-3" />
              Inactive
            </span>
          )}
        </Badge>
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  )
}
