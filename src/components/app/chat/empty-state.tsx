'use client'

import { motion } from 'motion/react'
import { BetaBadge } from '@/components/ui/beta-badge'

const suggestions = ['Create a task', 'Create a workspace', 'Show my tasks']

export function EmptyState({
  onSuggestion,
}: {
  onSuggestion: (text: string) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full min-h-[320px] sm:min-h-[420px] flex-col items-center justify-center gap-4 sm:gap-6 text-center px-4 sm:px-6"
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/8 blur-2xl scale-[2]" />
        <motion.img
          src="/favicon.png"
          alt="TwoDo"
          className="relative size-14 drop-shadow-md"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Hey, how can I help?
          </h2>
          <BetaBadge />
        </div>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
          Manage tasks, schedule focus sessions, or ask me anything about your
          workflow.
        </p>
      </div>

      <motion.div
        className="flex flex-wrap justify-center gap-2"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
      >
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSuggestion(s)}
            className="rounded-full border border-border/80 bg-card text-[11px] px-2.5 py-1 sm:text-xs sm:px-3.5 sm:py-1.5 font-medium text-muted-foreground shadow-xs hover:bg-muted/60 hover:text-foreground hover:border-border transition-all duration-200 cursor-pointer"
          >
            {s}
          </button>
        ))}
      </motion.div>
    </motion.div>
  )
}
