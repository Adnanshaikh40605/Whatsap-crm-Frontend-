import type { WhatsAppTemplate } from '../types/bot'

export type TemplateStatusGroup = 'approved' | 'pending' | 'rejected' | 'disabled'
export type StatusFilter = 'all' | TemplateStatusGroup
export type CategoryFilter = 'all' | 'marketing' | 'utility' | 'authentication' | 'media'

const STATUS_ORDER: Record<TemplateStatusGroup, number> = {
  approved: 0,
  pending: 1,
  rejected: 2,
  disabled: 3,
}

export function isMediaTemplate(t: WhatsAppTemplate) {
  const header = t.header as { type?: string; format?: string } | undefined
  const format = String(header?.format || header?.type || '').toUpperCase()
  return ['IMAGE', 'VIDEO', 'DOCUMENT', 'CAROUSEL'].includes(format)
    || t.template_type === 'carousel'
    || Boolean(t.media_asset)
}

export function getTemplateStatusGroup(t: WhatsAppTemplate): TemplateStatusGroup {
  const meta = String(t.meta_status || '').toUpperCase()
  if (meta === 'DISABLED' || meta === 'PAUSED' || meta === 'DELETED') return 'disabled'
  if (t.status === 'approved') return 'approved'
  if (t.status === 'pending') return 'pending'
  if (t.status === 'rejected') return 'rejected'
  return 'disabled'
}

export function sortTemplates(templates: WhatsAppTemplate[]): WhatsAppTemplate[] {
  return [...templates].sort((a, b) => {
    const statusDiff = STATUS_ORDER[getTemplateStatusGroup(a)] - STATUS_ORDER[getTemplateStatusGroup(b)]
    if (statusDiff !== 0) return statusDiff
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

export function matchesSearch(template: WhatsAppTemplate, query: string) {
  if (!query.trim()) return true
  const haystack = [
    template.name,
    template.body,
    template.category,
    template.language,
    template.whatsapp_template_id,
    template.meta_status,
    template.quality_rating,
  ].join(' ').toLowerCase()
  return haystack.includes(query.trim().toLowerCase())
}

export function matchesFilters(
  template: WhatsAppTemplate,
  statusFilters: Set<StatusFilter>,
  categoryFilters: Set<CategoryFilter>,
) {
  const statusActive = [...statusFilters].filter((f) => f !== 'all')
  const categoryActive = [...categoryFilters].filter((f) => f !== 'all')

  if (statusActive.length > 0) {
    const group = getTemplateStatusGroup(template)
    if (!statusActive.includes(group)) return false
  }

  if (categoryActive.length > 0) {
    const isMedia = isMediaTemplate(template)
    const categoryMatch = categoryActive.some((filter) => {
      if (filter === 'media') return isMedia
      return template.category === filter
    })
    if (!categoryMatch) return false
  }

  return true
}

export function computeTemplateStats(templates: WhatsAppTemplate[]) {
  return {
    total: templates.length,
    marketing: templates.filter((t) => t.category === 'marketing').length,
    utility: templates.filter((t) => t.category === 'utility').length,
    authentication: templates.filter((t) => t.category === 'authentication').length,
    media: templates.filter(isMediaTemplate).length,
    approved: templates.filter((t) => getTemplateStatusGroup(t) === 'approved').length,
    pending: templates.filter((t) => getTemplateStatusGroup(t) === 'pending').length,
    rejected: templates.filter((t) => getTemplateStatusGroup(t) === 'rejected').length,
    disabled: templates.filter((t) => getTemplateStatusGroup(t) === 'disabled').length,
  }
}

export function getLatestSyncTime(templates: WhatsAppTemplate[]): string | null {
  const times = templates
    .map((t) => (t as WhatsAppTemplate & { last_synced_at?: string }).last_synced_at)
    .filter(Boolean) as string[]
  if (!times.length) return null
  return times.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
}

export function groupTemplatesByStatus(templates: WhatsAppTemplate[]) {
  const sorted = sortTemplates(templates)
  const groups: { key: TemplateStatusGroup; label: string; items: WhatsAppTemplate[] }[] = [
    { key: 'approved', label: 'Approved', items: [] },
    { key: 'pending', label: 'Pending', items: [] },
    { key: 'rejected', label: 'Rejected', items: [] },
    { key: 'disabled', label: 'Disabled / Draft', items: [] },
  ]
  for (const template of sorted) {
    const group = getTemplateStatusGroup(template)
    groups.find((g) => g.key === group)?.items.push(template)
  }
  return groups.filter((g) => g.items.length > 0)
}

export function exportTemplatesJson(templates: WhatsAppTemplate[]) {
  const blob = new Blob([JSON.stringify(templates, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `whatsapp-templates-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}
