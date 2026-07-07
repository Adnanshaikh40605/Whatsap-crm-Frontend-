import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

/** Standard page wrapper — full width, consistent vertical rhythm (matches dashboard). */
export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('w-full space-y-4', className)}>{children}</div>
}

/** Responsive grid for cards / metrics — gap-3 matches dashboard. */
export function PageGrid({
  children,
  className,
  cols = 4,
}: {
  children: ReactNode
  className?: string
  cols?: 2 | 3 | 4
}) {
  const colClass =
    cols === 2
      ? 'sm:grid-cols-2'
      : cols === 3
        ? 'sm:grid-cols-2 lg:grid-cols-3'
        : 'sm:grid-cols-2 xl:grid-cols-4'
  return <div className={cn('grid gap-3', colClass, className)}>{children}</div>
}

/** Section card with header bar — consistent with Business Profile / dashboard panels. */
export function PageSection({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section className={cn('surface-card overflow-hidden', className)}>
      <div
        className="flex items-start justify-between gap-3 border-b px-5 py-3"
        style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-surface-muted)' }}
      >
        <div className="min-w-0">
          <h2 className="text-[var(--font-size-2xl)] font-semibold text-[var(--color-text-primary)]">{title}</h2>
          {description && (
            <p className="mt-0.5 text-[var(--font-size-md)] text-[var(--color-text-muted)]">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </section>
  )
}

export function PageAlert({
  children,
  variant = 'info',
  className,
}: {
  children: ReactNode
  variant?: 'info' | 'warning' | 'error' | 'success'
  className?: string
}) {
  const styles = {
    info: 'border-[var(--color-border-default)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]',
    warning: 'border-[var(--color-feedback-warning)]/40 bg-[var(--color-feedback-warning-muted)] text-[var(--color-text-primary)]',
    error: 'border-[var(--color-feedback-critical)]/30 bg-[var(--color-feedback-critical-muted)] text-[var(--color-feedback-critical)]',
    success: 'border-[var(--color-feedback-success)]/30 bg-[var(--color-feedback-success-muted)] text-[var(--color-text-primary)]',
  }
  return (
    <div
      className={cn(
        'rounded-[var(--radius-md)] border px-4 py-3 text-[var(--font-size-2xl)]',
        styles[variant],
        className,
      )}
      role={variant === 'error' ? 'alert' : undefined}
    >
      {children}
    </div>
  )
}
