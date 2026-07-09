import { Languages } from 'lucide-react'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { LANGUAGES } from '@/lib/translations'
import { useLang } from '@/context/LanguageContext'

export default function LanguageSelect({ className = '' }) {
  const { lang, setLang } = useLang()
  return (
    <Select value={lang} onValueChange={setLang}>
      <SelectTrigger className={className}>
        <Languages className="h-4 w-4 text-secondary" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((l) => (
          <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
