export default function StatCard({ icon: Icon, label, value, accent = false }) {
  return (
    <div className="rounded border border-border bg-surface p-4">
      <Icon className="h-5 w-5" style={{ color: accent ? 'var(--accent)' : 'var(--secondary)' }} />
      <div className="mt-3 text-sm text-secondary">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-primary">{value}</div>
    </div>
  )
}
