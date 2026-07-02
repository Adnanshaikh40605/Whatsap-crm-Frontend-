export type CampaignTab = 'overview' | 'sent' | 'delivered' | 'read' | 'clicked' | 'failed'

export const CAMPAIGN_TABS: { id: CampaignTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'sent', label: 'Sent' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'read', label: 'Read' },
  { id: 'clicked', label: 'Clicked' },
  { id: 'failed', label: 'Failed' },
]

export function formatDuration(seconds?: number | null) {
  if (seconds == null || Number.isNaN(seconds)) return '—'
  const s = Math.round(seconds)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rem = s % 60
  if (m < 60) return rem ? `${m}m ${rem}s` : `${m}m`
  const h = Math.floor(m / 60)
  return `${h}h ${m % 60}m`
}

export function formatPercent(value?: number | null) {
  if (value == null) return '0%'
  return `${Number(value).toFixed(1)}%`
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function statNumber(value: unknown, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}
