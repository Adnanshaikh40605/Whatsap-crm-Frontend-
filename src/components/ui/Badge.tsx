import { cn } from '../../lib/utils'

const variants: Record<string, string> = {
  default: 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]',
  success: 'bg-[#31a24c] text-white',
  warning: 'bg-[#f7b928] text-[#0a1317]',
  danger: 'bg-[#e41e3f] text-white',
  info: 'bg-[#1876f2] text-white',
  active: 'bg-brand-600 text-white',
}

interface BadgeProps {
  children: React.ReactNode
  variant?: keyof typeof variants
  className?: string
  dot?: boolean
}

export function Badge({ children, variant = 'default', className, dot }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-[100px] px-2.5 py-1 text-xs font-bold',
      variants[variant], className,
    )}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
