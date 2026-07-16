import { useEffect, useMemo, useState } from 'react'
import AppLayout from '@/components/AppLayout'
import Skeleton from '@/components/Skeleton'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { fetchAlerts } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useLang } from '@/context/LanguageContext'
import { RISK_COLORS } from '@/lib/risk'

const ALL = 'All districts'

export default function Alerts() {
  const { profile } = useAuth()
  const { t } = useLang()
  const [alerts, setAlerts] = useState(null)
  const [error, setError] = useState(null)
  const [country, setCountry] = useState('')

  useEffect(() => {
    fetchAlerts().then(setAlerts).catch((err) => setError(err.message))
  }, [])

  const countries = useMemo(
    () => (alerts ? [ALL, ...[...new Set(alerts.map((a) => a.country))].sort()] : [ALL]),
    [alerts],
  )

  const homeCountry = useMemo(() => {
    if (!alerts || !profile?.districts?.length) return null
    return alerts.find((a) => a.district === profile.districts[0])?.country || null
  }, [alerts, profile])

  const effectiveCountry = country || homeCountry || ALL
  const visible = alerts?.filter((a) => effectiveCountry === ALL || a.country === effectiveCountry) ?? []
  const highCount = visible.filter((a) => a.risk_level === 'HIGH').length
  const snapshotCount = visible.filter((a) => a.data_source === 'snapshot').length

  return (
    <AppLayout>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-primary">{t('nav.alerts')}</h1>
          <p className="mt-1 text-sm text-secondary">
            {t('alerts.subtitle')} {alerts ? t('alerts.high', { n: highCount }) : ''}
          </p>
          {snapshotCount > 0 && (
            <p className="mt-1 text-sm text-risk-medium">{t('alerts.snapshotNote', { n: snapshotCount })}</p>
          )}
        </div>
        {alerts && (
          <Select value={effectiveCountry} onValueChange={setCountry}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {countries.map((c) => (
                <SelectItem key={c} value={c}>{c === ALL ? t('alerts.all') : c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {error && (
        <div className="mt-8 rounded border border-border bg-surface p-4 text-sm text-secondary">
          {t('alerts.loadError')} ({error}).
        </div>
      )}

      {!alerts && !error && (
        <div className="mt-8 space-y-px overflow-hidden rounded border border-border bg-surface">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      )}

      {alerts && (
        <div className="mt-8 divide-y divide-border rounded border border-border bg-surface">
          {visible.map((a) => {
            const mine = a.district === profile?.districts?.[0]
            return (
              <div key={a.district} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: RISK_COLORS[a.risk_level] }} />
                  <div>
                    <div className="text-sm text-primary">
                      {a.district}
                      {mine && <span className="ml-2 text-sm text-accent">{t('alerts.yourDistrict')}</span>}
                    </div>
                    <div className="text-sm text-secondary">{a.country}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-sm font-medium" style={{ color: RISK_COLORS[a.risk_level] }}>{a.risk_level}</span>
                  <span className="w-12 text-right text-sm text-secondary">{Math.round(a.probability * 100)}%</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AppLayout>
  )
}
