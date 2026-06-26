import { Box, Stack, Typography } from '@mui/material'
import { Inbox } from '@mui/icons-material'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Stack spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'center', py: 8, px: 3, textAlign: 'center' }}>
      <Box sx={{ width: 56, height: 56, borderRadius: '50%', display: 'grid', placeItems: 'center',
        bgcolor: 'action.hover', color: 'text.secondary', mb: 0.5 }}>
        {icon ?? <Inbox />}
      </Box>
      <Typography variant="h4">{title}</Typography>
      {description ? <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>{description}</Typography> : null}
      {action ? <Box sx={{ mt: 1 }}>{action}</Box> : null}
    </Stack>
  )
}
