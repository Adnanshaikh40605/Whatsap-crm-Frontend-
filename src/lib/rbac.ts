export type PlatformRole = 'super_admin' | 'admin' | 'staff'

export type OrgRole =
  | 'owner'
  | 'admin'
  | 'manager'
  | 'agent'
  | 'accountant'
  | 'finance'
  | 'marketing'
  | 'viewer'

const STAFF_ROLES: OrgRole[] = ['agent', 'viewer']

export function isSuperAdmin(user: { is_superuser?: boolean } | null): boolean {
  return Boolean(user?.is_superuser)
}

export function isStaffUser(user: { platform_role?: PlatformRole } | null): boolean {
  return user?.platform_role === 'staff'
}

export function isAdminUser(user: { platform_role?: PlatformRole; is_superuser?: boolean } | null): boolean {
  if (!user) return false
  return user.is_superuser || user.platform_role === 'admin' || user.platform_role === 'super_admin'
}

export function canManageProjects(user: { platform_role?: PlatformRole; is_superuser?: boolean } | null): boolean {
  if (!user) return false
  return isSuperAdmin(user) || user.platform_role === 'admin'
}

export function canEditBusinessProfile(user: {
  is_superuser?: boolean
  org_role?: string
} | null): boolean {
  if (!user) return false
  if (user.is_superuser) return true
  return user.org_role === 'owner' || user.org_role === 'admin'
}

export function canAccessModule(
  user: { platform_role?: PlatformRole; is_superuser?: boolean } | null,
  module: 'inbox' | 'dashboard' | 'settings' | 'campaigns' | 'admin',
): boolean {
  if (!user) return false
  if (isSuperAdmin(user) || user.platform_role === 'admin') return true
  if (user.platform_role === 'staff') return module === 'inbox'
  return false
}

export function staffDefaultPath(projectType: 'whatsapp' | 'sms'): string {
  return projectType === 'sms' ? '/sms-crm/send' : '/whatsapp-crm/inbox'
}

export function isStaffOrgRole(role?: string | null): boolean {
  return STAFF_ROLES.includes(role as OrgRole)
}
