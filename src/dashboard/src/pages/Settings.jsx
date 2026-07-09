import { useNavigate } from 'react-router-dom'
import AppLayout from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { useLang } from '@/context/LanguageContext'
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
  const { t } = useLang()

  async function handleSignOut() {
    await signOut()
    navigate('/signin')
  }

  return (
    <AppLayout>
      <h1 className="text-xl font-semibold text-primary">{t('nav.settings')}</h1>
      <p className="mt-1 text-sm text-secondary">{t('settings.subtitle')}</p>

      <div className="mt-8 max-w-xl rounded border border-border bg-surface p-6">
        <Row label={t('settings.fullName')} value={profile?.full_name} />
        <Row label={t('settings.email')} value={session?.user?.email} />
        <Row label={t('settings.cooperative')} value={profile?.cooperative} />
        <Row label={t('settings.district')} value={profile?.districts?.join(', ')} />
      </div>

      <Button onClick={handleSignOut} className="mt-6 bg-accent text-black">
        {t('signOut')}
      </Button>
    </AppLayout>
  )
}
