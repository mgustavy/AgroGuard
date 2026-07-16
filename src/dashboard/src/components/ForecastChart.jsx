import { RISK_COLORS } from '@/lib/risk'

const LEGEND = [
  ['LOW', RISK_COLORS.LOW],
  ['MEDIUM', RISK_COLORS.MEDIUM],
  ['HIGH', RISK_COLORS.HIGH],
]
// Band boundaries (probability), matching the API's HIGH/MEDIUM/LOW thresholds.
const THRESHOLDS = [
  { at: 0.66, label: 'HIGH' },
  { at: 0.33, label: 'MED' },
]

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
            <span className="text-sm text-secondary">{label}</span>
          </div>
        ))}
      </div>

      {/* Scrolls horizontally on narrow screens so the 14 bars stay legible. */}
      <div className="overflow-x-auto rounded border border-border bg-elevated p-4">
        <div className="min-w-[560px]">
          {/* Exact probability above each day */}
          <div className="flex gap-1.5">
            {series.map((p) => (
              <span key={p.date} className="flex-1 text-center text-sm text-secondary">
                {Math.round(p.probability * 100)}%
              </span>
            ))}
          </div>

          {/* Bars with band threshold lines */}
          <div className="relative mt-2 flex h-[180px] items-end gap-1.5">
            {THRESHOLDS.map(({ at, label }) => (
              <div
                key={label}
                className="pointer-events-none absolute inset-x-0 border-t border-dashed border-[color:var(--hairline)]"
                style={{ bottom: `${at * 100}%` }}
              >
                <span className="absolute -top-2.5 right-0 text-sm text-secondary">{label}</span>
              </div>
            ))}
            {series.map((p) => (
              <div
                key={p.date}
                className="flex-1 rounded-sm transition-opacity hover:opacity-80"
                style={{
                  height: `${Math.max(p.probability * 100, 3)}%`,
                  backgroundColor: RISK_COLORS[p.risk_level],
                }}
                title={`${p.date}: ${Math.round(p.probability * 100)}% (${p.risk_level})`}
              />
            ))}
          </div>

          {/* Dates */}
          <div className="mt-2 flex gap-1.5">
            {series.map((p) => (
              <span key={p.date} className="flex-1 text-center text-sm text-secondary">
                {dayLabel(p.date)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
