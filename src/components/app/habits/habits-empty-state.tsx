import { motion } from 'motion/react'
import { TallyWall } from './tally'

export function HabitsEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      className="edge-lit flex flex-1 flex-col items-center justify-center rounded-lg border border-hairline-strong bg-card px-6 py-20 text-center shadow-elev-1"
    >
      <TallyWall count={0} markedToday={false} size="lg" className="mb-6" />
      <h2 className="text-lg font-bold tracking-tight">
        The wall starts empty
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-balance text-muted-foreground">
        Add one habit and mark it today. Every day you show up adds a stroke —
        the run is the only score this page keeps.
      </p>
    </motion.div>
  )
}
