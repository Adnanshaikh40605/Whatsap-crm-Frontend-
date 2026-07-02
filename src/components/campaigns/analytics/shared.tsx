import { Download, Mail, RefreshCw } from 'lucide-react'
import { Button } from '../../ui/Button'
import type { CampaignTab } from '../../../lib/campaignAnalytics'

interface Props {
  tab: CampaignTab
  onExport: (format: 'csv' | 'xlsx') => void
  onEmail: () => void
  onRefresh: () => void
  loading?: boolean
}

export function ReportActions({ tab, onExport, onEmail, onRefresh, loading }: Props) {
  const label = tab.charAt(0).toUpperCase() + tab.slice(1)
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" size="sm" onClick={onRefresh} loading={loading}>
        <RefreshCw className="h-3.5 w-3.5" /> Refresh
      </Button>
      <Button variant="secondary" size="sm" onClick={() => onExport('csv')}>
        <Download className="h-3.5 w-3.5" /> CSV
      </Button>
      <Button variant="secondary" size="sm" onClick={() => onExport('xlsx')}>
        <Download className="h-3.5 w-3.5" /> Excel
      </Button>
      <Button variant="secondary" size="sm" onClick={onEmail}>
        <Mail className="h-3.5 w-3.5" /> Email {label} Report
      </Button>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  hint?: string
}

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="surface-card p-4">
      <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
      {hint ? <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</p> : null}
    </div>
  )
}

interface FilterBarProps {
  search: string
  onSearch: (value: string) => void
  preset: string
  onPreset: (value: string) => void
  extra?: React.ReactNode
}

export function FilterBar({ search, onSearch, preset, onPreset, extra }: FilterBarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <input
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search name or number"
        className="h-10 min-w-[200px] flex-1 rounded-lg border px-3 text-sm outline-none focus:border-brand-500"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
      />
      <select
        value={preset}
        onChange={(e) => onPreset(e.target.value)}
        className="h-10 rounded-lg border px-3 text-sm"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
      >
        <option value="">All time</option>
        <option value="today">Today</option>
        <option value="yesterday">Yesterday</option>
      </select>
      {extra}
    </div>
  )
}
