import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AppLayout from '@/components/AppLayout'
import LanguageSelect from '@/components/LanguageSelect'
import ThemeToggle from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { useLang } from '@/context/LanguageContext'
import { signOut, deleteAccount } from '@/lib/auth'

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b border-border py-3">
      <span className="text-sm text-secondary">{label}</span>
      <span className="text-sm text-primary">{value || '-'}</span>
    </div>
  )
}

function formatConsent(profile) {
  if (!profile?.consented_at) return null
  const date = new Date(profile.consented_at).toLocaleDateString()
  return `v${profile.privacy_policy_version}, ${date}`
}

export default function Settings() {
  const navigate = useNavigate()
  const { session, profile } = useAuth()
  const { t } = useLang()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  async function handleSignOut() {
    await signOut()
    navigate('/signin')
  }

  async function handleDeleteAccount() {
    setDeleteError(null)
    setDeleting(true)
    try {
      await deleteAccount()
      navigate('/signin')
    } catch {
      setDeleteError(t('settings.deleteError'))
      setDeleting(false)
    }
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
        <Row label={t('settings.consent')} value={formatConsent(profile)} />
        <div className="flex items-center justify-between border-b border-border py-3">
          <span className="text-sm text-secondary">{t('settings.language')}</span>
          <LanguageSelect className="h-9 w-[160px]" />
        </div>
        <div className="flex items-center justify-between border-b border-border py-3">
          <span className="text-sm text-secondary">{t('settings.theme')}</span>
          <ThemeToggle showLabel className="-mr-3" />
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-secondary">{t('settings.privacy')}</span>
          <Link to="/privacy" className="text-sm text-primary underline transition-opacity hover:text-accent">
            {t('settings.view')}
          </Link>
        </div>
      </div>

      <Button onClick={handleSignOut} className="mt-6 bg-accent text-on-accent">
        {t('signOut')}
      </Button>

      <div className="mt-10 max-w-xl rounded border border-risk-high p-6">
        <h2 className="text-base font-semibold text-primary">{t('settings.deleteTitle')}</h2>
        <p className="mt-1 text-sm text-secondary">{t('settings.deleteBody')}</p>
        {deleteError && <p className="mt-3 text-sm text-risk-high">{deleteError}</p>}
        {confirmingDelete ? (
          <div className="mt-4 flex gap-3">
            <Button onClick={handleDeleteAccount} disabled={deleting}
              className="bg-risk-high text-white">
              {deleting ? t('settings.deleting') : t('settings.deleteConfirm')}
            </Button>
            <Button onClick={() => setConfirmingDelete(false)} disabled={deleting}
              className="border border-border bg-surface text-primary">
              {t('settings.cancel')}
            </Button>
          </div>
        ) : (
          <Button onClick={() => setConfirmingDelete(true)}
            className="mt-4 border border-risk-high bg-surface text-risk-high">
            {t('settings.deleteBtn')}
          </Button>
        )}
      </div>
    </AppLayout>
  )
}
