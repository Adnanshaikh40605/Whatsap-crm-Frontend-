import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Avatar, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, MenuItem, Stack, Tab, Tabs, TextField, Tooltip, Typography,
} from '@mui/material'
import {
  AddBusinessOutlined, ArrowForwardOutlined, DeleteOutlined, LockOutlined, LogoutOutlined,
  RocketLaunchOutlined, SmsOutlined, WhatsApp,
} from '@mui/icons-material'
import { useAuth, staffDefaultPath } from '../context/AuthContext'
import { canManageProjects } from '../lib/rbac'
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
  const { user, organization, organizations, switchOrganization, refreshUser, logout, isSuperAdmin } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<ProjectTab>('whatsapp')
  const [form, setForm] = useState({
    name: '',
    project_type: 'whatsapp' as ProjectType,
    project_password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [passwordDialog, setPasswordDialog] = useState<{ open: boolean; project: Organization | null }>({
    open: false,
    project: null,
  })
  const [accessPassword, setAccessPassword] = useState('')
  const [accessError, setAccessError] = useState('')
  const [accessLoading, setAccessLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Organization | null>(null)
  const [deleteStep, setDeleteStep] = useState<'confirm' | 'password' | null>(null)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  const filteredProjects = organizations.filter((org) => org.project_type === tab)
  const canCreate = canManageProjects(user)

  const createProject = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.name.trim() || !form.project_password.trim()) return
    setError('')
    setLoading(true)
    try {
      await orgApi.create({
        name: form.name.trim(),
        project_type: form.project_type,
        project_password: form.project_password,
      })
      setForm({ name: '', project_type: form.project_type, project_password: '' })
      setTab(form.project_type === 'sms' ? 'sms' : 'whatsapp')
      await refreshUser()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  const enterProject = async (project: Organization, password?: string) => {
    await switchOrganization(project.id, password)
    const defaultPath = user?.platform_role === 'staff'
      ? staffDefaultPath(project.project_type === 'sms' ? 'sms' : 'whatsapp')
      : project.project_type === 'sms'
        ? '/sms-crm/dashboard'
        : '/whatsapp-crm/dashboard'
    navigate(defaultPath)
  }

  const viewProject = async (project: Organization) => {
    const needsPassword = project.has_project_password && !user?.is_superuser
    if (needsPassword) {
      setPasswordDialog({ open: true, project })
      setAccessPassword('')
      setAccessError('')
      return
    }
    try {
      await enterProject(project)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to open project')
    }
  }

  const submitProjectPassword = async () => {
    if (!passwordDialog.project || !accessPassword.trim()) return
    setAccessError('')
    setAccessLoading(true)
    try {
      await enterProject(passwordDialog.project, accessPassword)
      setPasswordDialog({ open: false, project: null })
    } catch (err: any) {
      setAccessError(err.response?.data?.message || 'Invalid project password')
    } finally {
      setAccessLoading(false)
    }
  }

  const startDeleteProject = (project: Organization) => {
    setDeleteTarget(project)
    setDeleteStep('confirm')
    setDeletePassword('')
    setDeleteError('')
  }

  const closeDeleteDialog = () => {
    setDeleteTarget(null)
    setDeleteStep(null)
    setDeletePassword('')
    setDeleteError('')
  }

  const confirmDeleteProject = () => {
    setDeleteStep('password')
    setDeletePassword('')
    setDeleteError('')
  }

  const submitDeleteProject = async () => {
    if (!deleteTarget || !deletePassword.trim()) return
    setDeleteError('')
    setDeleteLoading(true)
    try {
      await orgApi.delete(deleteTarget.id, deletePassword)
      if (organization?.id === deleteTarget.id) {
        localStorage.removeItem('organization_id')
      }
      closeDeleteDialog()
      await refreshUser()
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || 'Failed to delete project')
    } finally {
      setDeleteLoading(false)
    }
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
        {canCreate ? (
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
                Start a WhatsApp or SMS CRM workspace with its own access password.
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 170px' }, gap: 1.5, mb: 1.5 }}>
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

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.75, color: '#1C2C2A' }}>Project Password *</Typography>
                <TextField
                  type="password"
                  value={form.project_password}
                  onChange={(event) => setForm((current) => ({ ...current, project_password: event.target.value }))}
                  placeholder="Set a unique project password"
                  required
                  fullWidth
                  sx={formFieldSx}
                  helperText="Required to open this project. Each company/project stays isolated."
                />
              </Box>

              <Button
                type="submit"
                variant="contained"
                disabled={!form.name.trim() || !form.project_password.trim() || loading}
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

            <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center', alignItems: 'center', minHeight: 210 }}>
              <Box sx={{
                width: 230, height: 210, position: 'relative', borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.66)', border: '1px solid rgba(22,76,77,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <RocketLaunchOutlined sx={{ fontSize: 104, color: '#31A24C', transform: 'rotate(-18deg)' }} />
              </Box>
            </Box>
          </Box>
        ) : null}

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
                {canCreate
                  ? `Create a ${isSms ? 'SMS' : 'WhatsApp'} project above.`
                  : 'Ask your admin to assign you to a project.'}
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
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                        {isSuperAdmin ? (
                          <Tooltip title="Delete project">
                            <IconButton
                              size="small"
                              aria-label={`Delete ${project.name}`}
                              onClick={() => startDeleteProject(project)}
                              sx={{ color: 'error.main' }}
                            >
                              <DeleteOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : null}
                        <Chip size="small" label={status.label} sx={{ mt: 0.5, ...status.chipSx }} />
                      </Stack>
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
                      {project.has_project_password ? (
                        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: 'text.secondary' }}>
                          <LockOutlined sx={{ fontSize: 16 }} />
                          <Typography variant="caption">Password protected</Typography>
                        </Stack>
                      ) : null}
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

      <Dialog open={passwordDialog.open} onClose={() => setPasswordDialog({ open: false, project: null })} maxWidth="xs" fullWidth>
        <DialogTitle>Enter Project Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {passwordDialog.project?.name} is protected. Enter the project password to continue.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            type="password"
            label="Project Password"
            value={accessPassword}
            onChange={(e) => setAccessPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitProjectPassword()}
            error={Boolean(accessError)}
            helperText={accessError}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPasswordDialog({ open: false, project: null })}>Cancel</Button>
          <Button variant="contained" onClick={submitProjectPassword} disabled={!accessPassword.trim() || accessLoading}>
            {accessLoading ? 'Verifying…' : 'Continue'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteStep === 'confirm'} onClose={closeDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Delete project?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This will permanently remove all
            contacts, templates, campaigns, and messages for this project.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDeleteProject}>
            Yes, continue
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteStep === 'password'} onClose={closeDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm with project password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter the project password for <strong>{deleteTarget?.name}</strong> to permanently delete it.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            type="password"
            label="Project Password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitDeleteProject()}
            error={Boolean(deleteError)}
            helperText={deleteError}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={submitDeleteProject}
            disabled={!deletePassword.trim() || deleteLoading}
          >
            {deleteLoading ? 'Deleting…' : 'Delete project'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
