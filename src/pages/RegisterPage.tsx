import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { AppLogo } from '../components/common/AppLogo'
import { FeedbackMessage } from '../components/common/FeedbackMessage'

export function RegisterPage() {
  const { register } = useAuth()
  const [form, setForm] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    organization_name: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
    } catch {
      setError('Registration failed. Username may already be in use.')
    } finally {
      setLoading(false)
    }
  }

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  return (
    <div className="flex min-h-screen items-center justify-center p-8 bg-slate-950">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex items-center justify-center">
          <AppLogo size="md" showName nameClassName="text-white" />
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8">
          <h2 className="text-2xl font-bold text-white">Start your free trial</h2>
          <p className="mt-1 text-slate-400">Create your organization and get started in minutes</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              label="Organization name"
              value={form.organization_name}
              onChange={update('organization_name')}
              placeholder="Acme Corp"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First name"
                value={form.first_name}
                onChange={update('first_name')}
                required
              />
              <Input
                label="Last name"
                value={form.last_name}
                onChange={update('last_name')}
              />
            </div>
            <Input
              label="Username"
              type="text"
              value={form.username}
              onChange={update('username')}
              required
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={update('password')}
              placeholder="Min 8 characters"
              required
              minLength={8}
            />
            {error ? (
              <FeedbackMessage variant="error">{error}</FeedbackMessage>
            ) : null}
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-brand-400 hover:text-brand-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
