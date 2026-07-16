import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

/**
 * Large modern iPhone-style device frame (Dynamic Island).
 * Sized for template builder live preview — fills the right column.
 */
interface IPhonePreviewFrameProps {
  children: ReactNode
  className?: string
  /** Outer width in px. Default 340 for builder preview. */
  width?: number
}

export function IPhonePreviewFrame({
  children,
  className,
  width = 252,
}: IPhonePreviewFrameProps) {
  const height = Math.round(width * (19.5 / 9))
  const scale = width / 340
  const outerRadius = Math.round(48 * scale)
  const innerRadius = Math.round(38 * scale)
  const screenRadius = Math.round(35 * scale)
  const bezel = Math.max(7, Math.round(11 * scale))
  const islandH = Math.max(18, Math.round(28 * scale))
  const islandTop = Math.max(10, Math.round(14 * scale))

  return (
    <div
      className={cn('relative shrink-0', className)}
      style={{ width, height }}
    >
      {/* Outer titanium / black chassis */}
      <div
        className="absolute inset-0"
        style={{
          borderRadius: outerRadius,
          padding: bezel,
          background: 'linear-gradient(160deg, #3a3a3c 0%, #1c1c1e 35%, #0a0a0a 100%)',
          boxShadow:
            '0 20px 40px rgba(0,0,0,0.3), 0 6px 14px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.12)',
        }}
      >
        {/* Inner bezel */}
        <div
          className="relative h-full w-full overflow-hidden bg-black"
          style={{ borderRadius: innerRadius }}
        >
          {/* Screen */}
          <div
            className="absolute overflow-hidden bg-[#e5ddd5]"
            style={{ inset: 2, borderRadius: screenRadius }}
          >
            {children}
          </div>

          {/* Dynamic Island */}
          <div
            className="pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 rounded-full bg-black"
            style={{
              top: islandTop,
              width: Math.round(width * 0.32),
              height: islandH,
            }}
            aria-hidden
          />

          {/* Home indicator */}
          <div
            className="pointer-events-none absolute bottom-[6px] left-1/2 z-20 h-[3px] w-[34%] -translate-x-1/2 rounded-full bg-black/80"
            aria-hidden
          />
        </div>
      </div>

      {/* Side buttons (visual only) */}
      <div
        className="absolute -left-[2px] top-[22%] h-5 w-[2px] rounded-l-sm bg-[#2c2c2e]"
        aria-hidden
      />
      <div
        className="absolute -left-[2px] top-[32%] h-9 w-[2px] rounded-l-sm bg-[#2c2c2e]"
        aria-hidden
      />
      <div
        className="absolute -left-[2px] top-[45%] h-9 w-[2px] rounded-l-sm bg-[#2c2c2e]"
        aria-hidden
      />
      <div
        className="absolute -right-[2px] top-[38%] h-12 w-[2px] rounded-r-sm bg-[#2c2c2e]"
        aria-hidden
      />
    </div>
  )
}
