import { Badge } from '../ui/Badge'
import type { WhatsAppTemplate } from '../../types/bot'
import { getTemplateStatusGroup } from '../../lib/templateList'

const STATUS_LABELS: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'default' | 'info' }> = {
  approved: { label: 'Approved', variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  rejected: { label: 'Rejected', variant: 'danger' },
  draft: { label: 'Draft', variant: 'default' },
  disabled: { label: 'Disabled', variant: 'danger' },
}

export function TemplateStatusBadge({ template }: { template: WhatsAppTemplate }) {
  const group = getTemplateStatusGroup(template)
  const config = STATUS_LABELS[group] ?? STATUS_LABELS.draft
  return <Badge variant={config.variant} dot>{config.label}</Badge>
}

export function TemplateQualityBadge({ rating }: { rating?: string | null }) {
  const value = String(rating || 'UNKNOWN').toUpperCase()
  if (value === 'GREEN' || value === 'HIGH') {
    return <Badge variant="success">High</Badge>
  }
  if (value === 'YELLOW' || value === 'MEDIUM') {
    return <Badge variant="warning">Medium</Badge>
  }
  if (value === 'RED' || value === 'LOW') {
    return <Badge variant="danger">Low</Badge>
  }
  return <Badge variant="default">Unknown</Badge>
}

export function TemplateCategoryBadge({ category }: { category: string }) {
  const label = category === 'authentication' ? 'Authentication' : category
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-slate-700">
      {label}
    </span>
  )
}
