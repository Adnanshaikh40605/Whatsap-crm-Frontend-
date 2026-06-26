import { cn } from '../../lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'dark' | 'danger' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({
  className, variant = 'primary', size = 'md', loading, children, disabled, ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-[var(--ink-button)] active:bg-[var(--text-secondary)] text-[var(--on-ink-button)]',
    secondary: 'border-2 border-[var(--text-primary)] bg-transparent text-[var(--text-primary)]',
    dark: 'bg-brand-600 active:bg-brand-700 text-white',
    danger: 'bg-[var(--critical)] text-white',
    outline: 'border-2 border-brand-600 text-brand-600 bg-transparent',
    ghost: 'border-2 border-black/10 bg-transparent text-[var(--text-primary)]',
  }
  const sizes = {
    sm: 'h-9 px-4 text-xs rounded-[100px]',
    md: 'h-11 px-7 text-sm rounded-[100px]',
    lg: 'h-12 px-8 text-sm rounded-[100px]',
  }

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-bold tracking-[-0.14px] transition-all disabled:bg-[var(--text-muted)] disabled:text-white disabled:opacity-60',
        variants[variant], sizes[size], className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
      {children}
    </button>
  )
}
