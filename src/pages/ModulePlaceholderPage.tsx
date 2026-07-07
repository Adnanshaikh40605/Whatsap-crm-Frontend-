import { Link as RouterLink } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { PageHeader } from '../components/common/PageHeader'
import { PageSection } from '../components/layout/PageShell'

interface ModulePlaceholderPageProps {
  project: 'WhatsApp CRM' | 'SMS CRM'
  title: string
  description: string
  items?: string[]
}

export function ModulePlaceholderPage({ project, title, description, items = [] }: ModulePlaceholderPageProps) {
  const root = project === 'SMS CRM' ? '/sms-crm/dashboard' : '/whatsapp-crm/dashboard'

  return (
    <div className="space-y-4">
      <PageHeader
        title={title}
        subtitle={description}
        actions={<Badge variant={project === 'SMS CRM' ? 'warning' : 'success'}>{project}</Badge>}
      />

      <PageSection title="Independent module" description={`This page belongs only to ${project}. It has its own route and can be connected to its own API surface without sharing WhatsApp/SMS behavior.`}>
        {items.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((item) => (
              <div
                key={item}
                className="rounded-[var(--radius-md)] border px-4 py-3"
                style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-surface-muted)' }}
              >
                <p className="text-[var(--font-size-2xl)] font-semibold text-[var(--color-text-primary)]">{item}</p>
              </div>
            ))}
          </div>
        ) : null}

        <RouterLink to={root} className="mt-4 inline-block">
          <Button>Back to {project} Dashboard</Button>
        </RouterLink>
      </PageSection>
    </div>
  )
}
