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

      <main className="p-4 sm:p-6 md:ml-60 md:p-8">
        {children}
        {/* Required by the CC BY 4.0 licences on Open-Meteo and Copernicus ERA5 data:
            credit must sit next to anywhere the weather-derived risk data is shown. */}
        <footer className="mt-12 text-xs text-secondary">
          Weather data by{' '}
          <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer"
            className="underline hover:text-accent">Open-Meteo.com</a>
          {' '}(CC BY 4.0). Generated using Copernicus Climate Change Service ERA5 data (CC BY 4.0).
        </footer>
      </main>
    </div>
  )
}
