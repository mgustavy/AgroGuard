import { useState } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import Wordmark from '@/components/Wordmark'

export default function AppLayout({ children }) {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile top bar with hamburger; hidden once the sidebar rail is visible. */}
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
        <Wordmark className="text-base" />
        <button
          type="button"
          onClick={() => setNavOpen(true)}
          aria-label="Open menu"
          className="rounded p-1 text-secondary transition-opacity hover:text-primary"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />

      <main className="p-4 sm:p-6 md:ml-60 md:p-8">{children}</main>
    </div>
  )
}
