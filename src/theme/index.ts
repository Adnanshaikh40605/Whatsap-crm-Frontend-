import { createTheme, type Theme } from '@mui/material/styles'
import { FONT_FAMILY } from '../lib/fonts'
import { tokens } from '../lib/design-tokens'

const e1 = 'none'
const e2 = tokens.shadow[1]
const e3 = tokens.shadow[2]

const shadows = [
  'none', e1, e1, e2, e2, e2, e3, e3, e3, e3,
  e3, e3, e3, e3, e3, e3, e3, e3, e3, e3, e3, e3, e3, e3, e3,
] as [
  'none', string, string, string, string, string, string, string, string,
  string, string, string, string, string, string, string, string, string,
  string, string, string, string, string, string, string,
]

const palette = {
  primary: {
    main: tokens.color.surface.raised,
    dark: tokens.color.surface.raisedPressed,
    light: 'rgba(66, 184, 100, 0.15)',
    contrastText: tokens.color.text.inverse,
  },
  secondary: { main: tokens.color.text.primary, contrastText: tokens.color.text.inverse },
  success: { main: tokens.color.feedback.success, light: '#e8f7ed', contrastText: tokens.color.text.inverse },
  warning: { main: tokens.color.feedback.warning, light: '#fff5cc', contrastText: tokens.color.text.primary },
  error: { main: tokens.color.feedback.critical, light: '#fde8ec', contrastText: tokens.color.text.inverse },
  info: { main: tokens.color.feedback.info, light: '#e8f2ff', contrastText: tokens.color.text.inverse },
  text: {
    primary: tokens.color.text.primary,
    secondary: tokens.color.text.secondary,
    disabled: tokens.color.text.muted,
  },
  divider: tokens.color.border.subtle,
  background: { default: tokens.color.surface.muted, paper: tokens.color.surface.default },
  action: { hover: 'rgba(10, 71, 76, 0.06)', selected: tokens.color.text.primary },
} as const

export function getTheme(_mode: 'light' | 'dark'): Theme {
  const p = palette
  return createTheme({
    palette: { mode: 'light', ...p },
    shape: { borderRadius: 8 },
    spacing: 8,
    typography: {
      fontFamily: FONT_FAMILY,
      fontSize: 14,
      h1: { fontSize: 16, lineHeight: '21px', fontWeight: 600 },
      h2: { fontSize: 15, lineHeight: '21px', fontWeight: 600 },
      h3: { fontSize: 14, lineHeight: '21px', fontWeight: 600 },
      h4: { fontSize: 14, lineHeight: '21px', fontWeight: 600 },
      h5: { fontSize: 13, lineHeight: '20px', fontWeight: 600 },
      h6: { fontSize: 12, lineHeight: '18px', fontWeight: 600 },
      subtitle1: { fontSize: 14, lineHeight: '21px', fontWeight: 600 },
      subtitle2: { fontSize: 12, lineHeight: '18px', fontWeight: 600 },
      body1: { fontSize: 14, lineHeight: '21px', fontWeight: 400 },
      body2: { fontSize: 12, lineHeight: '18px', fontWeight: 400 },
      caption: { fontSize: 11, lineHeight: '16px' },
      button: { fontSize: 14, lineHeight: '21px', fontWeight: 600, textTransform: 'none' },
    },
    shadows,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: { fontFamily: FONT_FAMILY },
          body: { fontFamily: FONT_FAMILY, backgroundColor: tokens.color.surface.muted },
          '#root': { fontFamily: FONT_FAMILY },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 50,
            padding: '10px 20px',
            minHeight: 40,
            fontWeight: 600,
            transition: `background-color ${tokens.motion.fast}, border-color ${tokens.motion.fast}`,
          },
          contained: {
            backgroundColor: tokens.color.surface.raised,
            '&:hover': { backgroundColor: tokens.color.surface.raisedHover },
            '&:active': { backgroundColor: tokens.color.surface.raisedPressed },
          },
          outlined: {
            borderWidth: 1,
            borderColor: tokens.color.border.default,
            color: tokens.color.text.primary,
            '&:hover': { borderWidth: 1, backgroundColor: 'rgba(10, 71, 76, 0.04)' },
          },
          sizeSmall: { padding: '6px 14px', minHeight: 32, fontSize: 12 },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: 8,
            border: `1px solid ${tokens.color.border.subtle}`,
            backgroundImage: 'none',
          },
        },
      },
      MuiPaper: { defaultProps: { elevation: 0 } },
      MuiTextField: { defaultProps: { size: 'small' } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            minHeight: 40,
            fontSize: 14,
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: tokens.color.focus.ring,
              borderWidth: 2,
            },
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              fontWeight: 600,
              fontSize: 12,
              color: p.text.secondary,
              background: p.background.default,
            },
          },
        },
      },
      MuiChip: { styleOverrides: { root: { borderRadius: 50, fontWeight: 600, fontSize: 11 }, sizeSmall: { height: 22 } } },
      MuiTooltip: { styleOverrides: { tooltip: { fontSize: 11, borderRadius: 6 } } },
      MuiListItemButton: { styleOverrides: { root: { borderRadius: 8 } } },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 8, border: '1px solid var(--color-border-subtle)', boxShadow: 'var(--shadow-2)' },
        },
      },
      MuiMenu: { styleOverrides: { paper: { borderRadius: 8, boxShadow: e2 } } },
    },
  })
}

export const theme = getTheme('light')
export default theme
