import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Avatar, Box, Button, Chip, MenuItem, Stack, Tab, Tabs, TextField, Typography,
} from '@mui/material'
import {
  AddBusinessOutlined, ArrowForwardOutlined, LogoutOutlined, RocketLaunchOutlined, SmsOutlined, WhatsApp,
} from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'
import { orgApi } from '../lib/api'
import { AppCard } from '../components/common'
import type { Organization } from '../types'

type ProjectTab = 'whatsapp' | 'sms'
type ProjectType = 'whatsapp' | 'sms'

const projectTypeOptions = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'sms', label: 'SMS' },
]

const formFieldSx = {
  '& .MuiInputBase-root': {
    bgcolor: 'background.paper',
    borderRadius: 1,
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'transparent',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: '#AFC7C0',
  },
  '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#164C4D',
    borderWidth: 1.5,
  },
  '& .MuiInputBase-input, & .MuiSelect-select': {
    py: 1.35,
    fontSize: 15,
  },
}

function getWhatsAppStatus(org: Organization) {
  const status = org.whatsapp_api_status || (org.whatsapp_connected ? 'live' : 'not_connected')
  if (status === 'live') {
    return {
      label: 'LIVE',
      chipSx: { bgcolor: '#4CAF50', color: '#FFFFFF' },
      help: 'WhatsApp Cloud API is connected',
    }
  }
  if (status === 'pending') {
    return {
      label: 'PENDING',
      chipSx: { bgcolor: '#F7B928', color: '#18211D' },
      help: org.whatsapp_setup_status || 'Complete WhatsApp setup',
    }
  }
  return {
    label: 'NOT CONNECTED',
    chipSx: { bgcolor: '#EEF2F4', color: '#4B5560', border: '1px solid #D7DFE4' },
    help: 'Connect Phone Number ID, WABA ID, and token',
  }
}

function getSmsStatus(org: Organization) {
  const smsSettings = org.settings?.sms_crm as Record<string, unknown> | undefined
  if (smsSettings?.api_key || smsSettings?.auth_token) {
    return {
      label: 'CONNECTED',
      chipSx: { bgcolor: '#4CAF50', color: '#FFFFFF' },
      help: 'SMS provider credentials are configured',
    }
  }
  return {
    label: 'SETUP REQUIRED',
    chipSx: { bgcolor: '#F7B928', color: '#18211D' },
    help: 'Connect Smartping/API, DLT Entity ID, sender IDs, and templates',
  }
}

