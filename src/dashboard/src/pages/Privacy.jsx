import { Link } from 'react-router-dom'
import ThemeToggle from '@/components/ThemeToggle'
import Wordmark from '@/components/Wordmark'
import { useAuth } from '@/context/AuthContext'
import { useLang } from '@/context/LanguageContext'
import { PRIVACY_POLICY_VERSION } from '@/lib/privacy'

// The policy text is kept in English only for now; translating it is listed as a
// known limitation in the ethics audit. Change PRIVACY_POLICY_VERSION with the text.
const SECTIONS = [
  {
    heading: 'Who runs AgroGuard',
    body: [
      'AgroGuard is a final-year capstone project by Manzi Gustave, a BSc. Software Engineering student at African Leadership University (ALU), Kigali, Rwanda, supervised by Hubert Apana. It is a research prototype, not a commercial service.',
      'Contact for any privacy question or request: m.gustave@alustudent.com.',
    ],
  },
  {
    heading: 'What we collect',
    body: [
      'When you create an account we store your full name, email address, cooperative, and the district you select. Your password is handled by Supabase, our sign-in provider, and is stored only as a one-way hash that we cannot read.',
      'We also store the date and time you accepted this policy and which version you accepted.',
      'Your browser keeps your sign-in session, language and theme choice in its local storage. These stay on your device.',
      'Our web server keeps standard access logs, which include IP addresses, to keep the service running and secure.',
    ],
  },
  {
    heading: 'What we do not collect',
    body: [
      'We do not collect your GPS location, farm boundaries, photos, phone number, or any information about individual farmers. Risk scores are calculated per district from public weather data, not from anything about you. We use no advertising or analytics trackers.',
    ],
  },
  {
    heading: 'Why we use your data',
    body: [
      'We use your details only to sign you in and to open the dashboard on your own district. We do not sell your data, share it with third parties for their own use, or use it to train the model.',
      'We process your data on the basis of your consent, in line with Rwanda\'s Law No. 058/2021 of 13/10/2021 relating to the protection of personal data and privacy.',
    ],
  },
  {
    heading: 'Where your data is stored',
    body: [
      'Account data is stored by Supabase in its [SUPABASE REGION] data centre. The AgroGuard API and website run on Strettch Cloud servers in Rwanda and do not store personal data.',
    ],
  },
  {
    heading: 'How long we keep it',
    body: [
      'We keep your account until you delete it. Deleting your account removes your profile and sign-in details immediately.',
    ],
  },
  {
    heading: 'Your rights',
    body: [
      'You can see everything we hold about you on the Settings page. You can delete your account at any time from Settings, which also withdraws your consent. To correct your details or ask any other question about your data, email the contact address above.',
    ],
  },
  {
    heading: 'About the risk scores',
    body: [
      'AgroGuard gives decision support, not instructions. The model was trained on maize disease data from three districts in Tanzania (Arusha, Mbeya and Morogoro), so scores for other districts and other crops are less certain and are marked as low confidence. Always check the field for symptoms before applying any treatment.',
    ],
  },
  {
    heading: 'Changes to this policy',
    body: [
      'If this policy changes, we will update the version number shown at the top of this page.',
    ],
  },
]

export default function Privacy() {
  const { session } = useAuth()
  const { t } = useLang()

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <Wordmark className="text-base" />
          <ThemeToggle />
        </div>

        <h1 className="mt-8 text-xl font-semibold text-primary">{t('privacy.title')}</h1>
        <p className="mt-1 text-sm text-secondary">
          {t('privacy.version')}: {PRIVACY_POLICY_VERSION}
        </p>

        <div className="mt-8 space-y-6 rounded border border-border bg-surface p-6">
          {SECTIONS.map((section) => (
            <section key={section.heading}>
              <h2 className="text-base font-semibold text-primary">{section.heading}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph} className="mt-2 text-sm text-secondary">{paragraph}</p>
              ))}
            </section>
          ))}
        </div>

        <Link to={session ? '/settings' : '/signup'}
          className="mt-6 inline-block text-sm text-secondary transition-opacity hover:text-accent">
          {session ? t('privacy.backToSettings') : t('privacy.backToSignUp')}
        </Link>
      </div>
    </div>
  )
}
