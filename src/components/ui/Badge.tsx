import { cn } from '../../lib/utils'

const variants: Record<string, string> = {
  default: 'bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]',
  success: 'bg-[var(--color-feedback-success)] text-[var(--color-text-inverse)]',
  warning: 'bg-[var(--color-feedback-warning)] text-[var(--color-text-primary)]',
  danger: 'bg-[var(--color-feedback-critical)] text-[var(--color-text-inverse)]',
  info: 'bg-[var(--color-feedback-info)] text-[var(--color-text-inverse)]',
  active: 'bg-[var(--color-surface-raised)] text-[var(--color-text-inverse)]',
}

interface BadgeProps {
  children: React.ReactNode
  variant?: keyof typeof variants
  className?: string
  dot?: boolean
}

export function Badge({ children, variant = 'default', className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-[var(--space-4)] rounded-[var(--radius-lg)] px-[var(--space-7)] py-[var(--space-2)]',
        'text-[var(--font-size-md)] font-semibold',
        variants[variant],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  )
}
