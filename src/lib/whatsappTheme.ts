/** Cohesive palette aligned with AiSensy tokens + WhatsApp chat UI. */
import { tokens } from './design-tokens'

export const WA = {
  /** Sidebar / app chrome — brand teal (AiSensy rail) */
  panelDark: '#074c4e',
  panel: '#0d555b',
  panelHover: '#117078',

  /** Primary actions — brand green */
  primary: tokens.color.surface.raised,
  primaryHover: tokens.color.surface.raisedHover,
  primaryMuted: 'rgba(66, 184, 100, 0.12)',

  /** Chat area */
  chatBg: tokens.color.surface.muted,
  chatBgAlt: '#e0efeb',
  bubbleOut: '#d9fdd3',
  bubbleIn: tokens.color.surface.default,

  /** Neutrals */
  border: tokens.color.border.subtle,
  surface: tokens.color.surface.default,
  surfaceSubtle: tokens.color.surface.muted,
  text: tokens.color.text.primary,
  textSecondary: tokens.color.text.secondary,
  textMuted: tokens.color.text.muted,

  /** Selection */
  activeBg: tokens.color.surface.muted,
  activeTint: '#e8f7ed',
} as const

export const CHAT_WALLPAPER = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c5ddd8' fill-opacity='0.35'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
