import { Box, Skeleton, Stack } from '@mui/material'

interface LoadingStateProps { variant?: 'table' | 'cards' | 'detail'; rows?: number }

export function LoadingState({ variant = 'table', rows = 5 }: LoadingStateProps) {
  if (variant === 'cards') {
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }, gap: 2 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={120} sx={{ borderRadius: 3 }} />
        ))}
      </Box>
    )
  }
  if (variant === 'detail') {
    return (
      <Stack spacing={2}>
        <Skeleton variant="text" width="40%" height={40} />
        <Skeleton variant="rounded" height={160} sx={{ borderRadius: 3 }} />
        <Skeleton variant="rounded" height={240} sx={{ borderRadius: 3 }} />
      </Stack>
    )
  }
  return (
    <Stack spacing={1}>
      <Skeleton variant="rounded" height={44} />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={52} />
      ))}
    </Stack>
  )
}
