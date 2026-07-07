import { cn } from '../../lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-')
  return (
    <div className="flex flex-col gap-[var(--space-4)]">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[var(--font-size-2xl)] font-semibold text-[var(--color-text-primary)]"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={cn(
          'h-10 w-full rounded-[var(--radius-md)] border bg-[var(--color-surface-default)] px-[var(--space-8)] py-[var(--space-6)]',
          'text-[var(--font-size-2xl)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
          'transition-[border-color,box-shadow] duration-[var(--motion-duration-instant)]',
          'focus:border-[var(--color-focus-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]/20',
          'disabled:cursor-not-allowed disabled:bg-[var(--color-surface-muted)] disabled:opacity-70',
          error && 'border-[var(--color-feedback-critical)] focus:border-[var(--color-feedback-critical)] focus:ring-[var(--color-feedback-critical)]/20',
          !error && 'border-[var(--color-border-default)]',
          className,
        )}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-[var(--font-size-md)] text-[var(--color-feedback-critical)]" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
