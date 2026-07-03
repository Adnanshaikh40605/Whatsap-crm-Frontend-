import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Stack, TextField, Typography } from '@mui/material'
import { User, Lock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../lib/api'
import { AppCard } from '../common'
import { Button } from '../ui/Button'
import { useToast } from '../common'
import { Icon } from '../ui/Icon'

export function AccountSettingsPanel() {
  const { user, refreshUser } = useAuth()
  const toast = useToast()
  const [profile, setProfile] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    username: user?.username || '',
  })
  const [passwords, setPasswords] = useState({ old_password: '', new_password: '', confirm: '' })

  useEffect(() => {
    setProfile({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone: user?.phone || '',
      username: user?.username || '',
    })
  }, [user?.first_name, user?.last_name, user?.phone, user?.username])

  const profileMutation = useMutation({
    mutationFn: () => authApi.updateProfile(profile),
    onSuccess: async () => {
      await refreshUser()
      toast.success('Profile updated')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    },
  })

  const passwordMutation = useMutation({
    mutationFn: () => authApi.changePassword(passwords.old_password, passwords.new_password),
    onSuccess: () => {
      setPasswords({ old_password: '', new_password: '', confirm: '' })
      toast.success('Password changed successfully')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Failed to change password')
    },
  })

  const submitPassword = (event: React.FormEvent) => {
    event.preventDefault()
    if (passwords.new_password !== passwords.confirm) {
      toast.error('New passwords do not match')
      return
    }
    if (passwords.new_password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    passwordMutation.mutate()
  }

  return (
    <Stack spacing={3}>
      <AppCard>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
          <Icon icon={User} size="lg" color="var(--accent, #164C4D)" />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Edit User Profile</Typography>
        </Stack>
        <Stack spacing={2} component="form" onSubmit={(e) => { e.preventDefault(); profileMutation.mutate() }}>
          <TextField
            label="First Name"
            value={profile.first_name}
            onChange={(e) => setProfile((p) => ({ ...p, first_name: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Last Name"
            value={profile.last_name}
            onChange={(e) => setProfile((p) => ({ ...p, last_name: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Username"
            value={profile.username}
            onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Phone"
            value={profile.phone}
            onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
            fullWidth
          />
          <TextField label="Email" value={user?.email || ''} fullWidth disabled />
          <Button type="submit" disabled={profileMutation.isPending}>
            {profileMutation.isPending ? 'Saving…' : 'Save Profile'}
          </Button>
        </Stack>
      </AppCard>

      <AppCard>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
          <Icon icon={Lock} size="lg" color="var(--accent, #164C4D)" />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Change Password</Typography>
        </Stack>
        <Stack spacing={2} component="form" onSubmit={submitPassword}>
          <TextField
            type="password"
            label="Current Password"
            value={passwords.old_password}
            onChange={(e) => setPasswords((p) => ({ ...p, old_password: e.target.value }))}
            fullWidth
            required
          />
          <TextField
            type="password"
            label="New Password"
            value={passwords.new_password}
            onChange={(e) => setPasswords((p) => ({ ...p, new_password: e.target.value }))}
            fullWidth
            required
            helperText="Minimum 8 characters"
          />
          <TextField
            type="password"
            label="Confirm New Password"
            value={passwords.confirm}
            onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
            fullWidth
            required
          />
          <Button type="submit" disabled={passwordMutation.isPending}>
            {passwordMutation.isPending ? 'Updating…' : 'Update Password'}
          </Button>
        </Stack>
      </AppCard>
    </Stack>
  )
}
