import { useQuery } from '@tanstack/react-query'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, ListItemButton, Stack, Typography } from '@mui/material'
import {
  ForumOutlined, CampaignOutlined, DescriptionOutlined, WhatsApp, GroupsOutlined, PermMediaOutlined,
  MenuBookOutlined,
} from '@mui/icons-material'
import { campaignApi, crmApi } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { PageHeader, StatCard, AppCard } from '../components/common'
import { formatNumber } from '../lib/utils'

export function DashboardPage() {
  const { organization } = useAuth()

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

  const campaignList = (campaigns as unknown[]) ?? []
  const templateList = (templates as unknown[]) ?? []
  const contactList = (contacts as unknown[]) ?? []
  const apiStatus = organization?.whatsapp_api_status || (organization?.whatsapp_connected ? 'live' : 'not_connected')
  const isLive = apiStatus === 'live'
  const isPending = apiStatus === 'pending'
  const statusLabel = isLive ? 'LIVE' : isPending ? 'PENDING' : 'NOT CONNECTED'
  const statusColor = isLive ? 'success.main' : isPending ? 'warning.main' : 'text.secondary'

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

      {/* KPI Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', xl: 'repeat(4,1fr)' }, gap: 2, mb: 3 }}>
        <StatCard label="WhatsApp" value={statusLabel} caption="Business API" icon={<WhatsApp />} />
        <StatCard label="Templates" value={formatNumber(templateList.length)} caption="message templates" icon={<DescriptionOutlined />} />
        <StatCard label="Contacts" value={formatNumber(contactList.length)} caption="saved contacts" icon={<GroupsOutlined />} />
        <StatCard label="Campaigns" value={formatNumber(campaignList.length)} caption="created" icon={<CampaignOutlined />} />
      </Box>

      <AppCard title="Start here" subtitle="The only core actions for now">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3,1fr)' }, gap: 2 }}>
          {[
            { to: '/whatsapp-crm/setup-guide', icon: <MenuBookOutlined />, label: 'Connect WhatsApp API', help: 'Step-by-step Meta setup guide' },
            { to: '/whatsapp-crm/templates', icon: <DescriptionOutlined />, label: 'Create template', help: 'Build and manage WhatsApp templates' },
            { to: '/whatsapp-crm/contacts', icon: <GroupsOutlined />, label: 'Import contacts', help: 'Upload CSV or Excel and group contacts' },
            { to: '/whatsapp-crm/campaigns', icon: <CampaignOutlined />, label: 'Create campaign', help: 'Send approved templates to contacts' },
            { to: '/whatsapp-crm/media', icon: <PermMediaOutlined />, label: 'Upload media', help: 'Store images, videos, PDFs, and documents' },
            { to: '/whatsapp-crm/inbox', icon: <ForumOutlined />, label: 'Open inbox', help: 'Reply to customers on WhatsApp' },
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
    </Box>
  )
}
