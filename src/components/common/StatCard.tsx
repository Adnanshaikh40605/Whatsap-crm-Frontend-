import { Card, CardContent, Box, Typography, Stack } from '@mui/material'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { ReactNode } from 'react'
import { ICON, ICON_STROKE } from '../../lib/icons'

interface StatCardProps {
  label: string
  value: ReactNode
  delta?: number | string
  trend?: 'up' | 'down' | 'neutral'
  icon?: ReactNode
  caption?: string
}

export function StatCard({ label, value, delta, trend = 'neutral', icon, caption }: StatCardProps) {
  const color = trend === 'up' ? 'success.main' : trend === 'down' ? 'error.main' : 'text.secondary'
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>{label}</Typography>
          {icon ? (
            <Box sx={{ width: 36, height: 36, borderRadius: 2, display: 'grid', placeItems: 'center',
              bgcolor: 'primary.light', color: 'primary.main' }}>
              {icon}
            </Box>
          ) : null}
        </Stack>
        <Typography variant="h2" sx={{ mt: 1.5, fontWeight: 700 }}>{value}</Typography>
        {(delta !== undefined || caption) ? (
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 1 }}>
            {delta !== undefined ? (
              <>
                <Box component="span" sx={{ color, display: 'inline-flex' }}>
                  <TrendIcon size={ICON.sm} strokeWidth={ICON_STROKE} />
                </Box>
                <Typography variant="caption" sx={{ color, fontWeight: 600 }}>{delta}</Typography>
              </>
            ) : null}
            {caption ? <Typography variant="caption" color="text.secondary">{caption}</Typography> : null}
          </Stack>
        ) : null}
      </CardContent>
    </Card>
  )
}
