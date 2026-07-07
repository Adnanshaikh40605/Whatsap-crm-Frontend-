import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface SectionHeaderProps {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
  badge?: string
  className?: string
}

export function SectionHeader({ title, subtitle, actions, badge, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold leading-tight text-[var(--color-text-primary)] lg:text-3xl">
            {title}
          </h1>
          {badge && (
            <span
              className="rounded-[var(--radius-lg)] px-[var(--space-7)] py-[var(--space-2)] text-[var(--font-size-md)] font-semibold"
              style={{ background: 'var(--accent-subtle)', color: 'var(--color-surface-raised)' }}
            >
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-1 text-[var(--font-size-2xl)] text-[var(--color-text-secondary)]">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
