import { Link as RouterLink } from 'react-router-dom'
import {
  Alert, Box, Button, List, ListItem, ListItemIcon, ListItemText, Stack, Typography,
} from '@mui/material'
import {
  CheckCircle, Server, ClipboardCheck, Key, Send, MessageSquare, BadgeCheck,
} from 'lucide-react'
import { PageHeader, AppCard, StatCard } from '../components/common'
import { Icon } from '../components/ui/Icon'
import { ICON, ICON_STROKE } from '../lib/icons'

const dltSteps = [
  {
    title: '1. Register entity on DLT',
    detail: 'Register the business entity on an operator DLT portal, complete KYC, and keep the Entity ID for SMS configuration.',
  },
  {
    title: '2. Create headers / sender IDs',
    detail: 'Add transactional or promotional headers. Approval is required before live SMS traffic can use the sender ID.',
  },
  {
    title: '3. Register SMS templates',
    detail: 'Create every SMS template in DLT with variables, PE ID, template ID, and category. Message body must match the approved template.',
  },
  {
    title: '4. Connect Smartping/API provider',
    detail: 'Add Smartping credentials, base URL, route, sender ID, PE ID, and template IDs in SMS CRM > API Settings.',
  },
  {
    title: '5. Send test SMS',
    detail: 'Send a one-contact test first. Confirm accepted, submitted, delivered, or failed status from provider callbacks/logs.',
  },
]

const smartpingChecklist = [
  'Provider account/API key or token',
  'Approved sender ID/header',
  'DLT Entity ID / PE ID',
  'DLT Template IDs mapped to SMS templates',
  'Callback URL for delivery reports',
]

export function SmsDashboardPage() {
  return (
    <Box sx={{ maxWidth: 1320, mx: 'auto' }}>
      <PageHeader
        title="SMS CRM"
        subtitle="Independent SMS workspace for DLT compliance, Smartping connection, sender IDs, templates, campaigns, and delivery logs."
        actions={
          <Button component={RouterLink} to="/sms-crm/api-settings" variant="contained">
            Configure SMS API
          </Button>
        }
      />

      <Alert severity="warning" sx={{ mb: 3 }}>
        SMS CRM is separate from WhatsApp CRM. Connect DLT-approved sender IDs and templates before sending bulk SMS.
      </Alert>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <StatCard label="Connection" value="Setup Required" caption="Smartping/API provider" icon={<Icon icon={Key} size="md" />} />
        <StatCard label="Sender IDs" value="0" caption="DLT approved headers" icon={<Icon icon={BadgeCheck} size="md" />} />
        <StatCard label="Templates" value="0" caption="registered SMS templates" icon={<Icon icon={MessageSquare} size="md" />} />
        <StatCard label="Campaigns" value="0" caption="bulk SMS campaigns" icon={<Icon icon={Send} size="md" />} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.4fr 1fr' }, gap: 3 }}>
        <AppCard title="DLT and Smartping setup process" subtitle="Follow this order before live SMS sending">
          <Stack spacing={1.5}>
            {dltSteps.map((step) => (
              <Box key={step.title} sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
                <Typography variant="subtitle2">{step.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{step.detail}</Typography>
              </Box>
            ))}
          </Stack>
        </AppCard>

        <Stack spacing={3}>
          <AppCard title="Smartping connection needs" subtitle="Keep these ready">
            <List dense>
              {smartpingChecklist.map((item) => (
                <ListItem key={item} disableGutters>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    <CheckCircle size={ICON.sm} strokeWidth={ICON_STROKE} color="#16a34a" />
                  </ListItemIcon>
                  <ListItemText primary={item} slotProps={{ primary: { variant: 'body2' } }} />
                </ListItem>
              ))}
            </List>
          </AppCard>

          <AppCard title="Quick actions">
            <Stack spacing={1.25}>
              {[
                { to: '/sms-crm/sender-ids', label: 'Add Sender ID', icon: <Icon icon={BadgeCheck} size="sm" /> },
                { to: '/sms-crm/templates', label: 'Create SMS Template', icon: <Icon icon={MessageSquare} size="sm" /> },
                { to: '/sms-crm/send', label: 'Send Test SMS', icon: <Icon icon={Send} size="sm" /> },
                { to: '/sms-crm/message-logs', label: 'Open Message Logs', icon: <Icon icon={Server} size="sm" /> },
                { to: '/sms-crm/reports', label: 'View Reports', icon: <Icon icon={ClipboardCheck} size="sm" /> },
              ].map((action) => (
                <Button
                  key={action.to}
                  component={RouterLink}
                  to={action.to}
                  variant="outlined"
                  startIcon={action.icon}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  {action.label}
                </Button>
              ))}
            </Stack>
          </AppCard>
        </Stack>
      </Box>
    </Box>
  )
}
