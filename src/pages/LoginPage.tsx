import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MessageSquare } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/')
    } catch {
      setError('Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-navy text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600">
            <MessageSquare className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold">WhatsFlow</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            WhatsApp templates, contacts, and campaigns
          </h1>
          <p className="mt-4 text-lg text-slate-400">
            Manage approved Meta templates, contact groups, media files, and bulk WhatsApp campaigns from one focused workspace.
          </p>
        </div>
        <p className="text-sm text-slate-500">WhatsApp Business API workspace</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <MessageSquare className="h-7 w-7 text-brand-600" />
            <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>WhatsFlow</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Welcome back</h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Sign in to your account</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Input label="Username" type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username" required autoComplete="username" />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required />
            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100">{error}</p>
            )}
            <Button type="submit" className="w-full" size="lg" loading={loading}>Sign in</Button>
          </form>

          <p className="mt-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
