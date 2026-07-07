import { Link as RouterLink } from 'react-router-dom'
import {
  Alert, Box, Button, Chip, Divider, Link, List, ListItem, ListItemIcon,
  ListItemText, Stack, Typography,
} from '@mui/material'
import {
  GitBranch, CheckCircle, CloudCheck, Copy, FileText, ClipboardCheck, Key, ExternalLink,
  Smartphone, Shield, SlidersHorizontal, RefreshCw, Webhook,
} from 'lucide-react'
import { PageHeader, AppCard } from '../components/common'
import { useAuth } from '../context/AuthContext'
import { Icon } from '../components/ui/Icon'
import { ICON, ICON_STROKE } from '../lib/icons'

const metaLinks = [
  ['Cloud API setup', 'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started'],
  ['Access tokens', 'https://developers.facebook.com/docs/whatsapp/business-management-api/get-started#system-user-access-tokens'],
  ['Phone numbers', 'https://developers.facebook.com/docs/whatsapp/phone-numbers'],
  ['Message templates', 'https://developers.facebook.com/docs/whatsapp/message-templates'],
  ['Webhooks', 'https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks'],
]

const setupSteps = [
  {
    title: '1. Create or open Meta app',
    icon: GitBranch,
    items: [
      'Go to Meta for Developers.',
      'Open your business app, or create a new app for WhatsApp.',
      'Add the WhatsApp product to the app.',
      'Keep admin access to the Meta Business portfolio.',
    ],
  },
  {
    title: '2. Add WhatsApp Business account and number',
    icon: Smartphone,
    items: [
      'In Meta App Dashboard, open WhatsApp > API setup.',
      'Select or create the WhatsApp Business Account.',
      'Add or select the business phone number.',
      'Copy the Phone Number ID and WhatsApp Business Account ID.',
    ],
  },
  {
    title: '3. Create permanent access token',
    icon: Key,
    items: [
      'Go to Meta Business Settings > Users > System users.',
      'Create a system user or open an existing admin system user.',
      'Assign the app and WhatsApp Business Account permissions.',
      'Generate a token with WhatsApp messaging and management permissions.',
      'Store the token safely. Do not paste it in public docs or screenshots.',
    ],
  },
  {
    title: '4. Connect inside WhatsFlow CRM',
    icon: SlidersHorizontal,
    items: [
      'Open the correct company from the top-right company switcher.',
      'Go to Admin > WhatsApp.',
      'Click Get started or Connect WhatsApp.',
      'Paste WABA ID, Phone Number ID, and Permanent Access Token.',
      'Click Connect. Dashboard should show WhatsApp Business API Status: LIVE.',
    ],
  },
  {
    title: '5. Configure webhook for production status',
    icon: Webhook,
    items: [
      'Expose backend on HTTPS in production. For local testing, use ngrok or another tunnel.',
      'Meta callback URL should point to /api/v1/onboarding/webhooks/whatsapp/.',
      'Use your verify token from backend settings.',
      'Subscribe to messages, message status, delivered, read, and failed events.',
      'Without webhook, sending may work but delivered/read blue-tick style status will not update.',
    ],
  },
  {
    title: '6. Sync templates and send campaigns',
    icon: FileText,
    items: [
      'Go to Templates and click Sync from Meta.',
      'Create Marketing, Utility, Authentication, media, carousel, image, video, or document templates.',
      'Wait for Meta approval before using a template in campaigns.',
      'Go to Contacts to import CSV/XLSX contacts and create groups.',
      'Go to Campaigns, create a campaign, select approved template, then Launch and choose audience.',
    ],
  },
]

const checks = [
  ['Live credentials', 'Phone Number ID + WABA ID + Permanent Access Token are saved.'],
  ['Template sync', 'Templates page can fetch approved templates from Meta.'],
  ['Test message', 'Send a one-contact campaign to your own number before bulk sending.'],
  ['Webhook status', 'Campaign status shows sent, delivered, read, and failed after Meta callbacks.'],
]

const pendingHelp = [
  { title: 'Missing token', icon: Key, detail: 'Add the permanent access token in WhatsApp setup.' },
  { title: 'Wrong company', icon: RefreshCw, detail: 'Use the top-right switcher and connect the correct workspace.' },
  { title: 'Webhook not live', icon: Webhook, detail: 'Use an HTTPS production URL or tunnel for local testing.' },
  { title: 'Permission issue', icon: Shield, detail: 'Regenerate token with WhatsApp messaging and management permissions.' },
  { title: 'Template not approved', icon: CloudCheck, detail: 'Wait for Meta approval, then Sync from Meta.' },
]

