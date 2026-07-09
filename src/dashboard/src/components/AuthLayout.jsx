import LanguageSelect from '@/components/LanguageSelect'

export default function AuthLayout({ children }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute right-4 top-4">
        <LanguageSelect className="h-8 w-[150px]" />
      </div>
      <div className="w-full max-w-[380px]">{children}</div>
    </div>
  )
}
