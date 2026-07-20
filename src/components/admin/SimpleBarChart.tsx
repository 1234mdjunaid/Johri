interface SimpleBarChartProps {
  data: { label: string; count: number }[]
}

/** Minimal dependency-free bar chart for the "spins over the last 7 days" trend. */
export function SimpleBarChart({ data }: SimpleBarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.count))
  return (
    <div className="flex h-[160px] items-end gap-3 px-1">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="text-royal text-xs font-bold">{d.count}</div>
          <div
            className="w-full rounded-t-lg"
            style={{
              height: `${Math.max(6, (d.count / max) * 110)}px`,
              background: 'linear-gradient(180deg,#a992cc,#5f4d8c)',
            }}
          />
          <div className="text-muted-3 text-[10.5px] whitespace-nowrap">{d.label}</div>
        </div>
      ))}
    </div>
  )
}
