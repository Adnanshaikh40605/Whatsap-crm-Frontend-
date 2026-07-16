import { cn } from '../../lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'dark' | 'danger' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const base =
  'inline-flex items-center justify-center gap-[var(--space-6)] font-semibold transition-all duration-[var(--motion-duration-fast)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)] disabled:cursor-not-allowed disabled:opacity-60'

const variants = {
  primary: [
    'bg-[var(--color-surface-raised)] text-[var(--color-text-inverse)]',
    'hover:bg-[var(--color-surface-raised-hover)]',
    'active:bg-[var(--color-surface-raised-pressed)]',
    'disabled:bg-[var(--color-text-muted)]',
  ].join(' '),
  secondary: [
    'border border-[var(--color-border-strong)] bg-transparent text-[var(--color-text-primary)]',
    'hover:bg-[var(--color-surface-overlay)]',
    'active:bg-[rgba(10,71,76,0.12)]',
  ].join(' '),
  dark: [
    'bg-[#0a474c] text-[#fbfbfb]',
    'hover:opacity-90',
    'active:opacity-80',
  ].join(' '),
  danger: [
    'bg-[var(--color-feedback-critical)] text-[var(--color-text-inverse)]',
    'hover:brightness-95',
    'active:brightness-90',
  ].join(' '),
  outline: [
    'border border-[var(--color-surface-raised)] bg-transparent text-[var(--color-surface-raised)]',
    'hover:bg-[var(--accent-subtle)]',
    'active:bg-[rgba(66,184,100,0.22)]',
  ].join(' '),
  ghost: [
    'border border-[var(--color-border-default)] bg-transparent text-[var(--color-text-primary)]',
    'hover:bg-[var(--color-surface-overlay)]',
    'active:bg-[rgba(10,71,76,0.1)]',
  ].join(' '),
}

const sizes = {
  sm: 'h-8 px-[var(--space-9)] text-[var(--font-size-md)] rounded-[var(--radius-lg)]',
  md: 'h-10 px-[var(--space-10)] text-[var(--font-size-2xl)] rounded-[var(--radius-lg)]',
  lg: 'h-11 px-[var(--space-11)] text-[var(--font-size-2xl)] rounded-[var(--radius-lg)]',
}

export function Button({
  className, variant = 'primary', size = 'md', loading, children, disabled, ...props
}: ButtonProps) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && (
        <span
          className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current/30 border-t-current"
          aria-hidden
        />
      )}
      {children}
    </button>
  )
}
