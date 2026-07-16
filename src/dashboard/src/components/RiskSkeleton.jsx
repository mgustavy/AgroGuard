import Skeleton from '@/components/Skeleton'

// Loading placeholder mirroring the risk card and the three stat cards.
export default function RiskSkeleton() {
  return (
    <>
      <div className="rounded border border-border bg-surface p-6">
        <div className="flex">
          <div className="flex-1 space-y-3 pr-6">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex-1 space-y-3 border-l border-border pl-6">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <div className="mt-6 space-y-2 border-t border-border pt-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-3 rounded border border-border bg-surface p-4">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-7 w-20" />
          </div>
        ))}
      </div>
    </>
  )
}
