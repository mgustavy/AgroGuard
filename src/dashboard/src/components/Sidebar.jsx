import { Map, AlertTriangle, Settings, LogOut, X } from 'lucide-react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import Wordmark from '@/components/Wordmark'
import ThemeToggle from '@/components/ThemeToggle'
import { signOut } from '@/lib/auth'
import { useAuth } from '@/context/AuthContext'
import { useLang } from '@/context/LanguageContext'

const NAV_ITEMS = [
  { icon: Map, key: 'nav.districts', to: '/dashboard' },
  { icon: AlertTriangle, key: 'nav.alerts', to: '/alerts' },
  { icon: Settings, key: 'nav.settings', to: '/settings' },
]

function initials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'FO'
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase()
}

export default function Sidebar({ open = false, onClose = () => {} }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { session, profile } = useAuth()
  const { t } = useLang()
  const name = profile?.full_name || t('fieldOfficer')
  const email = session?.user?.email

  async function handleSignOut() {
    await signOut()
    navigate('/signin')
  }

  return (
    <>
      {/* Backdrop for the mobile drawer. */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-border bg-surface transition-transform duration-200 md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-5">
          <Wordmark className="text-base" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded p-1 text-secondary transition-opacity hover:text-primary md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map(({ icon: Icon, key, to }) => {
            const active = pathname === to
            return (
              <Link
                key={key}
                to={to}
                onClick={onClose}
                className={`flex w-full items-center gap-3 rounded px-3 py-2 text-sm transition-opacity ${
                  active ? 'bg-elevated text-accent' : 'text-secondary hover:text-primary'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t(key)}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-border p-3">
          <div className="mb-2 flex items-center gap-3 px-1">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-elevated text-sm text-primary">
              {initials(profile?.full_name)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm text-primary">{name}</div>
              {email && <div className="truncate text-sm text-secondary">{email}</div>}
            </div>
          </div>
          <ThemeToggle className="w-full" showLabel />
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded px-3 py-2 text-sm text-secondary transition-opacity hover:text-primary"
          >
            <LogOut className="h-4 w-4" />
            {t('signOut')}
          </button>
        </div>
      </aside>
    </>
  )
}
