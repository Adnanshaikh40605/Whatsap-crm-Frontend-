import type { LucideIcon as LucideIconType } from 'lucide-react'
import { ICON, ICON_STROKE } from '../../lib/icons'

type IconSize = keyof typeof ICON | number

interface IconProps {
  icon: LucideIconType
  size?: IconSize
  strokeWidth?: number
  className?: string
  color?: string
}

export function Icon({
  icon: LucideComponent,
  size = 'md',
  strokeWidth = ICON_STROKE,
  className,
  color,
}: IconProps) {
  const px = typeof size === 'number' ? size : ICON[size]
  return (
    <LucideComponent
      size={px}
      strokeWidth={strokeWidth}
      className={className}
      color={color}
      aria-hidden
    />
  )
}
