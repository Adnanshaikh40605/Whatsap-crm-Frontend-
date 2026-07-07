import { NavLink } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'
import { APP_LOGO } from '../../lib/branding'
import { tokens } from '../../lib/design-tokens'

export const RAIL_WIDTH = 72

const RAIL_BG = '#074c4e'
const RAIL_ACTIVE = 'rgba(255, 255, 255, 0.12)'
const RAIL_HOVER = 'rgba(255, 255, 255, 0.06)'

const ICON_SIZE = 22
const ICON_STROKE = 1.5

export type RailItem = {
  to: string
  icon: LucideIcon
  label: string
  end?: boolean
}

type CrmIconRailProps = {
  mainItems: RailItem[]
  bottomItems?: RailItem[]
  logoSrc?: string
  onLogoClick?: () => void
  userInitial?: string
  onUserClick?: (e: React.MouseEvent<HTMLElement>) => void
  onNavigate?: () => void
}

function RailLink({
  item,
  onNavigate,
}: {
  item: RailItem
  onNavigate?: () => void
}) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      title={item.label}
      className={({ isActive }) =>
        cn(
          'group relative flex w-full flex-col items-center gap-1 px-1 py-2 transition-colors',
          isActive ? 'text-white' : 'text-white/85 hover:text-white',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              'absolute inset-x-1 inset-y-0.5 rounded-md transition-colors',
              !isActive && 'group-hover:bg-white/[0.06]',
            )}
            style={{ background: isActive ? RAIL_ACTIVE : undefined }}
            aria-hidden
          />
          <span
            className="relative flex h-[26px] w-[26px] items-center justify-center transition-colors group-hover:opacity-100"
            style={{ opacity: isActive ? 1 : 0.92 }}
          >
            <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} />
          </span>
          <span
            className={cn(
              'relative max-w-[64px] truncate text-center leading-tight text-white',
              isActive ? 'font-semibold' : 'font-medium',
            )}
            style={{ fontSize: tokens.font.size.xs }}
          >
            {item.label}
          </span>
        </>
      )}
    </NavLink>
  )
}

export function CrmIconRail({
  mainItems,
  bottomItems = [],
  logoSrc,
  onLogoClick,
  userInitial = 'U',
  onUserClick,
  onNavigate,
}: CrmIconRailProps) {
  return (
    <div
      className="flex h-full flex-col"
      style={{ background: RAIL_BG, width: RAIL_WIDTH }}
    >
      <button
        type="button"
        onClick={onLogoClick}
        className="flex shrink-0 flex-col items-center px-2 pb-3 pt-4 transition-opacity hover:opacity-90"
        aria-label="Home"
      >
        {logoSrc ? (
          <img
            src={logoSrc}
            alt=""
            className="h-9 w-9 rounded-full object-cover ring-2 ring-white/15"
          />
        ) : (
          <img
            src={APP_LOGO}
            alt=""
            className="h-9 w-9 rounded-full object-cover ring-2 ring-white/15"
            draggable={false}
          />
        )}
      </button>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-0.5 scrollbar-thin">
        {mainItems.map((item) => (
          <RailLink key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10">
        <div className="flex justify-center py-1.5 text-white/40">
          <ChevronDown size={14} strokeWidth={2} aria-hidden />
        </div>

        {bottomItems.map((item) => (
          <RailLink key={item.to} item={item} onNavigate={onNavigate} />
        ))}

        <div className="flex justify-center px-2 pb-3 pt-1">
          <button
            type="button"
            onClick={onUserClick}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold transition-transform hover:scale-105"
            style={{ color: RAIL_BG }}
            aria-label="Account menu"
          >
            {userInitial}
          </button>
        </div>
      </div>
    </div>
  )
}

export { RAIL_BG, RAIL_ACTIVE, RAIL_HOVER }
