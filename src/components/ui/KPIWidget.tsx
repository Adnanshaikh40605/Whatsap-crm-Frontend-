import { cn } from '../../lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KPIWidgetProps {
  label: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
  accent?: string
  className?: string
  compact?: boolean
}

export function KPIWidget({ label, value, change, trend = 'neutral', icon, accent, className, compact }: KPIWidgetProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-brand-600' : trend === 'down' ? 'text-red-500' : 'text-[var(--text-muted)]'

  return (
    <div className={cn('surface-card group p-4 transition-all hover:border-brand-500/20', compact ? 'p-3' : 'p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
          <p className={cn('mt-1 font-bold tracking-tight', compact ? 'text-xl' : 'text-2xl')} style={{ color: 'var(--text-primary)' }}>
            {value}
          </p>
          {change && (
            <div className={cn('mt-1.5 flex items-center gap-1 text-xs font-medium', trendColor)}>
              <TrendIcon className="h-3 w-3" />
              <span>{change}</span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
            style={{ background: accent ?? 'var(--accent-subtle)', color: 'var(--accent)' }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

interface MiniBarChartProps {
  data: number[]
  color?: string
  className?: string
}

export function MiniBarChart({ data, color = 'var(--accent)', className }: MiniBarChartProps) {
  const max = Math.max(...data, 1)
  return (
    <div className={cn('flex items-end gap-1', className)}>
      {data.map((v, i) => (
        <div
          key={i}
          className="w-2 rounded-sm transition-all duration-300"
          style={{ height: `${(v / max) * 100}%`, minHeight: 4, background: color, opacity: 0.4 + (v / max) * 0.6 }}
        />
      ))}
    </div>
  )
}
