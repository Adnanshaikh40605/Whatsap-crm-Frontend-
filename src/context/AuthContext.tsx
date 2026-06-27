import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { authApi, orgApi } from '../lib/api'
import { isStaffUser, staffDefaultPath } from '../lib/rbac'
import type { Organization, User } from '../types'

interface AuthContextType {
  user: User | null
  organization: Organization | null
  organizations: Organization[]
  loading: boolean
  login: (name: string, password: string) => Promise<void>
  register: (data: {
    username: string
    password: string
    first_name: string
    last_name: string
    organization_name: string
  }) => Promise<void>
  logout: () => void
  switchOrganization: (id: string, projectPassword?: string) => Promise<Organization>
  refreshUser: () => Promise<void>
  isStaff: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)

  const loadSession = async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const orgId = localStorage.getItem('organization_id')
      const [meRes, orgsRes, currentRes] = await Promise.all([
        authApi.me(),
        orgApi.list(),
        orgId ? orgApi.current().catch(() => null) : Promise.resolve(null),
      ])
      const meUser = meRes.data?.data ?? meRes.data
      setUser(meUser)
      const orgPayload = orgsRes.data
      const orgList = orgPayload.results ?? orgPayload.data ?? orgPayload
      setOrganizations(Array.isArray(orgList) ? orgList : [])
      if (currentRes?.data?.data) {
        setOrganization(currentRes.data.data)
        localStorage.setItem('organization_id', currentRes.data.data.id)
      } else if (Array.isArray(orgList) && orgList.length > 0) {
        setOrganization(orgList[0])
        localStorage.setItem('organization_id', orgList[0].id)
      } else {
        setOrganization(null)
      }
    } catch {
      localStorage.clear()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSession()
  }, [])

  const login = async (name: string, password: string) => {
    const { data } = await authApi.login(name, password)
    const payload = data.data ?? data
    const tokens = payload.tokens ?? payload
    if (!tokens?.access || !tokens?.refresh) {
      throw new Error('Invalid login response')
    }
    localStorage.setItem('access_token', tokens.access)
    localStorage.setItem('refresh_token', tokens.refresh)
    await loadSession()
  }

  const register = async (payload: {
    username: string
    password: string
    first_name: string
    last_name: string
    organization_name: string
  }) => {
    const { data } = await authApi.register(payload)
    const tokens = data.data.tokens
    localStorage.setItem('access_token', tokens.access)
    localStorage.setItem('refresh_token', tokens.refresh)
    setUser(data.data.user)
    await loadSession()
  }

  const logout = () => {
    localStorage.clear()
    sessionStorage.clear()
    setUser(null)
    setOrganization(null)
    setOrganizations([])
  }

  const switchOrganization = async (id: string, projectPassword?: string) => {
    localStorage.setItem('organization_id', id)
    const { data } = await orgApi.switch(id, projectPassword)
    const org = data.data ?? data
    setOrganization(org)
    setOrganizations((items) => {
      const exists = items.some((item) => item.id === org.id)
      return exists ? items.map((item) => (item.id === org.id ? org : item)) : [...items, org]
    })
    localStorage.setItem('organization_id', org.id)
    const meRes = await authApi.me()
    setUser(meRes.data?.data ?? meRes.data)
    return org
  }

  const isSuperAdmin = Boolean(user?.is_superuser)
  const isStaff = isStaffUser(user)
  const isAdmin = Boolean(user && (isSuperAdmin || user.platform_role === 'admin'))

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        organizations,
        loading,
        login,
        register,
        logout,
        switchOrganization,
        refreshUser: loadSession,
        isStaff,
        isAdmin,
        isSuperAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export { staffDefaultPath }