export function WhatsAppApiGuidePage() {
  const { organization } = useAuth()
  const status = organization?.whatsapp_api_status || (organization?.whatsapp_connected ? 'live' : 'not_connected')
  const live = status === 'live'
  const pending = status === 'pending'

  return (
    <div className="space-y-4">
      <PageHeader
        title="WhatsApp API setup guide"
        subtitle="Connect a new project like Pest Control 99 or 2end pestcontol99 to Meta Cloud API, then activate templates and campaigns."
        actions={
          <Button component={RouterLink} to="/whatsapp-crm/api-settings" variant="contained">
            Open WhatsApp setup
          </Button>
        }
      />

      <AppCard>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4">{organization?.name || 'Current project'}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {organization?.whatsapp_setup_status || 'Use this checklist to connect this exact company workspace.'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip
              color={live ? 'success' : pending ? 'warning' : 'default'}
              label={live ? 'LIVE' : pending ? 'PENDING' : 'NOT CONNECTED'}
            />
            {organization?.whatsapp_phone_number_id ? (
              <Chip variant="outlined" label={`Phone ID: ${organization.whatsapp_phone_number_id}`} />
            ) : null}
          </Stack>
        </Stack>
      </AppCard>

      <Alert severity={live ? 'success' : pending ? 'warning' : 'info'} sx={{ mb: 3 }}>
        {live
          ? 'This workspace has the required Meta API credentials. You can sync templates and send campaigns.'
          : pending
            ? 'This workspace has partial WhatsApp details. Add the missing credential, usually the permanent access token, to make it LIVE.'
            : 'This workspace is not connected yet. Follow the steps below, then open WhatsApp setup and paste the credentials.'}
      </Alert>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
        <Stack spacing={2}>
          {setupSteps.map((step) => {
            const StepIcon = step.icon
            return (
              <AppCard key={step.title}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
                  <Box sx={{
                    width: 44, height: 44, borderRadius: 2, display: 'grid', placeItems: 'center',
                    bgcolor: 'primary.light', color: 'primary.main', flexShrink: 0,
                  }}>
                    <StepIcon size={ICON.md} strokeWidth={ICON_STROKE} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h4">{step.title}</Typography>
                    <List dense sx={{ mt: 1 }}>
                      {step.items.map((item) => (
                        <ListItem key={item} disableGutters sx={{ py: 0.35 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <CheckCircle size={ICON.sm} strokeWidth={ICON_STROKE} color="#16a34a" />
                          </ListItemIcon>
                          <ListItemText
                            primary={item}
                            slotProps={{ primary: { variant: 'body2', color: 'text.secondary' } }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Stack>
              </AppCard>
            )
          })}
        </Stack>

        <Stack spacing={2}>
          <AppCard title="Where to click in CRM" subtitle="Fast path for the active company">
            <Stack spacing={1.25}>
              {[
                ['Switch company', 'Top-right company dropdown > choose 2end pestcontol99.'],
                ['Connect API', 'Sidebar > WhatsApp > Get started.'],
                ['Check status', 'Dashboard > WhatsApp Business API Status.'],
                ['Create template', 'Sidebar > Templates > Create Template.'],
                ['Import contacts', 'Sidebar > Contacts > Import Contacts.'],
                ['Send campaign', 'Sidebar > Campaigns > New Campaign > Launch.'],
              ].map(([title, detail]) => (
                <Box key={title} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}>
                  <Typography variant="subtitle2">{title}</Typography>
                  <Typography variant="caption" color="text.secondary">{detail}</Typography>
                </Box>
              ))}
            </Stack>
          </AppCard>

          <AppCard title="Credential names" subtitle="Paste exactly these values">
            <Stack spacing={1.25}>
              {[
                ['Phone Number ID', 'Meta App Dashboard > WhatsApp > API setup.'],
                ['WhatsApp Business Account ID', 'Same API setup page or Business Settings > WhatsApp accounts.'],
                ['Permanent Access Token', 'Business Settings > System Users > Generate token.'],
              ].map(([title, detail]) => (
                <Box key={title} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                  <Typography variant="subtitle2">{title}</Typography>
                  <Typography variant="caption" color="text.secondary">{detail}</Typography>
                </Box>
              ))}
            </Stack>
          </AppCard>

          <AppCard title="Production checks">
            <List dense>
              {checks.map(([title, detail]) => (
                <ListItem key={title} disableGutters>
                  <ListItemIcon sx={{ minWidth: 32 }}><ClipboardCheck size={ICON.md} strokeWidth={ICON_STROKE} /></ListItemIcon>
                  <ListItemText
                    primary={title}
                    secondary={detail}
                    slotProps={{ primary: { variant: 'subtitle2' }, secondary: { variant: 'caption' } }}
                  />
                </ListItem>
              ))}
            </List>
          </AppCard>

          <AppCard title="Official Meta docs">
            <Stack spacing={1}>
              {metaLinks.map(([label, href]) => (
                <Link key={href} href={href} target="_blank" rel="noreferrer" underline="hover" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                  {label} <ExternalLink size={ICON.xs} strokeWidth={ICON_STROKE} />
                </Link>
              ))}
            </Stack>
          </AppCard>

          <AppCard title="If status stays pending">
            <List dense>
              {pendingHelp.map(({ title, icon: ProblemIcon, detail }) => (
                  <ListItem key={title} disableGutters>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <ProblemIcon size={ICON.md} strokeWidth={ICON_STROKE} color="#f59e0b" />
                    </ListItemIcon>
                    <ListItemText
                      primary={title}
                      secondary={detail}
                      slotProps={{ primary: { variant: 'subtitle2' }, secondary: { variant: 'caption' } }}
                    />
                  </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 1.5 }} />
            <Button component={RouterLink} to="/whatsapp-crm/api-settings" variant="outlined" startIcon={<Icon icon={Copy} size="sm" />}>
              Open connection form
            </Button>
          </AppCard>
        </Stack>
      </Box>
    </div>
  )
}
