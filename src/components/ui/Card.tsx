import { cn } from '../../lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
  subtitle?: string
  action?: React.ReactNode
  padding?: boolean
  noBorder?: boolean
}

export function Card({ children, className, title, subtitle, action, padding = true, noBorder }: CardProps) {
  return (
    <div className={cn('surface-card overflow-hidden rounded-[20px]', noBorder && 'border-0 shadow-none', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'var(--border-subtle)' }}>
          <div>
            {title && <h3 className="text-[15px] font-medium" style={{ color: 'var(--text-primary)' }}>{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={padding ? 'p-5' : ''}>{children}</div>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  change?: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
}

export function StatCard({ label, value, change, icon, trend = 'neutral' }: StatCardProps) {
  const trendColors = { up: 'text-brand-600', down: 'text-red-500', neutral: 'text-[var(--text-muted)]' }
  return (
    <div className="surface-card rounded-[20px] p-5 transition-all hover:border-brand-500/30">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
          <p className="mt-1 text-2xl font-medium tracking-tight" style={{ color: 'var(--text-primary)' }}>{value}</p>
          {change && <p className={cn('mt-1.5 text-xs font-medium', trendColors[trend])}>{change}</p>}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
          {icon}
        </div>
      </div>
    </div>
  )
}
