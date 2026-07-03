import { useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  AppBar, Avatar, Box, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon,
  ListItemText, Menu, MenuItem, Toolbar, Tooltip, Typography, ListSubheader, useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard, MessagesSquare, FileText, BarChart2, Megaphone, Settings, Server,
  Building2, Menu as MenuIcon, Sun, Moon, ChevronsUpDown, Check, LogOut, MessageCircle, Users,
  Image, BookOpen, Smartphone, GitBranch, Folder, Store, User,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme as useColorMode } from '../../context/ThemeContext'
import { canAccessModule } from '../../lib/rbac'
import { getApiOrigin } from '../../lib/config'
import { ICON, ICON_STROKE } from '../../lib/icons'

const DRAWER_WIDTH = 260
const API_ORIGIN = getApiOrigin()

type NavItem = { to: string; icon: LucideIcon; label: string; end?: boolean }
type NavSection = { label: string; items: NavItem[] }

function NavIcon({ icon: LucideComponent }: { icon: LucideIcon }) {
  return <LucideComponent size={ICON.md} strokeWidth={ICON_STROKE} />
}

const PROJECT_NAV_SECTIONS: NavSection[] = [
  { label: 'Overview', items: [
    { to: '/projects', icon: Folder, label: 'Projects' },
  ] },
]

