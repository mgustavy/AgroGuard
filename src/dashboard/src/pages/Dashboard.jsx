import { useEffect, useState } from 'react'
import { Droplets, Thermometer, Wind, BarChart2 } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import RiskCard from '@/components/RiskCard'
import StatCard from '@/components/StatCard'
import RiskSkeleton from '@/components/RiskSkeleton'
import Skeleton from '@/components/Skeleton'
import ForecastChart from '@/components/ForecastChart'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { fetchDistrictRisk, fetchForecast } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useLang } from '@/context/LanguageContext'
import { DISTRICTS } from '@/lib/districts'

const CROPS = ['Maize', 'Beans', 'Potato', 'Banana']

function Picker({ value, onValueChange, options }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

const signed = (v) => `${v > 0 ? '+' : ''}${v}%`

export default function Dashboard() {
  const { profile } = useAuth()
  const { t } = useLang()
  const [district, setDistrict] = useState('')
  const [crop, setCrop] = useState('Maize')
  const [data, setData] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [error, setError] = useState(null)
  const [forecastError, setForecastError] = useState(false)

  useEffect(() => {
    if (district) return
    if (profile?.districts?.length) setDistrict(profile.districts[0])
    else if (profile) setDistrict('Arusha')
  }, [profile, district])

  useEffect(() => {
    if (!district) return
    let active = true
    setData(null)
    setError(null)
    fetchDistrictRisk(district, crop)
      .then((r) => active && setData(r))
      .catch((err) => active && setError(err.message))
    return () => { active = false }
  }, [district, crop])

  useEffect(() => {
    if (!district) return
    let active = true
    setForecast(null)
    setForecastError(false)
    fetchForecast(district)
      .then((r) => active && setForecast(r))
      .catch(() => active && setForecastError(true))
    return () => { active = false }
  }, [district])

  const features = data?.features

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-primary">{t('riskOverview')}</h1>
          {data && (
            <p className="mt-1 text-sm text-secondary">
              {data.district}, {data.country} &middot;{' '}
              {data.live ? t('liveWeather') : t('snapshot')} &middot; {data.as_of}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <Picker value={district} onValueChange={setDistrict} options={DISTRICTS} />
          <Picker value={crop} onValueChange={setCrop} options={CROPS} />
        </div>
      </div>

      {error && (
        <div className="mt-8 rounded border border-border bg-surface p-4 text-sm text-secondary">{t('apiError')} ({error}).</div>
      )}

      <div className="mt-8 space-y-6">
        {data ? (
          <>
            <RiskCard level={data.risk_level} probability={Math.round(data.probability * 100)}
              recommendation={data.recommendation} />
            <div className="grid grid-cols-3 gap-6">
              <StatCard icon={Droplets} label={t('consecutiveWetDays')}
                value={`${features.consecutive_wet_days} ${t('days')}`} accent />
              <StatCard icon={Thermometer} label={t('temperatureSpread')}
                value={`${features.temp_spread_7d}°C`} />
              <StatCard icon={Wind} label={t('humidityDeviation')}
                value={signed(features.humidity_deviation)} />
            </div>
          </>
        ) : (
          !error && <RiskSkeleton />
        )}

        <div className="rounded border border-border bg-surface p-6">
          <h2 className="text-base font-semibold text-primary">{t('forecast14')}</h2>
          <p className="mt-1 text-xs text-secondary">{t('forecastNote')}</p>
          {forecast ? (
            <ForecastChart series={forecast.series} />
          ) : forecastError ? (
            <div className="mt-4 flex h-[200px] flex-col items-center justify-center rounded border border-border bg-elevated">
              <BarChart2 className="h-8 w-8 text-secondary" />
              <span className="mt-2 text-sm text-secondary">{t('forecastUnavailable')}</span>
            </div>
          ) : (
            <Skeleton className="mt-4 h-[200px] w-full" />
          )}
        </div>
      </div>
    </AppLayout>
  )
}
