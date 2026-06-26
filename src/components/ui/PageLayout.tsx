import { cn } from '../../lib/utils'
import { SectionHeader } from './SectionHeader'
import { Badge } from './Badge'

export { SectionHeader, Badge }

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  badge?: string
}

export function PageHeader({ title, subtitle, actions, badge }: PageHeaderProps) {
  return <SectionHeader title={title} subtitle={subtitle} actions={actions} badge={badge} className="mb-6" />
}

interface TabsProps {
  tabs: { id: string; label: string; count?: number }[]
  active: string
  onChange: (id: string) => void
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all',
            active === tab.id ? '' : '',
          )}
          style={{
            borderRadius: '100px',
            border: active === tab.id ? '1px solid var(--text-primary)' : '1px solid var(--border)',
            background: active === tab.id ? 'var(--text-primary)' : 'var(--bg-card)',
            color: active === tab.id ? 'var(--bg-card)' : 'var(--text-primary)',
          }}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
              style={{ background: active === tab.id ? 'rgba(255,255,255,.18)' : 'var(--bg-subtle)', color: active === tab.id ? 'var(--bg-card)' : 'var(--text-muted)' }}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

const statusStyles: Record<string, string> = {
  approved: 'success', executed: 'warning', running: 'info', scheduled: 'info',
  draft: 'default', active: 'success', inactive: 'default', pending: 'warning',
  rejected: 'danger', open: 'info', resolved: 'success', closed: 'default',
}

export function StatusBadge({ status }: { status: string }) {
  const variant = (statusStyles[status] ?? 'default') as 'default' | 'success' | 'warning' | 'danger' | 'info'
  return <Badge variant={variant} dot={status === 'active' || status === 'open'}>{status}</Badge>
}

interface Column<T> {
  key: string
  label: string
  render?: (row: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  search?: string
  onSearch?: (v: string) => void
  loading?: boolean
  actions?: (row: T) => React.ReactNode
}

export function DataTable<T extends { id: string }>({
  columns, data, search, onSearch, loading, actions,
}: DataTableProps<T>) {
  return (
    <div className="surface-card overflow-hidden">
      {onSearch && (
        <div className="flex items-center justify-end border-b px-4 py-3" style={{ borderColor: 'var(--border-subtle)' }}>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="h-10 rounded-[100px] border px-5 text-sm outline-none focus:border-[#1876f2]"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
          />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs font-bold"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)', background: 'var(--bg-subtle)' }}>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3">{col.label}</th>
              ))}
              {actions && <th className="px-4 py-3">Action</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length + 1} className="px-4 py-8 text-center" style={{ color: 'var(--text-muted)' }}>Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={columns.length + 1} className="px-4 py-8 text-center" style={{ color: 'var(--text-muted)' }}>No records found</td></tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="border-b surface-interactive" style={{ borderColor: 'var(--border-subtle)' }}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                      {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as React.ReactNode}
                    </td>
                  ))}
                  {actions && <td className="px-4 py-3">{actions(row)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
