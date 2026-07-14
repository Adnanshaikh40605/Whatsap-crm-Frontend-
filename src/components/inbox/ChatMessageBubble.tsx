import { cn, formatMessageTime } from '../../lib/utils'
import { MessageDeliveryTicks } from './MessageDeliveryTicks'

/** Width reserved on the last line so time + ticks never overlap message text. */
const META_SPACE_OUTBOUND = '4.25rem' /* ~68px: time + double tick */
const META_SPACE_INBOUND = '2.75rem' /* ~44px: time only */

interface ChatMessageBubbleProps {
  content: string
  createdAt: string
  isOutbound: boolean
  status?: string
  errorReason?: string | null
}

export function ChatMessageBubble({
  content,
  createdAt,
  isOutbound,
  status,
  errorReason,
}: ChatMessageBubbleProps) {
  const metaSpace = isOutbound ? META_SPACE_OUTBOUND : META_SPACE_INBOUND

  return (
    <div
      className={cn(
        'w-fit max-w-[min(82%,42rem)] rounded-lg px-2.5 py-1.5 text-[14.2px] leading-[19px] shadow-sm',
        isOutbound
          ? 'rounded-tr-none bg-[#d9fdd3] text-[#111b21]'
          : 'rounded-tl-none bg-white text-[#111b21]',
      )}
    >
      <div className="relative min-w-[4.5rem]">
        <div className="whitespace-pre-wrap break-words text-left [overflow-wrap:anywhere]">
          {content}
          <span
            aria-hidden
            className="inline-block h-[15px] align-bottom"
            style={{ width: metaSpace }}
          />
        </div>
        <div className="absolute bottom-0 right-0 flex h-[15px] items-center gap-0.5 text-[11px] leading-none text-[#667781]">
          <span className="whitespace-nowrap">{formatMessageTime(createdAt)}</span>
          {isOutbound ? <MessageDeliveryTicks status={status} compact /> : null}
        </div>
      </div>
      {isOutbound && status === 'failed' && errorReason ? (
        <p className="mt-1 text-right text-[11px] text-red-600">{errorReason}</p>
      ) : null}
    </div>
  )
}
