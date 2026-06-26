import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import { AppCard, PageHeader } from '../components/common'

interface ModulePlaceholderPageProps {
  project: 'WhatsApp CRM' | 'SMS CRM'
  title: string
  description: string
  items?: string[]
}

export function ModulePlaceholderPage({ project, title, description, items = [] }: ModulePlaceholderPageProps) {
  const root = project === 'SMS CRM' ? '/sms-crm/dashboard' : '/whatsapp-crm/dashboard'

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      <PageHeader
        title={title}
        subtitle={description}
        actions={<Chip label={project} color={project === 'SMS CRM' ? 'warning' : 'success'} />}
      />

      <AppCard>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h4">Independent module</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              This page belongs only to {project}. It has its own route and can be connected to its own API surface without sharing WhatsApp/SMS behavior.
            </Typography>
          </Box>

          {items.length > 0 ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1.5 }}>
              {items.map((item) => (
                <Box key={item} sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{item}</Typography>
                </Box>
              ))}
            </Box>
          ) : null}

          <Button component={RouterLink} to={root} variant="contained" sx={{ alignSelf: 'flex-start' }}>
            Back to {project} Dashboard
          </Button>
        </Stack>
      </AppCard>
    </Box>
  )
}
