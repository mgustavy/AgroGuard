import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AuthLayout from '@/components/AuthLayout'
import Wordmark from '@/components/Wordmark'
import { signIn } from '@/lib/auth'

export default function SignIn() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signIn(email, password)
      navigate('/dashboard')
    } catch {
      setError('Invalid email or password.')
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <Wordmark className="text-base" />
      <p className="mb-6 mt-1 text-sm text-secondary">Sign in to your account</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com" required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input id="password" type={showPassword ? 'text' : 'password'}
              value={password} onChange={(event) => setPassword(event.target.value)}
              className="pr-10" required />
            <button type="button" onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary transition-opacity hover:text-primary">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-risk-high">{error}</p>}

        <Button type="submit" disabled={submitting} className="w-full bg-accent text-black">
          {submitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-secondary">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="transition-opacity hover:text-accent">Sign up</Link>
      </p>
    </AuthLayout>
  )
}
