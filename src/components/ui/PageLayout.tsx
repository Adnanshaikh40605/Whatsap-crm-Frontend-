import { cn } from '../../lib/utils'
import { SectionHeader } from './SectionHeader'
import { Badge } from './Badge'

export { SectionHeader, Badge }

interface PageHeaderProps {
  title: string
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  badge?: string
}

export function PageHeader({ title, subtitle, actions, badge }: PageHeaderProps) {
  return <SectionHeader title={title} subtitle={subtitle} actions={actions} badge={badge} />
}

interface TabsProps {
  tabs: { id: string; label: string; count?: number }[]
  active: string
  onChange: (id: string) => void
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div
      className="flex flex-wrap gap-6 border-b"
      style={{ borderColor: 'var(--color-border-subtle)' }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'relative pb-3 text-[var(--font-size-2xl)] font-semibold transition-colors',
            active === tab.id
              ? 'text-[var(--color-surface-raised)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]',
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1 text-[var(--font-size-md)] font-medium">({tab.count})</span>
          )}
          {active === tab.id && (
            <span
              className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
              style={{ background: 'var(--color-surface-raised)' }}
            />
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
        <div
          className="flex items-center justify-end border-b px-4 py-3"
          style={{ borderColor: 'var(--color-border-subtle)' }}
        >
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="h-10 w-full max-w-xs rounded-[var(--radius-lg)] border px-4 text-[var(--font-size-2xl)] outline-none transition-colors focus:border-[var(--color-focus-ring)] focus:ring-2 focus:ring-[var(--color-focus-ring)]/20"
            style={{
              borderColor: 'var(--color-border-default)',
              background: 'var(--color-surface-muted)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-[var(--font-size-2xl)]">
          <thead>
            <tr
              className="border-b text-left text-[var(--font-size-md)] font-semibold"
              style={{
                borderColor: 'var(--color-border-subtle)',
                color: 'var(--color-text-muted)',
                background: 'var(--color-surface-muted)',
              }}
            >
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3">{col.label}</th>
              ))}
              {actions && <th className="px-4 py-3">Action</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                  No records found
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row.id}
                  className="border-b surface-interactive"
                  style={{ borderColor: 'var(--color-border-subtle)' }}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-[var(--color-text-primary)]">
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
