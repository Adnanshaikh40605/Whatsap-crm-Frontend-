import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { ICON, ICON_STROKE } from '../../lib/icons'

const sizeClass = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
} as const

interface AppModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: keyof typeof sizeClass
  className?: string
}

export function AppModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'lg',
  className,
}: AppModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-modal-title"
        className={cn(
          'flex max-h-[min(90vh,720px)] w-full flex-col overflow-hidden rounded-[var(--radius-md)] border bg-[var(--color-surface-default)] shadow-[var(--shadow-2)]',
          sizeClass[size],
          className,
        )}
        style={{ borderColor: 'var(--color-border-subtle)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex shrink-0 items-start justify-between gap-3 border-b px-5 py-4"
          style={{ borderColor: 'var(--color-border-subtle)' }}
        >
          <div className="min-w-0 pr-2">
            <h2
              id="app-modal-title"
              className="text-[var(--font-size-4xl)] font-semibold text-[var(--color-text-primary)]"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-[var(--font-size-2xl)] text-[var(--color-text-muted)]">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-[var(--radius-md)] p-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-muted)]"
            aria-label="Close dialog"
          >
            <X size={ICON.md} strokeWidth={ICON_STROKE} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <div
            className="flex shrink-0 flex-col-reverse gap-3 border-t px-5 py-4 sm:flex-row sm:justify-end"
            style={{ borderColor: 'var(--color-border-subtle)' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
