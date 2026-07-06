import Sidebar from '@/components/Sidebar'

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-60 p-8">{children}</main>
    </div>
  )
}
