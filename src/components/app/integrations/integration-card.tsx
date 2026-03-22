'use client'

import { CheckCircle2, Circle } from 'lucide-react'
import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface IntegrationCardProps {
  title: string
  description: string
  isActive?: boolean
  children?: ReactNode
  className?: string
  icon?: ReactNode
  accentColor?: string
}

export function IntegrationCard({
  title,
  description,
  isActive = false,
  children,
  className,
  icon,
  accentColor,
}: IntegrationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-300',
        'hover:shadow-md hover:border-border',
        isActive && 'ring-1 ring-primary/20',
        className,
      )}
    >
      <div
        className="absolute inset-x-0 top-0 h-[2px] transition-opacity duration-300"
        style={{
          background: accentColor
            ? `linear-gradient(90deg, transparent, ${accentColor}, transparent)`
            : undefined,
          opacity: isActive ? 1 : 0.4,
        }}
      />

      <div className="flex items-start gap-4 px-5 pt-5 pb-3">
        {icon && (
          <div
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-xl border transition-colors duration-300',
              isActive
                ? 'border-transparent bg-primary/8'
                : 'border-border/50 bg-muted/50 group-hover:bg-muted/80',
            )}
            style={
              accentColor && isActive
                ? { backgroundColor: `${accentColor}10` }
                : undefined
            }
          >
            {icon}
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-bold tracking-tight text-foreground">
              {title}
            </h3>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider transition-colors',
                isActive
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {isActive ? (
                <>
                  <CheckCircle2 className="size-2.5" />
                  Connected
                </>
              ) : (
                <>
                  <Circle className="size-2.5" />
                  Not connected
                </>
              )}
            </span>
          </div>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-2">
        <div className="flex flex-1 flex-col">{children}</div>
      </div>
    </motion.div>
  )
}
