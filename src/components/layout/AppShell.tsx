import { useState, useEffect, useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  AppBar, Box, Divider, Drawer, IconButton, ListItemIcon,
  ListItemText, Menu, MenuItem, Toolbar, Tooltip, Typography, useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import {
  LayoutGrid, MessageSquare, FileText, BarChart2, Send, Settings,
  Building2, Menu as MenuIcon, Sun, Moon, ChevronsUpDown, Check, LogOut,
  Image, BookOpen, Smartphone, GitBranch, CircleDashed, Store, User, History, Code2,
  ContactRound,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme as useColorMode } from '../../context/ThemeContext'
import { canAccessModule } from '../../lib/rbac'
import { ICON, ICON_STROKE } from '../../lib/icons'
import { CrmIconRail, RAIL_WIDTH, type RailItem } from './CrmIconRail'
import { PageShell } from './PageShell'

type NavSection = { items: RailItem[]; bottom?: RailItem[] }

const WHATSAPP_NAV: NavSection = {
  items: [
    { to: '/whatsapp-crm/dashboard', icon: LayoutGrid, label: 'Dashboard' },
    { to: '/whatsapp-crm/inbox', icon: MessageSquare, label: 'Live Chat' },
    { to: '/whatsapp-crm/message-logs', icon: History, label: 'History' },
    { to: '/whatsapp-crm/contacts', icon: ContactRound, label: 'Contacts' },
    { to: '/whatsapp-crm/campaigns', icon: Send, label: 'Campaigns' },
    { to: '/whatsapp-crm/contact-groups', icon: GitBranch, label: 'Flows' },
    { to: '/whatsapp-crm/templates', icon: FileText, label: 'Templates' },
    { to: '/whatsapp-crm/media', icon: Image, label: 'Media' },
    { to: '/whatsapp-crm/business-profile', icon: Store, label: 'Profile' },
    { to: '/whatsapp-crm/setup-guide', icon: BookOpen, label: 'Guide' },
    { to: '/whatsapp-crm/settings', icon: Settings, label: 'Manage' },
  ],
  bottom: [
    { to: '/whatsapp-crm/api-settings', icon: Code2, label: 'Developer' },
    { to: '/projects', icon: CircleDashed, label: 'All Projects', end: true },
  ],
}

const SMS_NAV: NavSection = {
  items: [
    { to: '/sms-crm/dashboard', icon: LayoutGrid, label: 'Dashboard' },
    { to: '/sms-crm/message-logs', icon: History, label: 'History' },
    { to: '/sms-crm/contacts', icon: ContactRound, label: 'Contacts' },
    { to: '/sms-crm/campaigns', icon: Send, label: 'Campaigns' },
    { to: '/sms-crm/contact-groups', icon: GitBranch, label: 'Flows' },
    { to: '/sms-crm/templates', icon: FileText, label: 'Templates' },
    { to: '/sms-crm/sender-ids', icon: Smartphone, label: 'Senders' },
    { to: '/sms-crm/reports', icon: BarChart2, label: 'Reports' },
    { to: '/sms-crm/settings', icon: Settings, label: 'Manage' },
  ],
  bottom: [
    { to: '/sms-crm/api-settings', icon: Code2, label: 'Developer' },
    { to: '/projects', icon: CircleDashed, label: 'All Projects', end: true },
  ],
}

const PROJECTS_NAV: NavSection = {
  items: [
    { to: '/projects', icon: CircleDashed, label: 'All Projects', end: true },
  ],
}

const STAFF_WHATSAPP_NAV: NavSection = {
  items: [
    { to: '/whatsapp-crm/inbox', icon: MessageSquare, label: 'Live Chat' },
  ],
  bottom: [
    { to: '/projects', icon: CircleDashed, label: 'All Projects', end: true },
  ],
}

const STAFF_SMS_NAV: NavSection = {
  items: [
    { to: '/sms-crm/send', icon: Smartphone, label: 'Send SMS' },
  ],
  bottom: [
    { to: '/projects', icon: CircleDashed, label: 'All Projects', end: true },
  ],
}

export function AppShell() {
  const { user, organization, organizations, logout, switchOrganization, isStaff } = useAuth()
  const { theme: mode, toggleTheme } = useColorMode()
  const theme = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [orgAnchor, setOrgAnchor] = useState<null | HTMLElement>(null)
  const [userAnchor, setUserAnchor] = useState<null | HTMLElement>(null)

  const projectType = location.pathname.startsWith('/sms-crm')
    ? 'sms'
    : location.pathname.startsWith('/whatsapp-crm')
      ? 'whatsapp'
      : 'projects'

  const nav = useMemo((): NavSection => {
    if (projectType === 'projects') return PROJECTS_NAV
    if (isStaff) return projectType === 'sms' ? STAFF_SMS_NAV : STAFF_WHATSAPP_NAV
    return projectType === 'sms' ? SMS_NAV : WHATSAPP_NAV
  }, [projectType, isStaff])

  const headerSubtitle = projectType === 'sms'
    ? 'SMS templates, DLT setup, sender IDs, campaigns, and reports'
    : projectType === 'whatsapp'
      ? 'WhatsApp templates, contacts, media, and campaigns'
      : 'Select a CRM project'

  const isInboxRoute = location.pathname === '/whatsapp-crm/inbox'
  const showTopBar = !isInboxRoute || !isDesktop
  const mainPadding = isInboxRoute ? 0 : { xs: 1.5, lg: 2 }

  useEffect(() => {
    if (organizations && organizations.length === 0) {
      navigate('/projects')
    }
  }, [organizations, navigate])

  const handleLogout = () => { logout(); navigate('/login') }

  const rail = (
    <CrmIconRail
      mainItems={nav.items}
      bottomItems={nav.bottom}
      onLogoClick={() => navigate('/projects')}
      userInitial={user?.first_name?.[0]?.toUpperCase() || 'U'}
      onUserClick={(e) => setUserAnchor(e.currentTarget)}
      onNavigate={() => setMobileOpen(false)}
    />
  )

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Box component="nav" sx={{ width: { lg: RAIL_WIDTH }, flexShrink: { lg: 0 } }}>
        <Drawer
          variant={isDesktop ? 'permanent' : 'temporary'}
          open={isDesktop ? true : mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: RAIL_WIDTH,
              boxSizing: 'border-box',
              borderRight: 'none',
              overflow: 'hidden',
            },
          }}
        >
          {rail}
        </Drawer>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {showTopBar && (
          <AppBar
            position="static"
            color="inherit"
            elevation={0}
            sx={{ borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper' }}
          >
            <Toolbar sx={{ minHeight: 56, gap: 1, px: mainPadding }}>
              {!isDesktop && (
                <IconButton edge="start" onClick={() => setMobileOpen(true)} aria-label="Open menu">
                  <MenuIcon size={ICON.lg} strokeWidth={ICON_STROKE} />
                </IconButton>
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" color="text.secondary" noWrap sx={{ fontSize: 13 }}>
                  {headerSubtitle}
                </Typography>
              </Box>

              <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
                <IconButton onClick={toggleTheme} aria-label="Toggle theme" size="small">
                  {mode === 'dark' ? (
                    <Sun size={ICON.md} strokeWidth={ICON_STROKE} />
                  ) : (
                    <Moon size={ICON.md} strokeWidth={ICON_STROKE} />
                  )}
                </IconButton>
              </Tooltip>

              <IconButton
                onClick={(e) => setOrgAnchor(e.currentTarget)}
                size="small"
                sx={{ borderRadius: 100, px: 1.5, gap: 0.5, border: '1px solid', borderColor: 'divider' }}
              >
                <Building2 size={ICON.sm} strokeWidth={ICON_STROKE} color={theme.palette.text.secondary} />
                <Typography variant="body2" noWrap sx={{ fontWeight: 600, maxWidth: 120, display: { xs: 'none', sm: 'block' }, fontSize: 13 }}>
                  {organization?.name}
                </Typography>
                <ChevronsUpDown size={ICON.sm} strokeWidth={ICON_STROKE} color={theme.palette.text.disabled} />
              </IconButton>
            </Toolbar>
          </AppBar>
        )}

        {!showTopBar && !isDesktop && (
          <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 10 }}>
            <IconButton
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              sx={{ bgcolor: 'background.paper', boxShadow: 1 }}
              size="small"
            >
              <MenuIcon size={ICON.md} strokeWidth={ICON_STROKE} />
            </IconButton>
          </Box>
        )}

        <Box
          component="main"
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: isInboxRoute ? 'hidden' : 'auto',
            bgcolor: 'background.default',
            p: mainPadding,
            position: 'relative',
          }}
        >
          {isInboxRoute ? <Outlet /> : (
            <PageShell>
              <Outlet />
            </PageShell>
          )}
        </Box>
      </Box>

      <Menu anchorEl={orgAnchor} open={Boolean(orgAnchor)} onClose={() => setOrgAnchor(null)}>
        <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 0.5, display: 'block', fontWeight: 700 }}>
          Switch company
        </Typography>
        {organizations.map((org) => (
          <MenuItem key={org.id} selected={org.id === organization?.id}
            onClick={async () => {
              setOrgAnchor(null)
              if (org.has_project_password && !user?.is_superuser) {
                navigate('/projects')
                return
              }
              try {
                await switchOrganization(org.id)
              } catch {
                navigate('/projects')
              }
            }}>
            <ListItemText>{org.name}</ListItemText>
            {org.id === organization?.id && (
              <Check size={ICON.sm} strokeWidth={ICON_STROKE} color={theme.palette.primary.main} style={{ marginLeft: 16 }} />
            )}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem onClick={() => { setOrgAnchor(null); navigate('/projects') }}>
          <ListItemIcon><CircleDashed size={ICON.sm} strokeWidth={ICON_STROKE} /></ListItemIcon> All Projects
        </MenuItem>
      </Menu>

      <Menu anchorEl={userAnchor} open={Boolean(userAnchor)} onClose={() => setUserAnchor(null)}>
        <MenuItem onClick={() => { setUserAnchor(null); navigate('/whatsapp-crm/settings/account') }}>
          <ListItemIcon><User size={ICON.sm} strokeWidth={ICON_STROKE} /></ListItemIcon> Account Settings
        </MenuItem>
        {canAccessModule(user, 'settings') ? (
          <MenuItem onClick={() => { setUserAnchor(null); navigate('/whatsapp-crm/settings') }}>
            <ListItemIcon><Settings size={ICON.sm} strokeWidth={ICON_STROKE} /></ListItemIcon> Project Settings
          </MenuItem>
        ) : null}
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon><LogOut size={ICON.sm} strokeWidth={ICON_STROKE} color={theme.palette.error.main} /></ListItemIcon> Log out
        </MenuItem>
      </Menu>
    </Box>
  )
}
