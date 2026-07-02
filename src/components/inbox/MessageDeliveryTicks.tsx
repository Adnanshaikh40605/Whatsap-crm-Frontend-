import { Check, CheckCheck, Clock, X } from 'lucide-react'
import { cn } from '../../lib/utils'

export type DeliveryStatus =
  | 'pending'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | string

interface MessageDeliveryTicksProps {
  status?: DeliveryStatus
  compact?: boolean
  className?: string
}

export function MessageDeliveryTicks({ status, compact = false, className }: MessageDeliveryTicksProps) {
  const normalized = (status || 'sent').toLowerCase() as DeliveryStatus

  if (normalized === 'pending' || normalized === 'sending') {
    return (
      <span className={cn('inline-flex items-center gap-0.5 text-[#8696a0]', className)}>
        <Clock className="h-3 w-3" />
        {!compact && <span>{normalized === 'pending' ? 'Queued' : 'Sending'}</span>}
      </span>
    )
  }

  if (normalized === 'read') {
    return (
      <span className={cn('inline-flex items-center gap-0.5 text-[#53bdeb]', className)} title="Read">
        <CheckCheck className="h-3 w-3" strokeWidth={2.5} />
        {!compact && <span>Read</span>}
      </span>
    )
  }

  if (normalized === 'delivered') {
    return (
      <span className={cn('inline-flex items-center gap-0.5 text-[#8696a0]', className)} title="Delivered">
        <CheckCheck className="h-3 w-3" strokeWidth={2.5} />
        {!compact && <span>Delivered</span>}
      </span>
    )
  }

  if (normalized === 'failed') {
    return (
      <span className={cn('inline-flex items-center gap-0.5 font-semibold text-red-600', className)} title="Failed">
        <X className="h-3 w-3" strokeWidth={2.5} />
        {!compact && <span>Failed</span>}
      </span>
    )
  }

  return (
    <span className={cn('inline-flex items-center gap-0.5 text-[#8696a0]', className)} title="Sent">
      <Check className="h-3 w-3" strokeWidth={2.5} />
      {!compact && <span>Sent</span>}
    </span>
  )
}
