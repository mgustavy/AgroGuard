import { useLang } from '@/context/LanguageContext'
import { RISK_COLORS } from '@/lib/risk'

export default function RiskCard({ level = 'HIGH', probability = 78, recommendation }) {
  const { t } = useLang()
  return (
    <div className="rounded border border-border bg-surface p-6">
      <div className="flex">
        <div className="flex-1 pr-6">
          <div className="text-4xl font-semibold" style={{ color: RISK_COLORS[level] }}>
            {level}
          </div>
          <div className="mt-1 text-sm text-secondary">{t('diseaseRiskLevel')}</div>
        </div>
        <div className="flex-1 border-l border-border pl-6">
          <div className="text-4xl font-semibold text-primary">{probability}%</div>
          <div className="mt-1 text-sm text-secondary">{t('probabilityScore')}</div>
        </div>
      </div>

      <div className="mt-6 border-t border-border pt-4">
        <div className="text-sm text-secondary">{t('recommendation')}</div>
        <p className="mt-1 text-primary">{recommendation}</p>
      </div>
    </div>
  )
}
