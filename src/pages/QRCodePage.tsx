import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, Stack, Step, StepLabel, Stepper, TextField, Typography,
} from '@mui/material'
import { WhatsApp, CheckCircle, Bolt, VerifiedUser, MenuBookOutlined } from '@mui/icons-material'
import { onboardingApi } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { PageHeader, AppCard, useToast } from '../components/common'
import type { AxiosError } from 'axios'

const STEPS = ['Authorize with Meta', 'Select number', 'Verify business', 'Go live']

export function QRCodePage() {
  const { organization, refreshUser } = useAuth()
  const toast = useToast()
  const connected = organization?.whatsapp_api_status === 'live' || Boolean(organization?.whatsapp_connected)
  const [open, setOpen] = useState(false)
  const [waba, setWaba] = useState('')
  const [phoneId, setPhoneId] = useState('')
  const [accessToken, setAccessToken] = useState('')

  const connect = useMutation({
    mutationFn: () => onboardingApi.whatsappConnect({
      waba_id: waba,
      phone_number_id: phoneId,
      access_token: accessToken,
    }),
    onSuccess: async () => {
      toast.success('WhatsApp connected successfully')
      setOpen(false)
      await refreshUser()
    },
    onError: (e: AxiosError<{ message?: string }>) =>
      toast.error(e.response?.data?.message ?? 'Connection failed'),
  })

  return (
    <Box>
      <PageHeader
        title="WhatsApp accounts"
        subtitle={
          <span>
            Add WhatsApp Business Accounts (WABAs) and set up your phone numbers here.{' '}
            <RouterLink to="/whatsapp-crm/setup-guide" style={{ color: '#0064E0', textDecoration: 'none', fontWeight: 700 }}>
              Setup guide
            </RouterLink>
          </span>
        }
        actions={
          <Button component={RouterLink} to="/whatsapp-crm/setup-guide" variant="outlined" startIcon={<MenuBookOutlined />}>
            View setup guide
          </Button>
        }
      />

      {connected ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.5fr 1fr' }, gap: 3 }}>
          {/* Status card */}
          <AppCard>
            <Stack spacing={2.5}>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <Box sx={{ width: 56, height: 56, borderRadius: 3, display: 'grid', placeItems: 'center',
                  bgcolor: connected ? 'success.light' : 'action.hover',
                  color: connected ? 'success.main' : 'text.secondary' }}>
                  <WhatsApp sx={{ fontSize: 30 }} />
                </Box>
                <Box>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Typography variant="h4">{organization?.name}</Typography>
                    <Chip size="small" color={connected ? 'success' : 'default'}
                      label={connected ? 'Connected' : 'Not connected'} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {connected
                      ? 'Your number is live on the WhatsApp Business Platform.'
                      : 'Connect a number to start messaging customers.'}
                  </Typography>
                </Box>
              </Stack>

              <Divider />

              <Stepper activeStep={connected ? STEPS.length : 0} alternativeLabel>
                {STEPS.map((s) => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
              </Stepper>

              <Stack direction="row" spacing={1.5}>
                {connected ? (
                  <Button variant="outlined" startIcon={<CheckCircle />} disabled>Connected</Button>
                ) : (
                  <Button variant="contained" startIcon={<WhatsApp />} onClick={() => setOpen(true)}>
                    Connect WhatsApp
                  </Button>
                )}
              </Stack>
            </Stack>
          </AppCard>

          {/* Benefits / help card */}
          <AppCard title="What you'll need">
            <Stack spacing={2}>
              {[
                { icon: <Bolt color="primary" />, t: 'Meta Business account', d: 'Admin access to your Meta Business Manager.' },
                { icon: <VerifiedUser color="primary" />, t: 'Business verification', d: 'Required by Meta before higher messaging limits.' },
                { icon: <WhatsApp color="primary" />, t: 'A phone number', d: 'Not currently active on a personal WhatsApp app.' },
              ].map((i) => (
                <Stack key={i.t} direction="row" spacing={1.5}>
                  <Box sx={{ mt: 0.25 }}>{i.icon}</Box>
                  <Box>
                    <Typography variant="subtitle2">{i.t}</Typography>
                    <Typography variant="caption" color="text.secondary">{i.d}</Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </AppCard>
        </Box>
      ) : (
        <Box sx={{ maxWidth: 850, mx: 'auto', mt: 6 }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            borderRadius: 3, 
            border: '1px solid', 
            borderColor: 'divider',
            overflow: 'hidden',
            bgcolor: 'background.paper',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
          }}>
            <Box sx={{ width: { xs: '100%', md: '50%' }, bgcolor: '#0b132b', display: 'flex' }}>
              <img src="/images/whatsapp-api-illustration.png" alt="WhatsApp API" style={{ width: '100%', objectFit: 'cover' }} />
            </Box>
            <Box sx={{ width: { xs: '100%', md: '50%' }, p: { xs: 4, md: 6 }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Box sx={{ bgcolor: '#25D366', width: 48, height: 48, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                <WhatsApp sx={{ color: 'white', fontSize: 32 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, color: 'text.primary' }}>
                WhatsApp Business API
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, lineHeight: 1.6 }}>
                For medium to large businesses communicating with customers at scale through programmatic access
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button
                variant="contained" 
                onClick={() => setOpen(true)}
                sx={{ 
                  bgcolor: '#1e293b', 
                  color: 'white', 
                  py: 1.5, 
                  px: 3, 
                  borderRadius: 2,
                  width: 'fit-content',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: 15,
                  '&:hover': { bgcolor: '#0f172a' } 
                }}
              >
                Get started <span style={{ marginLeft: 8 }}>→</span>
              </Button>
              <Button
                component={RouterLink}
                to="/whatsapp-crm/setup-guide"
                variant="outlined"
                startIcon={<MenuBookOutlined />}
              >
                Read guide
              </Button>
              </Stack>
            </Box>
          </Box>
        </Box>
      )}

      {/* Connect dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Connect WhatsApp Business</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Alert severity="info">
              Embedded Signup with Meta is the recommended path. If you already have a WABA, enter its
              IDs below to link it directly via the Cloud API.
            </Alert>
            <Button variant="contained" startIcon={<WhatsApp />} fullWidth disabled>
              Continue with Meta (Embedded Signup)
            </Button>
            <Divider>or link manually</Divider>
            <TextField label="WhatsApp Business Account ID" fullWidth value={waba}
              onChange={(e) => setWaba(e.target.value)} placeholder="e.g. 1029384756" />
            <TextField label="Phone Number ID" fullWidth value={phoneId}
              onChange={(e) => setPhoneId(e.target.value)} placeholder="e.g. 1122334455" />
            <TextField
              label="Permanent Access Token"
              fullWidth
              value={accessToken}
              type="password"
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Paste your Meta system user token"
              helperText="Required for live sending, template sync, and campaign delivery."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!waba || !phoneId || !accessToken || connect.isPending}
            onClick={() => connect.mutate()}>
            {connect.isPending ? 'Connecting…' : 'Connect'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
