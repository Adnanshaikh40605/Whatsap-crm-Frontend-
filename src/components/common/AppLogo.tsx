import { cn } from '../../lib/utils'
import { WHATSAPP_ICON, APP_NAME } from '../../lib/branding'

const SIZES = {
  xs: 'h-8 w-8',
  sm: 'h-9 w-9',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-20 w-20',
} as const

interface AppLogoProps {
  size?: keyof typeof SIZES
  showName?: boolean
  nameClassName?: string
  className?: string
}

export function AppLogo({
  size = 'sm',
  showName = false,
  nameClassName,
  className,
}: AppLogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <img
        src={WHATSAPP_ICON}
        alt={APP_NAME}
        className={cn('shrink-0 rounded-full object-contain', SIZES[size])}
        draggable={false}
      />
      {showName ? (
        <span className={cn('text-lg font-bold leading-none', nameClassName)}>
          {APP_NAME}
        </span>
      ) : null}
    </div>
  )
}
