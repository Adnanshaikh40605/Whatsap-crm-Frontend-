import { Card, CardContent, CardHeader, Divider, type SxProps, type Theme } from '@mui/material'
import type { ReactNode } from 'react'

interface AppCardProps {
  title?: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  children?: ReactNode
  noPadding?: boolean
  divider?: boolean
  sx?: SxProps<Theme>
}

export function AppCard({ title, subtitle, action, children, noPadding, divider, sx }: AppCardProps) {
  return (
    <Card sx={{ borderRadius: '8px', border: '1px solid var(--color-border-subtle)', ...sx }}>
      {(title || action) && (
        <>
          <CardHeader
            title={title}
            subheader={subtitle}
            action={action}
            slotProps={{
              title: { variant: 'h6', sx: { fontSize: 14, fontWeight: 600 } },
              subheader: { variant: 'body2', sx: { fontSize: 12, color: 'var(--color-text-muted)' } },
            }}
            sx={{ py: 1.5, px: 2.5, pb: subtitle ? 1 : 1.5 }}
          />
          {divider && <Divider />}
        </>
      )}
      <CardContent sx={noPadding ? { p: 0, '&:last-child': { pb: 0 } } : { p: 2.5, '&:last-child': { pb: 2.5 } }}>
        {children}
      </CardContent>
    </Card>
  )
}
