import { Link as RouterLink } from 'react-router-dom'
import type { ReactNode } from 'react'
import { SectionHeader } from '../ui/SectionHeader'

interface Crumb { label: string; to?: string }

interface PageHeaderProps {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
  breadcrumbs?: Crumb[]
}

export function PageHeader({ title, subtitle, actions, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="space-y-2">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex flex-wrap items-center gap-1 text-[var(--font-size-md)] text-[var(--color-text-muted)]" aria-label="Breadcrumb">
          {breadcrumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden>/</span>}
              {c.to ? (
                <RouterLink to={c.to} className="hover:text-[var(--color-text-primary)] hover:underline">
                  {c.label}
                </RouterLink>
              ) : (
                <span className="text-[var(--color-text-secondary)]">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <SectionHeader title={title} subtitle={subtitle} actions={actions} />
    </div>
  )
}
