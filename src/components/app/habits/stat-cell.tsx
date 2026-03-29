export function StatCell({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="p-3 sm:p-4">
      <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </span>
      <p className="text-lg font-bold tabular-nums font-mono mt-0.5">
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
        {sub}
      </p>
    </div>
  )
}
