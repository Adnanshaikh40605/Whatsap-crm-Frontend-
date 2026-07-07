import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Avatar, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  MenuItem, Stack, TextField, Typography,
} from '@mui/material'
import { UserPlus } from 'lucide-react'
import { orgApi, coreApi } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { PageHeader, DataTable, StatusChip, AppCard, useToast, type GridColDef } from '../components/common'
import { Icon } from '../components/ui/Icon'
import type { AxiosError } from 'axios'


interface Member {
  id: string
  role: string
  is_active: boolean
  created_at: string
  user: { id: string; email: string; first_name?: string; last_name?: string; full_name?: string }
}

export function TeamPage() {
  const { organization } = useAuth()
  const orgId = organization?.id ?? ''
  const qc = useQueryClient()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('agent')

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members', orgId],
    queryFn: () => orgApi.members(orgId).then((r) => r.data.data ?? r.data.results ?? r.data),
    enabled: Boolean(orgId),
  })

  const { data: options } = useQuery({
    queryKey: ['core-options'],
    queryFn: () => coreApi.options().then((r) => r.data.data ?? r.data),
  })

  const roles = options?.roles ?? []

  const invite = useMutation({
    mutationFn: () => orgApi.addMember(orgId, { email, role }),
    onSuccess: () => {
      toast.success('Member added')
      setOpen(false); setEmail(''); setRole('agent')
      qc.invalidateQueries({ queryKey: ['members', orgId] })
    },
    onError: (e: AxiosError<{ message?: string }>) =>
      toast.error(e.response?.data?.message ?? 'Could not add member'),
  })

  const limits = organization?.plan_limits as { agents?: number } | undefined
  const maxAgents = limits?.agents === -1 || limits?.agents === undefined ? '∞' : limits.agents

  const columns: GridColDef[] = [
    {
      field: 'name', headerName: 'Member', flex: 1.4, minWidth: 220, sortable: false,
      renderCell: (p) => {
        const u = (p.row as Member).user
        const name = u.full_name || [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email
        return (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', height: '100%' }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', color: 'primary.main', fontSize: 13, fontWeight: 700 }}>
              {(name[0] || 'U').toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{name}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap>{u.email}</Typography>
            </Box>
          </Stack>
        )
      },
    },
    {
      field: 'role', headerName: 'Role', width: 160,
      renderCell: (p) => <Chip size="small" label={(p.row as Member).role} sx={{ textTransform: 'capitalize' }} color="primary" variant="outlined" />,
    },
    {
      field: 'is_active', headerName: 'Status', width: 130,
      renderCell: (p) => <StatusChip status={(p.row as Member).is_active ? 'active' : 'disconnected'} />,
    },
    {
      field: 'created_at', headerName: 'Joined', width: 150,
      valueFormatter: (v) => (v ? new Date(v as string).toLocaleDateString() : '—'),
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Team Members"
        subtitle="Manage agents, managers, and role-based access"
        actions={
          <Button variant="contained" startIcon={<Icon icon={UserPlus} size="sm" />} onClick={() => setOpen(true)}>
            Invite member
          </Button>
        }
      />

      <AppCard noPadding>
        <DataTable
          rows={members}
          columns={columns}
          loading={isLoading}
          getRowId={(r) => (r as Member).id}
          height={520}
          emptyTitle="No team members yet"
          emptyDescription="Invite colleagues to collaborate in the shared inbox and CRM."
          emptyAction={<Button variant="contained" startIcon={<Icon icon={UserPlus} size="sm" />} onClick={() => setOpen(true)}>Invite member</Button>}
        />
      </AppCard>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {members.length} member{members.length === 1 ? '' : 's'} on the{' '}
        <Box component="strong" sx={{ textTransform: 'capitalize' }}>{organization?.plan}</Box> plan (max {String(maxAgents)} agents)
      </Typography>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: '8px', border: '1px solid var(--color-border-subtle)' } } }}>
        <DialogTitle>Invite team member</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Email address" type="email" fullWidth autoFocus
              value={email} onChange={(e) => setEmail(e.target.value)}
              helperText="The person must already have a WhatsFlow account."
            />
            <TextField select label="Role" fullWidth value={role} onChange={(e) => setRole(e.target.value)}>
              {roles.map((r: any) => (
                <MenuItem key={r.id} value={r.id} sx={{ textTransform: 'capitalize' }}>{r.label}</MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!email || invite.isPending} onClick={() => invite.mutate()}>
            {invite.isPending ? 'Adding…' : 'Add member'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
