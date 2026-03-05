import { motion } from 'motion/react'

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-background">
      {/* Base gradient layer */}
      <div className="absolute inset-0 bg-linear-to-br from-background via-background to-primary/5 dark:to-primary/10" />
      
      {/* Animated glowing orbs */}
      <motion.div
        className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-primary/20 dark:bg-primary/15 blur-[120px]"
        animate={{
          x: [0, 50, -20, 0],
          y: [0, 30, 80, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
          repeatType: "reverse"
        }}
      />
      <motion.div
        className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-chart-1/20 dark:bg-chart-1/10 blur-[150px]"
        animate={{
          x: [0, -70, 30, 0],
          y: [0, -50, -90, 0],
          scale: [1, 1.1, 0.8, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear",
          repeatType: "reverse"
        }}
      />
      <motion.div
        className="absolute top-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-chart-2/15 dark:bg-chart-2/10 blur-[100px]"
        animate={{
          x: [0, -40, 20, 0],
          y: [0, 60, -20, 0],
          scale: [1, 1.3, 0.9, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "linear",
          repeatType: "reverse"
        }}
      />

      {/* Subtle fine noise overlay texture (optional, nice for glassmorphism) */}
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
    </div>
  )
}
