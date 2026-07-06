import { useNavigate } from 'react-router-dom'
import AppLayout from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { signOut } from '@/lib/auth'

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b border-border py-3 last:border-0">
      <span className="text-sm text-secondary">{label}</span>
      <span className="text-sm text-primary">{value || '-'}</span>
    </div>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const { session, profile } = useAuth()

  async function handleSignOut() {
    await signOut()
    navigate('/signin')
  }

  return (
    <AppLayout>
      <h1 className="text-xl font-semibold text-primary">Settings</h1>
      <p className="mt-1 text-sm text-secondary">Your field officer profile.</p>

      <div className="mt-8 max-w-xl rounded border border-border bg-surface p-6">
        <Row label="Full name" value={profile?.full_name} />
        <Row label="Email" value={session?.user?.email} />
        <Row label="Cooperative" value={profile?.cooperative} />
        <Row label="District" value={profile?.districts?.join(', ')} />
      </div>

      <Button onClick={handleSignOut} className="mt-6 bg-accent text-black">
        Sign out
      </Button>
    </AppLayout>
  )
}
