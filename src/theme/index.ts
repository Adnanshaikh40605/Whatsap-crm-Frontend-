import { createTheme, type Theme } from '@mui/material/styles'
import { FONT_FAMILY } from '../lib/fonts'

const e1 = 'none'
const e2 = 'rgba(20, 22, 26, 0.3) 0px 1px 4px 0px'
const e3 = 'rgba(20, 22, 26, 0.3) 0px 1px 4px 0px'

// MUI requires exactly 25 shadow entries.
const shadows = [
  'none', e1, e1, e2, e2, e2, e3, e3, e3, e3,
  e3, e3, e3, e3, e3, e3, e3, e3, e3, e3, e3, e3, e3, e3, e3,
] as [
  'none', string, string, string, string, string, string, string, string,
  string, string, string, string, string, string, string, string, string,
  string, string, string, string, string, string, string,
]

const light = {
  primary: { main: '#0064E0', dark: '#0457CB', light: 'rgba(0,145,255,.15)', contrastText: '#ffffff' },
  secondary: { main: '#0A1317', contrastText: '#ffffff' },
  success: { main: '#31A24C', light: '#EAF7EE', contrastText: '#ffffff' },
  warning: { main: '#F7B928', light: '#FFF5CC', contrastText: '#0A1317' },
  error: { main: '#E41E3F', light: '#FDE8EC', contrastText: '#ffffff' },
  info: { main: '#1876F2', light: '#E8F2FF', contrastText: '#ffffff' },
  text: { primary: '#0A1317', secondary: '#444950', disabled: '#BCC0C4' },
  divider: '#DEE3E9',
  background: { default: '#F1F4F7', paper: '#FFFFFF' },
  action: { hover: '#F1F4F7', selected: '#0A1317' },
} as const

const dark = {
  primary: { main: '#0064E0', dark: '#0457CB', light: 'rgba(0,145,255,.15)', contrastText: '#ffffff' },
  secondary: { main: '#0A1317', contrastText: '#ffffff' },
  success: { main: '#31A24C', light: '#EAF7EE', contrastText: '#ffffff' },
  warning: { main: '#F7B928', light: '#FFF5CC', contrastText: '#0A1317' },
  error: { main: '#E41E3F', light: '#FDE8EC', contrastText: '#ffffff' },
  info: { main: '#1876F2', light: '#E8F2FF', contrastText: '#ffffff' },
  text: { primary: '#0A1317', secondary: '#444950', disabled: '#BCC0C4' },
  divider: '#DEE3E9',
  background: { default: '#F1F4F7', paper: '#FFFFFF' },
  action: { hover: '#F1F4F7', selected: '#0A1317' },
} as const

export function getTheme(mode: 'light' | 'dark'): Theme {
  const p = mode === 'dark' ? dark : light
  return createTheme({
    palette: { mode, ...p },
    shape: { borderRadius: 16 },
    spacing: 8,
    typography: {
      fontFamily: FONT_FAMILY,
      h1: { fontSize: 36, lineHeight: '46px', fontWeight: 600, letterSpacing: '-0.02em' },
      h2: { fontSize: 28, lineHeight: '34px', fontWeight: 600, letterSpacing: '-0.02em' },
      h3: { fontSize: 24, lineHeight: '30px', fontWeight: 500, letterSpacing: 0 },
      h4: { fontSize: 18, lineHeight: '26px', fontWeight: 700, letterSpacing: 0 },
      h5: { fontSize: 16, lineHeight: '24px', fontWeight: 700, letterSpacing: '-0.16px' },
      h6: { fontSize: 14, lineHeight: '20px', fontWeight: 700, letterSpacing: '-0.14px' },
      subtitle1: { fontSize: 18, lineHeight: '26px', fontWeight: 700 },
      subtitle2: { fontSize: 14, lineHeight: '20px', fontWeight: 700, letterSpacing: '-0.14px' },
      body1: { fontSize: 16, lineHeight: '24px', letterSpacing: '-0.16px' },
      body2: { fontSize: 14, lineHeight: '20px', letterSpacing: '-0.14px' },
      caption: { fontSize: 12, lineHeight: '16px' },
      button: { fontSize: 14, lineHeight: '20px', fontWeight: 700, letterSpacing: '-0.14px', textTransform: 'none' },
    },
    shadows,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: { fontFamily: FONT_FAMILY },
          body: { fontFamily: FONT_FAMILY },
          '#root': { fontFamily: FONT_FAMILY },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 100, padding: '12px 28px', minHeight: 44, fontWeight: 700 },
          contained: { backgroundColor: '#0064E0', '&:active': { backgroundColor: '#0457CB' } },
          outlined: { borderWidth: 2, borderColor: '#0A1317', color: '#0A1317', '&:hover': { borderWidth: 2, backgroundColor: 'transparent' } },
          sizeSmall: { padding: '8px 16px', minHeight: 36 },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: { root: { borderRadius: 24, border: `1px solid ${p.divider}`, backgroundImage: 'none' } },
      },
      MuiPaper: { defaultProps: { elevation: 0 } },
      MuiTextField: { defaultProps: { size: 'small' } },
      MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 8, minHeight: 44 } } },
      MuiTableHead: {
        styleOverrides: { root: { '& .MuiTableCell-head': { fontWeight: 600, color: p.text.secondary, background: p.background.default } } },
      },
      MuiChip: { styleOverrides: { root: { borderRadius: 100, fontWeight: 700 }, sizeSmall: { height: 24 } } },
      MuiTooltip: { styleOverrides: { tooltip: { fontSize: 12, borderRadius: 8 } } },
      MuiListItemButton: {
        styleOverrides: { root: { borderRadius: 100 } },
      },
      MuiDialog: { styleOverrides: { paper: { borderRadius: 24 } } },
      MuiMenu: { styleOverrides: { paper: { borderRadius: 16, boxShadow: e2 } } },
    },
  })
}

export const theme = getTheme('light')
export default theme