const WHATSAPP_NAV_SECTIONS: NavSection[] = [
  { label: 'Overview', items: [
    { to: '/projects', icon: Folder, label: 'Projects' },
    { to: '/whatsapp-crm/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  ] },
  { label: 'Messaging', items: [
    { to: '/whatsapp-crm/inbox', icon: MessagesSquare, label: 'Inbox' },
    { to: '/whatsapp-crm/templates', icon: FileText, label: 'Templates' },
    { to: '/whatsapp-crm/contacts', icon: Users, label: 'Contacts' },
    { to: '/whatsapp-crm/contact-groups', icon: GitBranch, label: 'Contact Groups' },
    { to: '/whatsapp-crm/message-logs', icon: Server, label: 'Message Logs' },
    { to: '/whatsapp-crm/media', icon: Image, label: 'Media' },
  ] },
  { label: 'Growth', items: [
    { to: '/whatsapp-crm/campaigns', icon: Megaphone, label: 'Campaigns' },
  ] },
  { label: 'Admin', items: [
    { to: '/whatsapp-crm/api-settings', icon: MessageCircle, label: 'API Settings' },
    { to: '/whatsapp-crm/business-profile', icon: Store, label: 'Business Profile' },
    { to: '/whatsapp-crm/setup-guide', icon: BookOpen, label: 'Setup Guide' },
    { to: '/whatsapp-crm/settings', icon: Settings, label: 'Settings' },
  ] },
]

const SMS_NAV_SECTIONS: NavSection[] = [
  { label: 'Overview', items: [
    { to: '/projects', icon: Folder, label: 'Projects' },
    { to: '/sms-crm/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  ] },
  { label: 'Messaging', items: [
    { to: '/sms-crm/templates', icon: FileText, label: 'SMS Templates' },
    { to: '/sms-crm/campaigns', icon: Megaphone, label: 'Bulk SMS Campaigns' },
    { to: '/sms-crm/contacts', icon: Users, label: 'Contacts' },
    { to: '/sms-crm/contact-groups', icon: GitBranch, label: 'Contact Groups' },
    { to: '/sms-crm/sender-ids', icon: Smartphone, label: 'Sender IDs' },
    { to: '/sms-crm/message-logs', icon: Server, label: 'Message Logs' },
  ] },
  { label: 'Admin', items: [
    { to: '/sms-crm/api-settings', icon: Settings, label: 'API Settings' },
    { to: '/sms-crm/reports', icon: BarChart2, label: 'Reports' },
  ] },
]

const STAFF_WHATSAPP_NAV: NavSection[] = [
  { label: 'Overview', items: [
    { to: '/projects', icon: Folder, label: 'Projects' },
  ] },
  { label: 'Messaging', items: [
    { to: '/whatsapp-crm/inbox', icon: MessagesSquare, label: 'Inbox' },
  ] },
]

const STAFF_SMS_NAV: NavSection[] = [
  { label: 'Overview', items: [
    { to: '/projects', icon: Folder, label: 'Projects' },
  ] },
  { label: 'Messaging', items: [
    { to: '/sms-crm/send', icon: Smartphone, label: 'Send SMS' },
  ] },
]

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
  const brandName = typeof organization?.branding?.brand_name === 'string' && organization.branding.brand_name.trim()
    ? organization.branding.brand_name
    : 'WhatsFlow'
  const projectType = location.pathname.startsWith('/sms-crm')
    ? 'sms'
    : location.pathname.startsWith('/whatsapp-crm')
      ? 'whatsapp'
      : 'projects'
  const navSections = projectType === 'projects'
    ? PROJECT_NAV_SECTIONS
    : isStaff
      ? projectType === 'sms'
        ? STAFF_SMS_NAV
        : STAFF_WHATSAPP_NAV
      : projectType === 'sms'
        ? SMS_NAV_SECTIONS
        : WHATSAPP_NAV_SECTIONS
  const headerSubtitle = projectType === 'sms'
    ? 'SMS templates, DLT setup, sender IDs, campaigns, and reports'
    : projectType === 'whatsapp'
      ? 'WhatsApp templates, contacts, media, and campaigns'
      : 'Select a CRM project'
  const brandSubtitle = projectType === 'sms'
    ? 'SMS Business'
    : projectType === 'projects'
      ? 'CRM Projects'
      : 'WhatsApp Business'
  const logoSrc = organization?.logo
    ? organization.logo.startsWith('http')
      ? organization.logo
      : `${API_ORIGIN}${organization.logo}`
    : ''

  useEffect(() => {
    if (organizations && organizations.length === 0) {
      navigate('/projects')
    }
  }, [organizations, navigate])

  const handleLogout = () => { logout(); navigate('/login') }

  const navItem = (item: NavItem) => (
    <ListItemButton
      key={item.to}
      component={NavLink}
      to={item.to}
      end={item.end}
      onClick={() => setMobileOpen(false)}
      sx={{
        px: 1.5, py: 1, mb: 0.25,
        color: 'text.secondary',
        '&.active': {
          bgcolor: '#0A1317', color: '#ffffff',
          '& .MuiListItemIcon-root': { color: '#ffffff' },
          fontWeight: 600,
        },
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <ListItemIcon sx={{ minWidth: 34, color: 'text.secondary' }}>
        <NavIcon icon={item.icon} />
      </ListItemIcon>
      <ListItemText slotProps={{ primary: { sx: { fontSize: 14, fontWeight: 500 } } }}>{item.label}</ListItemText>
    </ListItemButton>
  )

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      <Box sx={{ height: 72, display: 'flex', alignItems: 'center', gap: 1.25, px: 2.5, flexShrink: 0 }}>
        <Avatar onClick={() => navigate('/projects')} sx={{ bgcolor: 'primary.main', width: 36, height: 36, cursor: 'pointer' }}>
          {logoSrc ? (
            <Box component="img" src={logoSrc} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <MessageCircle size={ICON.sm} strokeWidth={ICON_STROKE} color="#fff" />
          )}
        </Avatar>
        <Box onClick={() => navigate('/projects')} sx={{ cursor: 'pointer' }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16, lineHeight: 1.1 }}>{brandName}</Typography>
          <Typography variant="caption" color="text.secondary">{brandSubtitle}</Typography>
        </Box>
      </Box>
      <Divider />

      <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 1.5 }}>
        {navSections.map((section) => (
          <List
            key={section.label}
            dense
            subheader={
              <ListSubheader disableSticky sx={{
                bgcolor: 'transparent', color: 'text.disabled', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 2.2, px: 1.5,
              }}>
                {section.label}
              </ListSubheader>
            }
            sx={{ mb: 0.5 }}
          >
            {section.items.map(navItem)}
          </List>
        ))}
      </Box>

      <Divider />
      <Box sx={{ p: 1.5, flexShrink: 0 }}>
        <ListItemButton onClick={(e) => setUserAnchor(e.currentTarget)} sx={{ px: 1, py: 1 }}>
          <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.light', color: 'primary.main', fontSize: 13, fontWeight: 700, mr: 1 }}>
            {user?.first_name?.[0]?.toUpperCase() || 'U'}
          </Avatar>
          <ListItemText
            primary={user?.full_name || user?.email}
            secondary={organization?.name}
            slotProps={{
              primary: { noWrap: true, sx: { fontSize: 13, fontWeight: 600 } },
              secondary: { noWrap: true, sx: { fontSize: 11 } },
            }}
          />
          <ChevronsUpDown size={ICON.sm} strokeWidth={ICON_STROKE} color={theme.palette.text.disabled} />
        </ListItemButton>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Box component="nav" sx={{ width: { lg: DRAWER_WIDTH }, flexShrink: { lg: 0 } }}>
        <Drawer
          variant={isDesktop ? 'permanent' : 'temporary'}
          open={isDesktop ? true : mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH, boxSizing: 'border-box',
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AppBar
          position="static"
          color="inherit"
          sx={{ borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper' }}
        >
          <Toolbar sx={{ minHeight: 72, gap: 1, px: { xs: 2, lg: 4 } }}>
            {!isDesktop && (
              <IconButton edge="start" onClick={() => setMobileOpen(true)} aria-label="Open menu">
                <MenuIcon size={ICON.lg} strokeWidth={ICON_STROKE} />
              </IconButton>
            )}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" color="text.secondary" noWrap>
                {headerSubtitle}
              </Typography>
            </Box>

            <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
              <IconButton onClick={toggleTheme} aria-label="Toggle theme">
                {mode === 'dark' ? (
                  <Sun size={ICON.md} strokeWidth={ICON_STROKE} />
                ) : (
                  <Moon size={ICON.md} strokeWidth={ICON_STROKE} />
                )}
              </IconButton>
            </Tooltip>

            <IconButton onClick={(e) => setOrgAnchor(e.currentTarget)} sx={{ borderRadius: 100, px: 2, gap: 0.75, border: '1px solid', borderColor: 'divider' }}>
              <Building2 size={ICON.sm} strokeWidth={ICON_STROKE} color={theme.palette.text.secondary} />
              <Typography variant="body2" noWrap sx={{ fontWeight: 600, maxWidth: 120, display: { xs: 'none', sm: 'block' } }}>
                {organization?.name}
              </Typography>
              <ChevronsUpDown size={ICON.sm} strokeWidth={ICON_STROKE} color={theme.palette.text.disabled} />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flex: 1, overflowY: 'auto', bgcolor: 'background.default', p: { xs: 2, lg: 4 } }}>
          <Outlet />
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
          <ListItemIcon><Building2 size={ICON.sm} strokeWidth={ICON_STROKE} /></ListItemIcon> Projects
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
