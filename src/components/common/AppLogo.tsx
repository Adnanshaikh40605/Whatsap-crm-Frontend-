import { cn } from '../../lib/utils'
import { APP_LOGO, APP_NAME } from '../../lib/branding'

const SIZES = {
  xs: 'h-8 max-w-[48px]',
  sm: 'h-9 max-w-[52px]',
  md: 'h-12 max-w-[68px]',
  lg: 'h-16 max-w-[90px]',
  xl: 'h-20 max-w-[112px]',
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
        src={APP_LOGO}
        alt={APP_NAME}
        className={cn('w-auto shrink-0 object-contain', SIZES[size])}
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
