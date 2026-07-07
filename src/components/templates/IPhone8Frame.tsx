import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

/** iPhone 8 device frame — screen cutout from iPhone 8.svg viewBox 0 0 179 361 */
const FRAME_W = 179
const FRAME_H = 361
const SCREEN = { x: 10.75, y: 40.75, w: 157, h: 279 }

const screenInset = {
  left: `${(SCREEN.x / FRAME_W) * 100}%`,
  top: `${(SCREEN.y / FRAME_H) * 100}%`,
  width: `${(SCREEN.w / FRAME_W) * 100}%`,
  height: `${(SCREEN.h / FRAME_H) * 100}%`,
}

interface IPhone8FrameProps {
  children: ReactNode
  className?: string
  /** Fixed render width in px. Omit for fluid width (fills parent). */
  width?: number
}

export function IPhone8Frame({ children, className, width }: IPhone8FrameProps) {
  const fixedHeight = width ? (width / FRAME_W) * FRAME_H : undefined

  return (
    <div
      className={cn('relative shrink-0 drop-shadow-lg', !width && 'w-full', className)}
      style={
        width
          ? { width, height: fixedHeight }
          : { aspectRatio: `${FRAME_W} / ${FRAME_H}` }
      }
    >
      <div
        className="absolute overflow-hidden bg-[#e5ddd5]"
        style={screenInset}
      >
        {children}
      </div>

      <img
        src="/iphone-8-frame.svg"
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
    </div>
  )
}
