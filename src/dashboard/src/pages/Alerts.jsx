import { useEffect, useState } from 'react'
import AppLayout from '@/components/AppLayout'
import { fetchAlerts } from '@/lib/api'

const RISK_COLORS = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#22c55e' }

export default function Alerts() {
  const [alerts, setAlerts] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAlerts()
      .then(setAlerts)
      .catch((err) => setError(err.message))
  }, [])

  const highCount = alerts?.filter((a) => a.risk_level === 'HIGH').length ?? 0

  return (
    <AppLayout>
      <h1 className="text-xl font-semibold text-primary">Alerts</h1>
      <p className="mt-1 text-sm text-secondary">
        Districts ranked by current disease risk.
        {alerts ? ` ${highCount} at HIGH risk.` : ''}
      </p>

      {error && (
        <div className="mt-8 rounded border border-border bg-surface p-4 text-sm text-secondary">
          Could not load alerts ({error}).
        </div>
      )}

      {!alerts && !error && <p className="mt-8 text-sm text-secondary">Loading...</p>}

      {alerts && (
        <div className="mt-8 divide-y divide-border rounded border border-border bg-surface">
          {alerts.map((a) => (
            <div key={a.district} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <span
                  className="h-2 w-2 rounded-sm"
                  style={{ backgroundColor: RISK_COLORS[a.risk_level] }}
                />
                <div>
                  <div className="text-sm text-primary">{a.district}</div>
                  <div className="text-xs text-secondary">{a.country}</div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span
                  className="text-sm font-medium"
                  style={{ color: RISK_COLORS[a.risk_level] }}
                >
                  {a.risk_level}
                </span>
                <span className="w-12 text-right text-sm text-secondary">
                  {Math.round(a.probability * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  )
}
