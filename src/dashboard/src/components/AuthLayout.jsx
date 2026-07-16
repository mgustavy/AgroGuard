import ThemeToggle from '@/components/ThemeToggle'

export default function AuthLayout({ children }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <ThemeToggle className="absolute right-4 top-4" />
      <div className="w-full max-w-[380px]">{children}</div>
    </div>
  )
}
