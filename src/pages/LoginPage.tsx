import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { AppLogo } from '../components/common/AppLogo'
import { FeedbackMessage } from '../components/common/FeedbackMessage'
import { APP_NAME, APP_TAGLINE } from '../lib/branding'

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
        <AppLogo size="md" showName nameClassName="text-white" />
        <div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            {APP_TAGLINE}
          </h1>
          <p className="mt-4 text-lg text-slate-400">
            Manage approved Meta templates, contact groups, media files, and bulk WhatsApp campaigns from one focused workspace.
          </p>
        </div>
        <p className="text-sm text-slate-500">WhatsApp Business API workspace</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
            <AppLogo size="md" showName />
          </div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Welcome back</h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Sign in to your {APP_NAME} account</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Input label="Username" type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username" required autoComplete="username" />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required />
            {error ? (
              <FeedbackMessage variant="error">{error}</FeedbackMessage>
            ) : null}
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
