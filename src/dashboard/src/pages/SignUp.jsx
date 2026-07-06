import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import AuthLayout from '@/components/AuthLayout'
import Wordmark from '@/components/Wordmark'
import PasswordStrength from '@/components/PasswordStrength'
import { signUp } from '@/lib/auth'
import { DISTRICTS } from '@/lib/districts'

export default function SignUp() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    cooperative: '',
    district: '',
  })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value })

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signUp(form)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Could not create your account.')
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <Wordmark className="text-base" />
      <p className="mb-6 mt-1 text-sm text-secondary">Create your account</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" value={form.fullName} onChange={set('fullName')}
            placeholder="Jane Mukamana" required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={form.email} onChange={set('email')}
            placeholder="you@example.com" required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cooperative">Cooperative</Label>
          <Input id="cooperative" value={form.cooperative} onChange={set('cooperative')}
            placeholder="Huye Coffee Cooperative" required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="district">District</Label>
          <Select value={form.district}
            onValueChange={(value) => setForm({ ...form, district: value })}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a district" />
            </SelectTrigger>
            <SelectContent>
              {DISTRICTS.map((name) => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input id="password" type={showPassword ? 'text' : 'password'}
              value={form.password} onChange={set('password')} className="pr-10" required />
            <button type="button" onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary transition-opacity hover:text-primary">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <PasswordStrength value={form.password} />
        </div>

        {error && <p className="text-sm text-risk-high">{error}</p>}

        <Button type="submit" disabled={submitting || !form.district}
          className="w-full bg-accent text-black">
          {submitting ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-secondary">
        Already have an account?{' '}
        <Link to="/signin" className="transition-opacity hover:text-accent">Sign in</Link>
      </p>
    </AuthLayout>
  )
}
