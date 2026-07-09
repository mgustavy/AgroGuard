export default function Wordmark({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 font-medium text-primary ${className}`}>
      <img src="/favicon.svg" alt="" className="h-5 w-5" />
      AgroGuard
    </span>
  )
}
