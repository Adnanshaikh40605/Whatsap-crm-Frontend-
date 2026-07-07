import type { ReactNode } from 'react'
import { AlertCircle, AlertTriangle, Check, Info, X } from 'lucide-react'
import { cn } from '../../lib/utils'

export type FeedbackVariant = 'success' | 'error' | 'warning' | 'info'

const VARIANTS: Record<
  FeedbackVariant,
  {
    bg: string
    text: string
    icon: typeof Check
    iconColor: string
    iconRing: string
  }
> = {
  success: {
    bg: 'var(--color-feedback-success-muted)',
    text: '#1a5c3a',
    icon: Check,
    iconColor: 'var(--color-feedback-success)',
    iconRing: 'var(--color-feedback-success)',
  },
  error: {
    bg: 'var(--color-feedback-critical-muted)',
    text: '#9b1c31',
    icon: AlertCircle,
    iconColor: 'var(--color-feedback-critical)',
    iconRing: 'var(--color-feedback-critical)',
  },
  warning: {
    bg: 'var(--color-feedback-warning-muted)',
    text: '#7a4d00',
    icon: AlertTriangle,
    iconColor: 'var(--color-feedback-warning)',
    iconRing: 'var(--color-feedback-warning)',
  },
  info: {
    bg: 'var(--color-feedback-info-muted)',
    text: '#0d47a1',
    icon: Info,
    iconColor: 'var(--color-feedback-info)',
    iconRing: 'var(--color-feedback-info)',
  },
}

export interface FeedbackMessageProps {
  variant?: FeedbackVariant
  children: ReactNode
  onClose?: () => void
  showIcon?: boolean
  className?: string
  /** Toast-style elevation */
  elevated?: boolean
}

export function FeedbackMessage({
  variant = 'info',
  children,
  onClose,
  showIcon = true,
  className,
  elevated = false,
}: FeedbackMessageProps) {
  const style = VARIANTS[variant]
  const Icon = style.icon

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 text-[var(--font-size-2xl)] font-medium',
        elevated && 'shadow-[0_4px_16px_rgba(10,71,76,0.12)]',
        className,
      )}
      style={{ background: style.bg, color: style.text }}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      {showIcon ? (
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 bg-white/80"
          style={{ borderColor: style.iconRing, color: style.iconColor }}
          aria-hidden
        >
          <Icon className="h-4 w-4" strokeWidth={2.25} />
        </span>
      ) : null}

      <div className="min-w-0 flex-1 leading-snug">{children}</div>

      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100"
          style={{ color: style.text }}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" strokeWidth={2.25} />
        </button>
      ) : null}
    </div>
  )
}
