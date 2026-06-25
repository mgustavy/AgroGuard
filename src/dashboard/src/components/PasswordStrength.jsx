function scorePassword(pw) {
  let score = 0
  if (pw.length >= 8) score += 1
  if (/[A-Z]/.test(pw)) score += 1
  if (/[0-9]/.test(pw)) score += 1
  if (/[^A-Za-z0-9]/.test(pw)) score += 1
  return score
}

export default function PasswordStrength({ value }) {
  const score = value ? scorePassword(value) : 0
  const width = `${(score / 4) * 100}%`
  return (
    <div className="h-1 w-full overflow-hidden rounded bg-elevated">
      <div className="h-full bg-accent" style={{ width }} />
    </div>
  )
}
