const RISK_COLORS = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#22c55e' }
const LEGEND = [['LOW', '#22c55e'], ['MEDIUM', '#f59e0b'], ['HIGH', '#ef4444']]

function dayLabel(iso) {
  const date = new Date(iso)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

export default function ForecastChart({ series }) {
  return (
    <div className="mt-4">
      <div className="mb-3 flex justify-end gap-4">
        {LEGEND.map(([label, color]) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: color }} />
            <span className="text-[11px] text-secondary">{label}</span>
          </div>
        ))}
      </div>

      <div className="flex h-[200px] items-stretch gap-1.5 rounded border border-border bg-elevated p-4">
        {series.map((point) => (
          <div
            key={point.date}
            className="flex flex-1 flex-col"
            title={`${point.date}: ${Math.round(point.probability * 100)}% (${point.risk_level})`}
          >
            <div className="flex flex-1 items-end">
              <div
                className="w-full rounded-sm transition-opacity hover:opacity-80"
                style={{
                  height: `${Math.max(point.probability * 100, 3)}%`,
                  backgroundColor: RISK_COLORS[point.risk_level],
                }}
              />
            </div>
            <span className="mt-1 text-center text-[10px] text-secondary">
              {dayLabel(point.date)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
