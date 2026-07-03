import { useQuery } from '@tanstack/react-query'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, ListItemButton, Stack, Typography, Avatar } from '@mui/material'
import {
  MessagesSquare, Megaphone, FileText, MessageCircle, Users, Image,
  BookOpen, User, Lock, Store, BadgeCheck,
} from 'lucide-react'
import { campaignApi, crmApi, whatsappCrmApi } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { PageHeader, StatCard, AppCard } from '../components/common'
import { formatDate, formatNumber } from '../lib/utils'
import { Icon } from '../components/ui/Icon'
import { ICON } from '../lib/icons'

export function DashboardPage() {
  const { organization } = useAuth()
  const apiStatus = organization?.whatsapp_api_status || (organization?.whatsapp_connected ? 'live' : 'not_connected')
  const isLive = apiStatus === 'live'
  const isPending = apiStatus === 'pending'
  const statusLabel = isLive ? 'LIVE' : isPending ? 'PENDING' : 'NOT CONNECTED'
  const statusColor = isLive ? 'success.main' : isPending ? 'warning.main' : 'text.secondary'

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignApi.list().then((r) => r.data.results ?? r.data.data ?? r.data),
  })
  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => campaignApi.templates().then((r) => r.data.results ?? r.data.data ?? r.data),
  })
  const { data: contacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => crmApi.contacts().then((r) => r.data.results ?? r.data.data ?? r.data),
  })
  const { data: businessProfileData } = useQuery({
    queryKey: ['business-profile'],
    queryFn: () => whatsappCrmApi.getBusinessProfile().then((r) => r.data.data ?? r.data),
    enabled: isLive,
    retry: false,
  })

  const campaignList = (campaigns as unknown[]) ?? []
  const templateList = (templates as unknown[]) ?? []
  const contactList = (contacts as unknown[]) ?? []
  const businessProfile = businessProfileData?.profile as {
    business_name?: string
    phone_number?: string
    vertical_label?: string
    quality_rating?: string
    profile_picture_url?: string
    code_verification_status?: string
    last_synced_at?: string
  } | undefined

  const qualityText = (() => {
    const q = String(businessProfile?.quality_rating || '').toUpperCase()
    if (q === 'GREEN' || q === 'HIGH') return 'High'
    if (q === 'YELLOW' || q === 'MEDIUM') return 'Medium'
    if (q === 'RED' || q === 'LOW') return 'Low'
    return 'Unknown'
  })()

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <PageHeader
        title={organization?.name ?? 'Dashboard'}
        subtitle="Simple workspace for WhatsApp templates, campaigns, and customer replies"
        actions={
          <>
            {!isLive && (
              <Button component={RouterLink} to="/whatsapp-crm/api-settings" variant="contained">
                {isPending ? 'Complete WhatsApp Setup' : 'Connect WhatsApp'}
              </Button>
            )}
          </>
        }
      />

      <AppCard sx={{ mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="subtitle1">WhatsApp Business API Status</Typography>
            <Typography variant="body2" color="text.secondary">
              {organization?.whatsapp_setup_status || (isLive ? 'Cloud API credentials are configured.' : 'Connect your Meta Cloud API credentials.')}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: statusColor }}>{statusLabel}</Typography>
            {organization?.whatsapp_phone_number_id ? (
              <Typography variant="caption" color="text.secondary">Phone ID: {organization.whatsapp_phone_number_id}</Typography>
            ) : null}
          </Stack>
        </Stack>
      </AppCard>

      {isLive && businessProfile && (
        <AppCard title="Business Profile" subtitle="Your WhatsApp Business identity on Meta" sx={{ mb: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Avatar src={businessProfile.profile_picture_url || undefined} sx={{ width: 56, height: 56, bgcolor: 'primary.light' }}>
                <Store size={ICON.lg} strokeWidth={1.75} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{businessProfile.business_name || organization?.name}</Typography>
                <Typography variant="body2" color="text.secondary">{businessProfile.phone_number || '—'}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5, alignItems: 'center' }}>
                  <BadgeCheck size={ICON.sm} strokeWidth={1.75} color="#16a34a" />
                  <Typography variant="caption" color="success.main">
                    {businessProfile.code_verification_status === 'VERIFIED' ? 'Business Verified' : 'Profile Live'}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, auto)' }, gap: 2 }}>
              <Box><Typography variant="caption" color="text.secondary">Category</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{businessProfile.vertical_label || '—'}</Typography></Box>
              <Box><Typography variant="caption" color="text.secondary">Quality</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{qualityText}</Typography></Box>
              <Box><Typography variant="caption" color="text.secondary">Status</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>Live</Typography></Box>
              <Box><Typography variant="caption" color="text.secondary">Last Synced</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{businessProfile.last_synced_at ? formatDate(businessProfile.last_synced_at) : '—'}</Typography></Box>
            </Box>
            <Button component={RouterLink} to="/whatsapp-crm/business-profile" variant="outlined">
              Edit Profile
            </Button>
          </Stack>
        </AppCard>
      )}

      {/* KPI Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', xl: 'repeat(4,1fr)' }, gap: 2, mb: 3 }}>
        <StatCard label="WhatsApp" value={statusLabel} caption="Business API" icon={<Icon icon={MessageCircle} size="md" />} />
        <StatCard label="Templates" value={formatNumber(templateList.length)} caption="message templates" icon={<Icon icon={FileText} size="md" />} />
        <StatCard label="Contacts" value={formatNumber(contactList.length)} caption="saved contacts" icon={<Icon icon={Users} size="md" />} />
        <StatCard label="Campaigns" value={formatNumber(campaignList.length)} caption="created" icon={<Icon icon={Megaphone} size="md" />} />
      </Box>

      <AppCard title="Start here" subtitle="The only core actions for now">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3,1fr)' }, gap: 2 }}>
          {[
            { to: '/whatsapp-crm/setup-guide', icon: <Icon icon={BookOpen} size="md" />, label: 'Connect WhatsApp API', help: 'Step-by-step Meta setup guide' },
            { to: '/whatsapp-crm/templates', icon: <Icon icon={FileText} size="md" />, label: 'Create template', help: 'Build and manage WhatsApp templates' },
            { to: '/whatsapp-crm/contacts', icon: <Icon icon={Users} size="md" />, label: 'Import contacts', help: 'Upload CSV or Excel and group contacts' },
            { to: '/whatsapp-crm/campaigns', icon: <Icon icon={Megaphone} size="md" />, label: 'Create campaign', help: 'Send approved templates to contacts' },
            { to: '/whatsapp-crm/media', icon: <Icon icon={Image} size="md" />, label: 'Upload media', help: 'Store images, videos, PDFs, and documents' },
            { to: '/whatsapp-crm/inbox', icon: <Icon icon={MessagesSquare} size="md" />, label: 'Open inbox', help: 'Reply to customers on WhatsApp' },
          ].map((a) => (
            <ListItemButton
              key={a.to}
              component={RouterLink}
              to={a.to}
              sx={{ alignItems: 'flex-start', gap: 1.5, p: 2.5, bgcolor: 'action.hover', borderRadius: 2 }}
            >
            <Box sx={{ color: 'primary.main', mt: 0.25 }}>{a.icon}</Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{a.label}</Typography>
                <Typography variant="caption" color="text.secondary">{a.help}</Typography>
              </Box>
            </ListItemButton>
          ))}
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }}>
          <Button component={RouterLink} to="/whatsapp-crm/templates" variant="contained">Create template</Button>
          <Button component={RouterLink} to="/whatsapp-crm/contacts" variant="outlined">Import contacts</Button>
          <Button component={RouterLink} to="/whatsapp-crm/campaigns" variant="outlined">Create campaign</Button>
        </Stack>
      </AppCard>

      <AppCard title="Account Settings" subtitle="Manage your profile and password securely">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <ListItemButton
            component={RouterLink}
            to="/whatsapp-crm/settings/account"
            sx={{ alignItems: 'flex-start', gap: 1.5, p: 2.5, bgcolor: 'action.hover', borderRadius: 2 }}
          >
            <Box sx={{ color: 'primary.main', mt: 0.25 }}><Icon icon={User} size="md" /></Box>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>Edit User Profile</Typography>
              <Typography variant="caption" color="text.secondary">Update your name, username, and phone</Typography>
            </Box>
          </ListItemButton>
          <ListItemButton
            component={RouterLink}
            to="/whatsapp-crm/settings/account"
            sx={{ alignItems: 'flex-start', gap: 1.5, p: 2.5, bgcolor: 'action.hover', borderRadius: 2 }}
          >
            <Box sx={{ color: 'primary.main', mt: 0.25 }}><Icon icon={Lock} size="md" /></Box>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>Change Password</Typography>
              <Typography variant="caption" color="text.secondary">Update your login password</Typography>
            </Box>
          </ListItemButton>
        </Box>
      </AppCard>
    </Box>
  )
}