export function ProjectsPage() {
  const { user, organizations, switchOrganization, refreshUser, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<ProjectTab>('whatsapp')
  const [form, setForm] = useState({
    name: '',
    project_type: 'whatsapp' as ProjectType,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const filteredProjects = useMemo(
    () => organizations.filter((org) => org.project_type === tab),
    [organizations, tab],
  )

  const createProject = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.name.trim()) return
    setError('')
    setLoading(true)
    try {
      await orgApi.create({
        name: form.name.trim(),
        project_type: form.project_type,
      })
      setForm({ name: '', project_type: form.project_type })
      setTab(form.project_type === 'sms' ? 'sms' : 'whatsapp')
      await refreshUser()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  const viewProject = async (project: Organization) => {
    await switchOrganization(project.id)
    navigate(project.project_type === 'sms' ? '/sms-crm/dashboard' : '/whatsapp-crm/dashboard')
  }

  const isSms = tab === 'sms'

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#FAFAF9' }}>
      <Box sx={{
        height: 70,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 2.5, md: 3.5 },
        bgcolor: 'background.paper',
        boxShadow: '0 1px 0 rgba(10, 19, 23, 0.06)',
      }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Avatar sx={{ bgcolor: '#EAF7EE', color: '#31A24C', width: 34, height: 34 }}>
            <AddBusinessOutlined />
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 800, lineHeight: 1 }}>Projects</Typography>
            <Typography variant="caption" color="text.secondary">Choose a CRM workspace</Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.light', color: 'primary.main', fontSize: 13, fontWeight: 800 }}>
            {user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
          </Avatar>
          <Button size="small" color="inherit" startIcon={<LogoutOutlined />} onClick={() => { logout(); navigate('/login') }}>
            Log out
          </Button>
        </Stack>
      </Box>

      <Box sx={{ maxWidth: 1080, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 3, md: 4.5 } }}>
        <Box
          component="form"
          onSubmit={createProject}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' },
            alignItems: 'center',
            gap: { xs: 3, md: 4 },
            minHeight: { md: 285 },
            mb: { xs: 4, md: 5 },
            px: { xs: 3, sm: 4, md: 5 },
            py: { xs: 3.5, md: 5 },
            bgcolor: '#EEF8F4',
            border: '1px solid #DDEBE7',
            borderRadius: 2,
          }}
        >
          <Box sx={{ maxWidth: 520 }}>
            <Typography variant="h2" sx={{ color: '#111818', mb: 1 }}>Create New Project</Typography>
            <Typography variant="body2" sx={{ color: '#66736F', mb: 2.5 }}>
              Start a WhatsApp or SMS CRM workspace.
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 170px' },
                gap: 1.5,
                mb: 2,
              }}
            >
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.75, color: '#1C2C2A' }}>Project Name *</Typography>
                <TextField
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Enter project name"
                  required
                  fullWidth
                  sx={formFieldSx}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.75, color: '#1C2C2A' }}>Project Type</Typography>
                <TextField
                  select
                  value={form.project_type}
                  onChange={(event) => setForm((current) => ({ ...current, project_type: event.target.value as ProjectType }))}
                  fullWidth
                  sx={formFieldSx}
                >
                  {projectTypeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>

            <Button
              type="submit"
              variant="contained"
              disabled={!form.name.trim() || loading}
              sx={{
                bgcolor: '#164C4D',
                px: 3,
                '&:hover': { bgcolor: '#0F3F40' },
                '&.Mui-disabled': {
                  bgcolor: 'rgba(22, 76, 77, 0.12)',
                  color: 'rgba(22, 76, 77, 0.45)',
                },
              }}
            >
              Create
            </Button>
            {error ? <Typography color="error" variant="caption" sx={{ display: 'block', mt: 1.5 }}>{error}</Typography> : null}
          </Box>

          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 210,
            }}
          >
            <Box
              sx={{
                width: 230,
                height: 210,
                position: 'relative',
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.66)',
                border: '1px solid rgba(22,76,77,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RocketLaunchOutlined sx={{ fontSize: 104, color: '#31A24C', transform: 'rotate(-18deg)' }} />
              <Box sx={{
                position: 'absolute',
                left: 28,
                bottom: 30,
                width: 72,
                height: 10,
                borderRadius: 10,
                bgcolor: '#D7E8E2',
              }} />
              <Box sx={{
                position: 'absolute',
                right: 22,
                top: 38,
                width: 38,
                height: 38,
                borderRadius: 1,
                border: '2px solid #B8D9CE',
              }} />
            </Box>
          </Box>
        </Box>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'flex-end' }, justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 700 }}>Recent Projects</Typography>
          </Box>
          <Tabs
            value={tab}
            onChange={(_, value: ProjectTab) => setTab(value)}
            sx={{
              minHeight: 44,
              '& .MuiTabs-indicator': { height: 3, bgcolor: '#31A24C' },
              '& .MuiTab-root': { minHeight: 44, fontWeight: 800 },
              '& .Mui-selected': { color: '#164C4D' },
            }}
          >
            <Tab icon={<WhatsApp />} iconPosition="start" label="WhatsApp Projects" value="whatsapp" />
            <Tab icon={<SmsOutlined />} iconPosition="start" label="SMS Projects" value="sms" />
          </Tabs>
        </Stack>

        {filteredProjects.length === 0 ? (
          <AppCard>
            <Stack spacing={1.5} sx={{ alignItems: 'center', textAlign: 'center', py: 5 }}>
              {isSms ? <SmsOutlined color="primary" sx={{ fontSize: 48 }} /> : <WhatsApp color="primary" sx={{ fontSize: 48 }} />}
              <Typography variant="h4">No {isSms ? 'SMS' : 'WhatsApp'} projects yet</Typography>
              <Typography variant="body2" color="text.secondary">
                Create a {isSms ? 'SMS' : 'WhatsApp'} project above. Nothing is shown here unless it exists in the database.
              </Typography>
            </Stack>
          </AppCard>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }, gap: 2 }}>
            {filteredProjects.map((project) => {
              const status = isSms ? getSmsStatus(project) : getWhatsAppStatus(project)
              const Icon = isSms ? SmsOutlined : WhatsApp
              return (
                <AppCard key={project.id} sx={{ borderColor: '#EEF0EE', borderRadius: 1.5, bgcolor: '#FFFFFF' }}>
                  <Stack spacing={2.5} sx={{ height: '100%' }}>
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h3" sx={{ fontWeight: 800 }}>{project.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Created {new Date(project.created_at || Date.now()).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Chip size="small" label={status.label} sx={{ mt: 0.5, ...status.chipSx }} />
                    </Stack>

                    <Stack spacing={1.25} sx={{ flex: 1 }}>
                      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                        <Icon sx={{ color: isSms ? '#44505A' : '#31A24C' }} />
                        <Box>
                          <Typography variant="subtitle2">{isSms ? 'SMS CRM' : 'WhatsApp CRM'}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {project.description || status.help}
                          </Typography>
                        </Box>
                      </Stack>
                    </Stack>

                    <Button
                      variant="outlined"
                      endIcon={<ArrowForwardOutlined />}
                      onClick={() => viewProject(project)}
                      sx={{
                        alignSelf: 'stretch',
                        borderColor: '#B8C7C3',
                        color: '#164C4D',
                        '&:hover': { borderColor: '#164C4D', bgcolor: '#F6FBF9' },
                      }}
                    >
                      View
                    </Button>
                  </Stack>
                </AppCard>
              )
            })}
          </Box>
        )}
      </Box>
    </Box>
  )
}
