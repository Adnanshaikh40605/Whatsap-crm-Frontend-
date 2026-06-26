import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, organization, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500/30 border-t-brand-600" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />

  // Internal mode: skip forced onboarding for superusers / pre-seeded companies
  const skipOnboarding =
    user?.is_superuser ||
    organization?.plan === 'internal' ||
    organization?.onboarding_completed === true

  if (
    organization &&
    !skipOnboarding &&
    organization.onboarding_completed === false &&
    location.pathname !== '/onboarding'
  ) {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500/30 border-t-brand-600" />
      </div>
    )
  }
  if (user) return <Navigate to="/" replace />
  return <>{children}</>
}
