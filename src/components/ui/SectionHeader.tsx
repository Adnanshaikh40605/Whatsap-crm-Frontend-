import { cn } from '../../lib/utils'

interface SectionHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  badge?: string
  className?: string
}

export function SectionHeader({ title, subtitle, actions, badge, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-4', className)}>
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-[28px] font-medium leading-[1.21] lg:text-4xl lg:leading-[1.28]" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h1>
          {badge && (
            <span className="rounded-[100px] px-2.5 py-1 text-xs font-bold"
              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-2 text-base tracking-[-0.16px]" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
