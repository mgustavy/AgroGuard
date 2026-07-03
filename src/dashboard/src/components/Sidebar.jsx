import { Map, Wheat, AlertTriangle, Settings, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Wordmark from '@/components/Wordmark'
import { signOut } from '@/lib/auth'
import { useAuth } from '@/context/AuthContext'

const NAV_ITEMS = [
  { icon: Map, label: 'Districts', active: true },
  { icon: Wheat, label: 'Crops' },
  { icon: AlertTriangle, label: 'Alerts' },
  { icon: Settings, label: 'Settings' },
]

function initials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'FO'
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase()
}

export default function Sidebar() {
  const navigate = useNavigate()
  const { session, profile } = useAuth()
  const name = profile?.full_name || 'Field Officer'
  const email = session?.user?.email

  async function handleSignOut() {
    await signOut()
    navigate('/signin')
  }

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-60 flex-col border-r border-border bg-surface">
      <div className="p-5">
        <Wordmark className="text-base" />
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ icon: Icon, label, active }) => (
          <button
            key={label}
            className={`flex w-full items-center gap-3 rounded px-3 py-2 text-sm transition-opacity ${
              active ? 'bg-elevated text-accent' : 'text-secondary hover:text-primary'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className="mb-2 flex items-center gap-3 px-1">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-elevated text-xs text-primary">
            {initials(profile?.full_name)}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm text-primary">{name}</div>
            {email && <div className="truncate text-xs text-secondary">{email}</div>}
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded px-3 py-2 text-sm text-secondary transition-opacity hover:text-primary"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
