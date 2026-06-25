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

const RECOMMENDATION =
  'Apply fungicide within 48 hours. Avoid overhead irrigation. Monitor neighbouring plots.'
const DISTRICTS = ['Huye', 'Arusha', 'Nakuru', 'Mbarara']
const CROPS = ['Maize', 'Beans', 'Potato', 'Banana']

function Picker({ placeholder, options, defaultValue }) {
  return (
    <Select defaultValue={defaultValue}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
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

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-60 p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-primary">Risk Overview</h1>
          <div className="flex gap-3">
            <Picker placeholder="District" options={DISTRICTS} defaultValue="Arusha" />
            <Picker placeholder="Crop" options={CROPS} defaultValue="Maize" />
          </div>
        </div>

        <div className="mt-8 space-y-6">
          <RiskCard level="HIGH" probability={78} recommendation={RECOMMENDATION} />

          <div className="grid grid-cols-3 gap-6">
            <StatCard icon={Droplets} label="Consecutive Wet Days" value="6 days" accent />
            <StatCard icon={Thermometer} label="Temperature Spread" value="8.2°C" />
            <StatCard icon={Wind} label="Humidity Deviation" value="+2.5%" />
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
