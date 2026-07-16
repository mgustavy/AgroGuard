// A shimmering placeholder block used while data loads.
export default function Skeleton({ className = '' }) {
  return (
    <div className={`relative overflow-hidden rounded bg-elevated ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-[color:var(--shimmer)] to-transparent" />
    </div>
  )
}
