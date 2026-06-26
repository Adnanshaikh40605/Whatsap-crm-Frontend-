import { Box, Breadcrumbs, Link, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'

interface Crumb { label: string; to?: string }
interface PageHeaderProps {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
  breadcrumbs?: Crumb[]
}

export function PageHeader({ title, subtitle, actions, breadcrumbs }: PageHeaderProps) {
  return (
    <Box sx={{ mb: 3 }}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <Breadcrumbs sx={{ mb: 1, fontSize: 13 }}>
          {breadcrumbs.map((c, i) =>
            c.to ? (
              <Link key={i} component={RouterLink} to={c.to} underline="hover" color="text.secondary">
                {c.label}
              </Link>
            ) : (
              <Typography key={i} color="text.primary" sx={{ fontSize: 13 }}>{c.label}</Typography>
            ),
          )}
        </Breadcrumbs>
      ) : null}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
        <Box>
          <Typography variant="h2">{title}</Typography>
          {subtitle ? <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography> : null}
        </Box>
        {actions ? <Stack direction="row" spacing={1.5} sx={{ flexShrink: 0 }}>{actions}</Stack> : null}
      </Stack>
    </Box>
  )
}
