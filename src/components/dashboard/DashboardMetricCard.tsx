import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export type MetricTone = 'sky' | 'amber' | 'rose' | 'emerald' | 'orange' | 'violet' | 'cyan' | 'slate'

const toneStyles: Record<MetricTone, { card: string; title: string; value: string; sub: string; icon: string }> = {
  sky: {
    card: 'bg-[#e8f4f5] border-[#c5ddd8]',
    title: 'text-[#0a474c]/80',
    value: 'text-[#0a474c]',
    sub: 'text-[#2d6b70]/70',
    icon: 'bg-[#d9ebe7] text-[#0a474c]',
  },
  amber: {
    card: 'bg-[#fff8e6] border-[#f5e6b8]',
    title: 'text-[#6b5a20]/80',
    value: 'text-[#4a3d10]',
    sub: 'text-[#6b5a20]/60',
    icon: 'bg-[#fff0c2] text-[#b8860b]',
  },
  rose: {
    card: 'bg-[#fdeef0] border-[#f5d0d6]',
    title: 'text-[#7a2e3a]/80',
    value: 'text-[#5c222c]',
    sub: 'text-[#7a2e3a]/70',
    icon: 'bg-[#fad4da] text-[#c43d52]',
  },
  emerald: {
    card: 'bg-[#ebf5f3] border-[#c5ddd8]',
    title: 'text-[#0a474c]/80',
    value: 'text-[#0a474c]',
    sub: 'text-[#2d6b70]/70',
    icon: 'bg-[#e8f7ed] text-[#42b864]',
  },
  orange: {
    card: 'bg-[#fff3e8] border-[#f5dcc8]',
    title: 'text-[#7a4520]/80',
    value: 'text-[#5c3318]',
    sub: 'text-[#7a4520]/70',
    icon: 'bg-[#ffe4cc] text-[#e67e22]',
  },
  violet: {
    card: 'bg-[#f0eef8] border-[#ddd6f0]',
    title: 'text-[#4a3d6b]/80',
    value: 'text-[#352c52]',
    sub: 'text-[#4a3d6b]/70',
    icon: 'bg-[#e4dff5] text-[#6b5b95]',
  },
  cyan: {
    card: 'bg-[#e8f7f5] border-[#c5e8e2]',
    title: 'text-[#1a5c52]/80',
    value: 'text-[#0a474c]',
    sub: 'text-[#2d6b70]/70',
    icon: 'bg-[#d4f0eb] text-[#2d9d8a]',
  },
  slate: {
    card: 'bg-[#f4f7f7] border-[#d9ebe7]',
    title: 'text-[#4a4a4a]',
    value: 'text-[#0a474c]',
    sub: 'text-[#6b7c7e]',
    icon: 'bg-[#ebf5f3] text-[#2d6b70]',
  },
}

interface DashboardMetricCardProps {
  title: string
  value: ReactNode
  sublabel?: string
  tone?: MetricTone
  icon?: ReactNode
  className?: string
  variant?: 'filled' | 'outline'
}

export function DashboardMetricCard({
  title,
  value,
  sublabel,
  tone = 'sky',
  icon,
  className,
  variant = 'filled',
}: DashboardMetricCardProps) {
  const t = toneStyles[tone]

  if (variant === 'outline') {
    return (
      <div
        className={cn(
          'flex h-[108px] flex-col justify-between rounded-[var(--radius-md)] border bg-[var(--color-surface-default)] p-3.5 shadow-sm',
          t.card.split(' ')[1],
          className,
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-2xl font-bold leading-none tracking-tight', t.value)}>{value}</p>
          {icon && (
            <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', t.icon)}>
              {icon}
            </span>
          )}
        </div>
        <div className="mt-3">
          {sublabel && <p className={cn('text-[11px] font-medium', t.sub)}>{sublabel}</p>}
          <p className={cn('text-sm font-semibold', t.title)}>{title}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
          'flex h-[108px] flex-col justify-between rounded-[var(--radius-md)] border p-3.5 shadow-sm transition-shadow duration-[var(--motion-duration-instant)] hover:shadow-[var(--shadow-1)]',
        t.card,
        className,
      )}
    >
      <p className={cn('text-xs font-semibold leading-tight', t.title)}>{title}</p>
      <div className="flex items-end justify-between gap-2">
        <p className={cn('text-2xl font-bold leading-none tracking-tight', t.value)}>{value}</p>
        {icon && (
          <span className={cn('mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', t.icon)}>
            {icon}
          </span>
        )}
      </div>
      {sublabel && <p className={cn('text-xs font-medium', t.sub)}>{sublabel}</p>}
    </div>
  )
}

interface DashboardHeroCardProps {
  label: string
  value: ReactNode
  caption?: string
  icon?: ReactNode
  className?: string
}

export function DashboardHeroCard({ label, value, caption, icon, className }: DashboardHeroCardProps) {
  return (
    <div
      className={cn(
        'flex min-h-[108px] items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-default)] px-5 py-4 shadow-sm',
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-4xl font-bold tracking-tight text-[var(--color-surface-raised)]">{value}</p>
        {caption && <p className="mt-1 text-xs text-slate-500">{caption}</p>}
      </div>
      {icon && (
        <div className="hidden shrink-0 sm:flex h-20 w-20 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-muted)]">
          {icon}
        </div>
      )}
    </div>
  )
}
