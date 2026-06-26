import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { authApi, orgApi } from '../lib/api'
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
  switchOrganization: (id: string) => Promise<void>
  refreshUser: () => Promise<void>
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
      const [meRes, orgsRes, currentRes] = await Promise.all([
        authApi.me(),
        orgApi.list(),
        orgApi.current().catch(() => null),
      ])
      setUser(meRes.data?.data ?? meRes.data)
      const orgPayload = orgsRes.data
      const orgList = orgPayload.results ?? orgPayload.data ?? orgPayload
      setOrganizations(Array.isArray(orgList) ? orgList : [])
      if (currentRes?.data?.data) {
        setOrganization(currentRes.data.data)
        localStorage.setItem('organization_id', currentRes.data.data.id)
      } else if (Array.isArray(orgList) && orgList.length > 0) {
        setOrganization(orgList[0])
        localStorage.setItem('organization_id', orgList[0].id)
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
    setUser(null)
    setOrganization(null)
    setOrganizations([])
  }

  const switchOrganization = async (id: string) => {
    const { data } = await orgApi.switch(id)
    const org = data.data ?? data
    setOrganization(org)
    setOrganizations((items) => items.map((item) => item.id === org.id ? org : item))
    localStorage.setItem('organization_id', org.id)
  }

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
