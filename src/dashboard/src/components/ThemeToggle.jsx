import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useLang } from '@/context/LanguageContext'

// Button that flips between light and dark. Shows the icon of the theme it
// switches TO, with a matching accessible label.
export default function ThemeToggle({ className = '', showLabel = false }) {
  const { theme, toggle } = useTheme()
  const { t } = useLang()
  const toLight = theme === 'dark'
  const Icon = toLight ? Sun : Moon
  const label = toLight ? t('theme.toLight') : t('theme.toDark')

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={`flex items-center gap-3 rounded px-3 py-2 text-sm text-secondary transition-opacity hover:text-primary ${className}`}
    >
      <Icon className="h-4 w-4" />
      {showLabel && <span>{toLight ? t('theme.light') : t('theme.dark')}</span>}
    </button>
  )
}
