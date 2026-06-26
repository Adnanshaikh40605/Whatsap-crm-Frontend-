import { Chip, type ChipProps } from '@mui/material'

type Color = 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary'

// Canonical domain-status → color map (see DESIGN.md §4.5)
const MAP: Record<string, Color> = {
  // positive
  approved: 'success', delivered: 'success', read: 'success', paid: 'success',
  active: 'success', won: 'success', sent_success: 'success', completed: 'success', connected: 'success',
  // pending / neutral
  pending: 'warning', sent: 'warning', queued: 'warning', trialing: 'warning',
  viewed: 'info', scheduled: 'info', running: 'info', partial: 'warning',
  draft: 'default', archived: 'default', paused: 'default',
  // negative
  rejected: 'error', failed: 'error', overdue: 'error', lost: 'error',
  past_due: 'error', cancelled: 'error', expired: 'error', disconnected: 'error',
}

export function StatusChip({ status, ...props }: { status?: string } & Omit<ChipProps, 'label' | 'color'>) {
  const key = (status ?? '').toLowerCase()
  const color = MAP[key] ?? 'default'
  const label = (status ?? '—').replace(/_/g, ' ')
  return <Chip size="small" label={label} color={color} sx={{ textTransform: 'capitalize' }} {...props} />
}
