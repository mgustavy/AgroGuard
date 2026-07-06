import { useEffect, useState } from 'react'
import { Droplets, Thermometer, Wind, BarChart2 } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import RiskCard from '@/components/RiskCard'
import StatCard from '@/components/StatCard'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { fetchDistrictRisk } from '@/lib/api'

const DISTRICTS = ['Huye', 'Arusha', 'Nakuru', 'Mbarara']
const CROPS = ['Maize', 'Beans', 'Potato', 'Banana']

function Picker({ value, onValueChange, options }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function signed(value) {
  return `${value > 0 ? '+' : ''}${value}%`
}

export default function Dashboard() {
  const [district, setDistrict] = useState('Arusha')
  const [crop, setCrop] = useState('Maize')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    setError(null)
    fetchDistrictRisk(district, crop)
      .then((result) => active && setData(result))
      .catch((err) => {
        if (active) {
          setData(null)
          setError(err.message)
        }
      })
    return () => {
      active = false
    }
  }, [district, crop])

  const features = data?.features

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-60 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-primary">Risk Overview</h1>
            {data && (
              <p className="mt-1 text-sm text-secondary">
                {data.district}, {data.country} &middot;{' '}
                {data.live ? 'live weather' : 'snapshot'} &middot; {data.as_of}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Picker value={district} onValueChange={setDistrict} options={DISTRICTS} />
            <Picker value={crop} onValueChange={setCrop} options={CROPS} />
          </div>
        </div>

        {error && (
          <div className="mt-8 rounded border border-border bg-surface p-4 text-sm text-secondary">
            Could not reach the API ({error}). Start it with{' '}
            <span className="text-primary">uvicorn src.api.main:app</span>.
          </div>
        )}

        <div className="mt-8 space-y-6">
          <RiskCard
            level={data ? data.risk_level : 'LOW'}
            probability={data ? Math.round(data.probability * 100) : 0}
            recommendation={data ? data.recommendation : 'Loading district risk...'}
          />

          <div className="grid grid-cols-3 gap-6">
            <StatCard
              icon={Droplets}
              label="Consecutive Wet Days"
              value={features ? `${features.consecutive_wet_days} days` : '-'}
              accent
            />
            <StatCard
              icon={Thermometer}
              label="Temperature Spread"
              value={features ? `${features.temp_spread_7d}°C` : '-'}
            />
            <StatCard
              icon={Wind}
              label="Humidity Deviation"
              value={features ? signed(features.humidity_deviation) : '-'}
            />
          </div>

          <div className="rounded border border-border bg-surface p-6">
            <h2 className="text-base font-semibold text-primary">14-Day Forecast</h2>
            <div className="mt-4 flex h-[200px] flex-col items-center justify-center rounded border border-border bg-elevated">
              <BarChart2 className="h-8 w-8 text-secondary" />
              <span className="mt-2 text-sm text-secondary">Chart coming in Sprint 2</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
