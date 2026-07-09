import { createContext, useContext, useState } from 'react'
import { translations } from '@/lib/translations'

const KEY = 'agroguard_lang'
const LanguageContext = createContext({ lang: 'en', setLang: () => {}, t: (k) => k })

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem(KEY) || 'en')

  const setLang = (next) => {
    localStorage.setItem(KEY, next)
    setLangState(next)
  }

  const t = (key, vars) => {
    let str = translations[lang]?.[key] ?? translations.en[key] ?? key
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, v)
      })
    }
    return str
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLang = () => useContext(LanguageContext)
