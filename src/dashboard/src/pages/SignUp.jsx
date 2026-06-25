import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AuthLayout from '@/components/AuthLayout'
import Wordmark from '@/components/Wordmark'
import PasswordStrength from '@/components/PasswordStrength'
import { signIn } from '@/lib/auth'

export default function SignUp() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    signIn()
    navigate('/dashboard')
  }

  return (
    <AuthLayout>
      <Wordmark className="text-base" />
      <p className="mb-6 mt-1 text-sm text-secondary">Create your account</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" type="text" placeholder="Jane Mukamana" required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary transition-opacity hover:text-primary"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <PasswordStrength value={password} />
        </div>

        <Button type="submit" className="w-full bg-accent text-black">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-sm text-secondary">
        Already have an account?{' '}
        <Link to="/signin" className="transition-opacity hover:text-accent">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
