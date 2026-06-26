import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, MessageSquare, Bot, Users, Megaphone, FileText,
  Zap, BarChart3, Settings, LogOut, ChevronDown, Moon, Sun, Menu, X, Check, Building2, Smartphone,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { AICommandBar } from '../ui/AICommandBar'
import { cn } from '../../lib/utils'
import { useState } from 'react'

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { to: '/whatsapp-crm/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
      { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    ],
  },
  {
    label: 'Messaging',
    items: [
      { to: '/whatsapp-crm/inbox', icon: MessageSquare, label: 'Inbox' },
      { to: '/sms-crm/dashboard', icon: Smartphone, label: 'SMS CRM' },
      { to: '/whatsapp-crm/templates', icon: FileText, label: 'Templates' },
    ],
  },
  {
    label: 'Growth',
    items: [
      { to: '/whatsapp-crm/contacts', icon: Users, label: 'Contacts' },
      { to: '/whatsapp-crm/campaigns', icon: Megaphone, label: 'Campaigns' },
      { to: '/whatsapp-crm/automation', icon: Zap, label: 'Automations' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { to: '/ai-agent', icon: Bot, label: 'AI Agents' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { to: '/whatsapp-crm/settings', icon: Settings, label: 'Settings' },
    ],
  },
]

export function DashboardLayout() {
  const { user, organization, organizations, logout, switchOrganization } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const isInbox = location.pathname === '/inbox'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [orgMenuOpen, setOrgMenuOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const navLink = (item: { to: string; icon: typeof LayoutDashboard; label: string; end?: boolean }) => (
    <NavLink key={item.to} to={item.to} end={item.end}
      onClick={() => setSidebarOpen(false)}
      className={({ isActive }) => cn(
        'flex items-center gap-2.5 rounded-[50px] px-3 py-2 text-[13px] font-medium transition-all duration-150',
        isActive
          ? 'bg-brand-600 text-white'
          : 'hover:bg-[var(--hover)]',
      )}
      style={{ color: undefined }}>
      {({ isActive }) => (
        <>
          <item.icon className="h-4 w-4 shrink-0" style={{ color: isActive ? '#fff' : 'var(--text-secondary)' }} />
          <span style={{ color: isActive ? '#fff' : 'var(--text-secondary)' }}>{item.label}</span>
        </>
      )}
    </NavLink>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col border-r transition-transform duration-200 lg:static lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      )} style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--border)' }}>
        <div className="flex h-14 items-center gap-2.5 px-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white">
            <MessageSquare className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-[13px] font-bold leading-none" style={{ color: 'var(--text-primary)' }}>WhatsFlow</p>
            <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>Growth OS</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="mb-4">
              <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map(navLink)}
              </div>
            </div>
          ))}
          {user?.is_superuser && (
            <div className="mb-4">
              <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Platform</p>
              <NavLink to="/admin/companies" onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => cn(
                  'flex items-center gap-2.5 rounded-[50px] px-3 py-2 text-[13px] font-medium transition-all',
                  isActive ? 'bg-brand-600 text-white' : 'hover:bg-[var(--hover)]',
                )}>
                <Building2 className="h-4 w-4" /> <span style={{ color: 'var(--text-secondary)' }}>Companies</span>
              </NavLink>
            </div>
          )}
        </nav>

        <div className="border-t p-3" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2 rounded-[50px] px-2 py-2 surface-interactive">
            <div className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold"
              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
              {user?.first_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.full_name}</p>
              <p className="truncate text-[10px]" style={{ color: 'var(--text-muted)' }}>{organization?.name}</p>
            </div>
            <button onClick={handleLogout} className="rounded-[50px] p-1.5 hover:bg-[var(--hover)]">
              <LogOut className="h-3.5 w-3.5 text-red-500" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 lg:px-5"
          style={{ background: 'var(--header-bg)', borderColor: 'var(--border-subtle)' }}>
          <button className="rounded-[50px] p-2 hover:bg-[var(--hover)] lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-4 w-4" style={{ color: 'var(--text-primary)' }} />
          </button>

          <AICommandBar />

          <div className="ml-auto flex items-center gap-1.5">
            <button onClick={toggleTheme} className="rounded-[50px] p-2 hover:bg-[var(--hover)] transition-colors">
              {theme === 'dark'
                ? <Sun className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                : <Moon className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />}
            </button>

            <div className="relative">
              <button onClick={() => setOrgMenuOpen(!orgMenuOpen)}
                className="flex items-center gap-1.5 rounded-[50px] border px-2.5 py-1.5 text-xs font-medium hover:bg-[var(--hover)] transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                <span className="hidden sm:inline max-w-[100px] truncate">{organization?.name}</span>
                <ChevronDown className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
              </button>
              {orgMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-1.5 w-52 rounded-[20px] border py-1 animate-fade-in"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-lg)' }}>
                  <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Switch company</p>
                  {organizations.map((org) => (
                    <button key={org.id} onClick={() => { switchOrganization(org.id); setOrgMenuOpen(false) }}
                      className="flex w-full items-center justify-between px-3 py-2 text-sm surface-interactive"
                      style={{ color: 'var(--text-primary)' }}>
                      {org.name}
                      {org.id === organization?.id && <Check className="h-3.5 w-3.5 text-brand-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className={cn('flex-1', isInbox ? 'overflow-hidden' : 'overflow-y-auto px-4 py-5 lg:px-6 lg:py-6')}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
