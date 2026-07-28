import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

/**
 * ── The mark ──
 * The habits page has one unit of meaning: a mark struck for a day you showed
 * up. It appears at three scales — the wall of marks in the hero, the slot you
 * strike on each habit row, and the ghost slot waiting for today. Every stroke
 * on this page comes from here so they read as the same hand.
 */

export type TallySize = 'lg' | 'md' | 'sm'

const SIZES: Record<
  TallySize,
  { step: number; height: number; stroke: number; gap: number; row: number }
> = {
  lg: { step: 8, height: 36, stroke: 2.6, gap: 15, row: 14 },
  md: { step: 6, height: 27, stroke: 2.1, gap: 12, row: 11 },
  sm: { step: 4.5, height: 19, stroke: 1.6, gap: 9, row: 9 },
}

const PAD = 3

/** Picks a scale so a long run still fits the sheet instead of overflowing it. */
export function tallySizeFor(count: number): TallySize {
  if (count <= 55) return 'lg'
  if (count <= 170) return 'md'
  return 'sm'
}

/**
 * Deterministic 0–1 noise. Marks need to look struck by hand, but they must not
 * reshuffle on every render — the wall is a record, not an animation.
 */
function noise(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function groupWidth(step: number) {
  return PAD * 2 + step * 3
}

/** One struck stroke, slanted and inset by a hand's worth of imprecision. */
function Stroke({
  index,
  x,
  size,
  className,
  animate,
  delay,
}: {
  index: number
  x: number
  size: TallySize
  className?: string
  animate: boolean
  delay: number
}) {
  const { height, stroke } = SIZES[size]
  const lean = (noise(index) - 0.5) * 2.4
  const topInset = 1.5 + noise(index + 0.31) * 1.6
  const bottomInset = 1.5 + noise(index + 0.77) * 1.6

  return (
    <motion.line
      x1={x - lean}
      y1={topInset}
      x2={x + lean}
      y2={height - bottomInset}
      strokeWidth={stroke}
      strokeLinecap="round"
      className={className}
      initial={animate ? { pathLength: 0, opacity: 0 } : false}
      animate={animate ? { pathLength: 1, opacity: 1 } : undefined}
      transition={{ duration: 0.26, delay, ease: [0.22, 1, 0.36, 1] }}
    />
  )
}

/**
 * Five days: four uprights and the diagonal that closes them. A group holds
 * fewer strokes only when it is the newest one, still being filled in.
 */
function TallyGroup({
  filled,
  startIndex,
  size,
  freshIndex,
  ghostSlot,
  animate,
  stagger,
}: {
  filled: number
  startIndex: number
  size: TallySize
  freshIndex: number | null
  /** Slot 0–4 in this group that today's mark would fill, if it is still open. */
  ghostSlot?: number
  animate: boolean
  stagger: number
}) {
  const { step, height, stroke } = SIZES[size]
  const width = groupWidth(step)
  const uprights = Math.min(filled, 4)
  const closed = filled === 5

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden="true"
      className="shrink-0 overflow-visible"
    >
      {ghostSlot !== undefined &&
        (ghostSlot === 4 ? (
          <line
            x1={-1}
            y1={height - 3}
            x2={width + 1}
            y2={3}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray="2 4"
            className="stroke-primary/45"
          />
        ) : (
          <line
            x1={PAD + ghostSlot * step}
            y1={1.5}
            x2={PAD + ghostSlot * step}
            y2={height - 1.5}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray="2 4"
            className="stroke-primary/45"
          />
        ))}
      {Array.from({ length: uprights }).map((_, i) => {
        const index = startIndex + i
        return (
          <Stroke
            key={index}
            index={index}
            x={PAD + i * step}
            size={size}
            animate={animate}
            delay={index * stagger}
            className={
              index === freshIndex
                ? 'stroke-primary'
                : 'stroke-foreground/80 dark:stroke-foreground/70'
            }
          />
        )
      })}
      {closed && (
        <motion.line
          x1={-1}
          y1={height - 3}
          x2={width + 1}
          y2={3}
          strokeWidth={SIZES[size].stroke}
          strokeLinecap="round"
          className={
            startIndex + 4 === freshIndex
              ? 'stroke-primary'
              : 'stroke-foreground/80 dark:stroke-foreground/70'
          }
          initial={animate ? { pathLength: 0, opacity: 0 } : false}
          animate={animate ? { pathLength: 1, opacity: 1 } : undefined}
          transition={{
            duration: 0.3,
            delay: (startIndex + 4) * stagger,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      )}
    </svg>
  )
}

/**
 * The slot today's mark will go in, when it opens a fresh group. Only as wide
 * as the one stroke, so it sits a mark's distance from the wall and not a
 * group's.
 */
function GhostSlot({ size }: { size: TallySize }) {
  const { height, stroke } = SIZES[size]
  const width = PAD * 2

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <line
        x1={PAD}
        y1={1.5}
        x2={PAD}
        y2={height - 1.5}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray="2 4"
        className="stroke-primary/45"
      />
    </svg>
  )
}

/**
 * The wall. Every day you kept the run going, struck in ink on ruled paper.
 * Today's mark is the only one in terracotta — the ink is still wet.
 */
export function TallyWall({
  count,
  markedToday,
  size,
  className,
}: {
  count: number
  markedToday: boolean
  size: TallySize
  className?: string
}) {
  const reduceMotion = useReducedMotion()
  const { height, gap, row } = SIZES[size]
  // Past a certain wall size the draw-on stops reading as a gesture and starts
  // reading as a loading bar, so it is dropped rather than compressed further.
  const animate = !reduceMotion && count > 0 && count <= 130
  const stagger = count > 0 ? Math.min(0.014, 0.85 / count) : 0
  const groups = Math.ceil(count / 5)
  const freshIndex = markedToday ? count - 1 : null
  // An unmarked today goes in the group still being filled; only once a group
  // is closed does the waiting slot start a new one.
  const openSlot = count % 5
  const ghostInLastGroup = !markedToday && openSlot !== 0

  // A hair fainter than a structural rule: this is the paper, not the layout.
  const rule = 'color-mix(in srgb, var(--hairline) 55%, transparent)'

  return (
    <div
      className={cn('flex flex-wrap items-end', className)}
      style={{
        columnGap: gap,
        rowGap: row,
        backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${height - 1}px, ${rule} ${height - 1}px, ${rule} ${height}px, transparent ${height}px, transparent ${height + row}px)`,
      }}
    >
      {Array.from({ length: groups }).map((_, g) => (
        <TallyGroup
          key={g}
          startIndex={g * 5}
          filled={Math.min(5, count - g * 5)}
          size={size}
          freshIndex={freshIndex}
          ghostSlot={
            ghostInLastGroup && g === groups - 1 ? openSlot : undefined
          }
          animate={animate}
          stagger={stagger}
        />
      ))}
      {!markedToday && !ghostInLastGroup && <GhostSlot size={size} />}
    </div>
  )
}

/**
 * The control on a habit row. Unmarked it is a dashed slot; marked it is a
 * struck stroke in wet ink. Pressing it presses into the paper.
 */
export function MarkSlot({ marked }: { marked: boolean }) {
  const reduceMotion = useReducedMotion()

  return (
    <svg
      width={16}
      height={26}
      viewBox="0 0 16 26"
      fill="none"
      aria-hidden="true"
      className="overflow-visible"
    >
      <line
        x1={8}
        y1={2}
        x2={8}
        y2={24}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="2 4"
        className={cn(
          'transition-opacity duration-200',
          marked
            ? 'stroke-transparent opacity-0'
            : 'stroke-foreground/25 group-hover/row:stroke-primary/55',
        )}
      />
      {marked && (
        <motion.line
          x1={6.6}
          y1={2}
          x2={9.4}
          y2={24}
          strokeWidth={2.6}
          strokeLinecap="round"
          className="stroke-primary"
          initial={reduceMotion ? false : { pathLength: 0 }}
          animate={reduceMotion ? undefined : { pathLength: 1 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        />
      )}
    </svg>
  )
}
