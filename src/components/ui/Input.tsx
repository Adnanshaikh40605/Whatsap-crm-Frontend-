import { cn } from '../../lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-')
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-bold tracking-[-0.14px]" style={{ color: 'var(--text-primary)' }}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'h-11 w-full rounded-lg border bg-white px-3 py-2.5 text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
          'focus:border-[#1876f2] focus:outline-none focus:ring-2 focus:ring-[#1876f2]/10 transition-colors',
          error && 'border-red-500',
          className,
        )}
        style={{ borderColor: error ? 'var(--critical)' : 'var(--border)' }}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
