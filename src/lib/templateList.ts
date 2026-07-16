import type { WhatsAppTemplate } from '../types/bot'
import { campaignApi } from './api'

/** Status groups used for badges / sorting (includes internal draft & disabled). */
export type TemplateStatusGroup = 'approved' | 'pending' | 'rejected' | 'draft' | 'disabled'

/** Filters shown in the Templates UI. */
export type StatusFilter = 'all' | 'approved' | 'pending' | 'rejected'
export type CategoryFilter = 'marketing' | 'utility'

const STATUS_ORDER: Record<TemplateStatusGroup, number> = {
  approved: 0,
  pending: 1,
  rejected: 2,
  draft: 3,
  disabled: 4,
}

/**
 * Map CRM + Meta status into a display group.
 * Draft = saved locally, not (yet) submitted to Meta.
 * Disabled = Meta-disabled / paused / deleted only — never drafts.
 */
export function getTemplateStatusGroup(t: WhatsAppTemplate): TemplateStatusGroup {
  const meta = String(t.meta_status || '').toUpperCase()
  if (meta === 'DISABLED' || meta === 'PAUSED' || meta === 'DELETED') return 'disabled'

  const status = String(t.status || '').toLowerCase()
  if (status === 'approved') return 'approved'
  if (status === 'pending') return 'pending'
  if (status === 'rejected') return 'rejected'
  if (status === 'draft' || !status) return 'draft'

  if (t.whatsapp_template_id) return 'pending'
  return 'draft'
}

/** Map internal status → UI filter bucket (only Approved / Pending / Rejected). */
function toFilterStatus(group: TemplateStatusGroup): Exclude<StatusFilter, 'all'> {
  if (group === 'approved') return 'approved'
  if (group === 'rejected' || group === 'disabled') return 'rejected'
  return 'pending' // pending + draft
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
  const categoryActive = [...categoryFilters]

  if (statusActive.length > 0) {
    const bucket = toFilterStatus(getTemplateStatusGroup(template))
    if (!statusActive.includes(bucket)) return false
  }

  if (categoryActive.length > 0) {
    if (!categoryActive.includes(template.category as CategoryFilter)) return false
  }

  return true
}

export function getLatestSyncTime(templates: WhatsAppTemplate[]): string | null {
  const times = templates
    .map((t) => (t as WhatsAppTemplate & { last_synced_at?: string }).last_synced_at)
    .filter(Boolean) as string[]
  if (!times.length) return null
  return times.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
}

/** Group list sections: Approved / Pending / Rejected only. */
export function groupTemplatesByStatus(templates: WhatsAppTemplate[]) {
  const sorted = sortTemplates(templates)
  const groups: { key: Exclude<StatusFilter, 'all'>; label: string; items: WhatsAppTemplate[] }[] = [
    { key: 'approved', label: 'Approved', items: [] },
    { key: 'pending', label: 'Pending', items: [] },
    { key: 'rejected', label: 'Rejected', items: [] },
  ]
  for (const template of sorted) {
    const key = toFilterStatus(getTemplateStatusGroup(template))
    groups.find((g) => g.key === key)?.items.push(template)
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

function extractTemplatePage(payload: unknown): { results: WhatsAppTemplate[]; count: number } {
  if (Array.isArray(payload)) {
    return { results: payload as WhatsAppTemplate[], count: payload.length }
  }
  const record = payload as { results?: WhatsAppTemplate[]; count?: number; data?: unknown }
  if (Array.isArray(record?.results)) {
    return { results: record.results, count: record.count ?? record.results.length }
  }
  if (record?.data) return extractTemplatePage(record.data)
  return { results: [], count: 0 }
}

/** Fetch every template across paginated API pages (list + duplicate-name checks). */
export async function fetchAllCampaignTemplates(): Promise<WhatsAppTemplate[]> {
  const pageSize = 100
  const merged: WhatsAppTemplate[] = []
  let page = 1
  while (true) {
    const response = await campaignApi.templates({ page, page_size: pageSize })
    const body = response.data as {
      data?: unknown
      results?: WhatsAppTemplate[]
      count?: number
      next?: string | null
    }
    const payload = (body?.data ?? body) as typeof body
    const { results, count } = extractTemplatePage(payload)
    merged.push(...results)
    const hasNext = Boolean(payload?.next) || (count > 0 && merged.length < count)
    if (!results.length || !hasNext || results.length < pageSize) break
    page += 1
    if (page > 50) break
  }
  return merged
}
