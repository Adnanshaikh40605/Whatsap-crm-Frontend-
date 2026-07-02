import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { canAccessModule } from '../../lib/rbac'

const STAFF_BLOCKED_PATHS = [
  '/whatsapp-crm/dashboard',
  '/whatsapp-crm/templates',
  '/whatsapp-crm/campaigns',
  '/whatsapp-crm/contacts',
  '/whatsapp-crm/contact-groups',
  '/whatsapp-crm/message-logs',
  '/whatsapp-crm/media',
  '/whatsapp-crm/api-settings',
  '/whatsapp-crm/business-profile',
  '/whatsapp-crm/setup-guide',
  '/whatsapp-crm/settings',
  '/sms-crm/dashboard',
  '/sms-crm/templates',
  '/sms-crm/campaigns',
  '/sms-crm/contacts',
  '/sms-crm/contact-groups',
  '/sms-crm/sender-ids',
  '/sms-crm/message-logs',
  '/sms-crm/api-settings',
  '/sms-crm/reports',
  '/admin/companies',
]

function isStaffBlockedPath(pathname: string): boolean {
  return STAFF_BLOCKED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  )
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, organization, loading, isStaff } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500/30 border-t-brand-600" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />

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

  if (isStaff && isStaffBlockedPath(location.pathname)) {
    const inboxPath = organization?.project_type === 'sms'
      ? '/sms-crm/send'
      : '/whatsapp-crm/inbox'
    return <Navigate to={inboxPath} replace />
  }

  if (location.pathname.startsWith('/admin/companies') && !user.is_superuser) {
    return <Navigate to="/projects" replace />
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

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!canAccessModule(user, 'settings')) {
    return <Navigate to="/whatsapp-crm/inbox" replace />
  }
  return <>{children}</>
}
