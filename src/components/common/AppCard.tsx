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
    <Card sx={sx}>
      {(title || action) && (
        <>
          <CardHeader
            title={title}
            subheader={subtitle}
            action={action}
            slotProps={{
              title: { variant: 'h4' },
              subheader: { variant: 'body2', color: 'text.secondary' },
            }}
            sx={{ pb: subtitle ? 1 : 1.5 }}
          />
          {divider && <Divider />}
        </>
      )}
      <CardContent sx={noPadding ? { p: 0, '&:last-child': { pb: 0 } } : undefined}>
        {children}
      </CardContent>
    </Card>
  )
}
